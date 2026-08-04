"""เทียบตารางจริงในฐานข้อมูลกับที่โค้ดคาดหวัง

ทำไมต้องมี:

เดิม main.py เรียก Base.metadata.create_all() ตอนเปิดแอป ซึ่งสร้างตาราง
ที่ขาดให้เองเงียบ ๆ — ปิดปัญหาไว้แต่ไปสร้างปัญหาใหม่ (ชนกับ Alembic)
พอเอา create_all ออก อาการก็เปลี่ยนเป็น "แอปเปิดได้ปกติ แต่พอผู้ใช้กดใช้งาน
ฟีเจอร์ที่ต้องใช้คอลัมน์ใหม่ ถึงจะพัง 500"

ของจริงที่เกิดขึ้น: เพิ่ม migration ให้คอมเมนต์ตอบกลับได้ (คอลัมน์ parent_id)
แต่ยังไม่ได้รัน alembic upgrade head บนเครื่องที่ใช้อยู่
-> เปิดเว็บได้ ดูคลิปได้ กดคอมเมนต์ทีเดียวเจอ
   'column parent_id of relation comments does not exist'
ซึ่งอ่านไม่ออกว่าต้องไปทำอะไร

โมดูลนี้ทำให้รู้ตั้งแต่ตอนเปิดเซิร์ฟเวอร์ พร้อมบอกคำสั่งที่ต้องรัน
"""
from __future__ import annotations

from dataclasses import dataclass, field

from sqlalchemy import inspect
from sqlalchemy.engine import Engine


@dataclass
class SchemaDiff:
    """ส่วนที่ฐานข้อมูลยังตามโค้ดไม่ทัน"""
    missing_tables: list[str] = field(default_factory=list)
    missing_columns: list[tuple[str, list[str]]] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.missing_tables and not self.missing_columns

    def as_lines(self) -> list[str]:
        out: list[str] = []
        for t in self.missing_tables:
            out.append(f"ตารางที่ยังไม่มี: {t}")
        for t, cols in self.missing_columns:
            out.append(f"คอลัมน์ที่ยังไม่มีในตาราง {t}: {', '.join(cols)}")
        return out


def diff_schema(engine: Engine) -> SchemaDiff:
    """คืนสิ่งที่ models.py มีแต่ฐานข้อมูลยังไม่มี

    ดูทางเดียว (โค้ด -> ฐานข้อมูล) เท่านั้น
    คอลัมน์ส่วนเกินในฐานข้อมูลไม่ถือว่าผิด เพราะอาจเป็นของที่กำลังจะเลิกใช้
    แต่ยังไม่ได้ลบ ซึ่งไม่ทำให้แอปพัง
    """
    from . import models  # noqa: F401  ต้อง import เพื่อให้ Base รู้จักทุกตาราง
    from .database import Base

    insp = inspect(engine)
    existing = set(insp.get_table_names())
    diff = SchemaDiff()

    for name, table in Base.metadata.tables.items():
        if name not in existing:
            diff.missing_tables.append(name)
            continue
        have = {c["name"] for c in insp.get_columns(name)}
        gap = sorted({c.name for c in table.columns} - have)
        if gap:
            diff.missing_columns.append((name, gap))

    diff.missing_tables.sort()
    diff.missing_columns.sort()
    return diff
