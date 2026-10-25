from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.db.base import Base

class DigestSubscription(Base):
    __tablename__ = "digest_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    organization_name = Column(String(150), nullable=False)
    sector = Column(String(100), default="General Business")  # Healthcare, Finance, Education, Retail, Local Gov
    frequency = Column(String(50), default="weekly")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
