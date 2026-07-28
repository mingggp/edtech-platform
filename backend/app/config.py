"""Application configuration.

Loads from environment variables (via python-dotenv in main.py).
Single source of truth for config — do not call os.getenv elsewhere.
"""
from __future__ import annotations

import os
import re
import secrets
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path

# ---------- Paths ---------- #

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
UPLOAD_DIR = STATIC_DIR / "uploads"

# ---------- Timezone helpers ---------- #

BKK_TZ = timezone(timedelta(hours=7))


def _bkk_text(dt: datetime) -> str:
    if not dt:
        return ""
    return dt.replace(tzinfo=timezone.utc).astimezone(BKK_TZ).strftime("%Y-%m-%d %H:%M:%S")


def _bkk_iso(dt: datetime) -> str:
    if not dt:
        return ""
    return dt.replace(tzinfo=timezone.utc).astimezone(BKK_TZ).isoformat()


def get_youtube_duration(video_id: str) -> int:
    """Get video length in minutes from YouTube. Returns 0 if fail."""
    try:
        url = f"https://www.youtube.com/watch?v={video_id}"
        with urllib.request.urlopen(url, timeout=5) as response:
            html = response.read().decode()
            match = re.search(r'"lengthSeconds":"(\d+)"', html)
            if match:
                return round(int(match.group(1)) / 60)
    except Exception:
        pass
    return 0


# ---------- Settings ---------- #

def _bool_env(key: str, default: bool = False) -> bool:
    val = os.getenv(key)
    if val is None:
        return default
    return val.strip().lower() in ("1", "true", "yes", "on")


def _required_secret(key: str, *, dev_default: str | None = None) -> str:
    val = os.getenv(key)
    if val:
        return val
    env = os.getenv("ENV", "development").lower()
    if env == "production":
        raise RuntimeError(
            f"Missing required environment variable: {key}. "
            f"Set it before starting the server in production."
        )
    return dev_default or secrets.token_urlsafe(32)


@dataclass(frozen=True)
class Settings:
    ENV: str = field(default_factory=lambda: os.getenv("ENV", "development"))
    DEBUG: bool = field(default_factory=lambda: _bool_env("DEBUG", True))

    DATABASE_URL: str = field(
        default_factory=lambda: os.getenv("DATABASE_URL", "sqlite:///./app.db")
    )

    SECRET_KEY: str = field(default_factory=lambda: _required_secret("SECRET_KEY"))
    ALGORITHM: str = field(default_factory=lambda: os.getenv("ALGORITHM", "HS256"))
    ACCESS_TOKEN_EXPIRE_MINUTES: int = field(
        default_factory=lambda: int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = field(
        default_factory=lambda: int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    )

    CORS_ORIGINS: tuple = field(
        default_factory=lambda: tuple(
            o.strip()
            for o in os.getenv(
                "CORS_ORIGINS",
                "http://localhost:3000,http://localhost:5173",
            ).split(",")
            if o.strip()
        )
    )

    PROMPTPAY_ID: str = field(
        default_factory=lambda: os.getenv("PROMPTPAY_ID", "0630218621")
    )

    REDIS_URL: str | None = field(default_factory=lambda: os.getenv("REDIS_URL"))

    @property
    def is_production(self) -> bool:
        return self.ENV.lower() == "production"


settings = Settings()

# Backward compatibility — old code still imports MY_PROMPTPAY_ID directly
MY_PROMPTPAY_ID = settings.PROMPTPAY_ID
