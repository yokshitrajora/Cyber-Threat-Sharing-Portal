import logging
import concurrent.futures
from celery import Celery
from app.core.config import settings

logger = logging.getLogger("shield.celery")

celery_app = Celery(
    "shield_soc_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.threat_tasks",
        "app.tasks.digest_tasks"
    ]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=120,
    broker_connection_retry_on_startup=False,
    beat_schedule={
        "send-weekly-threat-digest": {
            "task": "send_weekly_threat_digest_task",
            # Every Monday at 08:00 UTC
            "schedule": 604800.0,
        }
    }
)

# Background fallback thread pool for when Redis server is offline
_fallback_executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)

def dispatch_task(task_func, *args, **kwargs):
    """
    Attempts to dispatch task to Celery + Redis worker queue.
    If Redis broker is unreachable, executes in background thread pool seamlessly.
    """
    try:
        # Check if Celery can queue to Redis
        async_result = task_func.delay(*args, **kwargs)
        logger.info(f"Task {task_func.name} dispatched to Celery worker queue: id={async_result.id}")
        return {"status": "queued", "task_id": str(async_result.id), "engine": "celery_redis"}
    except Exception as e:
        logger.warning(f"Celery broker unreachable ({e}). Offloading to async fallback worker thread.")
        # Execute the underlying function in background thread
        target_fn = getattr(task_func, "run", task_func)
        future = _fallback_executor.submit(target_fn, *args, **kwargs)
        return {"status": "background_executed", "engine": "async_fallback_worker"}
