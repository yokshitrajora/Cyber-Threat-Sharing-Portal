from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from datetime import datetime, timedelta, timezone

from app.api.deps import get_db
from app.models.threat import ThreatIncident

router = APIRouter()

@router.get("", response_model=dict)
def get_analytics(db: Session = Depends(get_db)):
    """
    Returns aggregated metrics, threat level breakdown, category distribution,
    and a 24-hour timeline for the SOC analytics dashboard.
    """
    total_threats = db.query(ThreatIncident).count()
    active_threats = db.query(ThreatIncident).filter(ThreatIncident.status != "Resolved").count()
    critical_threats = db.query(ThreatIncident).filter(
        ThreatIncident.threat_level.in_(["High", "Critical"]),
        ThreatIncident.status != "Resolved"
    ).count()

    # Category breakdown
    category_counts = (
        db.query(ThreatIncident.threat_type, func.count(ThreatIncident.id))
        .group_by(ThreatIncident.threat_type)
        .all()
    )
    categories = {cat: count for cat, count in category_counts if cat}

    # Threat level distribution
    level_counts = (
        db.query(ThreatIncident.threat_level, func.count(ThreatIncident.id))
        .group_by(ThreatIncident.threat_level)
        .all()
    )
    threat_levels = {lvl: count for lvl, count in level_counts if lvl}

    # Status distribution
    status_counts = (
        db.query(ThreatIncident.status, func.count(ThreatIncident.id))
        .group_by(ThreatIncident.status)
        .all()
    )
    statuses = {st: count for st, count in status_counts if st}

    # 24-Hour Timeline in 4-hour buckets
    now = datetime.now(timezone.utc)
    timeline = []
    for i in range(6, -1, -1):
        bucket_time = now - timedelta(hours=i * 4)
        time_label = bucket_time.strftime("%H:%M")
        
        # Count incidents created up to this bucket window
        start_win = bucket_time - timedelta(hours=4)
        count = db.query(ThreatIncident).filter(
            ThreatIncident.created_at >= start_win,
            ThreatIncident.created_at <= bucket_time
        ).count()

        timeline.append({
            "timestamp": time_label,
            "threats": count
        })

    return {
        "total_threats": total_threats,
        "active_threats": active_threats,
        "critical_threats": critical_threats,
        "categories": categories,
        "threat_levels": threat_levels,
        "statuses": statuses,
        "timeline": timeline,
        "last_updated": now.isoformat()
    }

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint verifying database connectivity."""
    try:
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "online",
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
