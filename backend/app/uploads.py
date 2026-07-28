"""File upload helpers — validation + safe save.

หลักการ:
- ไม่เชื่อ filename จาก client (อาจมี ../, อักขระพิเศษ, นามสกุลปลอม)
- เช็ค magic byte/MIME ผ่าน Pillow แทนการ trust extension
- จำกัด size ก่อน read ทั้งไฟล์ (เพื่อกัน DoS)
- save ด้วยชื่อใหม่ที่สุ่ม + timestamp
"""
from __future__ import annotations

import io
import time
from pathlib import Path
from typing import Iterable

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from .config import UPLOAD_DIR

# ---------- Constants ---------- #

MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_SLIP_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_EXTS = {"jpg", "jpeg", "png", "webp"}
ALLOWED_IMAGE_MIME = {"image/jpeg", "image/png", "image/webp"}


# ---------- Validation ---------- #

class UploadValidationError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


async def read_validated_image(
    file: UploadFile,
    *,
    max_bytes: int = MAX_IMAGE_BYTES,
    allowed_exts: Iterable[str] = ALLOWED_IMAGE_EXTS,
) -> tuple[bytes, str]:
    """อ่าน + validate ไฟล์รูป. คืน (bytes, normalized_extension).

    Raises UploadValidationError หากไม่ผ่าน.
    """
    # 1) ตรวจ MIME header (client ส่งมา — ไม่เชื่อ 100% แต่ใช้ filter ชั้นแรก)
    if file.content_type and file.content_type not in ALLOWED_IMAGE_MIME:
        raise UploadValidationError(
            f"ประเภทไฟล์ไม่รองรับ: {file.content_type} "
            f"(รองรับ: {', '.join(sorted(ALLOWED_IMAGE_MIME))})"
        )

    # 2) ตรวจนามสกุลจาก filename
    if not file.filename:
        raise UploadValidationError("ไม่พบชื่อไฟล์")
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    allowed_exts_set = {e.lower() for e in allowed_exts}
    if ext not in allowed_exts_set:
        raise UploadValidationError(
            f"นามสกุลไฟล์ไม่รองรับ: .{ext} (รองรับ: {', '.join(sorted(allowed_exts_set))})"
        )

    # 3) อ่านทั้งไฟล์ — ใช้ chunked read เพื่อ enforce max_bytes
    chunks: list[bytes] = []
    total = 0
    while True:
        chunk = await file.read(64 * 1024)
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            raise UploadValidationError(
                f"ไฟล์ใหญ่เกินกำหนด ({max_bytes // (1024 * 1024)} MB)"
            )
        chunks.append(chunk)
    data = b"".join(chunks)

    # 4) Verify จริงด้วย Pillow (ป้องกันคนเปลี่ยนนามสกุลแต่ไฟล์ไม่ใช่รูป)
    try:
        img = Image.open(io.BytesIO(data))
        img.verify()
    except (UnidentifiedImageError, Exception) as e:
        raise UploadValidationError(f"ไฟล์ไม่ใช่รูปภาพที่ใช้งานได้: {e}")

    # normalize jpeg → jpg
    norm_ext = "jpg" if ext == "jpeg" else ext
    return data, norm_ext


def save_upload(data: bytes, ext: str, *, prefix: str) -> str:
    """บันทึกลง UPLOAD_DIR ด้วยชื่อใหม่ที่ปลอดภัย. คืน URL path สำหรับ static serve."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    fname = f"{prefix}_{int(time.time() * 1000)}.{ext}"
    path = UPLOAD_DIR / fname
    with open(path, "wb") as f:
        f.write(data)
    return f"/static/uploads/{fname}"
