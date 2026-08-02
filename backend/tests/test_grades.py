"""ระดับชั้น + รุ่น DEK

บั๊กที่ทำให้เขียนไฟล์นี้:
  crud.py มีตารางแปลงรุ่น DEK เขียนไว้ 2 ที่ {"M6":69, "M5":70, "M4":71}
  ซึ่งเป็นค่าตายตัวที่ **เก่าตามเวลา** — เขียนไว้ตอน ม.6 คือ DEK69
  พอถึงปีการศึกษา 2569 ม.6 กลายเป็น DEK70 แต่โค้ดยังตอบ 69

เทสต์ที่สำคัญที่สุดในไฟล์นี้คือตัวที่ยิงวันที่ในอนาคตเข้าไป — เพื่อพิสูจน์ว่า
ค่ามันขยับตามปีจริง ไม่ใช่ค้างอยู่กับที่
"""
from datetime import date

import pytest

from app import grades


# --------------------------------------------------------------------- key/label

def test_keys_are_lowercase_ascii():
    """key ต้องเอาไปใส่ URL และ query ได้โดยไม่ต้อง encode"""
    for k in grades.GRADE_KEYS:
        assert k.isascii() and k.islower(), k


def test_labels_are_thai():
    assert grades.label("m4") == "ม.4"
    assert grades.label("m6") == "ม.6"
    assert grades.label("other") == "อื่นๆ"


def test_label_of_unknown_returns_input():
    """ข้อมูลเก่าที่แปลก ๆ ต้องไม่ทำให้หน้าเว็บพัง"""
    assert grades.label("zzz") == "zzz"
    assert grades.label(None) == ""


@pytest.mark.parametrize("raw,want", [
    ("m6", "m6"), ("M6", "m6"), ("ม.6", "m6"), ("ม6", "m6"), ("M.6", "m6"),
    (" m5 ", "m5"), ("M4", "m4"), ("other", "other"), ("อื่นๆ", "other"),
    (None, None), ("", None), ("ป.6", None), ("ขยะ", None),
])
def test_normalize(raw, want):
    assert grades.normalize(raw) == want


# ------------------------------------------------------------------------- DEK

def test_m6_is_dek70_in_academic_year_2569():
    """ค่าที่หมิงยืนยันเอง: ตอนนี้ ม.6 คือ DEK70"""
    assert grades.dek_code("m6", date(2026, 8, 2)) == "70"


def test_lower_grades_are_later_cohorts():
    d = date(2026, 8, 2)
    assert grades.dek_code("m5", d) == "71"
    assert grades.dek_code("m4", d) == "72"


def test_other_has_no_dek():
    """เดาให้ไม่ได้ ก็ไม่ควรเดา"""
    assert grades.dek_code("other") is None
    assert grades.dek_code(None) is None
    assert grades.dek_code("ป.6") is None


@pytest.mark.parametrize("d", [
    date(2026, 5, 16),   # เปิดเทอมต้น
    date(2026, 8, 2),
    date(2026, 12, 31),  # ข้ามปี ค.ศ. แต่ยังปีการศึกษาเดิม
    date(2027, 1, 5),
    date(2027, 4, 30),   # ก่อนเปิดเทอมใหม่
])
def test_dek_does_not_change_mid_academic_year(d):
    """เด็ก ม.6 คนเดิมต้องเป็นรุ่นเดิมตลอดปีการศึกษา

    ถ้าใช้ปี ค.ศ. ตรง ๆ โดยไม่คิดเรื่องเดือนเปิดเทอม พอขึ้นเดือนมกราคม
    รุ่นจะกระโดดทันที ทั้งที่เด็กยังเรียน ม.6 อยู่และยังสอบไม่เสร็จ
    """
    assert grades.dek_code("m6", d) == "70"


def test_dek_advances_next_academic_year():
    """ปีหน้า ม.6 รุ่นใหม่ต้องเป็น DEK71 เอง โดยไม่ต้องมีใครมาแก้โค้ด

    นี่คือเทสต์ที่จะจับบั๊กเดิม — ตารางตายตัวจะตอบ 70 ตลอดไป
    """
    assert grades.dek_code("m6", date(2027, 5, 20)) == "71"
    assert grades.dek_code("m6", date(2028, 5, 20)) == "72"
    assert grades.dek_code("m6", date(2036, 5, 20)) == "80"


def test_dek_wraps_past_hundred():
    """พ.ศ. 2600 -> DEK00 ไม่ใช่ DEK100"""
    assert grades.dek_code("m6", date(2056, 5, 20)) == "00"


def test_academic_year_boundary_is_may():
    assert grades.academic_year_be(date(2026, 4, 30)) == 2568
    assert grades.academic_year_be(date(2026, 5, 1)) == 2569


# ---------------------------------------------------------- ไม่มีตารางตายตัวหลงเหลือ

def test_no_hardcoded_dek_table_left_in_code():
    """กันไม่ให้ตารางตายตัวกลับมา

    ถ้าตก: ใช้ grades.dek_code() แทนการเขียน map เอง
    """
    import pathlib
    root = pathlib.Path(grades.__file__).resolve().parent.parent
    bad = []
    for p in sorted(root.rglob("*.py")):
        if any(x in p.parts for x in (".venv", "__pycache__", "tests")):
            continue
        # migration เป็นบันทึกประวัติศาสตร์ ต้องคงค่าเดิมไว้เพื่อย้อนกลับได้
        if "versions" in p.parts or p.name in ("grades.py", "test_grades.py"):
            continue
        txt = p.read_text(encoding="utf-8")
        # มองหา map จริง ๆ คือ  "M6": 69  ไม่ใช่คำว่า M6 ที่โผล่ในคอมเมนต์
        if '"M6":' in txt or "'M6':" in txt:
            bad.append(str(p.relative_to(root)))
    assert not bad, f"ยังมีตารางแปลงรุ่น DEK เขียนมืออยู่ใน: {bad}"
