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
    CORS_ORIGINS: List[str] = ["*"]

settings = Settings()
