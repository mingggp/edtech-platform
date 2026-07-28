"""เทสต์ระบบชำระเงินแบบยืนยันอัตโนมัติ

กติกาจาก CLAUDE.md ที่ต้องคุ้มไว้:
  - ไม่มีการอัปโหลดสลิป
  - ไม่มีสถานะ "รอแอดมินอนุมัติ" และแอดมินกดอนุมัติเองไม่ได้
  - สถานะที่นักเรียน/แอดมินเห็นมีแค่ สำเร็จ (paid) กับ หมดอายุ (expired)
"""
import os
from datetime import datetime, timedelta

import pytest

from app import crud, models
from app.auth import get_password_hash

WEBHOOK_SECRET = "test-secret"


@pytest.fixture(autouse=True)
def _webhook_secret(monkeypatch):
    monkeypatch.setattr("app.routers.payments.PAYMENT_WEBHOOK_SECRET", WEBHOOK_SECRET)


@pytest.fixture
def course(db_session):
    c = models.Course(title="A-Level คณิต 1", description="ทดสอบ", price=1990.0,
                      subject="math", level="alevel", category="General", is_active=True)
    db_session.add(c); db_session.commit(); db_session.refresh(c)
    return c


def _login(client):
    r = client.post("/auth/login", json={"email": "test@example.com", "password": "testpassword"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


# --------------------------------------------------------------------------
# ต้องไม่มีทางส่งสลิปได้อีก
# --------------------------------------------------------------------------

def test_slip_upload_endpoint_is_gone(client):
    r = client.post("/payments/upload", files={"file": ("s.png", b"x", "image/png")}, data={"course_id": 1})
    assert r.status_code in (404, 405), "endpoint อัปโหลดสลิปต้องไม่มีแล้ว"


def test_payment_model_has_no_slip_column():
    assert not hasattr(models.Payment, "slip_url"), "Payment ต้องไม่มีคอลัมน์ slip_url"


def test_admin_cannot_approve_payments(client):
    r = client.post("/admin/payments/1/approve")
    assert r.status_code in (404, 405), "แอดมินต้องกดอนุมัติการชำระเงินเองไม่ได้"


# --------------------------------------------------------------------------
# flow ปกติ: สร้าง QR -> เกตเวย์ยืนยัน -> เปิดคอร์สอัตโนมัติ
# --------------------------------------------------------------------------

def test_checkout_creates_awaiting_payment(client, course):
    h = _login(client)
    r = client.post("/payments/checkout", json={"course_id": course.id}, headers=h)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["status"] == "awaiting"
    assert d["amount"] == 1990.0
    assert d["ref"].startswith("MSF-")
    assert datetime.fromisoformat(d["expires_at"]) > datetime.utcnow()


def test_webhook_marks_paid_and_enrolls(client, db_session, course):
    h = _login(client)
    ref = client.post("/payments/checkout", json={"course_id": course.id}, headers=h).json()["ref"]

    r = client.post("/payments/webhook",
                    json={"ref": ref, "status": "paid", "charge_id": "chrg_1", "amount": 1990.0},
                    headers={"X-Signature": WEBHOOK_SECRET})
    assert r.status_code == 200, r.text
    assert r.json()["payment_status"] == "paid"

    p = crud.get_payment_by_ref(db_session, ref)
    assert p.status == "paid" and p.paid_at is not None
    user = crud.get_user_by_email(db_session, "test@example.com")
    assert crud.get_enrollment(db_session, user.id, course.id) is not None, "ต้องเปิดคอร์สให้อัตโนมัติ"


def test_webhook_is_idempotent(client, db_session, course):
    """เกตเวย์อาจยิง webhook ซ้ำ — ต้องไม่พังและไม่ลงทะเบียนซ้ำ"""
    h = _login(client)
    ref = client.post("/payments/checkout", json={"course_id": course.id}, headers=h).json()["ref"]
    body = {"ref": ref, "status": "paid", "amount": 1990.0}
    sig = {"X-Signature": WEBHOOK_SECRET}
    assert client.post("/payments/webhook", json=body, headers=sig).status_code == 200
    assert client.post("/payments/webhook", json=body, headers=sig).status_code == 200
    user = crud.get_user_by_email(db_session, "test@example.com")
    n = db_session.query(models.Enrollment).filter_by(user_id=user.id, course_id=course.id).count()
    assert n == 1


# --------------------------------------------------------------------------
# ความปลอดภัยของ webhook
# --------------------------------------------------------------------------

def test_webhook_rejects_bad_signature(client, course):
    h = _login(client)
    ref = client.post("/payments/checkout", json={"course_id": course.id}, headers=h).json()["ref"]
    r = client.post("/payments/webhook", json={"ref": ref, "status": "paid"},
                    headers={"X-Signature": "wrong-secret"})
    assert r.status_code == 401


def test_webhook_rejects_missing_signature(client, course):
    h = _login(client)
    ref = client.post("/payments/checkout", json={"course_id": course.id}, headers=h).json()["ref"]
    assert client.post("/payments/webhook", json={"ref": ref, "status": "paid"}).status_code == 401


def test_webhook_rejects_wrong_amount(client, course):
    """กันคนยิง webhook ปลอมด้วยยอดต่ำๆ เพื่อปลดล็อกคอร์สแพง"""
    h = _login(client)
    ref = client.post("/payments/checkout", json={"course_id": course.id}, headers=h).json()["ref"]
    r = client.post("/payments/webhook", json={"ref": ref, "status": "paid", "amount": 1.0},
                    headers={"X-Signature": WEBHOOK_SECRET})
    assert r.status_code == 400


def test_webhook_disabled_when_secret_not_set(client, course, monkeypatch):
    monkeypatch.setattr("app.routers.payments.PAYMENT_WEBHOOK_SECRET", "")
    h = _login(client)
    ref = client.post("/payments/checkout", json={"course_id": course.id}, headers=h).json()["ref"]
    r = client.post("/payments/webhook", json={"ref": ref, "status": "paid"},
                    headers={"X-Signature": "anything"})
    assert r.status_code == 503, "ถ้ายังไม่ตั้ง secret ต้องปิดไว้ ไม่ใช่ปล่อยผ่าน"


# --------------------------------------------------------------------------
# QR หมดอายุ
# --------------------------------------------------------------------------

def test_expired_qr_becomes_expired(client, db_session, course):
    h = _login(client)
    ref = client.post("/payments/checkout", json={"course_id": course.id}, headers=h).json()["ref"]
    p = crud.get_payment_by_ref(db_session, ref)
    p.expires_at = datetime.utcnow() - timedelta(minutes=1)
    db_session.commit()

    r = client.get(f"/payments/{ref}", headers=h)
    assert r.status_code == 200
    assert r.json()["status"] == "expired"


def test_cannot_see_someone_elses_payment(client, db_session, course):
    other = crud.create_user(db=db_session, email="other@example.com",
                             hashed_password=get_password_hash("testpassword"),
                             full_name="Other", nickname="O", grade_level="M5")
    p = crud.create_payment_intent(db_session, other.id, course.id, 1990.0)
    h = _login(client)
    assert client.get(f"/payments/{p.provider_ref}", headers=h).status_code == 404


# --------------------------------------------------------------------------
# สถานะที่แอดมินเห็น
# --------------------------------------------------------------------------

def test_admin_list_hides_awaiting(db_session, course):
    """awaiting เป็นสถานะชั่วคราวระหว่างรอผู้ใช้สแกน ไม่ใช่คิวให้ตรวจ"""
    user = crud.get_user_by_email(db_session, "test@example.com")
    crud.create_payment_intent(db_session, user.id, course.id, 1990.0)
    rows = crud.get_payments(db_session)
    assert all(p.status != "awaiting" for p in rows)


def test_stats_count_only_paid(db_session, course):
    user = crud.get_user_by_email(db_session, "test@example.com")
    paid = crud.create_payment_intent(db_session, user.id, course.id, 1990.0)
    crud.mark_payment_paid(db_session, paid.provider_ref)
    stats = crud.get_payment_stats(db_session)
    assert stats["total_revenue"] == 1990.0
    assert "expired_count" in stats and "pending_count" not in stats
