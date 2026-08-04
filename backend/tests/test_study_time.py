"""บันทึกเวลาเรียน — จุดเดียวที่ขยับสตรีค / เป้าหมาย / XP / เหรียญ

บั๊ก 2 ตัวที่ทำให้เขียนไฟล์นี้ (เจอตอนทดสอบหน้าห้องเรียนกับเซิร์ฟเวอร์จริง):

  1. crud.record_study_time ใช้ StudyLog.date ซึ่งไม่มีอยู่จริง
     (คอลัมน์จริงชื่อ created_at)
     -> POST /users/me/study-time ตอบ 500 ทุกครั้ง
     -> สตรีค เป้าหมายรายวัน XP เหรียญ ไม่เคยขยับเลยสักครั้ง
     ทั้งที่เป็นหัวใจของเว็บ และเทสต์กีม 31 เคสก็ผ่านหมด
     เพราะทดสอบที่ชั้น gamification ตรง ๆ ไม่ได้ยิงผ่าน endpoint

  2. total_minutes ถูกบวก 2 รอบ — ทั้งใน crud.record_study_time และ
     gamification.record_study ซึ่ง endpoint เรียกต่อกันทั้งคู่
     ส่ง 30 นาที กลายเป็น 60 ยอดนี้ไปโผล่ในโปรไฟล์ ตารางอันดับ
     และเงื่อนไขปลดเหรียญ = ผิดหมดทั้งสาย
"""
import pytest

from app import crud
from app.auth import get_password_hash


@pytest.fixture
def token(client, db_session):
    email = "study@example.com"
    if not crud.get_user_by_email(db_session, email):
        crud.create_user(db_session, email, get_password_hash("password123"), "ผู้เรียน")
    return client.post("/auth/login",
                       json={"email": email, "password": "password123"}).json()["access_token"]


def _h(t):
    return {"Authorization": f"Bearer {t}"}


def test_endpoint_does_not_crash(client, token):
    """เคสที่จับบั๊กตัวแรกได้ — ต้องยิงผ่าน endpoint จริงเท่านั้นถึงเจอ"""
    r = client.post("/users/me/study-time", json={"minutes": 10}, headers=_h(token))
    assert r.status_code == 200, r.text


def test_minutes_counted_once(client, token):
    """เคสที่จับบั๊กตัวที่สอง — ส่ง 30 ต้องได้ 30 ไม่ใช่ 60"""
    before = client.get("/users/me", headers=_h(token)).json()["total_minutes"]
    client.post("/users/me/study-time", json={"minutes": 30}, headers=_h(token))
    after = client.get("/users/me", headers=_h(token)).json()["total_minutes"]
    assert after - before == 30, f"นับได้ {after - before} นาที ทั้งที่ส่งไป 30"


def test_accumulates_across_calls(client, token):
    for _ in range(3):
        client.post("/users/me/study-time", json={"minutes": 5}, headers=_h(token))
    assert client.get("/users/me", headers=_h(token)).json()["total_minutes"] == 15


def test_streak_starts_at_one(client, token):
    client.post("/users/me/study-time", json={"minutes": 5}, headers=_h(token))
    g = client.get("/users/me/gamification", headers=_h(token)).json()
    assert g["streak"]["current"] >= 1


def test_streak_does_not_double_count_same_day(client, token):
    for _ in range(4):
        client.post("/users/me/study-time", json={"minutes": 5}, headers=_h(token))
    g = client.get("/users/me/gamification", headers=_h(token)).json()
    assert g["streak"]["current"] == 1, "เรียนหลายรอบในวันเดียวต้องนับเป็น 1 วัน"


def test_xp_awarded_when_daily_goal_met(client, token):
    """XP มาตอนทำครบเป้าหมายรายวัน (ค่าเริ่มต้น 30 นาที) ไม่ใช่ทุกครั้งที่เรียน"""
    before = client.get("/users/me/gamification", headers=_h(token)).json()["xp_total"]

    client.post("/users/me/study-time", json={"minutes": 20}, headers=_h(token))
    mid = client.get("/users/me/gamification", headers=_h(token)).json()["xp_total"]
    assert mid == before, "ยังไม่ครบเป้าหมาย ไม่ควรได้ XP"

    client.post("/users/me/study-time", json={"minutes": 15}, headers=_h(token))
    after = client.get("/users/me/gamification", headers=_h(token)).json()["xp_total"]
    assert after > before, "ครบเป้าหมายแล้วต้องได้ XP"


def test_goal_xp_given_once_per_day(client, token):
    """ทำครบเป้าหมายแล้วเรียนต่อ ต้องไม่ได้ XP ก้อนเดิมซ้ำ"""
    client.post("/users/me/study-time", json={"minutes": 40}, headers=_h(token))
    a = client.get("/users/me/gamification", headers=_h(token)).json()["xp_total"]
    client.post("/users/me/study-time", json={"minutes": 40}, headers=_h(token))
    b = client.get("/users/me/gamification", headers=_h(token)).json()["xp_total"]
    assert a == b, "ได้ XP เป้าหมายรายวันซ้ำในวันเดียวกัน"


def test_zero_minutes_is_harmless(client, token):
    before = client.get("/users/me", headers=_h(token)).json()["total_minutes"]
    r = client.post("/users/me/study-time", json={"minutes": 0}, headers=_h(token))
    assert r.status_code == 200
    assert client.get("/users/me", headers=_h(token)).json()["total_minutes"] == before


def test_requires_login(client):
    assert client.post("/users/me/study-time", json={"minutes": 5}).status_code in (401, 403)
