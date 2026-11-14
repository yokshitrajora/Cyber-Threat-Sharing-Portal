import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, require_role
from app.models.digest import DigestSubscription
from app.models.user import User
from app.schemas.digest import (
    DigestSubscribeRequest,
    DigestSubscriptionResponse,
    DigestTriggerResponse,
    DigestPreviewResponse
)
from app.services.digest_service import WeeklyDigestService
from app.core.celery_app import dispatch_task
from app.tasks.digest_tasks import send_weekly_threat_digest_task

logger = logging.getLogger("shield.api.digest")

router = APIRouter(tags=["Weekly Email Digest"])

@router.post("/subscribe", response_model=DigestSubscriptionResponse, status_code=status.HTTP_201_CREATED)
def subscribe_to_weekly_digest(
    payload: DigestSubscribeRequest,
    db: Session = Depends(get_db)
):
    """
    Subscribes a local business/organization to the automated weekly community cyber-threat digest.
    """
    existing = db.query(DigestSubscription).filter(
        DigestSubscription.email == payload.email
    ).first()

    if existing:
        if not existing.is_active:
            existing.is_active = True
            existing.organization_name = payload.organization_name
            existing.sector = payload.sector or existing.sector
            existing.phone_number = payload.phone_number or existing.phone_number
            db.commit()
            db.refresh(existing)
            return existing
        # Update phone number even if already active (allow users to add/change it)
        if payload.phone_number:
            existing.phone_number = payload.phone_number
            db.commit()
            db.refresh(existing)
        return existing

    new_sub = DigestSubscription(
        email=payload.email,
        organization_name=payload.organization_name,
        sector=payload.sector or "General Business",
        phone_number=payload.phone_number or None,
        frequency="weekly",
        is_active=True
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)

    # Immediately dispatch confirmation email & SMS so the subscriber knows alerts are active
    try:
        from app.services.notifier import SecurityAlertService
        if payload.email:
            welcome_html = f"""
            <h2>🛡️ Shield AI Alerts: Subscription Confirmed</h2>
            <p>Hello <strong>{payload.organization_name}</strong>,</p>
            <p>Your email <code>{payload.email}</code> is now registered in our active threat intelligence system.</p>
            <p>Whenever a malicious IP address or high-severity cyber attack is detected, you will automatically receive an incident alert directly to this email address.</p>
            <p>Stay safe,<br><strong>Shield AI SOC Defense Team</strong></p>
            """
            SecurityAlertService._send_email(
                payload.email,
                "🛡️ [Confirmed] Shield AI Real-Time Cyber Threat Alerts Active",
                welcome_html
            )
        if payload.phone_number:
            SecurityAlertService._send_sms(
                payload.phone_number,
                f"🛡️ Shield AI: {payload.organization_name} is now registered! You will receive instant SMS alerts whenever malicious IPs or critical threats are detected."
            )
    except Exception as e:
        logger.warning(f"Could not dispatch subscriber welcome notification: {e}")

    return new_sub

@router.get("/subscribers", response_model=List[DigestSubscriptionResponse])
def list_digest_subscribers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["org_admin", "sys_admin"]))
):
    """Lists all active local business subscribers. Requires Org Admin or Sys Admin."""
    return db.query(DigestSubscription).order_by(DigestSubscription.created_at.desc()).all()

@router.delete("/unsubscribe/{email}", status_code=status.HTTP_200_OK)
def unsubscribe_from_digest(
    email: str,
    db: Session = Depends(get_db)
):
    """Unsubscribes a business from the automated weekly digest."""
    sub = db.query(DigestSubscription).filter(DigestSubscription.email == email).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription email not found")

    sub.is_active = False
    db.commit()
    return {"message": f"Successfully unsubscribed {email} from weekly community digests"}

@router.get("/preview", response_model=DigestPreviewResponse)
def get_digest_preview(
    organization: Optional[str] = Query("Local Community Business"),
    db: Session = Depends(get_db)
):
    """Returns the rendered weekly email digest preview and past 7-day stats."""
    stats = WeeklyDigestService.compile_weekly_threat_stats(db)
    html = WeeklyDigestService.build_digest_html(stats, business_name=organization)
    subject = f"🛡️ Weekly Threat Digest: {stats['phishing_campaigns']} phishing & {stats['malicious_ips_blocked']} malicious IPs blocked this week"

    return DigestPreviewResponse(
        subject=subject,
        stats=stats,
        html_preview=html
    )

@router.post("/trigger-send", response_model=DigestTriggerResponse)
def trigger_weekly_digest_broadcast(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["org_admin", "sys_admin"]))
):
    """
    Manually triggers the Celery/background weekly threat digest distribution.
    Offloads email rendering and multi-recipient dispatch to the worker queue.
    """
    # Trigger via Celery task queue or fallback
    dispatch_result = dispatch_task(send_weekly_threat_digest_task)
    
    # Also compile summary for immediate response
    stats = WeeklyDigestService.compile_weekly_threat_stats(db)
    subscribers_count = db.query(DigestSubscription).filter(DigestSubscription.is_active == True).count()

    from datetime import datetime, timezone
    return DigestTriggerResponse(
        status="dispatched_to_queue",
        recipients_count=subscribers_count,
        stats=stats,
        sent_at=datetime.now(timezone.utc).isoformat()
    )
