from pathlib import Path
from datetime import datetime, timedelta, timezone
import urllib.request, re

MY_PROMPTPAY_ID = "0630218621"

STATIC_DIR = Path("static")
UPLOAD_DIR = STATIC_DIR / "uploads"

BKK_TZ = timezone(timedelta(hours=7))

def _bkk_text(dt: datetime) -> str:
    return dt.replace(tzinfo=timezone.utc).astimezone(BKK_TZ).strftime("%Y-%m-%d %H:%M:%S") if dt else ""

def _bkk_iso(dt: datetime) -> str:
    return dt.replace(tzinfo=timezone.utc).astimezone(BKK_TZ).isoformat() if dt else ""

def get_youtube_duration(video_id: str) -> int:
    try:
        url = f"https://www.youtube.com/watch?v={video_id}"
        with urllib.request.urlopen(url) as response:
            html = response.read().decode()
            match = re.search(r'"lengthSeconds":"(\d+)"', html)
            if match:
                return round(int(match.group(1)) / 60)
    except:
        pass
    return 0
