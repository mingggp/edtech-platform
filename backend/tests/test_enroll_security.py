"""เทสต์ช่องโหว่การลงทะเบียนเรียน

ช่องโหว่ที่เจอ: POST /users/me/courses?course_id=X เดิมเรียก create_enrollment
ทันทีโดยไม่เช็คราคาเลย ใครล็อกอินแล้วยิง endpoint นี้ก็ได้คอร์สราคา 2,490
ไปฟรี ๆ ไม่ต้องจ่ายสักบาท

เทสต์ชุดนี้มีไว้กันไม่ให้ช่องโหว่นี้กลับมาอีก
"""
import pytest

from app import crud, models, schemas
from app.auth import get_password_hash

WEBHOOK_SECRET = "test-secret"


@pytest.fixture(autouse=True)
def _webhook_secret(monkeypatch):
    monkeypatch.setattr("app.routers.payments.PAYMENT_WEBHOOK_SECRET", WEBHOOK_SECRET)


def _course(db, price, **kw):
    c = models.Course(title="คอร์ส", description="x", price=price,
                      category="General", subject="math", is_active=True, **kw)
    db.add(c); db.commit(); db.refresh(c)
    return c


def _login(client):
    r = client.post("/auth/login", json={"email": "test@example.com", "password": "testpassword"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


# ---------------------------------------------------------------------------
# คอร์สเสียเงิน — ห้ามลงทะเบียนเองเด็ดขาด
# ---------------------------------------------------------------------------

def test_cannot_self_enroll_paid_course(client, db_session):
    c = _course(db_session, price=2490)
    h = _login(client)
    r = client.post(f"/users/me/courses?course_id={c.id}", headers=h)
    assert r.status_code == 402, "คอร์สเสียเงินต้องลงทะเบียนเองไม่ได้"

    user = crud.get_user_by_email(db_session, "test@example.com")
    assert crud.get_enrollment(db_session, user.id, c.id) is None


def test_paid_course_needs_payment_flow(client, db_session):
    """ทางเดียวที่จะได้คอร์สเสียเงินคือผ่าน checkout -> webhook"""
    c = _course(db_session, price=1990)
    h = _login(client)
    ref = client.post("/payments/checkout", json={"course_id": c.id}, headers=h).json()["ref"]
    user = crud.get_user_by_email(db_session, "test@example.com")
    assert crud.get_enrollment(db_session, user.id, c.id) is None, "แค่สร้าง QR ยังไม่ควรได้เรียน"

    client.post("/payments/webhook", json={"ref": ref, "status": "paid", "amount": 1990.0},
                headers={"X-Signature": WEBHOOK_SECRET})
    assert crud.get_enrollment(db_session, user.id, c.id) is not None


def test_anonymous_cannot_enroll(client, db_session):
    c = _course(db_session, price=0)
    assert client.post(f"/users/me/courses?course_id={c.id}").status_code == 401


# ---------------------------------------------------------------------------
# คอร์สฟรี — ลงทะเบียนเองได้
# ---------------------------------------------------------------------------

def test_free_course_self_enroll_ok(client, db_session):
    c = _course(db_session, price=0)
    h = _login(client)
    assert client.post(f"/users/me/courses?course_id={c.id}", headers=h).status_code == 200
    user = crud.get_user_by_email(db_session, "test@example.com")
    assert crud.get_enrollment(db_session, user.id, c.id) is not None


def test_free_course_enroll_twice_rejected(client, db_session):
    c = _course(db_session, price=0)
    h = _login(client)
    client.post(f"/users/me/courses?course_id={c.id}", headers=h)
    assert client.post(f"/users/me/courses?course_id={c.id}", headers=h).status_code == 400


def test_inactive_course_rejected(client, db_session):
    c = _course(db_session, price=0)
    c.is_active = False
    db_session.commit()
    h = _login(client)
    assert client.post(f"/users/me/courses?course_id={c.id}", headers=h).status_code == 400


def test_missing_course_rejected(client):
    h = _login(client)
    assert client.post("/users/me/courses?course_id=999999", headers=h).status_code == 404


# ---------------------------------------------------------------------------
# ปุ่มจำลองการจ่ายเงิน (สำหรับ dev)
# ---------------------------------------------------------------------------

def test_simulate_paid_works_in_dev(client, db_session):
    c = _course(db_session, price=1490)
    h = _login(client)
    ref = client.post("/payments/checkout", json={"course_id": c.id}, headers=h).json()["ref"]
    r = client.post(f"/payments/{ref}/simulate-paid", headers=h)
    assert r.status_code == 200
    assert r.json()["payment_status"] == "paid"
    user = crud.get_user_by_email(db_session, "test@example.com")
    assert crud.get_enrollment(db_session, user.id, c.id) is not None


def test_simulate_paid_blocked_in_production(client, db_session, monkeypatch):
    """บน production ต้องหายไปเลย ไม่งั้นใครก็กดปลดคอร์สฟรีได้

    settings เป็น frozen dataclass แก้ field ตรง ๆ ไม่ได้
    จึงสลับทั้งอ็อบเจกต์ที่ payments.py อ้างถึงแทน
    """
    c = _course(db_session, price=1490)
    h = _login(client)
    ref = client.post("/payments/checkout", json={"course_id": c.id}, headers=h).json()["ref"]

    class _Prod:
        is_production = True
    monkeypatch.setattr("app.routers.payments.settings", _Prod())
    assert client.post(f"/payments/{ref}/simulate-paid", headers=h).status_code == 404


def test_simulate_paid_only_own_payment(client, db_session):
    """ยิง ref ของคนอื่นไม่ได้"""
    c = _course(db_session, price=990)
    other = crud.create_user(db=db_session, email="x@example.com",
                             hashed_password=get_password_hash("x"),
                             full_name="X", nickname="X", grade_level="M5")
    p = crud.create_payment_intent(db_session, other.id, c.id, 990.0)
    h = _login(client)
    assert client.post(f"/payments/{p.provider_ref}/simulate-paid", headers=h).status_code == 404


def test_simulate_paid_rejects_expired(client, db_session):
    from datetime import datetime, timedelta
    c = _course(db_session, price=990)
    h = _login(client)
    ref = client.post("/payments/checkout", json={"course_id": c.id}, headers=h).json()["ref"]
    p = crud.get_payment_by_ref(db_session, ref)
    p.status = "expired"
    db_session.commit()
    assert client.post(f"/payments/{ref}/simulate-paid", headers=h).status_code == 400
