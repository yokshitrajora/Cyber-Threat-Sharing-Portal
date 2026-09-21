from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

class ThreatReportCreate(BaseModel):
    threat_data: str = Field(..., min_length=1, max_length=2048, description="Raw indicator string (URL, IP, Domain, Email)")
    description: Optional[str] = Field(None, max_length=1000, description="Contextual incident details")

class ThreatStatusUpdate(BaseModel):
    status: str = Field(..., description="Target status ('Auto-Blocked', 'Quarantined', 'Monitoring', 'Resolved', 'False Positive', 'Investigating')")

class ThreatIncidentResponse(BaseModel):
    id: str  # e.g. "INC-9082"
    numeric_id: int
    indicator: str
    raw_input: str
    type: str
    score: int
    severity: str
    status: str
    ai_confidence: str
    target: str
    location: str
    description: Optional[str] = None
    sanitized_parameters: List[str] = []
    stix_bundle: Optional[Dict[str, Any]] = None
    timestamp: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ThreatListResponse(BaseModel):
    total: int
    threats: List[ThreatIncidentResponse]

class CategoryMetric(BaseModel):
    name: str
    type: str
    count: int
    value: int
    color: str

class TimelinePoint(BaseModel):
    time: str
    anomaly: int
    blocked: int
    normal: int

class AnalyticsSummary(BaseModel):
    totalThreats: int
    criticalCount: int
    highCount: int
    medCount: int
    lowCount: int
    avgScore: float

class AnalyticsResponse(BaseModel):
    summary: AnalyticsSummary
    categories: List[CategoryMetric]
    timeline: List[TimelinePoint]
