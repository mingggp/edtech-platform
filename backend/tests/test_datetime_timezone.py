"""ทุกเวลาที่ส่งออกทาง API ต้องบอก timezone ติดไปด้วย

บั๊กจริงที่ทำให้เขียนไฟล์นี้ (2 ส.ค. 69):

  backend ส่ง  "expires_at": "2026-08-02T13:58:53.924132"   ไม่มี Z ไม่มี +00:00
  JavaScript เจอสตริงแบบนี้จะตีความเป็น "เวลาท้องถิ่น" ตามสเปก ECMAScript
  เครื่องที่ตั้งเวลาไทย (UTC+7) จึงอ่านว่าเป็นเวลาที่ผ่านมาแล้ว 7 ชั่วโมง

  ผล: QR พร้อมเพย์ที่เพิ่งสร้างสด ๆ อายุ 15 นาที พอถึงหน้าเว็บกลายเป็น
  "หมดอายุไปแล้ว 405 นาที" -> ขึ้นหน้า "QR หมดอายุแล้ว" ทันทีที่เปิด
  กดสร้างใหม่ก็เด้งกลับหน้าเดิมทุกครั้ง = ไม่มีนักเรียนคนไหนจ่ายเงินได้เลย

เทสต์ backend ทั้งชุดผ่านหมดตอนนั้น เพราะฝั่ง Python เทียบเวลากันเองถูกต้อง
ความผิดพลาดอยู่ที่ "สัญญาระหว่าง backend กับเบราว์เซอร์" ซึ่งไม่มีใครตรวจ
"""
import json
import re
from datetime import datetime, timedelta, timezone

import pytest

from app import schemas

# รูปแบบที่ JavaScript อ่านแล้วได้เวลาที่ถูกต้องแน่นอน
_HAS_TZ = re.compile(r"(Z|[+-]\d{2}:\d{2})$")


def _iso_of(model, field: str) -> str:
    return json.loads(model.model_dump_json())[field]


def test_checkout_expires_at_has_timezone():
    """ฟิลด์ที่ทำให้เกิดบั๊ก — ต้องลงท้ายด้วย Z"""
    exp = datetime.utcnow() + timedelta(minutes=15)
    c = schemas.CheckoutRead(
        ref="ABC123", amount=1990.0, status="awaiting", expires_at=exp, qr_url="/x",
    )
    got = _iso_of(c, "expires_at")
    assert _HAS_TZ.search(got), f"ไม่มี timezone ต่อท้าย: {got!r}"


def test_browser_would_see_15_minutes_left():
    """จำลองสิ่งที่เบราว์เซอร์คำนวณได้จริง

    นี่คือเทสต์ที่จะจับบั๊กเดิมได้ ถ้ามีคนเผลอเอา timezone ออกอีก
    """
    exp = datetime.utcnow() + timedelta(minutes=15)
    c = schemas.CheckoutRead(
        ref="ABC123", amount=1990.0, status="awaiting", expires_at=exp, qr_url="/x",
    )
    # เบราว์เซอร์แปลงสตริงเป็นเวลาจริง (Python อ่าน Z ไม่ได้ตรง ๆ ต้องแปลงก่อน)
    parsed = datetime.fromisoformat(_iso_of(c, "expires_at").replace("Z", "+00:00"))
    left = (parsed - datetime.now(timezone.utc)).total_seconds()
    assert 13 * 60 < left <= 15 * 60, (
        f"เบราว์เซอร์จะเห็นว่าเหลือ {left / 60:.0f} นาที (ควรได้ ~15) "
        "— ถ้าติดลบแปลว่าบั๊ก timezone กลับมาแล้ว"
    )


@pytest.mark.parametrize(
    "model,kwargs,fields",
    [
        (
            "PaymentRead",
            dict(id=1, user_id=1, course_id=1, amount=1990.0, status="awaiting",
                 created_at=datetime.utcnow(), expires_at=datetime.utcnow(),
                 paid_at=datetime.utcnow()),
            ["created_at", "expires_at", "paid_at"],
        ),
        (
            "EnrollmentRead",
            dict(id=1, course_id=1, user_id=1, enrolled_at=datetime.utcnow()),
            ["enrolled_at"],
        ),
    ],
)
def test_other_time_fields_have_timezone(model, kwargs, fields):
    m = getattr(schemas, model)(**kwargs)
    data = json.loads(m.model_dump_json())
    for f in fields:
        assert _HAS_TZ.search(data[f]), f"{model}.{f} ไม่มี timezone: {data[f]!r}"


def test_naive_and_aware_input_give_same_answer():
    """ส่งเวลาเข้ามาแบบติด/ไม่ติด timezone ต้องได้ผลลัพธ์เดียวกัน"""
    naive = datetime(2026, 8, 2, 12, 0, 0)
    aware = naive.replace(tzinfo=timezone.utc)
    mk = lambda d: schemas.CheckoutRead(  # noqa: E731
        ref="R", amount=1.0, status="awaiting", expires_at=d, qr_url="/x")
    assert _iso_of(mk(naive), "expires_at") == _iso_of(mk(aware), "expires_at")


def test_every_datetime_field_in_schemas_uses_utcdatetime():
    """ห้ามมีฟิลด์ไหนใช้ `datetime` เปล่า ๆ ใน schemas.py

    ถ้าตก: เปลี่ยนเป็น UtcDatetime (หรือ Optional[UtcDatetime])
    ฟิลด์ที่หลุดไปแม้ตัวเดียวก็พาบั๊ก 7 ชั่วโมงกลับมาได้
    """
    import ast
    import pathlib

    src = pathlib.Path(schemas.__file__).read_text(encoding="utf-8")
    tree = ast.parse(src)
    bad = []
    for cls in [n for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]:
        for stmt in cls.body:
            if not isinstance(stmt, ast.AnnAssign) or not isinstance(stmt.target, ast.Name):
                continue
            ann = ast.unparse(stmt.annotation)
            if re.search(r"\bdatetime\b", ann):
                bad.append(f"{cls.name}.{stmt.target.id}: {ann}")
    assert not bad, (
        "ฟิลด์ที่ยังใช้ datetime เปล่า ๆ (ต้องเป็น UtcDatetime):\n  " + "\n  ".join(bad)
    )
