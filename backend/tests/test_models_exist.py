"""โค้ดต้องไม่อ้างถึงตาราง/คอลัมน์ที่ไม่มีอยู่จริง

บั๊กที่ทำให้เขียนไฟล์นี้:

  crud.py มี 3 ฟังก์ชันที่อ้าง `models.LessonProgress` ซึ่งไม่มีอยู่ในโปรเจกต์นี้
  (ชื่อจริงคือ `models.Progress`) และใช้ชื่อคอลัมน์ที่ไม่มีด้วย
  — completed_at / last_watched_second ของจริงคือ completed / seconds_watched

  ผลคือปุ่ม "ทำเครื่องหมายว่าเรียนจบ" และการจำตำแหน่งวิดีโอ ตอบ 500 ทุกครั้ง
  ที่กด ตั้งแต่วันแรกที่เขียน ไม่มีใครรู้เพราะไม่มีเทสต์ตัวไหนแตะเลย

Python ไม่ฟ้อง `models.อะไรก็ได้` ตอน import — มันจะพังตอนรันจริงเท่านั้น
เทสต์นี้เลยไล่อ่านโค้ดทั้งหมดแล้วเทียบกับสิ่งที่มีจริงใน models.py
"""
import ast
import pathlib

from app import models

APP = pathlib.Path(models.__file__).resolve().parent


def _py_files():
    for p in sorted(APP.rglob("*.py")):
        if "__pycache__" not in p.parts:
            yield p


def test_no_reference_to_nonexistent_model():
    """ห้ามมี models.XxxYyy ที่ไม่มีอยู่จริง

    ถ้าตก: เช็คชื่อคลาสใน models.py — ส่วนใหญ่เป็นการจำชื่อผิด
    (LessonProgress vs Progress, LessonRating vs Rating)
    """
    real = {n for n in dir(models) if isinstance(getattr(models, n), type)}
    bad = []
    for p in _py_files():
        tree = ast.parse(p.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if (
                isinstance(node, ast.Attribute)
                and isinstance(node.value, ast.Name)
                and node.value.id == "models"
                and node.attr[:1].isupper()
                and node.attr not in real
            ):
                bad.append(f"{p.name}:{node.lineno} -> models.{node.attr}")
    assert not bad, "อ้างถึงคลาสที่ไม่มีอยู่ใน models.py:\n  " + "\n  ".join(bad)


def test_progress_columns_are_what_code_expects():
    """ชื่อคอลัมน์ของ Progress ต้องตรงกับที่ crud ใช้"""
    cols = {c.name for c in models.Progress.__table__.columns}
    for need in ("user_id", "lesson_id", "completed", "seconds_watched", "last_updated"):
        assert need in cols, f"Progress ไม่มีคอลัมน์ {need}"
    # ชื่อเก่าที่เคยเขียนผิดต้องไม่กลับมา
    assert "completed_at" not in cols
    assert "last_watched_second" not in cols
