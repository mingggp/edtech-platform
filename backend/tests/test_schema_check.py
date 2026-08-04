"""ตัวเตือนว่าฐานข้อมูลตามโค้ดไม่ทัน

เคสจริงที่ทำให้ต้องมีตัวนี้:
  เพิ่ม migration ให้คอมเมนต์ตอบกลับได้ (คอลัมน์ parent_id) แต่ยังไม่ได้รัน
  alembic upgrade head บนเครื่องที่ใช้อยู่
  -> เปิดเว็บได้ ดูคลิปได้ ทุกอย่างดูปกติดี
  -> พอกดส่งคอมเมนต์ถึงเจอ 500 'column parent_id ... does not exist'

ก่อนหน้านี้ main.py เรียก create_all() ซึ่งปิดปัญหานี้ไว้เงียบ ๆ
พอเอาออก (เพราะมันไปแย่งงาน Alembic) อาการเลยย้ายไปโผล่ตอนผู้ใช้กดใช้งานแทน
ตัวเช็คนี้ดึงให้มารู้ตั้งแต่ตอนเปิดเซิร์ฟเวอร์
"""
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.schema_check import diff_schema


def _rebuild_comments_without_parent_id(engine):
    """จำลองฐานข้อมูลที่ยังไม่ได้รัน migration ตัวล่าสุด

    สร้างตาราง comments ใหม่แบบไม่มี parent_id แทนการใช้ DROP COLUMN
    เพราะ SQLite รองรับ DROP COLUMN ตั้งแต่ 3.35 เท่านั้น
    ถ้าใช้ ALTER เทสต์จะพังบนเครื่องที่ SQLite เก่ากว่านั้น
    """
    with engine.begin() as c:
        c.execute(text("DROP TABLE comments"))
        c.execute(text("""
            CREATE TABLE comments (
                id INTEGER NOT NULL PRIMARY KEY,
                user_id INTEGER,
                lesson_id INTEGER,
                text VARCHAR,
                created_at DATETIME
            )
        """))


@pytest.fixture
def fresh_engine():
    e = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False},
                      poolclass=StaticPool)
    yield e
    e.dispose()


def test_no_diff_when_up_to_date(fresh_engine):
    Base.metadata.create_all(bind=fresh_engine)
    d = diff_schema(fresh_engine)
    assert d.ok, d.as_lines()


def test_detects_missing_table(fresh_engine):
    Base.metadata.create_all(bind=fresh_engine)
    with fresh_engine.begin() as c:
        c.execute(text("DROP TABLE comments"))
    d = diff_schema(fresh_engine)
    assert not d.ok
    assert "comments" in d.missing_tables


def test_detects_missing_column(fresh_engine):
    """เคสเดียวกับที่หมิงเจอเป๊ะ ๆ — ตารางมีอยู่ แต่คอลัมน์ใหม่ยังไม่มา"""
    Base.metadata.create_all(bind=fresh_engine)
    _rebuild_comments_without_parent_id(fresh_engine)

    d = diff_schema(fresh_engine)
    assert not d.ok
    tables = dict(d.missing_columns)
    assert "parent_id" in tables.get("comments", [])


def test_message_tells_you_what_to_run(fresh_engine):
    """ข้อความต้องอ่านแล้วรู้ว่าต้องไปทำอะไร ไม่ใช่แค่บอกว่าพัง"""
    Base.metadata.create_all(bind=fresh_engine)
    _rebuild_comments_without_parent_id(fresh_engine)
    lines = diff_schema(fresh_engine).as_lines()
    assert any("comments" in l and "parent_id" in l for l in lines), lines


def test_extra_column_in_db_is_not_an_error(fresh_engine):
    """คอลัมน์ส่วนเกินในฐานข้อมูลไม่ถือว่าผิด

    อาจเป็นของที่กำลังจะเลิกใช้แต่ยังไม่ได้ลบ ซึ่งไม่ทำให้แอปพัง
    ถ้าเตือนด้วยจะกลายเป็นเสียงรบกวนจนคนเลิกอ่าน
    """
    Base.metadata.create_all(bind=fresh_engine)
    with fresh_engine.begin() as c:
        # ADD COLUMN รองรับทุกเวอร์ชัน ต่างจาก DROP COLUMN
        c.execute(text("ALTER TABLE comments ADD COLUMN legacy_note TEXT"))
    assert diff_schema(fresh_engine).ok
