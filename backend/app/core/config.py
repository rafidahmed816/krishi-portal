"""Application configuration loaded from environment variables."""

import os
from pathlib import Path
from functools import lru_cache

# ── Load .env manually (stdlib only, no third-party imports) ────────
_ENV_FILE = Path(__file__).resolve().parents[3] / ".env"

if _ENV_FILE.exists():
    for line in _ENV_FILE.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        key, _, value = line.partition("=")
        if key and _ == "=":
            os.environ.setdefault(key.strip(), value.strip())


class Settings:
    """Central configuration for the AgroLink backend."""

    # ── AWS ──────────────────────────────────────────────────────────
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_SESSION_TOKEN: str = os.getenv("AWS_SESSION_TOKEN", "")

    # ── Cognito ─────────────────────────────────────────────────────
    COGNITO_USER_POOL_ID: str = os.getenv("COGNITO_USER_POOL_ID", "")
    COGNITO_APP_CLIENT_ID: str = os.getenv("COGNITO_APP_CLIENT_ID", "")

    # ── Database (future) ───────────────────────────────────────────
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/agrolink")

    # ── CORS ────────────────────────────────────────────────────────
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


@lru_cache()
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
