from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.db.base import Base

class ThreatIncident(Base):
    __tablename__ = "threat_incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_code = Column(String(50), unique=True, index=True, nullable=False)
    indicator = Column(String(1024), index=True, nullable=False)
    raw_input = Column(String(2048), nullable=False)
    indicator_type = Column(String(50), index=True, nullable=False)
    score = Column(Integer, nullable=False, default=50)
    severity = Column(String(50), index=True, nullable=False, default="Low")
    status = Column(String(50), index=True, nullable=False, default="Monitoring")
    ai_confidence = Column(String(20), default="95.0%")
    target = Column(String(255), default="Web Edge (443)")
    location = Column(String(255), default="Autonomous Ingestion Node")
    description = Column(Text, nullable=True)
    sanitized_parameters = Column(Text, default="[]")
    stix_bundle = Column(Text, nullable=True)  # STIX 2.1 JSON Specification
    virustotal_summary = Column(Text, nullable=True)
    abuseipdb_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
