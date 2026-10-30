import json
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.db.base import Base

logger = logging.getLogger("shield.db")

# Configure database engine with support for standard postgresql:// URL format
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        pool_pre_ping=True
    )
except Exception:
    # Fallback to local SQLite if remote database is unreachable
    engine = create_engine(
        "sqlite:///./threats.db",
        connect_args={"check_same_thread": False},
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

def run_migrations():
    """Ensures newly added columns exist in existing SQLite/Postgres tables."""
    with engine.connect() as conn:
        # Check users columns
        try:
            users_cols = []
            if db_url.startswith("sqlite"):
                res = conn.execute(text("PRAGMA table_info(users)"))
                users_cols = [r[1] for r in res.fetchall()]
            
            if users_cols:
                if "role" not in users_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'standard'"))
                if "organization" not in users_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN organization VARCHAR(100)"))
                conn.commit()
        except Exception as e:
            logger.warning(f"User schema migration check note: {e}")

        # Check threat_incidents columns
        try:
            threat_cols = []
            if db_url.startswith("sqlite"):
                res = conn.execute(text("PRAGMA table_info(threat_incidents)"))
                threat_cols = [r[1] for r in res.fetchall()]

            if threat_cols:
                if "sightings_count" not in threat_cols:
                    conn.execute(text("ALTER TABLE threat_incidents ADD COLUMN sightings_count INTEGER DEFAULT 0"))
                if "false_alarms_count" not in threat_cols:
                    conn.execute(text("ALTER TABLE threat_incidents ADD COLUMN false_alarms_count INTEGER DEFAULT 0"))
                if "verified" not in threat_cols:
                    conn.execute(text("ALTER TABLE threat_incidents ADD COLUMN verified BOOLEAN DEFAULT 0"))
                if "latitude" not in threat_cols:
                    conn.execute(text("ALTER TABLE threat_incidents ADD COLUMN latitude FLOAT"))
                if "longitude" not in threat_cols:
                    conn.execute(text("ALTER TABLE threat_incidents ADD COLUMN longitude FLOAT"))
                if "origin_country" not in threat_cols:
                    conn.execute(text("ALTER TABLE threat_incidents ADD COLUMN origin_country VARCHAR(100)"))
                if "origin_city" not in threat_cols:
                    conn.execute(text("ALTER TABLE threat_incidents ADD COLUMN origin_city VARCHAR(100)"))
                conn.commit()
        except Exception as e:
            logger.warning(f"Threat schema migration check note: {e}")

def init_db():
    """Initializes tables, migrates columns, and seeds demo users and digest subscribers."""
    from app.models.threat import ThreatIncident
    from app.models.user import User
    from app.models.digest import DigestSubscription
    from app.core.security import get_password_hash

    Base.metadata.create_all(bind=engine)
    run_migrations()
    
    with SessionLocal() as db:
        # Seed default users for all 3 tiers if missing
        seed_users = [
            {
                "username": "user",
                "email": "user@shieldcommunity.io",
                "role": "standard",
                "organization": "Community Contributor",
                "password": "ShieldUser2026!",
                "is_superuser": False
            },
            {
                "username": "orgadmin",
                "email": "orgadmin@shieldcommunity.io",
                "role": "org_admin",
                "organization": "CyberDefend Enterprise SOC",
                "password": "ShieldOrg2026!",
                "is_superuser": False
            },
            {
                "username": "admin",
                "email": "admin@shieldcommunity.io",
                "role": "sys_admin",
                "organization": "Autonomous SOC Command",
                "password": "ShieldAdmin2026!",
                "is_superuser": True
            }
        ]

        for u in seed_users:
            existing = db.query(User).filter(User.username == u["username"]).first()
            if not existing:
                new_user = User(
                    username=u["username"],
                    email=u["email"],
                    hashed_password=get_password_hash(u["password"]),
                    role=u["role"],
                    organization=u["organization"],
                    is_active=True,
                    is_superuser=u["is_superuser"]
                )
                db.add(new_user)
            else:
                if not existing.role or existing.role != u["role"]:
                    existing.role = u["role"]
                if not existing.organization:
                    existing.organization = u["organization"]
        db.commit()

        # Seed sample local business subscribers for Weekly Digest
        if db.query(DigestSubscription).count() == 0:
            sample_subs = [
                DigestSubscription(
                    email="contact@downtownbakery.com",
                    organization_name="Downtown Artisan Bakery",
                    sector="Retail & Food",
                    frequency="weekly",
                    is_active=True
                ),
                DigestSubscription(
                    email="secops@valleyhealth.org",
                    organization_name="Valley Community Health Clinic",
                    sector="Healthcare",
                    frequency="weekly",
                    is_active=True
                ),
                DigestSubscription(
                    email="security@firstmetrocitizens.com",
                    organization_name="First Metro Savings & Credit",
                    sector="Finance",
                    frequency="weekly",
                    is_active=True
                ),
                DigestSubscription(
                    email="admin@riversideschools.edu",
                    organization_name="Riverside Community District",
                    sector="Education",
                    frequency="weekly",
                    is_active=True
                )
            ]
            db.add_all(sample_subs)
            db.commit()

        # Seed initial rich incidents with geo coordinates if empty
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
                    latitude=50.1109,
                    longitude=8.6821,
                    origin_city="Frankfurt",
                    origin_country="Germany",
                    description="High-risk crypto credential harvesting phish with session token injection.",
                    sanitized_parameters=json.dumps(["token=usr_99812a", "sig=secret_9912"]),
                    sightings_count=7,
                    false_alarms_count=0,
                    verified=True,
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
                    latitude=39.0438,
                    longitude=-77.4874,
                    origin_city="Ashburn",
                    origin_country="United States",
                    description="Distributed SYN flood and brute-force credential spray detected across ingress nodes.",
                    sanitized_parameters="[]",
                    sightings_count=12,
                    false_alarms_count=1,
                    verified=True,
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
                    latitude=44.4268,
                    longitude=26.1025,
                    origin_city="Bucharest",
                    origin_country="Romania",
                    description="Spoofed enterprise invoice typosquat targeting finance department accounts.",
                    sanitized_parameters="[]",
                    sightings_count=4,
                    false_alarms_count=0,
                    verified=True,
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
                    latitude=47.3769,
                    longitude=8.5417,
                    origin_city="Zurich",
                    origin_country="Switzerland",
                    description="Verified educational documentation portal with clean cryptographic checksums.",
                    sanitized_parameters="[]",
                    sightings_count=1,
                    false_alarms_count=3,
                    verified=False,
                    created_at=now - timedelta(hours=6)
                ),
                ThreatIncident(
                    incident_code="INC-5044",
                    indicator="203.0.113.195",
                    raw_input="203.0.113.195:8080/setup.cgi",
                    indicator_type="IP",
                    score=91,
                    severity="Critical",
                    status="Auto-Blocked",
                    ai_confidence="99.1%",
                    target="API Gateway (8080)",
                    location="Tokyo, JP (AS2516)",
                    latitude=35.6762,
                    longitude=139.6503,
                    origin_city="Tokyo",
                    origin_country="Japan",
                    description="Automated Mirai botnet variant targeting unpatched edge routers.",
                    sanitized_parameters="[]",
                    sightings_count=9,
                    false_alarms_count=0,
                    verified=True,
                    created_at=now - timedelta(hours=8)
                ),
                ThreatIncident(
                    incident_code="INC-4219",
                    indicator="secure-update-patch.biz",
                    raw_input="http://secure-update-patch.biz/download?installer=payload.exe",
                    indicator_type="Domain",
                    score=78,
                    severity="High",
                    status="Quarantined",
                    ai_confidence="94.6%",
                    target="Endpoint Defense (DNS)",
                    location="Amsterdam, NL (AS1103)",
                    latitude=52.3676,
                    longitude=4.9041,
                    origin_city="Amsterdam",
                    origin_country="Netherlands",
                    description="Fake browser update distributing infostealer trojan.",
                    sanitized_parameters=json.dumps(["installer=payload.exe"]),
                    sightings_count=3,
                    false_alarms_count=0,
                    verified=True,
                    created_at=now - timedelta(hours=12)
                )
            ]
            db.add_all(seed_incidents)
            db.commit()
        else:
            # Backfill coordinates if existing incidents don't have them yet
            incidents_to_update = db.query(ThreatIncident).filter(ThreatIncident.latitude == None).all()
            coord_map = {
                "Frankfurt": (50.1109, 8.6821, "Frankfurt", "Germany"),
                "Ashburn": (39.0438, -77.4874, "Ashburn", "United States"),
                "Bucharest": (44.4268, 26.1025, "Bucharest", "Romania"),
                "Zurich": (47.3769, 8.5417, "Zurich", "Switzerland"),
                "Tokyo": (35.6762, 139.6503, "Tokyo", "Japan"),
                "Amsterdam": (52.3676, 4.9041, "Amsterdam", "Netherlands"),
            }
            for inc in incidents_to_update:
                for k, v in coord_map.items():
                    if k.lower() in (inc.location or "").lower():
                        inc.latitude = v[0]
                        inc.longitude = v[1]
                        inc.origin_city = v[2]
                        inc.origin_country = v[3]
                        break
                if not inc.latitude:
                    inc.latitude = 50.1109
                    inc.longitude = 8.6821
                    inc.origin_city = "Frankfurt"
                    inc.origin_country = "Germany"
            db.commit()
