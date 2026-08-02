"""ระดับชั้น และ รุ่น DEK — แหล่งความจริงที่เดียวของทั้งระบบ

แยก key กับ label เหมือนที่ทำกับวิชา (ดู CLAUDE.md):

    key    m4 · m5 · m6 · other      เก็บในฐานข้อมูล ใช้ใน URL และ query
    label  ม.4 · ม.5 · ม.6 · อื่นๆ    สิ่งที่นักเรียนเห็นบนหน้าจอ

ห้ามเอา label ไปเก็บลงฐานข้อมูล เพราะพอเอาไปใส่ URL หรือส่ง API จะเจอ
เรื่อง encoding จุกจิก และวันไหนอยากเปลี่ยนคำที่แสดงก็ต้องไล่แก้ข้อมูลเก่าทั้งหมด


รุ่น DEK
--------
เดิมโค้ดใช้ตารางตายตัว {"M6":69, "M5":70, "M4":71} เขียนไว้ 2 ที่ใน crud.py
มีปัญหา 2 อย่าง:

  1. เขียนซ้ำ 2 ที่ -> วันไหนแก้ที่เดียวจะหลุดกัน
  2. **ค่าตายตัวเก่าตามเวลา** — ตารางนั้นถูกเขียนไว้ตอนที่ ม.6 คือ DEK69
     พอถึงปีการศึกษา 2569 ม.6 กลายเป็น DEK70 แต่โค้ดยังบอก 69 อยู่
     นักเรียนที่สมัครวันนี้จะถูกติดป้ายรุ่นผิดตั้งแต่วินาทีแรก และจะผิดเพิ่ม
     ขึ้นทุก ๆ ปีที่ผ่านไป

ตอนนี้คำนวณจาก "ปีการศึกษาปัจจุบัน" แทน จึงถูกต้องเองทุกปีโดยไม่ต้องมาแก้

    ม.6 ปีการศึกษา 2569  จบ มี.ค. 2570  เข้ามหาลัย 2570  ->  DEK70
    ม.5 ปีการศึกษา 2569                 เข้ามหาลัย 2571  ->  DEK71
    ม.4 ปีการศึกษา 2569                 เข้ามหาลัย 2572  ->  DEK72

ปีการศึกษาไทยเริ่มประมาณเดือนพฤษภาคม ดังนั้นเดือน ม.ค.–เม.ย. ยังนับเป็น
ปีการศึกษาก่อนหน้า — ไม่งั้นเด็ก ม.6 คนเดิมจะเปลี่ยนรุ่นกลางคันตอนขึ้นปีใหม่
"""
from __future__ import annotations

from datetime import date

# key -> ป้ายที่นักเรียนเห็น
GRADES: dict[str, str] = {
    "m4": "ม.4",
    "m5": "ม.5",
    "m6": "ม.6",
    "other": "อื่นๆ",
}

GRADE_KEYS = tuple(GRADES)

# ม.6 เข้ามหาลัยปีถัดจากปีการศึกษาปัจจุบัน, ม.5 ถัดไปอีกปี, ม.4 อีกปี
_YEARS_UNTIL_UNIVERSITY = {"m6": 1, "m5": 2, "m4": 3}

# เดือนที่ปีการศึกษาไทยเริ่ม
_ACADEMIC_YEAR_STARTS_IN_MONTH = 5


def label(key: str | None) -> str:
    """คืนคำที่เอาไปแสดงบนหน้าจอ — ไม่รู้จักก็คืนค่าเดิมไปตรง ๆ"""
    if not key:
        return ""
    return GRADES.get(key, key)


def is_valid(key: str | None) -> bool:
    return key in GRADES


def normalize(raw: str | None) -> str | None:
    """แปลงค่าที่รับมาให้เป็น key มาตรฐาน

    รองรับของเก่าที่เคยเก็บไว้หลายแบบ: "M6", "m6", "ม.6", "ม6"
    ถ้าแปลงไม่ได้จะคืน None แทนที่จะเดา — ข้อมูลผิดควรเห็นชัด ๆ ดีกว่าเงียบ ๆ
    """
    if raw is None:
        return None
    s = str(raw).strip().replace(" ", "")
    if not s:
        return None
    low = s.lower()
    if low in GRADES:
        return low
    # ม.6 / ม6 / M6 / m.6
    digits = "".join(ch for ch in s if ch.isdigit())
    if digits in ("4", "5", "6") and (low.startswith("m") or s.startswith("ม")):
        return f"m{digits}"
    if low in ("other", "อื่นๆ", "อื่น ๆ", "อื่นๆ".replace(" ", "")):
        return "other"
    return None


def academic_year_be(today: date | None = None) -> int:
    """ปีการศึกษาปัจจุบันแบบ พ.ศ. (เต็ม เช่น 2569)"""
    d = today or date.today()
    be = d.year + 543
    if d.month < _ACADEMIC_YEAR_STARTS_IN_MONTH:
        be -= 1          # ม.ค.–เม.ย. ยังอยู่ปีการศึกษาเดิม
    return be


def dek_code(grade_key: str | None, today: date | None = None) -> str | None:
    """รุ่น DEK จากระดับชั้น เช่น 'm6' -> '70'

    คืน None เมื่อระดับชั้นเป็น other/ไม่รู้จัก เพราะเดาให้ไม่ได้และไม่ควรเดา
    """
    key = normalize(grade_key)
    ahead = _YEARS_UNTIL_UNIVERSITY.get(key or "")
    if ahead is None:
        return None
    # 2569 + 1 = 2570 -> "70"
    return str((academic_year_be(today) + ahead) % 100).zfill(2)
