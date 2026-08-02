"""Tests for password change/forgot/reset endpoints (เพิ่มในรอบ rebuild)."""
from app.auth import get_password_hash, verify_password, _encode_token
from app import crud
from datetime import timedelta


def _login_token(client) -> str:
    res = client.post("/auth/login", json={"email": "test@example.com", "password": "testpassword"})
    assert res.status_code == 200
    return res.json()["access_token"]


# ---------- change-password ---------- #

def test_change_password_requires_auth(client):
    res = client.post("/auth/change-password", json={
        "current_password": "x", "new_password": "newpassword123"
    })
    assert res.status_code == 401


def test_change_password_wrong_current(client):
    token = _login_token(client)
    res = client.post(
        "/auth/change-password",
        json={"current_password": "WRONG", "new_password": "newpassword123"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 400


def test_change_password_too_short(client):
    token = _login_token(client)
    res = client.post(
        "/auth/change-password",
        json={"current_password": "testpassword", "new_password": "short"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 422  # Pydantic min_length validation


def test_change_password_success(client, db_session):
    token = _login_token(client)
    res = client.post(
        "/auth/change-password",
        json={"current_password": "testpassword", "new_password": "newpassword123"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 204
    # ล็อกอินด้วยรหัสเก่าต้องไม่ผ่านแล้ว
    old = client.post("/auth/login", json={"email": "test@example.com", "password": "testpassword"})
    assert old.status_code == 401
    # รหัสใหม่ต้องเข้าได้
    new = client.post("/auth/login", json={"email": "test@example.com", "password": "newpassword123"})
    assert new.status_code == 200


# ---------- forgot-password ---------- #

def test_forgot_password_always_204(client):
    """ไม่ว่า email มีหรือไม่มีในระบบ — ต้องคืน 204 เพื่อกัน user enumeration."""
    res1 = client.post("/auth/forgot-password", json={"email": "test@example.com"})
    res2 = client.post("/auth/forgot-password", json={"email": "nobody@example.com"})
    assert res1.status_code == 204
    assert res2.status_code == 204


# ---------- reset-password ---------- #

def test_reset_password_invalid_token(client):
    res = client.post("/auth/reset-password", json={
        "token": "garbage.invalid.jwt", "new_password": "newpassword123"
    })
    assert res.status_code == 400


def test_reset_password_wrong_type(client):
    """access token ต้องใช้ reset-password ไม่ได้."""
    token = _login_token(client)  # type: access
    res = client.post("/auth/reset-password", json={
        "token": token, "new_password": "newpassword123"
    })
    assert res.status_code == 400


def test_reset_password_success(client):
    """token ที่ถูกต้องต้องเปลี่ยนรหัสได้

    ต้องขอ token ผ่าน /auth/forgot-password จริง ๆ — ปั้น token เองไม่ได้แล้ว
    เพราะตอนนี้ token ต้องมี 'ลายนิ้วมือรหัสผ่านปัจจุบัน' ติดมาด้วย
    (กลไกที่ทำให้ลิงก์ใช้ได้ครั้งเดียว ดู tests/test_password_reset.py)
    """
    import contextlib, io
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        client.post("/auth/forgot-password", json={"email": "test@example.com"})
    reset_token = buf.getvalue().split("token=")[1].strip()

    res = client.post("/auth/reset-password", json={
        "token": reset_token, "new_password": "freshpassword123"
    })
    assert res.status_code == 204
    # login ด้วยรหัสใหม่ได้
    login = client.post("/auth/login", json={"email": "test@example.com", "password": "freshpassword123"})
    assert login.status_code == 200


# ---------- require_admin ---------- #

def test_admin_endpoint_blocks_student(client):
    """student ต้องโดน 403 จาก /admin/metrics."""
    token = _login_token(client)
    res = client.get("/admin/metrics", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403


def test_admin_endpoint_allows_admin(client, db_session):
    """promote test user เป็น admin แล้วเรียก /admin/metrics ต้องผ่าน."""
    user = crud.get_user_by_email(db_session, "test@example.com")
    user.role = "admin"
    db_session.commit()

    token = _login_token(client)
    res = client.get("/admin/metrics", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    body = res.json()
    assert "total_users" in body


def test_refresh_token_cannot_be_used_as_access(client):
    """access token endpoint ต้องไม่รับ refresh token (เคย bug ก่อน rebuild)."""
    res = client.post("/auth/login", json={"email": "test@example.com", "password": "testpassword"})
    refresh = res.json()["refresh_token"]
    me = client.get("/users/me", headers={"Authorization": f"Bearer {refresh}"})
    assert me.status_code == 401
