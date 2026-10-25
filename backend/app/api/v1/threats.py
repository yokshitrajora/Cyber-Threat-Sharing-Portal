import json
import re
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func

from app.api.deps import get_db, get_current_user, get_current_active_user, require_role
from app.models.threat import ThreatIncident
from app.models.user import User
from app.schemas.threat import (
    ThreatReportCreate,
    ThreatStatusUpdate,
    ThreatIncidentResponse,
    ThreatListResponse,
    EmergencyAlertRequest,
    ThreatMapResponse,
    ThreatMapOrigin
)
from app.services.pii_scrubber import PIIScrubber
from app.services.threat_intel import ThreatIntelEngine
from app.services.stix_formatter import build_stix2_bundle, get_stix_pattern
from app.services.notifier import SecurityAlertService
from app.core.celery_app import dispatch_task
from app.tasks.threat_tasks import enrich_threat_indicator_task, resolve_geo_coordinates

router = APIRouter(tags=["Threat Intelligence"])

def format_relative_time(dt: datetime) -> str:
    """Formats datetime to human-readable relative time."""
    if not dt:
        return "Just now"
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    diff = int((now - dt).total_seconds())
    if diff < 60:
        return "Just now"
    if diff < 3600:
        return f"{diff // 60} mins ago"
    if diff < 86400:
        hours = diff // 3600
        return f"{hours} {'hour' if hours == 1 else 'hours'} ago"
    days = diff // 86400
    return f"{days} {'day' if days == 1 else 'days'} ago"

def serialize_threat(item: ThreatIncident) -> ThreatIncidentResponse:
    """Helper to convert a ThreatIncident model to a ThreatIncidentResponse schema."""
    sanitized = []
    if item.sanitized_parameters:
        try:
            sanitized = json.loads(item.sanitized_parameters)
        except Exception:
            sanitized = []

    stix_dict = None
    if item.stix_bundle:
        try:
            stix_dict = json.loads(item.stix_bundle)
        except Exception:
            stix_dict = None

    return ThreatIncidentResponse(
        id=item.incident_code,
        numeric_id=item.id,
        indicator=item.indicator,
        raw_input=item.raw_input,
        type=item.indicator_type,
        score=item.score,
        severity=item.severity,
        status=item.status,
        ai_confidence=item.ai_confidence or "95.0%",
        target=item.target or "Web Edge (443)",
        location=item.location or "Autonomous Ingestion Node",
        description=item.description,
        sanitized_parameters=sanitized,
        stix_bundle=stix_dict,
        sightings_count=item.sightings_count or 0,
        false_alarms_count=item.false_alarms_count or 0,
        verified=item.verified or False,
        latitude=item.latitude,
        longitude=item.longitude,
        origin_country=item.origin_country,
        origin_city=item.origin_city,
        timestamp=format_relative_time(item.created_at),
        created_at=item.created_at
    )

def parse_incident_id(raw_id: str) -> Optional[int]:
    """Extracts numeric DB ID from either raw numbers or 'INC-xxxx' strings."""
    digits = re.sub(r"\D", "", str(raw_id))
    if not digits:
        return None
    val = int(digits)
    return val


# ─── REPORT THREAT (all authenticated users) ──────────────────────────────────

@router.post("/report", response_model=ThreatIncidentResponse, status_code=status.HTTP_201_CREATED)
async def submit_threat_indicator(
    payload: ThreatReportCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Core Threat Ingestion Pipeline (accessible by all roles):
    1. Server-side PII scrubbing (instant)
    2. Fast heuristic pre-scoring
    3. Geo-location coordinate mapping
    4. Save initial threat record in DB
    5. Offload deep API calls (VirusTotal, AbuseIPDB) to Celery+Redis Background Worker Queue
    6. Multi-channel alerting
    """
    from app.services.threat_intel import classify_indicator
    raw_str = payload.threat_data.strip()
    raw_desc = payload.description.strip() if payload.description else ""

    # 1. PII Scrubbing (Immediate)
    clean_indicator, stripped_tokens = PIIScrubber.scrub_indicator(raw_str)
    clean_description = PIIScrubber.scrub_text(raw_desc)

    # 2. Fast Heuristic Scoring & Classification (Instant - no external API locks)
    ind_type = classify_indicator(clean_indicator)
    score, severity, initial_status = ThreatIntelEngine.calculate_heuristic_score(clean_indicator, ind_type)

    # Generate sequential incident code
    count = db.query(ThreatIncident).count()
    incident_code = f"INC-{9000 + count + 1}"

    # Resolve geo origin coordinates
    lat, lng, city, country = resolve_geo_coordinates(clean_indicator, ind_type, "Autonomous Ingestion Node")

    # 3. STIX 2.1 Formatting
    stix_bundle = build_stix2_bundle(
        indicator_value=clean_indicator,
        indicator_type=ind_type,
        score=score,
        severity=severity,
        description=clean_description or f"Ingested {ind_type} indicator",
        threat_id=incident_code
    )

    # 4. Save to Database (Instant Persistence)
    threat_record = ThreatIncident(
        incident_code=incident_code,
        indicator=clean_indicator,
        raw_input=raw_str,
        indicator_type=ind_type,
        score=score,
        severity=severity,
        status=initial_status,
        ai_confidence=f"{min(99.9, (88.0 + (score * 0.11))):.1f}%",
        target="Auth Portal (443)" if "auth" in clean_indicator.lower() else "Web Edge (443)",
        location=f"{city}, {country}",
        latitude=lat,
        longitude=lng,
        origin_city=city,
        origin_country=country,
        description=clean_description,
        sanitized_parameters=json.dumps(stripped_tokens),
        stix_bundle=json.dumps(stix_bundle),
        virustotal_summary=None,
        abuseipdb_summary=None,
        sightings_count=0,
        false_alarms_count=0,
        verified=False,
        created_at=datetime.now(timezone.utc)
    )
    db.add(threat_record)
    db.commit()
    db.refresh(threat_record)

    # 5. Offload Deep Threat Enrichment (VirusTotal, AbuseIPDB) to Celery+Redis Background Worker Queue
    # This prevents locking the HTTP request thread while querying external intelligence APIs
    dispatch_task(enrich_threat_indicator_task, threat_record.id)

    # 6. Alerting Dispatch (Non-blocking background notification)
    await SecurityAlertService.dispatch_incident_alert({
        "incident_code": incident_code,
        "indicator": clean_indicator,
        "score": score,
        "severity": severity,
        "type": ind_type,
        "target": threat_record.target,
        "status": initial_status
    })

    return serialize_threat(threat_record)


# ─── LIST THREATS (all roles) ─────────────────────────────────────────────────

@router.get("", response_model=ThreatListResponse)
def list_threat_incidents(
    search: Optional[str] = None,
    severity: Optional[str] = None,
    type: Optional[str] = None,
    status: Optional[str] = None,
    verified_only: bool = False,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieves all threat incidents with filtering, search, and pagination."""
    query = db.query(ThreatIncident)

    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                ThreatIncident.indicator.ilike(pattern),
                ThreatIncident.description.ilike(pattern),
                ThreatIncident.incident_code.ilike(pattern),
                ThreatIncident.target.ilike(pattern)
            )
        )

    if severity and severity != "ALL":
        query = query.filter(ThreatIncident.severity == severity)

    if type and type != "ALL":
        query = query.filter(ThreatIncident.indicator_type == type)

    if status and status != "ALL":
        query = query.filter(ThreatIncident.status == status)

    if verified_only:
        query = query.filter(ThreatIncident.verified == True)

    total = query.count()
    records = query.order_by(desc(ThreatIncident.created_at)).offset((page - 1) * limit).limit(limit).all()

    return ThreatListResponse(
        total=total,
        threats=[serialize_threat(item) for item in records]
    )


# ─── INTERACTIVE THREAT MAP ORIGINS ───────────────────────────────────────────

@router.get("/map/origins", response_model=ThreatMapResponse)
def get_threat_map_origins(db: Session = Depends(get_db)):
    """
    Returns geo-located threat attack origins for Interactive Leaflet Threat Map.
    Provides approximate geographic latitude/longitude of attacking sources.
    """
    records = db.query(ThreatIncident).filter(
        ThreatIncident.latitude.isnot(None),
        ThreatIncident.longitude.isnot(None)
    ).order_by(desc(ThreatIncident.created_at)).limit(100).all()

    points = []
    for item in records:
        points.append(
            ThreatMapOrigin(
                id=item.incident_code,
                numeric_id=item.id,
                indicator=item.indicator,
                type=item.indicator_type,
                score=item.score,
                severity=item.severity,
                status=item.status,
                target=item.target or "Web Edge (443)",
                location=item.location or "Autonomous Ingestion Node",
                latitude=item.latitude,
                longitude=item.longitude,
                origin_city=item.origin_city or "Unknown City",
                origin_country=item.origin_country or "Unknown Country",
                sightings_count=item.sightings_count or 0,
                timestamp=format_relative_time(item.created_at)
            )
        )
    return ThreatMapResponse(total_origins=len(points), points=points)


# ─── EXPORT RULES (org_admin + sys_admin) ─────────────────────────────────────

@router.get("/export/rules")
def export_threat_rules(
    format: str = Query("csv", description="Format: csv, stix, or hosts"),
    token: Optional[str] = Query(None, description="Auth token parameter for browser download"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Exports active threat rules for network ingestion. Requires org_admin or sys_admin."""
    import uuid as _uuid
    from jose import jwt
    from app.core.config import settings
    from app.schemas.token import TokenPayload

    # Resolve user from header or query param
    user = current_user
    if not user and token:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            token_data = TokenPayload(**payload)
            user = db.query(User).filter(User.username == token_data.sub).first()
        except Exception:
            user = None

    if not user or (user.role not in ["org_admin", "sys_admin"] and not user.is_superuser):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Exporting threat rules requires org_admin or sys_admin role."
        )

    threats = db.query(ThreatIncident).order_by(desc(ThreatIncident.created_at)).all()

    if format == "csv":
        lines = ["Incident ID,Indicator,Type,Severity,Score,Status,Sightings,Verified"]
        for t in threats:
            lines.append(f"{t.incident_code},{t.indicator},{t.indicator_type},{t.severity},{t.score},{t.status},{t.sightings_count},{'Yes' if t.verified else 'No'}")
        return PlainTextResponse("\n".join(lines), media_type="text/csv",
                                 headers={"Content-Disposition": "attachment; filename=shield_threats.csv"})
    
    elif format == "stix":
        stix_objects = []
        for t in threats:
            if t.stix_bundle:
                try:
                    bundle = json.loads(t.stix_bundle)
                    if "objects" in bundle:
                        stix_objects.extend(bundle["objects"])
                        continue
                except Exception:
                    pass
            now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            pattern = get_stix_pattern(t.indicator_type, t.indicator)
            stix_objects.append({
                "type": "indicator",
                "spec_version": "2.1",
                "id": f"indicator--{_uuid.uuid4()}",
                "created": now_iso,
                "modified": now_iso,
                "name": f"Threat Indicator: {t.indicator}",
                "description": t.description or f"{t.indicator_type} threat with risk score {t.score}/100 ({t.severity})",
                "indicator_types": ["malicious-activity"],
                "pattern": pattern,
                "pattern_type": "stix",
                "pattern_version": "2.1",
                "valid_from": now_iso,
                "confidence": t.score or 0,
                "external_references": [
                    {"source_name": "Shield AI SOC Core", "external_id": t.incident_code or "SHIELD-INC"}
                ]
            })
        bundle = {
            "type": "bundle",
            "id": f"bundle--{_uuid.uuid4()}",
            "objects": stix_objects
        }
        return PlainTextResponse(json.dumps(bundle, indent=2), media_type="application/json",
                                 headers={"Content-Disposition": "attachment; filename=shield_stix_bundle.json"})
    
    elif format == "hosts":
        lines = ["# Shield AI Exported Blocklist", "# Format: HOSTS", ""]
        for t in threats:
            if t.indicator_type in ["URL", "Domain"]:
                domain = re.sub(r"^https?://", "", t.indicator).split("/")[0]
                lines.append(f"0.0.0.0 {domain}")
            elif t.indicator_type == "IP":
                lines.append(f"0.0.0.0 {t.indicator}")
        return PlainTextResponse("\n".join(lines), media_type="text/plain",
                                 headers={"Content-Disposition": "attachment; filename=shield_blocklist.hosts"})

    raise HTTPException(status_code=400, detail="Invalid format specified")


# ─── GET SINGLE THREAT (all roles) ────────────────────────────────────────────

@router.get("/{id}", response_model=ThreatIncidentResponse)
def get_threat_incident(id: str, db: Session = Depends(get_db)):
    """Retrieves a single forensic threat incident including its STIX 2.1 bundle."""
    numeric_id = parse_incident_id(id)
    incident = db.query(ThreatIncident).filter(
        or_(
            ThreatIncident.incident_code == id,
            ThreatIncident.id == numeric_id
        )
    ).first()

    if not incident:
        raise HTTPException(status_code=404, detail="Threat incident not found")

    return serialize_threat(incident)


# ─── UPDATE STATUS (sys_admin only) ───────────────────────────────────────────

@router.patch("/{id}/status", response_model=ThreatIncidentResponse)
def update_threat_incident_status(
    id: str,
    payload: ThreatStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["sys_admin"]))
):
    """Updates operational triage status. Requires sys_admin."""
    numeric_id = parse_incident_id(id)
    incident = db.query(ThreatIncident).filter(
        or_(
            ThreatIncident.incident_code == id,
            ThreatIncident.id == numeric_id
        )
    ).first()

    if not incident:
        raise HTTPException(status_code=404, detail="Threat incident not found")

    incident.status = payload.status
    db.commit()
    db.refresh(incident)
    return serialize_threat(incident)


# ─── DELETE THREAT (sys_admin only) ───────────────────────────────────────────

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_threat_incident(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["sys_admin"]))
):
    """Removes an incident from the database. Requires sys_admin."""
    numeric_id = parse_incident_id(id)
    incident = db.query(ThreatIncident).filter(
        or_(
            ThreatIncident.incident_code == id,
            ThreatIncident.id == numeric_id
        )
    ).first()

    if not incident:
        raise HTTPException(status_code=404, detail="Threat incident not found")

    db.delete(incident)
    db.commit()
    return {"message": "Incident removed successfully from database"}


# ─── SIGHTINGS (standard + org_admin can report, all can view) ────────────────

@router.post("/{id}/sightings", response_model=ThreatIncidentResponse)
def report_sighting(
    id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Reports a community sighting of a threat ('I saw this too'). Increments counter."""
    numeric_id = parse_incident_id(id)
    incident = db.query(ThreatIncident).filter(
        or_(ThreatIncident.incident_code == id, ThreatIncident.id == numeric_id)
    ).first()

    if not incident:
        raise HTTPException(status_code=404, detail="Threat incident not found")

    incident.sightings_count = (incident.sightings_count or 0) + 1
    # Auto-escalate if many sightings
    if incident.sightings_count >= 5 and incident.severity not in ("Critical",):
        incident.severity = "Critical"
    db.commit()
    db.refresh(incident)
    return serialize_threat(incident)


# ─── FALSE ALARM (standard + org_admin can report) ───────────────────────────

@router.post("/{id}/false-alarms", response_model=ThreatIncidentResponse)
def report_false_alarm(
    id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Reports a false alarm for a threat indicator. Increments counter."""
    numeric_id = parse_incident_id(id)
    incident = db.query(ThreatIncident).filter(
        or_(ThreatIncident.incident_code == id, ThreatIncident.id == numeric_id)
    ).first()

    if not incident:
        raise HTTPException(status_code=404, detail="Threat incident not found")

    incident.false_alarms_count = (incident.false_alarms_count or 0) + 1
    # Auto-flag for review if too many false alarms
    if incident.false_alarms_count >= 3 and incident.status not in ("False Positive", "Resolved"):
        incident.status = "Under Review"
    db.commit()
    db.refresh(incident)
    return serialize_threat(incident)


# ─── VERIFY THREAT (sys_admin only) ──────────────────────────────────────────

@router.post("/{id}/verify", response_model=ThreatIncidentResponse)
def verify_threat(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["sys_admin"]))
):
    """Marks a threat as verified by an analyst. Requires sys_admin."""
    numeric_id = parse_incident_id(id)
    incident = db.query(ThreatIncident).filter(
        or_(ThreatIncident.incident_code == id, ThreatIncident.id == numeric_id)
    ).first()

    if not incident:
        raise HTTPException(status_code=404, detail="Threat incident not found")

    incident.verified = True
    db.commit()
    db.refresh(incident)
    return serialize_threat(incident)


# ─── OVERRIDE FALSE POSITIVE (sys_admin only) ────────────────────────────────

@router.post("/{id}/override-false-positive", response_model=ThreatIncidentResponse)
def override_false_positive(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["sys_admin"]))
):
    """Overrides a threat as False Positive. Requires sys_admin."""
    numeric_id = parse_incident_id(id)
    incident = db.query(ThreatIncident).filter(
        or_(ThreatIncident.incident_code == id, ThreatIncident.id == numeric_id)
    ).first()

    if not incident:
        raise HTTPException(status_code=404, detail="Threat incident not found")

    incident.status = "False Positive"
    incident.verified = True
    db.commit()
    db.refresh(incident)
    return serialize_threat(incident)


# ─── EMERGENCY ALERT BROADCAST (org_admin + sys_admin) ───────────────────────

@router.post("/broadcast/emergency")
async def broadcast_emergency_alert(
    payload: EmergencyAlertRequest,
    current_user: User = Depends(require_role(["org_admin", "sys_admin"]))
):
    """Broadcasts an emergency alert. Requires org_admin or sys_admin."""
    result = await SecurityAlertService.dispatch_incident_alert({
        "incident_code": payload.threat_id or "EMERGENCY",
        "indicator": payload.title,
        "score": 100,
        "severity": payload.severity,
        "type": "Emergency Broadcast",
        "target": "All Systems",
        "status": "Active Alert"
    })
    return {
        "status": "broadcast_sent",
        "title": payload.title,
        "message": payload.message,
        "dispatched_by": current_user.username,
        "channels": result
    }
