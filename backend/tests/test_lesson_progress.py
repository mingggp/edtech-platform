"""ความคืบหน้าของบทเรียน — ปุ่มเรียนจบ + จำตำแหน่งวิดีโอ

ทั้งหมดนี้เคยพัง 500 ทุกครั้งที่เรียก (ดู tests/test_models_exist.py)
หน้าห้องเรียนพึ่งพา 3 อย่างนี้ทั้งหมด จึงต้องมีเทสต์คุมไว้ก่อนสร้างหน้า
"""
import pytest

from app import crud, models
from app.auth import get_password_hash


@pytest.fixture
def setup(client, db_session):
    c = models.Course(title="คอร์สเรียน", description="x", price=1990.0,
                      category="General", subject="math", is_active=True)
    db_session.add(c); db_session.commit(); db_session.refresh(c)
    ch = models.Chapter(course_id=c.id, title="บท 1", order=1)
    db_session.add(ch); db_session.commit(); db_session.refresh(ch)
    lessons = []
    for i in range(1, 4):
        l = models.Lesson(chapter_id=ch.id, title=f"EP.{i}", youtube_id=f"v{i}",
                          duration=20, order=i)
        db_session.add(l); lessons.append(l)
    db_session.commit()
    for l in lessons:
        db_session.refresh(l)

    u = crud.get_user_by_email(db_session, "learner@example.com")
    if not u:
        u = crud.create_user(db_session, "learner@example.com",
                             get_password_hash("password123"), "ผู้เรียน")
    crud.create_enrollment(db_session, u.id, c.id)
    tok = client.post("/auth/login", json={"email": "learner@example.com",
                                           "password": "password123"}).json()["access_token"]
    return c, lessons, {"Authorization": f"Bearer {tok}"}


# ------------------------------------------------------------ ปุ่มเรียนจบ

def test_toggle_marks_complete_then_incomplete(client, setup):
    c, lessons, h = setup
    url = f"/courses/{c.id}/lessons/{lessons[0].id}/toggle-progress"

    r1 = client.post(url, headers=h)
    assert r1.status_code == 200, r1.text
    assert r1.json()["completed"] is True

    r2 = client.post(url, headers=h)
    assert r2.json()["completed"] is False, "กดซ้ำต้องยกเลิก ไม่ใช่ค้างเป็น True"


def test_completed_list_reflects_toggles(client, setup):
    c, lessons, h = setup
    client.post(f"/courses/{c.id}/lessons/{lessons[0].id}/toggle-progress", headers=h)
    client.post(f"/courses/{c.id}/lessons/{lessons[2].id}/toggle-progress", headers=h)

    done = client.get(f"/courses/{c.id}/my-progress", headers=h).json()["completed_ids"]
    assert sorted(done) == sorted([lessons[0].id, lessons[2].id])

    client.post(f"/courses/{c.id}/lessons/{lessons[0].id}/toggle-progress", headers=h)
    done = client.get(f"/courses/{c.id}/my-progress", headers=h).json()["completed_ids"]
    assert done == [lessons[2].id]


# ------------------------------------------------------ จำตำแหน่งวิดีโอ

def test_remembers_watch_position(client, setup):
    c, lessons, h = setup
    lid = lessons[0].id
    assert client.get(f"/courses/{c.id}/lessons/{lid}/progress",
                      headers=h).json()["seconds"] == 0

    client.post(f"/courses/{c.id}/lessons/{lid}/progress",
                json={"seconds_watched": 315}, headers=h)
    assert client.get(f"/courses/{c.id}/lessons/{lid}/progress",
                      headers=h).json()["seconds"] == 315


def test_position_never_goes_backwards(client, setup):
    """เลื่อนกลับไปดูซ้ำ ต้องไม่ทำให้ตำแหน่งที่บันทึกไว้ถอยหลัง

    ไม่งั้นนักเรียนดูจบแล้วเผลอลากกลับไปต้นคลิป พอปิดแล้วเปิดใหม่
    จะเริ่มจากต้นคลิปทั้งที่ดูไปเกือบหมดแล้ว
    """
    c, lessons, h = setup
    lid = lessons[0].id
    client.post(f"/courses/{c.id}/lessons/{lid}/progress",
                json={"seconds_watched": 600}, headers=h)
    client.post(f"/courses/{c.id}/lessons/{lid}/progress",
                json={"seconds_watched": 12}, headers=h)
    assert client.get(f"/courses/{c.id}/lessons/{lid}/progress",
                      headers=h).json()["seconds"] == 600


def test_negative_seconds_ignored(client, setup):
    c, lessons, h = setup
    lid = lessons[0].id
    client.post(f"/courses/{c.id}/lessons/{lid}/progress",
                json={"seconds_watched": -50}, headers=h)
    assert client.get(f"/courses/{c.id}/lessons/{lid}/progress",
                      headers=h).json()["seconds"] == 0


def test_progress_is_per_user(client, db_session, setup):
    """ความคืบหน้าของแต่ละคนต้องไม่ปนกัน"""
    c, lessons, h = setup
    client.post(f"/courses/{c.id}/lessons/{lessons[0].id}/toggle-progress", headers=h)

    other = crud.create_user(db_session, "other@example.com",
                             get_password_hash("password123"), "อีกคน")
    crud.create_enrollment(db_session, other.id, c.id)
    tok = client.post("/auth/login", json={"email": "other@example.com",
                                           "password": "password123"}).json()["access_token"]
    h2 = {"Authorization": f"Bearer {tok}"}

    assert client.get(f"/courses/{c.id}/my-progress", headers=h2).json()["completed_ids"] == []
