from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

class DigestSubscribeRequest(BaseModel):
    email: EmailStr
    organization_name: str = Field(..., min_length=2, max_length=150)
    sector: Optional[str] = "General Business"

class DigestSubscriptionResponse(BaseModel):
    id: int
    email: str
    organization_name: str
    sector: str
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DigestTriggerResponse(BaseModel):
    status: str
    recipients_count: int
    stats: Dict[str, Any]
    sent_at: str

class DigestPreviewResponse(BaseModel):
    subject: str
    stats: Dict[str, Any]
    html_preview: str
