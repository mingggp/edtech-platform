"""คอร์สของฉัน + ความคืบหน้า — ข้อมูลหลักของหน้าหลัก

บั๊กที่เจอตอนจะทำหน้าหลัก:

  /users/me/courses ไม่ได้ประกาศ response_model แต่ประกอบ dict ด้วยมือ
  จึงหลุดจากกลไก UtcDatetime ที่บังคับให้เวลาทุกฟิลด์ติด timezone
  -> ส่ง enrolled_at ออกไปเป็น "2026-08-04T17:02:48" ไม่มี Z
  -> เบราว์เซอร์อ่านเป็นเวลาท้องถิ่น เพี้ยนไป 7 ชั่วโมง
  พันธุ์เดียวกับบั๊กที่ทำให้ QR พร้อมเพย์หมดอายุทันทีที่เปิดหน้า

  บทเรียน: การประกอบ dict ด้วยมือแทน schema ทำให้หลุดกฎที่วางไว้ทั้งหมด
  เทสต์นี้จึงคุมทั้ง endpoint ไม่ใช่แค่ฟิลด์เดียว
"""
import re

import pytest

from app import crud, models
from app.auth import get_password_hash

_HAS_TZ = re.compile(r"(Z|[+-]\d{2}:\d{2})$")


@pytest.fixture
def course_with_lessons(db_session):
    c = models.Course(title="A-Level คณิต", description="x", price=1990.0,
                      category="General", subject="math", level="alevel", is_active=True)
    db_session.add(c); db_session.commit(); db_session.refresh(c)
    ch = models.Chapter(course_id=c.id, title="บท 1", order=1)
    db_session.add(ch); db_session.commit(); db_session.refresh(ch)
    for i in (1, 2, 3, 4):
        db_session.add(models.Lesson(chapter_id=ch.id, title=f"EP.{i}",
                                     youtube_id=f"v{i}", duration=20, order=i))
    db_session.commit(); db_session.refresh(c)
    return c


@pytest.fixture
def student(client, db_session, course_with_lessons):
    email = "mine@example.com"
    u = crud.get_user_by_email(db_session, email)
    if not u:
        u = crud.create_user(db_session, email, get_password_hash("password123"), "ผู้เรียน")
    crud.create_enrollment(db_session, u.id, course_with_lessons.id)
    tok = client.post("/auth/login",
                      json={"email": email, "password": "password123"}).json()["access_token"]
    return u, {"Authorization": f"Bearer {tok}"}


def test_enrolled_at_has_timezone(client, student):
    """เคสที่จับบั๊กได้ — ทุกเวลาที่ส่งออกต้องติด timezone"""
    _, h = student
    row = client.get("/users/me/courses", headers=h).json()[0]
    assert _HAS_TZ.search(row["enrolled_at"]), row["enrolled_at"]


def test_no_leftover_tailwind_color_field(client, student):
    """ฟิลด์ color เป็นชื่อคลาส Tailwind จากเว็บเวอร์ชันเก่า ไม่มีใครใช้แล้ว"""
    _, h = student
    assert "color" not in client.get("/users/me/courses", headers=h).json()[0]


def test_returns_subject_and_level(client, student):
    """หน้าหลักต้องใช้สี/ป้ายประจำวิชา ถ้าไม่ส่งมาก็ต้องยิงถามทีละคอร์ส"""
    _, h = student
    row = client.get("/users/me/courses", headers=h).json()[0]
    assert row["subject"] == "math"
    assert row["level"] == "alevel"


def test_progress_starts_at_zero(client, student):
    _, h = student
    row = client.get("/users/me/courses", headers=h).json()[0]
    assert row["total_lessons"] == 4
    assert row["completed_lessons"] == 0
    assert row["progress"] == 0


def test_progress_follows_completed_lessons(client, db_session, student, course_with_lessons):
    u, h = student
    lessons = course_with_lessons.chapters[0].lessons
    cid = course_with_lessons.id
    client.post(f"/courses/{cid}/lessons/{lessons[0].id}/toggle-progress", headers=h)

    row = client.get("/users/me/courses", headers=h).json()[0]
    assert row["completed_lessons"] == 1
    assert row["progress"] == 25, "1 จาก 4 บท ต้องเป็น 25%"

    client.post(f"/courses/{cid}/lessons/{lessons[1].id}/toggle-progress", headers=h)
    assert client.get("/users/me/courses", headers=h).json()[0]["progress"] == 50


def test_progress_never_exceeds_100(client, db_session, student, course_with_lessons):
    u, h = student
    cid = course_with_lessons.id
    for l in course_with_lessons.chapters[0].lessons:
        client.post(f"/courses/{cid}/lessons/{l.id}/toggle-progress", headers=h)
    row = client.get("/users/me/courses", headers=h).json()[0]
    assert row["progress"] == 100


def test_course_without_lessons_does_not_crash(client, db_session):
    """คอร์สที่ยังไม่มีบทเรียน ต้องไม่หารด้วยศูนย์"""
    c = models.Course(title="ยังไม่มีบทเรียน", description="x", price=100.0,
                      category="General", subject="phys", is_active=True)
    db_session.add(c); db_session.commit(); db_session.refresh(c)
    email = "empty@example.com"
    u = crud.get_user_by_email(db_session, email) or crud.create_user(
        db_session, email, get_password_hash("password123"), "ว่าง")
    crud.create_enrollment(db_session, u.id, c.id)
    tok = client.post("/auth/login",
                      json={"email": email, "password": "password123"}).json()["access_token"]

    r = client.get("/users/me/courses", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 200
    assert r.json()[0]["progress"] == 0


def test_only_my_courses(client, db_session, student, course_with_lessons):
    """ต้องไม่เห็นคอร์สของคนอื่น"""
    other = models.Course(title="ของคนอื่น", description="x", price=500.0,
                          category="General", subject="tpat3", is_active=True)
    db_session.add(other); db_session.commit(); db_session.refresh(other)
    u2 = crud.create_user(db_session, "other2@example.com",
                          get_password_hash("password123"), "อีกคน")
    crud.create_enrollment(db_session, u2.id, other.id)

    _, h = student
    titles = [c["title"] for c in client.get("/users/me/courses", headers=h).json()]
    assert titles == ["A-Level คณิต"]


def test_requires_login(client):
    assert client.get("/users/me/courses").status_code in (401, 403)
