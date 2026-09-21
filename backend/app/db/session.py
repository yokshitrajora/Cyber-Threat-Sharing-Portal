import json
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.db.base import Base

# Configure engine with SQLite thread handling if in fallback mode
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """FastAPI Dependency for database session management."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initializes tables and seeds initial threat incidents if database is empty."""
    from app.models.threat import ThreatIncident
    from app.models.user import User
    from app.core.security import get_password_hash

    Base.metadata.create_all(bind=engine)
    
    with SessionLocal() as db:
        # Seed default admin operator if no users exist
        if db.query(User).count() == 0:
            admin_user = User(
                username="admin",
                email="admin@shieldcommunity.io",
                hashed_password=get_password_hash("ShieldAdmin2026!"),
                is_active=True,
                is_superuser=True
            )
            db.add(admin_user)
            db.commit()

        # Seed initial rich incidents if empty
        if db.query(ThreatIncident).count() == 0:
            now = datetime.now(timezone.utc)
            seed_incidents = [
                ThreatIncident(
                    incident_code="INC-9082",
                    indicator="http://free-crypto-giveaway.xyz/claim",
                    raw_input="http://free-crypto-giveaway.xyz/claim?token=usr_99812a&sig=secret_9912",
                    indicator_type="URL",
                    score=96,
                    severity="Critical",
                    status="Auto-Blocked",
                    ai_confidence="99.8%",
                    target="Auth Portal (443)",
                    location="Frankfurt, DE (AS24940)",
                    description="High-risk crypto credential harvesting phish with session token injection.",
                    sanitized_parameters=json.dumps(["token=usr_99812a", "sig=secret_9912"]),
                    created_at=now - timedelta(minutes=15)
                ),
                ThreatIncident(
                    incident_code="INC-8194",
                    indicator="198.51.100.44",
                    raw_input="198.51.100.44:22",
                    indicator_type="IP",
                    score=88,
                    severity="Critical",
                    status="Auto-Blocked",
                    ai_confidence="98.2%",
                    target="SSH Daemon (22)",
                    location="Ashburn, US (AS13335)",
                    description="Distributed SYN flood and brute-force credential spray detected across ingress nodes.",
                    sanitized_parameters="[]",
                    created_at=now - timedelta(hours=1)
                ),
                ThreatIncident(
                    incident_code="INC-7301",
                    indicator="billing-alert@paypa1-security.com",
                    raw_input="billing-alert@paypa1-security.com",
                    indicator_type="Email",
                    score=82,
                    severity="High",
                    status="Quarantined",
                    ai_confidence="97.4%",
                    target="Mail Ingress (25)",
                    location="Bucharest, RO (AS9009)",
                    description="Spoofed enterprise invoice typosquat targeting finance department accounts.",
                    sanitized_parameters="[]",
                    created_at=now - timedelta(hours=3)
                ),
                ThreatIncident(
                    incident_code="INC-6120",
                    indicator="https://community-defense-portal.org/docs",
                    raw_input="https://community-defense-portal.org/docs",
                    indicator_type="URL",
                    score=14,
                    severity="Low",
                    status="Monitoring",
                    ai_confidence="91.2%",
                    target="Web Edge (443)",
                    location="Zurich, CH (AS15169)",
                    description="Verified educational documentation portal with clean cryptographic checksums.",
                    sanitized_parameters="[]",
                    created_at=now - timedelta(hours=6)
                )
            ]
            db.add_all(seed_incidents)
            db.commit()
