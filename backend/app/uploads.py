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
from PIL import Image, ImageOps, UnidentifiedImageError

from .config import UPLOAD_DIR

# ---------- Constants ---------- #

MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB
# (เอา MAX_SLIP_BYTES ออกแล้ว — ไม่มีการอัปโหลดสลิปอีกต่อไปตั้งแต่เปลี่ยนไป
#  ใช้ QR พร้อมเพย์ที่ยืนยันอัตโนมัติ ดู CLAUDE.md)
ALLOWED_IMAGE_EXTS = {"jpg", "jpeg", "png", "webp"}
ALLOWED_IMAGE_MIME = {"image/jpeg", "image/png", "image/webp"}

# จำนวนจุดสูงสุดที่ยอมรับ ~50 ล้าน (เทียบเท่ากล้อง 50 MP)
# มีไว้กัน decompression bomb ไม่ใช่กันรูปใหญ่ธรรมดา
MAX_IMAGE_PIXELS = 50_000_000

# ขนาดรูปโปรไฟล์หลังย่อ — 256 พอสำหรับจอ retina ที่แสดง 128 px
AVATAR_SIZE = 256


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
    except UnidentifiedImageError:
        raise UploadValidationError("ไฟล์นี้ไม่ใช่รูปภาพ")
    except Exception as e:                      # noqa: BLE001 — Pillow โยนได้หลายชนิด
        raise UploadValidationError(f"เปิดไฟล์รูปไม่ได้: {e}")

    # 5) กันรูป "ระเบิด" — ไฟล์เล็กนิดเดียวแต่ประกาศขนาดมหาศาล
    #    เช่น PNG 40 KB ที่บอกว่ากว้าง 50000 x สูง 50000 px
    #    ตัวไฟล์ผ่านทุกด่านข้างบน แต่พอเบราว์เซอร์ของนักเรียนโหลดไปแสดง
    #    จะกินแรม ~7 GB แล้วแท็บค้าง (Pillow เรียกมันว่า decompression bomb)
    w, h = img.size
    if w * h > MAX_IMAGE_PIXELS:
        raise UploadValidationError(
            f"รูปใหญ่เกินไป ({w}×{h} จุด) — ใช้รูปที่เล็กกว่านี้หน่อยนะ"
        )

    # normalize jpeg → jpg
    norm_ext = "jpg" if ext == "jpeg" else ext
    return data, norm_ext


def make_avatar(data: bytes, *, size: int = AVATAR_SIZE) -> bytes:
    """แปลงรูปที่ผู้ใช้อัปโหลดให้เป็นรูปโปรไฟล์สี่เหลี่ยมจัตุรัสขนาดมาตรฐาน

    ทำไมต้อง "ถอดรหัสแล้วเข้ารหัสใหม่" ไม่เก็บไฟล์เดิมไปตรง ๆ:

    1. **EXIF หลุด** — รูปจากมือถือมักฝังพิกัด GPS ที่ถ่าย วันเวลา และรุ่นเครื่อง
       ไว้ในไฟล์ ถ้าเก็บไฟล์เดิมแล้วเสิร์ฟออกไป ใครโหลดรูปโปรไฟล์ของนักเรียน
       ไปเปิดดู ก็รู้ว่าบ้านอยู่ไหน  เว็บนี้ผู้ใช้เป็นเด็ก ม.ปลาย เรื่องนี้สำคัญมาก
       การเข้ารหัสใหม่ทำให้ EXIF หายไปทั้งหมดโดยอัตโนมัติ

    2. **ขนาดไฟล์** — รูปจากกล้องมือถือ 4 MB มาแสดงเป็นวงกลม 34 px
       เปลืองเน็ตนักเรียนเปล่า ๆ  ย่อแล้วเหลือหลักสิบ KB

    3. **ของแปลกปลอมที่ฝังมาในไฟล์** — ข้อมูลอะไรที่แนบมาท้ายไฟล์รูป
       จะหายไปด้วย เพราะเราสร้างไฟล์ใหม่จากพิกเซลล้วน ๆ

    ครอบตรงกลางเป็นสี่เหลี่ยมจัตุรัสก่อนย่อ — ไม่งั้นรูปแนวนอนจะถูกบีบจนหน้าเบี้ยว
    """
    try:
        img = Image.open(io.BytesIO(data))
        img = ImageOps.exif_transpose(img)      # หมุนตามที่กล้องบันทึกไว้ก่อนทิ้ง EXIF
        img = img.convert("RGB")                # ทิ้งชั้นโปร่งใส (JPEG ไม่รองรับ)
        img = ImageOps.fit(img, (size, size), method=Image.LANCZOS, centering=(0.5, 0.5))
    except Exception as e:                      # noqa: BLE001
        raise UploadValidationError(f"แปลงรูปไม่สำเร็จ: {e}")

    out = io.BytesIO()
    img.save(out, format="JPEG", quality=85, optimize=True)
    return out.getvalue()


def delete_upload(url: str | None) -> None:
    """ลบไฟล์เก่าทิ้งเมื่อผู้ใช้เปลี่ยนรูปโปรไฟล์

    ถ้าไม่ลบ ทุกครั้งที่เปลี่ยนรูปจะทิ้งไฟล์เก่าไว้เรื่อย ๆ
    นักเรียนคนเดียวเปลี่ยนรูป 50 ครั้ง = ไฟล์ขยะ 50 ไฟล์ที่ไม่มีใครใช้

    รับเฉพาะ path ที่เราออกให้เอง (/static/uploads/...) และตรวจซ้ำว่าไฟล์
    อยู่ใน UPLOAD_DIR จริง — กันกรณีค่าใน DB ถูกแก้ให้ชี้ออกไปข้างนอก
    """
    if not url or not url.startswith("/static/uploads/"):
        return
    try:
        target = (UPLOAD_DIR / Path(url).name).resolve()
        if target.parent == UPLOAD_DIR.resolve() and target.is_file():
            target.unlink()
    except OSError:
        pass        # ลบไม่ได้ก็ไม่ควรทำให้ผู้ใช้อัปโหลดรูปใหม่ไม่สำเร็จ


def save_upload(data: bytes, ext: str, *, prefix: str) -> str:
    """บันทึกลง UPLOAD_DIR ด้วยชื่อใหม่ที่ปลอดภัย. คืน URL path สำหรับ static serve."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    fname = f"{prefix}_{int(time.time() * 1000)}.{ext}"
    path = UPLOAD_DIR / fname
    with open(path, "wb") as f:
        f.write(data)
    return f"/static/uploads/{fname}"
