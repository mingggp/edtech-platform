"""เทสต์ฟิลด์ใหม่ของคอร์ส — ริบบิ้น + ค่าที่คำนวณเอง

แยกเป็น 2 กลุ่มตามที่ตกลงกันไว้:
  กลุ่ม 1 (คำนวณเอง)  total_lessons · total_minutes · student_count
                       ไม่มีคอลัมน์ในตาราง คำนวณจากข้อมูลที่มีอยู่
                       -> ไม่มีวันไม่ตรงกับความจริง
  กลุ่ม 3 (แอดมินตั้ง) ribbon — เป็นการตลาด คำนวณไม่ได้
"""
import pytest
from pydantic import ValidationError

from app import crud, models, schemas


def _course(db, **kw):
    base = dict(title="คอร์สทดสอบ", description="x", price=1000.0,
                category="General", subject="math", is_active=True)
    base.update(kw)
    c = models.Course(**base)
    db.add(c); db.commit(); db.refresh(c)
    return c


def _with_lessons(db, course, durations):
    ch = models.Chapter(course_id=course.id, title="บทนำ", order=1)
    db.add(ch); db.commit(); db.refresh(ch)
    for i, d in enumerate(durations, 1):
        db.add(models.Lesson(chapter_id=ch.id, title=f"EP.{i}",
                             youtube_id="x", duration=d, order=i))
    db.commit(); db.refresh(course)
    return course


# ---------------------------------------------------------------------------
# กลุ่ม 3 — ริบบิ้น
# ---------------------------------------------------------------------------

def test_ribbon_list():
    assert schemas.RIBBONS == ("hot", "new", "rec", "free")


@pytest.mark.parametrize("r", ["hot", "new", "rec", "free"])
def test_valid_ribbons(r):
    assert schemas.CourseCreate(title="a", description="b", price=1,
                                category="General", ribbon=r).ribbon == r


def test_ribbon_can_be_empty():
    assert schemas.CourseCreate(title="a", description="b", price=1,
                                category="General").ribbon is None


@pytest.mark.parametrize("r", ["HOT", "sale", "แนะนำ", "bestseller"])
def test_invalid_ribbon_rejected(r):
    with pytest.raises(ValidationError):
        schemas.CourseCreate(title="a", description="b", price=1,
                             category="General", ribbon=r)


def test_ribbon_can_be_cleared_via_update(db_session):
    """ส่ง ribbon=None มาต้องลบป้ายออกได้จริง

    เดิม update_course เช็ค `if p.x is not None` ซึ่งล้างค่าเป็น null ไม่ได้เลย
    """
    c = _course(db_session, ribbon="hot")
    crud.update_course(db_session, c.id, schemas.CourseUpdate(ribbon=None))
    assert crud.get_course(db_session, c.id).ribbon is None


# ---------------------------------------------------------------------------
# create/update ต้องไม่ลืมฟิลด์
# ---------------------------------------------------------------------------

def test_create_course_saves_every_field(db_session):
    """เคยมีบั๊ก: create_course ไล่เขียนทีละฟิลด์ พอเพิ่ม subject/level/price_old
    ลง schema แล้วลืมมาเพิ่ม -> สร้างคอร์สแล้ววิชาหายเงียบ ๆ"""
    p = schemas.CourseCreate(
        title="A-Level คณิต", description="x", price=1990, price_old=2990,
        subject="math", level="alevel", ribbon="hot", category="General",
        target_audience="ม.6", highlights="ครบ", is_active=True,
    )
    c = crud.create_course(db_session, p)
    assert (c.subject, c.level, c.ribbon) == ("math", "alevel", "hot")
    assert c.price_old == 2990
    assert c.target_audience == "ม.6" and c.is_active is True


def test_update_only_touches_given_fields(db_session):
    c = _course(db_session, subject="phys", level="m5", ribbon="new")
    crud.update_course(db_session, c.id, schemas.CourseUpdate(price=555))
    got = crud.get_course(db_session, c.id)
    assert got.price == 555
    assert (got.subject, got.level, got.ribbon) == ("phys", "m5", "new")


# ---------------------------------------------------------------------------
# กลุ่ม 1 — ค่าที่คำนวณเอง
# ---------------------------------------------------------------------------

def test_totals_are_zero_when_empty(db_session):
    c = _course(db_session)
    assert (c.total_lessons, c.total_minutes, c.student_count) == (0, 0, 0)


def test_total_lessons_and_minutes(db_session):
    c = _with_lessons(db_session, _course(db_session), [20, 15, 25])
    assert c.total_lessons == 3
    assert c.total_minutes == 60


def test_minutes_ignores_null_duration(db_session):
    """บทที่ยังไม่ได้ดึงความยาวจาก YouTube (duration = None) ต้องไม่ทำให้พัง"""
    c = _course(db_session)
    ch = models.Chapter(course_id=c.id, title="บท", order=1)
    db_session.add(ch); db_session.commit(); db_session.refresh(ch)
    db_session.add(models.Lesson(chapter_id=ch.id, title="a", youtube_id="x",
                                 duration=None, order=1))
    db_session.add(models.Lesson(chapter_id=ch.id, title="b", youtube_id="x",
                                 duration=30, order=2))
    db_session.commit(); db_session.refresh(c)
    assert c.total_minutes == 30
    assert c.total_lessons == 2


def test_student_count_follows_enrollments(db_session):
    c = _course(db_session)
    user = crud.get_user_by_email(db_session, "test@example.com")
    assert c.student_count == 0
    crud.create_enrollment(db_session, user.id, c.id)
    db_session.refresh(c)
    assert c.student_count == 1


def test_computed_fields_appear_in_api(client, db_session):
    c = _with_lessons(db_session, _course(db_session, title="มีบทเรียน"), [10, 20])
    rows = client.get("/courses").json()
    row = next(x for x in rows if x["id"] == c.id)
    assert row["total_lessons"] == 2
    assert row["total_minutes"] == 30
    assert row["student_count"] == 0
    assert "ribbon" in row


# ---------------------------------------------------------------------------
# คอร์สที่ไม่มีอยู่ ต้องตอบ 404 ไม่ใช่ 500
# ---------------------------------------------------------------------------

def test_missing_course_returns_404(client):
    """เดิม get_course คืน None แล้ว FastAPI serialize ไม่ผ่าน -> 500
    หน้าเว็บเลยแยกไม่ออกว่า 'ไม่มีคอร์ส' กับ 'เซิร์ฟเวอร์พัง'"""
    assert client.get("/courses/999999").status_code == 404


def test_missing_course_chapters_returns_404(client):
    """คืน list ว่างจะทำให้หน้าเว็บขึ้น 'ยังไม่ได้เพิ่มบทเรียน' ทั้งที่ไม่มีคอร์ส"""
    assert client.get("/courses/999999/chapters").status_code == 404


def test_existing_course_chapters_ok(client, db_session):
    c = _with_lessons(db_session, _course(db_session), [10])
    r = client.get(f"/courses/{c.id}/chapters")
    assert r.status_code == 200
    assert len(r.json()) == 1
