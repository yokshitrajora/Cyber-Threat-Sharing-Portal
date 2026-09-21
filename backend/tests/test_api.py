"""
Integration & Unit Test Suite for SHIELD SOC Threat Intelligence Backend.
Validates:
1. PII Scrubbing Service (token and regex redaction).
2. STIX 2.1 Object Generation & Validation.
3. User Registration, Authentication & JWT Generation.
4. Threat Incident Ingestion with Automated PII Scrubbing & STIX validation.
5. Threat Status Updates & Filtering.
6. SOC Analytics & Health Endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.api.deps import get_db
from app.services.pii_scrubber import scrub_pii, contains_pii
from app.services.stix_formatter import create_stix_bundle
from main import app

# In-memory test database for fast, isolated testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create test tables
Base.metadata.create_all(bind=engine)

client = TestClient(app)

# 1. PII Scrubbing Tests
def test_pii_scrubber():
    raw_text = "Suspect John Doe at user@threatdomain.com connected from 192.168.1.100 with card 4532-1234-5678-9012 and phone +1-555-867-5309"
    assert contains_pii(raw_text) is True
    scrubbed = scrub_pii(raw_text)
    assert "[REDACTED_EMAIL]" in scrubbed
    assert "[REDACTED_CREDIT_CARD]" in scrubbed
    assert "[REDACTED_PHONE]" in scrubbed
    assert "user@threatdomain.com" not in scrubbed
    assert "4532-1234-5678-9012" not in scrubbed

# 2. STIX 2.1 Formatter Tests
def test_stix_bundle_creation():
    bundle = create_stix_bundle(
        threat_type="Phishing",
        indicator="phishing-login-page.com",
        description="Malicious credential harvester",
        confidence=85,
        labels=["phishing", "credential-harvesting"]
    )
    assert bundle["type"] == "bundle"
    assert bundle["id"].startswith("bundle--")
    assert len(bundle["objects"]) >= 1  # Contains Indicator SDO
    indicator_obj = bundle["objects"][0]
    assert indicator_obj["type"] == "indicator"
    assert "pattern" in indicator_obj

# 3. User Registration & Login Test
def test_auth_flow():
    # Register
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "email": "analyst@shield-soc.local",
            "full_name": "Senior SOC Analyst",
            "password": "SecurePassword123!",
            "role": "analyst"
        }
    )
    assert reg_res.status_code == 201
    user_data = reg_res.json()
    assert user_data["email"] == "analyst@shield-soc.local"
    assert "id" in user_data

    # Login
    login_res = client.post(
        "/api/v1/auth/login",
        data={
            "username": "analyst@shield-soc.local",
            "password": "SecurePassword123!"
        }
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

    # Verify Current User
    auth_header = {"Authorization": f"Bearer {token_data['access_token']}"}
    me_res = client.get("/api/v1/auth/me", headers=auth_header)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "analyst@shield-soc.local"

# 4. Threat Incident Ingestion with PII Redaction
def test_threat_ingestion():
    # Login to get token
    login_res = client.post(
        "/api/v1/auth/login",
        data={
            "username": "analyst@shield-soc.local",
            "password": "SecurePassword123!"
        }
    )
    token = login_res.json()["access_token"]
    auth_header = {"Authorization": f"Bearer {token}"}

    threat_payload = {
        "title": "Phishing Attempt detected targeting admin@secretcorp.com",
        "threat_type": "Phishing",
        "indicator": "198.51.100.45",
        "description": "Attacker contact email: attacker@evil.org and phone: 555-123-4567 attempting credential theft",
        "threat_level": "High"
    }

    res = client.post("/api/v1/threats/report", json=threat_payload, headers=auth_header)
    assert res.status_code == 201
    created_threat = res.json()
    
    assert created_threat["threat_type"] == "Phishing"
    assert created_threat["threat_level"] in ["High", "Critical"]
    # Verify PII was scrubbed
    assert "[REDACTED_EMAIL]" in created_threat["title"]
    assert "admin@secretcorp.com" not in created_threat["title"]
    assert "[REDACTED_EMAIL]" in created_threat["description"]
    assert "attacker@evil.org" not in created_threat["description"]
    # Verify STIX 2.1 bundle was generated
    assert created_threat["stix_bundle"] is not None
    assert created_threat["stix_bundle"]["type"] == "bundle"

    # List threats
    list_res = client.get("/api/v1/threats", headers=auth_header)
    assert list_res.status_code == 200
    threats_data = list_res.json()
    assert threats_data["total"] >= 1

    # Update threat status
    threat_id = created_threat["id"]
    patch_res = client.patch(
        f"/api/v1/threats/{threat_id}/status",
        json={"status": "Investigating", "mitigation_notes": "Triage started by analyst"},
        headers=auth_header
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "Investigating"

# 5. SOC Analytics and Health Endpoints
def test_analytics_and_health():
    analytics_res = client.get("/api/v1/analytics")
    assert analytics_res.status_code == 200
    data = analytics_res.json()
    assert "total_threats" in data
    assert "active_threats" in data
    assert "timeline" in data

    health_res = client.get("/api/v1/analytics/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "online"
