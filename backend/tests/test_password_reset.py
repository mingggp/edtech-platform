"""ลืมรหัสผ่าน / ตั้งรหัสใหม่

ช่องโหว่ที่ทำให้เขียนไฟล์นี้ (เจอตอนทดสอบกับเซิร์ฟเวอร์จริง):

  token รีเซ็ตรหัสผ่าน "ใช้ซ้ำได้" จนกว่าจะครบ 30 นาที
  ถ้าลิงก์หลุดไป (ส่งต่ออีเมล แชร์จอ ประวัติเบราว์เซอร์ กล่องเมลรั่ว)
  คนที่ได้ลิงก์ไปจะตั้งรหัสใหม่ซ้ำได้เรื่อย ๆ แม้เจ้าของจะตั้งรหัสของตัวเองไปแล้ว
  -> เจ้าของกดตั้งรหัสใหม่ก็ไม่ช่วย เพราะอีกฝ่ายตั้งทับได้อีก = โดนยึดบัญชี

แก้โดยฝัง "ลายนิ้วมือของรหัสผ่านตอนออก token" ไว้ใน token
พอรหัสผ่านเปลี่ยน ลายนิ้วมือเปลี่ยน -> token เดิมตายทันที
"""
import io
import contextlib

import pytest

from app import crud
from app.auth import get_password_hash


EMAIL = "reset@example.com"
OLD = "oldpassword1"
NEW = "brandnewpass2"


@pytest.fixture
def user(db_session):
    u = crud.get_user_by_email(db_session, EMAIL)
    if not u:
        u = crud.create_user(db_session, EMAIL, get_password_hash(OLD), "รีเซ็ต")
    else:
        u.hashed_password = get_password_hash(OLD)
        db_session.commit()
    return u


def _get_token(client) -> str:
    """ดึง token จากบรรทัดที่ backend print ออกมาตอน dev"""
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        r = client.post("/auth/forgot-password", json={"email": EMAIL})
    assert r.status_code == 204
    out = buf.getvalue()
    assert "token=" in out, f"ไม่เจอลิงก์ใน log: {out!r}"
    return out.split("token=")[1].strip()


# --------------------------------------------------------------- ไม่บอกใบ้

def test_same_response_whether_email_exists(client, user):
    """ตอบเหมือนกันทั้งมีและไม่มีอีเมลนั้น

    ถ้าตอบต่างกัน คนร้ายไล่กรอกอีเมลทีละอันเพื่อดูว่าใครเรียนที่นี่บ้างได้
    """
    a = client.post("/auth/forgot-password", json={"email": EMAIL})
    b = client.post("/auth/forgot-password", json={"email": "ไม่มีจริง@example.com"})
    assert a.status_code == b.status_code == 204
    assert a.text == b.text


# ------------------------------------------------------------ ใช้ได้ครั้งเดียว

def test_reset_works_once(client, user, db_session):
    token = _get_token(client)
    r = client.post("/auth/reset-password", json={"token": token, "new_password": NEW})
    assert r.status_code == 204

    assert client.post("/auth/login", json={"email": EMAIL, "password": OLD}).status_code == 401
    assert client.post("/auth/login", json={"email": EMAIL, "password": NEW}).status_code == 200


def test_same_token_cannot_be_reused(client, user):
    """หัวใจของไฟล์นี้ — ลิงก์เดิมต้องใช้ครั้งที่ 2 ไม่ได้"""
    token = _get_token(client)
    assert client.post("/auth/reset-password",
                       json={"token": token, "new_password": NEW}).status_code == 204

    again = client.post("/auth/reset-password",
                        json={"token": token, "new_password": "hijacked12345"})
    assert again.status_code == 400, "token ใช้ซ้ำได้ = ใครได้ลิงก์ไปก็ยึดบัญชีได้"

    # รหัสที่เจ้าของตั้งไว้ต้องยังใช้ได้อยู่
    assert client.post("/auth/login", json={"email": EMAIL, "password": NEW}).status_code == 200
    assert client.post("/auth/login",
                       json={"email": EMAIL, "password": "hijacked12345"}).status_code == 401


def test_old_token_dies_when_password_changed_elsewhere(client, user, db_session):
    """ขอลิงก์ไว้ แล้วไปเปลี่ยนรหัสเองทางอื่น -> ลิงก์เก่าต้องใช้ไม่ได้

    เคสจริง: นักเรียนกดลืมรหัส แล้วนึกรหัสออกเลยเข้าไปเปลี่ยนเองในหน้าตั้งค่า
    ลิงก์ที่ค้างอยู่ในเมลไม่ควรใช้ได้อีก
    """
    token = _get_token(client)
    user.hashed_password = get_password_hash("changedbyowner9")
    db_session.commit()

    r = client.post("/auth/reset-password", json={"token": token, "new_password": NEW})
    assert r.status_code == 400


def test_two_links_only_newest_works(client, user):
    """ขอลิงก์ 2 ครั้ง — ใช้อันใหม่แล้วอันเก่าต้องตาย"""
    first = _get_token(client)
    second = _get_token(client)
    assert client.post("/auth/reset-password",
                       json={"token": second, "new_password": NEW}).status_code == 204
    assert client.post("/auth/reset-password",
                       json={"token": first, "new_password": "somethingelse1"}).status_code == 400


# ------------------------------------------------------------------ token มั่ว

@pytest.mark.parametrize("bad", ["", "abc", "a.b.c", "x" * 200])
def test_garbage_token_rejected(client, bad):
    r = client.post("/auth/reset-password", json={"token": bad, "new_password": NEW})
    assert r.status_code in (400, 422)


def test_access_token_cannot_be_used_as_reset_token(client, user):
    """token ล็อกอินธรรมดาต้องเอามาตั้งรหัสใหม่ไม่ได้

    ไม่งั้นใครยืมเครื่องที่ล็อกอินค้างไว้ก็เปลี่ยนรหัสเจ้าของได้โดยไม่ต้องรู้รหัสเดิม
    """
    access = client.post("/auth/login",
                         json={"email": EMAIL, "password": OLD}).json()["access_token"]
    r = client.post("/auth/reset-password", json={"token": access, "new_password": NEW})
    assert r.status_code == 400


def test_short_password_rejected(client, user):
    token = _get_token(client)
    r = client.post("/auth/reset-password", json={"token": token, "new_password": "sh0rt"})
    assert r.status_code == 422
