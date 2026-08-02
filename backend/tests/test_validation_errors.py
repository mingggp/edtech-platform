"""ข้อมูลที่ส่งมาไม่ถูกต้อง ต้องได้ 422 ไม่ใช่ 500

บั๊กที่ทำให้เขียนไฟล์นี้:

  main.py มี handler ของ RequestValidationError ที่ตอบ exc.errors() ตรง ๆ
  แต่ pydantic v2 แนบ ValueError "ตัวจริง" ไว้ใน error["ctx"]["error"]
  ซึ่ง json แปลงไม่ได้ -> handler พังเอง -> FastAPI ตอบ 500

  ผลคือ validator ทุกตัวที่ raise ValueError (วิชา, ริบบิ้น, ระดับชั้น)
  ทำให้ API ตอบว่า "เซิร์ฟเวอร์พัง" ทั้งที่ความจริงคือ "กรอกข้อมูลไม่ถูก"
  หน้าเว็บแยกไม่ออก เลยแสดงข้อความผิดให้นักเรียน และเราก็จะได้ error log
  ที่ชี้ไปผิดที่ด้วย

เทสต์เดิม 22 เคสของ subject ผ่านหมด เพราะทดสอบที่ schema ตรง ๆ ไม่ได้ยิงผ่าน API
"""


def _bad(client, path, body, token=None):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    return client.post(path, json=body, headers=h)


def test_unknown_grade_returns_422(client):
    r = _bad(client, "/auth/signup", {
        "email": "x@example.com", "password": "secretpassword",
        "full_name": "X", "grade_level": "ป.6",
    })
    assert r.status_code == 422, f"ได้ {r.status_code}: {r.text[:200]}"


def test_error_body_is_readable(client):
    """หน้าเว็บต้องหยิบข้อความไปแสดงได้จริง"""
    r = _bad(client, "/auth/signup", {
        "email": "x@example.com", "password": "secretpassword",
        "full_name": "X", "grade_level": "ป.6",
    })
    body = r.json()
    assert body["success"] is False
    msgs = [d.get("msg", "") for d in body["details"]]
    assert any("grade_level" in m for m in msgs), body


def test_password_not_echoed_back(client):
    """ข้อความ error ต้องไม่ส่งรหัสผ่านที่ผู้ใช้กรอกกลับไป

    pydantic ใส่ค่าที่ผู้ใช้ส่งมาไว้ใน error["input"] ให้โดยปริยาย
    ถ้าปล่อยผ่าน รหัสผ่านจะไปโผล่ใน response แล้วอาจถูกเก็บลง log ของเบราว์เซอร์
    """
    r = _bad(client, "/auth/signup", {
        "email": "x@example.com", "password": "SuperSecret123!",
        "full_name": "X", "grade_level": "ป.6",
    })
    assert "SuperSecret123!" not in r.text


def test_bad_email_returns_422(client):
    r = _bad(client, "/auth/signup", {
        "email": "ไม่ใช่อีเมล", "password": "secretpassword", "full_name": "X",
    })
    assert r.status_code == 422


def test_bad_subject_returns_422(client, db_session):
    """วิชาที่ไม่มีอยู่จริง — เคสเดียวกัน คนละ validator"""
    from app import crud
    from app.auth import get_password_hash

    admin = crud.get_user_by_email(db_session, "admin_val@example.com")
    if not admin:
        admin = crud.create_user(db_session, "admin_val@example.com",
                                 get_password_hash("password"), "Admin")
        admin.role = "admin"
        db_session.commit()
    tok = client.post("/auth/login", json={
        "email": "admin_val@example.com", "password": "password",
    }).json()["access_token"]

    r = _bad(client, "/admin/courses", {
        "title": "x", "description": "y", "price": 1,
        "category": "General", "subject": "ชีวะ",
    }, tok)
    assert r.status_code == 422, f"ได้ {r.status_code}: {r.text[:200]}"
