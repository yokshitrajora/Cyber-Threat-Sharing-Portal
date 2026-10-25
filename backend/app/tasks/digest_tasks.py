import logging
from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.services.digest_service import WeeklyDigestService

logger = logging.getLogger("shield.tasks.digest")

@celery_app.task(name="send_weekly_threat_digest_task", bind=True)
def send_weekly_threat_digest_task(self):
    """
    Celery Periodic / Background Worker Task:
    Dispatches automated weekly cybersecurity digests to all subscribed local businesses.
    """
    db = SessionLocal()
    try:
        logger.info("[Celery Worker] Executing automated weekly threat digest distribution...")
        result = WeeklyDigestService.send_weekly_digest(db)
        logger.info(f"[Celery Worker] Digest sent to {result.get('recipients_count', 0)} businesses.")
        return result
    except Exception as e:
        logger.error(f"[Celery Worker] Error executing weekly digest task: {e}")
        raise e
    finally:
        db.close()
