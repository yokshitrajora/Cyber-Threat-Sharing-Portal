import json
import re
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.api.deps import get_db, get_current_user
from app.models.threat import ThreatIncident
from app.models.user import User
from app.schemas.threat import (
    ThreatReportCreate,
    ThreatStatusUpdate,
    ThreatIncidentResponse,
    ThreatListResponse
)
from app.services.pii_scrubber import PIIScrubber
from app.services.threat_intel import ThreatIntelEngine
from app.services.stix_formatter import build_stix2_bundle
from app.services.notifier import SecurityAlertService

router = APIRouter(prefix="/threats", tags=["Threat Intelligence"])

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
        timestamp=format_relative_time(item.created_at),
        created_at=item.created_at
    )

def parse_incident_id(raw_id: str) -> Optional[int]:
    """Extracts numeric DB ID from either raw numbers or 'INC-xxxx' strings."""
    digits = re.sub(r"\D", "", str(raw_id))
    if not digits:
        return None
    val = int(digits)
    # If using 4-digit code e.g. 9082 or 1001, map directly or adjust
    return val

@router.post("/report", response_model=ThreatIncidentResponse, status_code=status.HTTP_201_CREATED)
async def submit_threat_indicator(
    payload: ThreatReportCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Core Threat Ingestion Pipeline:
    1. Server-side PII scrubbing (anonymizes tracking tokens & credentials)
    2. Threat enrichment (VirusTotal v3 & AbuseIPDB v2)
    3. STIX 2.1 JSON Specification Formatting
    4. Persistent storage in PostgreSQL / SQLite
    5. Multi-channel alerting (Twilio SMS & SendGrid Email)
    """
    raw_str = payload.threat_data.strip()
    raw_desc = payload.description.strip() if payload.description else ""

    # 1. PII Scrubbing
    clean_indicator, stripped_tokens = PIIScrubber.scrub_indicator(raw_str)
    clean_description = PIIScrubber.scrub_text(raw_desc)

    # 2. Threat Intel & Scoring
    intel = await ThreatIntelEngine.analyze_and_enrich(clean_indicator)

    # Generate sequential incident code
    count = db.query(ThreatIncident).count()
    incident_code = f"INC-{9000 + count + 1}"

    # 3. STIX 2.1 Formatting
    stix_bundle = build_stix2_bundle(
        indicator_value=clean_indicator,
        indicator_type=intel["type"],
        score=intel["score"],
        severity=intel["severity"],
        description=clean_description or f"Ingested {intel['type']} indicator",
        threat_id=incident_code
    )

    # 4. Save to Database
    threat_record = ThreatIncident(
        incident_code=incident_code,
        indicator=clean_indicator,
        raw_input=raw_str,
        indicator_type=intel["type"],
        score=intel["score"],
        severity=intel["severity"],
        status=intel["status"],
        ai_confidence=intel["ai_confidence"],
        target=intel["target"],
        location=intel["location"],
        description=clean_description,
        sanitized_parameters=json.dumps(stripped_tokens),
        stix_bundle=json.dumps(stix_bundle),
        virustotal_summary=json.dumps(intel.get("virustotal")),
        abuseipdb_summary=json.dumps(intel.get("abuseipdb")),
        created_at=datetime.now(timezone.utc)
    )
    db.add(threat_record)
    db.commit()
    db.refresh(threat_record)

    # 5. Alerting Dispatch
    await SecurityAlertService.dispatch_incident_alert({
        "incident_code": incident_code,
        "indicator": clean_indicator,
        "score": intel["score"],
        "severity": intel["severity"],
        "type": intel["type"],
        "target": intel["target"],
        "status": intel["status"]
    })

    return serialize_threat(threat_record)

@router.get("", response_model=ThreatListResponse)
def list_threat_incidents(
    search: Optional[str] = None,
    severity: Optional[str] = None,
    type: Optional[str] = None,
    status: Optional[str] = None,
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

    total = query.count()
    records = query.order_by(desc(ThreatIncident.created_at)).offset((page - 1) * limit).limit(limit).all()

    return ThreatListResponse(
        total=total,
        threats=[serialize_threat(item) for item in records]
    )

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

@router.patch("/{id}/status", response_model=ThreatIncidentResponse)
def update_threat_incident_status(
    id: str,
    payload: ThreatStatusUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Updates operational triage status (e.g. 'Resolved', 'False Positive', 'Auto-Blocked')."""
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

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_threat_incident(
    id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Removes an incident or false positive from the database."""
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
