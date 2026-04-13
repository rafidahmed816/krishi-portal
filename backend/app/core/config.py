"""Application configuration loaded from environment variables."""

from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings

# Resolve .env path relative to this file → project root
_ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    """Central configuration for the AgroLink backend."""

    # ── AWS ──────────────────────────────────────────────────────────
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_SESSION_TOKEN: str = ""

    # ── Cognito ─────────────────────────────────────────────────────
    COGNITO_USER_POOL_ID: str = ""
    COGNITO_APP_CLIENT_ID: str = ""

    # ── Database (future) ───────────────────────────────────────────
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/agrolink"

    # ── CORS ────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    model_config = {
        "env_file": str(_ENV_FILE),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
