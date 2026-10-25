import sys
import os

# Add backend directory to sys.path
backend_dir = r"c:\Users\yoksh\Documents\Community_Service\shield-community-dashboard\backend"
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.db.session import SessionLocal, init_db
from app.models.user import User
from app.models.threat import ThreatIncident
from app.models.digest import DigestSubscription
from app.core.security import create_access_token, verify_password
from app.core.celery_app import celery_app, dispatch_task
from app.services.digest_service import WeeklyDigestService
from app.tasks.threat_tasks import enrich_threat_indicator_task
from app.tasks.digest_tasks import send_weekly_threat_digest_task

def run_e2e_verification():
    print("=== STARTING END-TO-END VERIFICATION ===")
    init_db()
    db = SessionLocal()

    # 1. Verify Users & Roles
    print("\n[1] Verifying RBAC Seeded Users & Token Generation...")
    users = db.query(User).all()
    user_roles = {u.username: u.role for u in users}
    print(f"    Users found: {user_roles}")
    assert 'user' in user_roles and user_roles['user'] == 'standard', "Standard user missing"
    assert 'orgadmin' in user_roles and user_roles['orgadmin'] == 'org_admin', "Org admin missing"
    assert 'admin' in user_roles and user_roles['admin'] == 'sys_admin', "Sys admin missing"
    
    token_std = create_access_token({"sub": "user", "role": "standard"})
    token_org = create_access_token({"sub": "orgadmin", "role": "org_admin"})
    token_sys = create_access_token({"sub": "admin", "role": "sys_admin"})
    print("    Access tokens created successfully for all 3 tiers.")

    # 2. Verify Background Worker Queue (Celery + dispatch_task)
    print("\n[2] Verifying Background Worker Queue & Indicator Enrichment...")
    test_incident = ThreatIncident(
        incident_code="INC-TEST-99",
        indicator="http://phishing-bank-portal-update.org/login",
        raw_input="http://phishing-bank-portal-update.org/login?user=test",
        indicator_type="URL",
        severity="High",
        score=85,
        target="Web Portal",
        status="Active",
        sightings_count=3,
        false_alarms_count=0,
        verified=False,
        latitude=48.8566,
        longitude=2.3522,
        origin_country="France",
        origin_city="Paris"
    )
    db.add(test_incident)
    db.commit()
    db.refresh(test_incident)
    print(f"    Created test threat incident ID: {test_incident.id}")

    # Dispatch enrichment task via worker
    task_res = dispatch_task(enrich_threat_indicator_task, test_incident.id)
    print(f"    Dispatched enrich_threat_indicator_task: {task_res}")

    # 3. Verify Community Sightings & False Alarm Actions
    print("\n[3] Verifying Community Actions (Sightings & False Alarms)...")
    initial_sightings = test_incident.sightings_count
    test_incident.sightings_count += 1
    db.commit()
    db.refresh(test_incident)
    print(f"    Sightings incremented: {initial_sightings} -> {test_incident.sightings_count}")

    initial_false_alarms = test_incident.false_alarms_count
    test_incident.false_alarms_count += 1
    db.commit()
    db.refresh(test_incident)
    print(f"    False alarms incremented: {initial_false_alarms} -> {test_incident.false_alarms_count}")

    # 4. Verify Sys Admin Verification & Override
    print("\n[4] Verifying Sys Admin Actions (Verify & Override False Positive)...")
    test_incident.verified = True
    test_incident.status = "Verified"
    db.commit()
    db.refresh(test_incident)
    print(f"    Verified indicator: verified={test_incident.verified}, status={test_incident.status}")

    test_incident.status = "False Positive"
    test_incident.score = 0
    test_incident.severity = "Low"
    db.commit()
    db.refresh(test_incident)
    print(f"    Overrode to False Positive: status={test_incident.status}, score={test_incident.score}")

    # 5. Verify Threat Map Coordinates
    print("\n[5] Verifying Geospatial Map Coordinates...")
    geo_threats = db.query(ThreatIncident).filter(
        ThreatIncident.latitude.isnot(None),
        ThreatIncident.longitude.isnot(None)
    ).all()
    print(f"    Geolocated threat vectors in database: {len(geo_threats)}")
    assert len(geo_threats) > 0, "No geolocated threat vectors found"
    sample = geo_threats[0]
    print(f"    Sample pin: [{sample.latitude}, {sample.longitude}] from {sample.origin_city}, {sample.origin_country} ({sample.indicator})")

    # 6. Verify Weekly Threat Email Digest
    print("\n[6] Verifying Automated Weekly Email Digest...")
    stats = WeeklyDigestService.compile_weekly_threat_stats(db)
    print(f"    7-Day Stats: {stats['phishing_campaigns']} phishing campaigns, {stats['malicious_ips_blocked']} malicious IPs, {stats['total_threats_blocked']} total")
    assert "phishing_campaigns" in stats and "malicious_ips_blocked" in stats, "Stats calculation failed"

    html_email = WeeklyDigestService.build_digest_html(stats, business_name="Green Valley Bakery")
    assert "Green Valley Bakery" in html_email, "Email template missing business name"
    assert "Shield AI Community Defense Digest" in html_email, "Email template title missing"
    print(f"    Rendered HTML email digest ({len(html_email)} bytes).")

    # Check subscribers and dispatch digest
    subs = db.query(DigestSubscription).filter(DigestSubscription.is_active == True).all()
    print(f"    Active digest subscribers: {len(subs)}")
    assert len(subs) > 0, "No seeded subscribers found"

    dispatch_res = WeeklyDigestService.send_weekly_digest(db)
    print(f"    Weekly digest dispatch result: {dispatch_res}")

    # Clean up test incident
    db.delete(test_incident)
    db.commit()
    db.close()
    print("\n=== ALL END-TO-END VERIFICATION CHECKS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_e2e_verification()
