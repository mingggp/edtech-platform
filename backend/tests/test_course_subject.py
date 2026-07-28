"""เทสต์กติกา 4 วิชา / ระดับ ของคอร์ส

อ้างอิง CLAUDE.md:
  - มี 4 วิชาเท่านั้น: math (คณิต) · phys (ฟิสิกส์) · tpat3 · tgat2
  - เฉพาะ math / phys ที่มีระดับย่อยได้: m4 m5 m6 alevel
  - TPAT3 / TGAT2 ไม่มีระดับ
  - ห้ามเพิ่มวิชานอกรายการ (เคมี ชีวะ อังกฤษ ฯลฯ)
"""
import pytest
from pydantic import ValidationError

from app import schemas


def _course(**kw):
    base = dict(title="คอร์สทดสอบ", description="x", price=1990.0, category="General")
    base.update(kw)
    return schemas.CourseCreate(**base)


def test_subject_list_is_exactly_four():
    assert schemas.SUBJECTS == ("math", "phys", "tpat3", "tgat2")


@pytest.mark.parametrize("subject", ["math", "phys", "tpat3", "tgat2"])
def test_accepts_the_four_subjects(subject):
    assert _course(subject=subject).subject == subject


@pytest.mark.parametrize("subject", ["chem", "bio", "eng", "คณิต", "TPAT3", "tpat", "tgat", "amath"])
def test_rejects_everything_else(subject):
    """กันคีย์เก่า (tpat/tgat/amath) กับวิชานอกรายการหลุดเข้ามา"""
    with pytest.raises(ValidationError):
        _course(subject=subject)


@pytest.mark.parametrize("level", ["m4", "m5", "m6", "alevel"])
def test_math_and_phys_can_have_levels(level):
    assert _course(subject="math", level=level).level == level
    assert _course(subject="phys", level=level).level == level


@pytest.mark.parametrize("subject", ["tpat3", "tgat2"])
def test_tpat3_and_tgat2_cannot_have_level(subject):
    with pytest.raises(ValidationError):
        _course(subject=subject, level="m6")


def test_rejects_unknown_level():
    with pytest.raises(ValidationError):
        _course(subject="math", level="m7")


def test_subject_is_optional_for_now():
    """คอร์สเก่าที่ยังไม่ได้ระบุวิชา ต้องยังบันทึกได้ (migration ค่อยเติมทีหลัง)"""
    c = _course()
    assert c.subject is None and c.level is None


def test_course_update_validates_too():
    with pytest.raises(ValidationError):
        schemas.CourseUpdate(subject="chem")
    with pytest.raises(ValidationError):
        schemas.CourseUpdate(subject="tgat2", level="m4")
