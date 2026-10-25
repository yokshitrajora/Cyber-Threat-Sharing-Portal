import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        extra="ignore"
    )

    PROJECT_NAME: str = "Shield AI Threat Intelligence SOC Core"
    VERSION: str = "5.0.0"
    API_V1_STR: str = "/api/v1"

    # JWT Authentication Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "shield_soc_super_secret_jwt_key_99812a_change_in_prod")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 Hours

    # Database Configuration (PostgreSQL default, auto SQLite fallback for local developer machines)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./threats.db"
    )

    # Background Task Queue (Celery + Redis)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

    # External Threat Intel APIs
    VIRUSTOTAL_API_KEY: Optional[str] = os.getenv("VIRUSTOTAL_API_KEY", "")
    ABUSEIPDB_API_KEY: Optional[str] = os.getenv("ABUSEIPDB_API_KEY", "")

    # Alerting Services (Twilio SMS & SendGrid Email)
    TWILIO_ACCOUNT_SID: Optional[str] = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: Optional[str] = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_FROM_NUMBER: Optional[str] = os.getenv("TWILIO_FROM_NUMBER", "+1234567890")
    ALERT_PHONE_NUMBER: Optional[str] = os.getenv("ALERT_PHONE_NUMBER", "+1234567890")

    SENDGRID_API_KEY: Optional[str] = os.getenv("SENDGRID_API_KEY", "")
    ALERT_EMAIL_FROM: Optional[str] = os.getenv("ALERT_EMAIL_FROM", "alerts@shieldcommunity.io")
    ALERT_EMAIL_TO: Optional[str] = os.getenv("ALERT_EMAIL_TO", "soc-team@shieldcommunity.io")

    # CORS settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:80",
        "http://localhost",
        "https://cyber-threat-sharing-portal.vercel.app"
    ]

    @property
    def cors_origin_list(self) -> List[str]:
        env_origins = os.getenv("CORS_ORIGINS")
        if env_origins:
            return [origin.strip() for origin in env_origins.split(",") if origin.strip()]
        return self.CORS_ORIGINS

settings = Settings()
