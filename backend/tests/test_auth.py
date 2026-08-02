def test_signup(client):
    response = client.post("/auth/signup", json={
        "email": "newuser@example.com",
        "password": "secretpassword",
        "full_name": "New User"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["email"] == "newuser@example.com"
    assert "id" in data["user"]


def test_signup_logs_you_in(client):
    """สมัครเสร็จต้องได้ token เลย ไม่ต้องล็อกอินซ้ำ

    เดิม /auth/signup คืนแค่ข้อมูลผู้ใช้ หน้าเว็บเลยต้องยิง /auth/login ตามอีกรอบ
    ซึ่งไปชน rate limit 5 ครั้ง/นาที ได้ถ้าผู้ใช้ลองสมัครหลายที
    """
    r = client.post("/auth/signup", json={
        "email": "tokenuser@example.com",
        "password": "secretpassword",
        "full_name": "Token User",
    })
    d = r.json()
    assert d["token_type"] == "bearer"
    assert d["access_token"] and d["refresh_token"]
    # เอา token ไปใช้ได้จริงทันที
    me = client.get("/users/me", headers={"Authorization": f"Bearer {d['access_token']}"})
    assert me.status_code == 200
    assert me.json()["email"] == "tokenuser@example.com"


def test_signup_normalizes_grade_and_computes_dek(client):
    """ระดับชั้นเก็บเป็น key มาตรฐาน และรุ่น DEK คำนวณให้เอง"""
    from datetime import date
    from app import grades

    r = client.post("/auth/signup", json={
        "email": "m6@example.com",
        "password": "secretpassword",
        "full_name": "เด็ก ม.6",
        "grade_level": "M6",          # ส่งมาแบบเก่า ต้องแปลงให้
    })
    u = r.json()["user"]
    assert u["grade_level"] == "m6"
    assert u["dek_code"] == grades.dek_code("m6")


def test_signup_rejects_unknown_grade(client):
    r = client.post("/auth/signup", json={
        "email": "bad@example.com", "password": "secretpassword",
        "full_name": "X", "grade_level": "ป.6",
    })
    assert r.status_code == 422

def test_signup_duplicate_email(client):
    response = client.post("/auth/signup", json={
        "email": "test@example.com",
        "password": "secretpassword",
        "full_name": "Test User"
    })
    assert response.status_code == 400

def test_login_success(client):
    response = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "testpassword"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

def test_login_failure(client):
    response = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_refresh_token(client):
    # First login to get a refresh token
    login_response = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "testpassword"
    })
    refresh_token = login_response.json()["refresh_token"]

    # Use it to get a new token pair
    response = client.post("/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
