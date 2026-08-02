"""ฐานข้อมูลที่สร้างจาก Alembic ต้องเหมือนกับ models.py เป๊ะ ๆ

ทำไมต้องมีเทสต์นี้:

เดิม main.py เรียก Base.metadata.create_all() ตอนเปิดแอป ซึ่งสร้างตารางตาม
models.py ตรง ๆ ผลคือ "ตารางมีครบ" เสมอบนเครื่องที่พัฒนา แม้จะลืมเขียน migration
ก็ไม่มีใครรู้ — จนกว่าจะไปสร้างฐานข้อมูลใหม่จาก alembic แล้วตารางหาย

เจอของจริงตอนเอา create_all ออก: ตาราง exam_results ไม่เคยมี migration เลย
อยู่รอดมาได้เพราะ create_all สร้างให้ทุกครั้ง

เทสต์นี้รัน `alembic upgrade head` ลงฐานข้อมูลเปล่าจริง ๆ แล้วเทียบทีละตาราง
ทีละคอลัมน์กับ models.py ถ้าลืมเขียน migration จะฟ้องทันที
"""
import pathlib
import tempfile

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect

from app.database import Base
from app import models  # noqa: F401  ต้อง import เพื่อให้ Base รู้จักทุกตาราง

BACKEND = pathlib.Path(__file__).resolve().parent.parent


@pytest.fixture(scope="module")
def migrated_inspector():
    """สร้างฐานข้อมูลเปล่าแล้วรัน migration ทั้งหมดตามลำดับจริง"""
    with tempfile.TemporaryDirectory() as tmp:
        db = pathlib.Path(tmp) / "fresh.db"
        url = f"sqlite:///{db}"

        cfg = Config(str(BACKEND / "alembic.ini"))
        cfg.set_main_option("script_location", str(BACKEND / "alembic"))
        cfg.set_main_option("sqlalchemy.url", url)
        command.upgrade(cfg, "head")

        engine = create_engine(url)
        try:
            yield inspect(engine)
        finally:
            engine.dispose()


def test_no_table_missing_from_migrations(migrated_inspector):
    """ทุกตารางใน models.py ต้องถูกสร้างโดย migration

    ถ้าตก: เพิ่มไฟล์ใน alembic/versions/ ให้สร้างตารางที่ขาด
    (อย่าแก้ด้วยการเอา create_all กลับมา — นั่นคือต้นเหตุ ไม่ใช่ทางแก้)
    """
    have = set(migrated_inspector.get_table_names())
    want = set(Base.metadata.tables)
    missing = sorted(want - have)
    assert not missing, f"ตารางที่ models.py มีแต่ migration ไม่ได้สร้าง: {missing}"


def test_no_column_missing_from_migrations(migrated_inspector):
    """ทุกคอลัมน์ใน models.py ต้องมีอยู่จริงหลังรัน migration

    เคยเจอของจริง: เพิ่ม price_old ลง models แล้วลืม migration
    -> "column courses.price_old does not exist" ตอนเปิดหน้าคอร์ส
    """
    have_tables = set(migrated_inspector.get_table_names())
    gaps = []
    for name, table in Base.metadata.tables.items():
        if name not in have_tables:
            continue  # เทสต์ข้างบนรายงานไปแล้ว
        actual = {c["name"] for c in migrated_inspector.get_columns(name)}
        missing = sorted({c.name for c in table.columns} - actual)
        if missing:
            gaps.append(f"{name}: {', '.join(missing)}")
    assert not gaps, "คอลัมน์ที่ migration ยังไม่ได้สร้าง:\n  " + "\n  ".join(gaps)


def test_migrations_have_single_head():
    """ต้องมี head เดียว — สองหัวแปลว่ามีคนแตกสายโดยไม่ได้ merge"""
    from alembic.script import ScriptDirectory

    cfg = Config(str(BACKEND / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND / "alembic"))
    heads = ScriptDirectory.from_config(cfg).get_heads()
    assert len(heads) == 1, f"มี head มากกว่า 1: {heads} — ต้อง alembic merge ก่อน"
