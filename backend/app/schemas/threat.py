from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

class ThreatReportCreate(BaseModel):
    threat_data: str = Field(..., min_length=1, max_length=2048, description="Raw indicator string (URL, IP, Domain, Email)")
    description: Optional[str] = Field(None, max_length=1000, description="Contextual incident details")

class ThreatStatusUpdate(BaseModel):
    status: str = Field(..., description="Target status ('Auto-Blocked', 'Quarantined', 'Monitoring', 'Resolved', 'False Positive', 'Investigating')")
    notes: Optional[str] = None

class EmergencyAlertRequest(BaseModel):
    title: str = Field(..., description="Alert headline or subject")
    message: str = Field(..., description="Emergency threat broadcast body")
    threat_id: Optional[str] = None
    severity: str = "Critical"

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
    sightings_count: int = 0
    false_alarms_count: int = 0
    verified: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    origin_country: Optional[str] = None
    origin_city: Optional[str] = None
    timestamp: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ThreatMapOrigin(BaseModel):
    id: str
    numeric_id: int
    indicator: str
    type: str
    score: int
    severity: str
    status: str
    target: str
    location: str
    latitude: float
    longitude: float
    origin_city: str
    origin_country: str
    sightings_count: int = 0
    timestamp: str

class ThreatMapResponse(BaseModel):
    total_origins: int
    points: List[ThreatMapOrigin]

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
    activeThreats: int
    criticalCount: int
    highCount: int
    medCount: int
    lowCount: int
    avgScore: float
    sightingsTotal: int = 0
    falseAlarmsTotal: int = 0
    verifiedCount: int = 0

class AnalyticsResponse(BaseModel):
    summary: AnalyticsSummary
    categories: List[CategoryMetric]
    timeline: List[TimelinePoint]
    total_threats: int
    active_threats: int
    critical_threats: int
