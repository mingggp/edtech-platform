"""กำแพงจ่ายเงิน — คนที่ยังไม่ซื้อต้องไม่ได้ลิงก์วิดีโอ

ช่องโหว่ที่ทำให้เขียนไฟล์นี้:

    curl http://localhost:8000/courses/1/chapters

    ยิงแค่นี้ ไม่ต้องล็อกอิน ไม่ต้องสมัครสมาชิก ได้ youtube_id ของทุกบทเรียน
    ในคอร์สราคา 2,490 กลับมาครบ เอาไปเปิดดูบน YouTube ได้เลยทั้งคอร์ส

นี่ร้ายแรงกว่าช่องโหว่ลงทะเบียนฟรีที่เจอก่อนหน้า เพราะอันนั้นยังต้องมีบัญชี
แต่อันนี้ใครก็ได้บนอินเทอร์เน็ต

สิ่งที่ยังต้องเห็นได้: ชื่อบท ชื่อบทเรียน ความยาว จำนวนคลิป
เพราะเป็นข้อมูลที่นักเรียนใช้ตัดสินใจว่าจะซื้อดีไหม
"""
import pytest

from app import crud, models
from app.auth import get_password_hash

SECRET = "SECRET_VIDEO_ID"


@pytest.fixture
def course(db_session):
    c = models.Course(title="A-Level คณิต", description="x", price=2490.0,
                      category="General", subject="math", is_active=True)
    db_session.add(c); db_session.commit(); db_session.refresh(c)
    ch = models.Chapter(course_id=c.id, title="บทที่ 1 ลิมิต", order=1)
    db_session.add(ch); db_session.commit(); db_session.refresh(ch)
    db_session.add(models.Lesson(chapter_id=ch.id, title="ลิมิตคืออะไร",
                                 youtube_id=SECRET, duration=42, order=1,
                                 doc_url="/static/uploads/secret-sheet.pdf"))
    db_session.commit(); db_session.refresh(c)
    return c


@pytest.fixture
def free_course(db_session):
    c = models.Course(title="ปฐมนิเทศ", description="x", price=0.0,
                      category="General", subject="math", is_active=True)
    db_session.add(c); db_session.commit(); db_session.refresh(c)
    ch = models.Chapter(course_id=c.id, title="บทนำ", order=1)
    db_session.add(ch); db_session.commit(); db_session.refresh(ch)
    db_session.add(models.Lesson(chapter_id=ch.id, title="แนะนำตัว",
                                 youtube_id="FREE_VIDEO", duration=5, order=1))
    db_session.commit(); db_session.refresh(c)
    return c


def _mk(client, db_session, email, role="student"):
    u = crud.get_user_by_email(db_session, email)
    if not u:
        u = crud.create_user(db_session, email, get_password_hash("password123"), email)
    if u.role != role:
        u.role = role
        db_session.commit()
    tok = client.post("/auth/login",
                      json={"email": email, "password": "password123"}).json()["access_token"]
    return u, {"Authorization": f"Bearer {tok}"}


def _all_lessons(body):
    return [l for ch in body for l in ch["lessons"]]


# ------------------------------------------------------------------ ยังไม่ซื้อ

def test_anonymous_cannot_get_youtube_id(client, course):
    """หัวใจของไฟล์นี้ — ไม่ล็อกอินเลยต้องไม่ได้ไอดีวิดีโอ"""
    r = client.get(f"/courses/{course.id}/chapters")
    assert r.status_code == 200
    assert SECRET not in r.text, "ไอดีวิดีโอหลุดให้คนที่ไม่ได้ล็อกอิน"
    for l in _all_lessons(r.json()):
        assert "youtube_id" not in l
        assert "doc_url" not in l


def test_logged_in_but_not_enrolled_cannot_get_youtube_id(client, db_session, course):
    _, h = _mk(client, db_session, "notbuyer@example.com")
    r = client.get(f"/courses/{course.id}/chapters", headers=h)
    assert SECRET not in r.text, "ไอดีวิดีโอหลุดให้คนที่ล็อกอินแต่ยังไม่ซื้อ"


def test_titles_still_visible_for_selling(client, course):
    """ต้องยังเห็นสารบัญ ไม่งั้นนักเรียนตัดสินใจซื้อไม่ได้"""
    body = client.get(f"/courses/{course.id}/chapters").json()
    assert body[0]["title"] == "บทที่ 1 ลิมิต"
    l = _all_lessons(body)[0]
    assert l["title"] == "ลิมิตคืออะไร"
    assert l["duration"] == 42
    assert l["locked"] is True


# -------------------------------------------------------------------- ซื้อแล้ว

def test_enrolled_student_gets_youtube_id(client, db_session, course):
    u, h = _mk(client, db_session, "buyer@example.com")
    crud.create_enrollment(db_session, u.id, course.id)

    body = client.get(f"/courses/{course.id}/chapters", headers=h).json()
    l = _all_lessons(body)[0]
    assert l["youtube_id"] == SECRET
    assert l["doc_url"] == "/static/uploads/secret-sheet.pdf"


def test_admin_sees_everything(client, db_session, course):
    _, h = _mk(client, db_session, "adm@example.com", role="admin")
    body = client.get(f"/courses/{course.id}/chapters", headers=h).json()
    assert _all_lessons(body)[0]["youtube_id"] == SECRET


def test_free_course_is_open(client, db_session, free_course):
    """คอร์สฟรีไม่ต้องลงทะเบียนก็ดูได้ ไม่งั้นของแถมจะกลายเป็นของล็อก"""
    _, h = _mk(client, db_session, "free@example.com")
    body = client.get(f"/courses/{free_course.id}/chapters", headers=h).json()
    assert _all_lessons(body)[0]["youtube_id"] == "FREE_VIDEO"


def test_expired_token_falls_back_to_locked(client, course):
    """token พังต้องถือว่ายังไม่ซื้อ ไม่ใช่ 401 ทั้งหน้า

    หน้ารายละเอียดคอร์สเป็นหน้าสาธารณะ ถ้า token เก่าค้างอยู่ในเบราว์เซอร์
    แล้วทำให้หน้าพังทั้งหน้า นักเรียนจะเข้ามาดูคอร์สไม่ได้เลย
    """
    r = client.get(f"/courses/{course.id}/chapters",
                   headers={"Authorization": "Bearer garbage.garbage.garbage"})
    assert r.status_code == 200
    assert SECRET not in r.text


# ------------------------------------------------- บันทึกความคืบหน้าโดยไม่ซื้อ

def test_cannot_record_progress_without_enrollment(client, db_session, course):
    _, h = _mk(client, db_session, "sneaky@example.com")
    lesson_id = course.chapters[0].lessons[0].id

    r = client.post(f"/courses/{course.id}/lessons/{lesson_id}/toggle-progress", headers=h)
    assert r.status_code == 403

    r = client.post(f"/courses/{course.id}/lessons/{lesson_id}/progress",
                    json={"seconds_watched": 100}, headers=h)
    assert r.status_code == 403


def test_enrolled_can_record_progress(client, db_session, course):
    u, h = _mk(client, db_session, "ok@example.com")
    crud.create_enrollment(db_session, u.id, course.id)
    lesson_id = course.chapters[0].lessons[0].id

    assert client.post(f"/courses/{course.id}/lessons/{lesson_id}/toggle-progress",
                       headers=h).status_code == 200
    assert client.post(f"/courses/{course.id}/lessons/{lesson_id}/progress",
                       json={"seconds_watched": 100}, headers=h).status_code == 200


def test_missing_course_returns_404_not_403(client, db_session):
    """คอร์สที่ไม่มีอยู่ต้องบอกว่าไม่มี ไม่ใช่บอกว่าไม่มีสิทธิ์"""
    _, h = _mk(client, db_session, "x404@example.com")
    r = client.post("/courses/999999/lessons/1/toggle-progress", headers=h)
    assert r.status_code == 404
