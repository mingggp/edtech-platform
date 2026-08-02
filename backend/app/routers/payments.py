from typing import List, Optional
import time, io, os, hmac
from fastapi import APIRouter, Depends, HTTPException, Body, Header
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import get_db
from .. import schemas, crud, models, achievements_seed
from .. import gamification as gm
from ..auth import get_current_user, require_admin
from ..promptpay import make_qr_image
from ..config import UPLOAD_DIR, MY_PROMPTPAY_ID, settings

# secret ที่ใช้ตรวจ webhook จากเกตเวย์ — ถ้าไม่ตั้ง endpoint จะปฏิเสธทุก request
# อ่านผ่าน settings ไม่ใช่ os.getenv เอง (กฎใน config.py) แต่ยังคงเป็นตัวแปรระดับ
# โมดูลไว้ เพราะเทสต์ monkeypatch ชื่อนี้อยู่
PAYMENT_WEBHOOK_SECRET = settings.PAYMENT_WEBHOOK_SECRET

router = APIRouter(prefix="", tags=["payments"])

@router.post("/users/me/courses")
def enroll(course_id: int, db: Session = Depends(get_db), u=Depends(get_current_user)):
    """ลงทะเบียนเรียนด้วยตัวเอง — ใช้ได้กับคอร์สฟรีเท่านั้น

    ⚠️ ช่องโหว่ที่เพิ่งอุด: เดิม endpoint นี้เรียก create_enrollment ทันที
    โดยไม่เช็คราคาเลย ใครล็อกอินแล้วยิง POST /users/me/courses?course_id=1
    ก็ได้คอร์สราคา 2,490 ไปฟรี ๆ โดยไม่ต้องจ่ายสักบาท

    คอร์สที่มีราคาต้องผ่าน /payments/checkout -> webhook เท่านั้น
    """
    c = crud.get_course(db, course_id)
    if not c:
        raise HTTPException(404, "ไม่พบคอร์สนี้")
    if not c.is_active:
        raise HTTPException(400, "คอร์สนี้ยังไม่เปิดให้ลงทะเบียน")
    if (c.price or 0) > 0:
        raise HTTPException(402, "คอร์สนี้ต้องชำระเงินก่อน")
    if crud.get_enrollment(db, u.id, course_id):
        raise HTTPException(400, "คุณลงทะเบียนคอร์สนี้ไปแล้ว")

    crud.create_enrollment(db, u.id, course_id)
    user = db.query(models.User).get(u.id)
    if user:
        achievements_seed.check_all(db, user)
    return {"status": "ok", "course_id": course_id}


@router.post("/payments/{ref}/simulate-paid")
def simulate_paid(ref: str, db: Session = Depends(get_db), u=Depends(get_current_user)):
    """จำลองว่าจ่ายเงินสำเร็จ — ใช้ทดสอบตอนพัฒนาเท่านั้น

    ทำไมไม่ให้หน้าเว็บยิง /payments/webhook ตรง ๆ:
    webhook ต้องใช้ PAYMENT_WEBHOOK_SECRET ถ้าเอา secret ไปไว้ในเบราว์เซอร์
    ใครเปิด DevTools ก็เห็น แล้วปลดคอร์สฟรีได้ทั้งเว็บ

    endpoint นี้จึงไม่ต้องใช้ secret แต่:
      • ปิดสนิทเมื่อ ENV=production
      • ทำได้เฉพาะรายการของตัวเองเท่านั้น
    """
    if settings.is_production:
        raise HTTPException(404, "ไม่พบเส้นทางนี้")

    p = crud.get_payment_by_ref(db, ref)
    if not p or p.user_id != u.id:
        raise HTTPException(404, "ไม่พบรายการชำระเงิน")
    if p.status == "expired":
        raise HTTPException(400, "รายการนี้หมดอายุแล้ว สร้าง QR ใหม่ก่อน")

    r = crud.mark_payment_paid(db, ref, charge_id=f"SIMULATED-{ref}")
    user = db.query(models.User).get(p.user_id)
    if user:
        course = crud.get_course(db, p.course_id)
        gm.notify(db, user, "payment", "ชำระเงินสำเร็จ",
                  f"คอร์ส {course.title if course else ''} · ฿{p.amount:,.0f} — เปิดเรียนให้แล้ว",
                  href="Settings.html#billing", dedupe_key=f"paid:{p.provider_ref}")
        db.commit()
        achievements_seed.check_all(db, user)
    return {"status": "ok", "payment_status": r.status if r else p.status}

# GET /users/me/courses อยู่ที่ routers/users.py (คืนความคืบหน้าการเรียนมาด้วย)
# เดิมประกาศไว้ทั้งสองไฟล์ ตัวที่นี่ถูกบังไม่เคยทำงานเลย จึงลบทิ้ง

@router.get("/users/me/payments", response_model=List[schemas.PaymentRead])
def my_payments(db: Session = Depends(get_db), u=Depends(get_current_user)):
    """ประวัติการชำระเงินของผู้ใช้ปัจจุบัน — รวมข้อมูล course title."""
    payments = crud.get_my_payments(db, u.id)
    course_ids = {p.course_id for p in payments}
    courses = {
        c.id: c
        for c in db.query(models.Course).filter(models.Course.id.in_(course_ids)).all()
    } if course_ids else {}
    for p in payments:
        c = courses.get(p.course_id)
        p.user_email = u.email
        p.user_full_name = u.full_name
        p.course_title = c.title if c else None
    return payments

@router.post("/coupons/validate")
def validate_coupon(code: str = Body(..., embed=True), db: Session = Depends(get_db)):
    coupon = db.query(models.Coupon).filter(models.Coupon.code == code.upper()).first()
    if not coupon:
        raise HTTPException(400, "คูปองไม่ถูกต้อง")
    if coupon.expires_at and coupon.expires_at < datetime.utcnow():
        raise HTTPException(400, "คูปองหมดอายุแล้ว")
    if coupon.max_usage > 0 and coupon.current_usage >= coupon.max_usage:
        raise HTTPException(400, "คูปองสิทธิ์เต็มแล้ว")
    return {"code": coupon.code, "discount_type": coupon.discount_type, "discount_value": coupon.discount_value}

@router.get("/payments/qr")
def generate_qr(amount: float):
    if amount <= 0:
        return Response(status_code=204)
    img = make_qr_image(MY_PROMPTPAY_ID, amount)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")

# ---------------------------------------------------------------------------
# Checkout — ยืนยันอัตโนมัติ ไม่มีอัปโหลดสลิป ไม่มีแอดมินอนุมัติ (ดู CLAUDE.md)
#   1) POST /payments/checkout  -> สร้างรายการ awaiting + QR (อายุ 15 นาที)
#   2) หน้า Checkout poll GET /payments/{ref}
#   3) เกตเวย์ยิง POST /payments/webhook -> paid -> เปิดคอร์สทันที
# ---------------------------------------------------------------------------

@router.post("/payments/checkout", response_model=schemas.CheckoutRead)
def start_checkout(
    body: schemas.CheckoutCreate,
    db: Session = Depends(get_db),
    u = Depends(get_current_user),
):
    c = crud.get_course(db, body.course_id)
    if not c:
        raise HTTPException(404, "Course not found")
    if crud.get_enrollment(db, u.id, body.course_id):
        raise HTTPException(400, "คุณลงทะเบียนคอร์สนี้ไปแล้ว")

    final_price, _coupon = crud.price_after_coupon(db, c.price, body.coupon_code)
    p = crud.create_payment_intent(db, u.id, body.course_id, final_price, body.coupon_code)
    return schemas.CheckoutRead(
        ref=p.provider_ref,
        amount=p.amount,
        status=p.status,
        expires_at=p.expires_at,
        qr_url=f"/payments/qr?amount={p.amount}&ref={p.provider_ref}",
    )


@router.get("/payments/{ref}", response_model=schemas.PaymentRead)
def payment_status(ref: str, db: Session = Depends(get_db), u = Depends(get_current_user)):
    """หน้า Checkout เรียกซ้ำๆ เพื่อดูว่าจ่ายสำเร็จหรือ QR หมดอายุแล้ว"""
    crud.expire_stale_payments(db)
    p = crud.get_payment_by_ref(db, ref)
    if not p or p.user_id != u.id:
        raise HTTPException(404, "ไม่พบรายการชำระเงิน")
    return p


@router.post("/payments/webhook")
def payment_webhook(
    body: schemas.PaymentWebhook,
    x_signature: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """เกตเวย์ (Opn / 2C2P / GB Prime Pay) เรียกเข้ามาเมื่อผลชำระเปลี่ยน

    ยังไม่ได้ผูกกับเกตเวย์จริง — ตรวจ signature ด้วย secret ที่ตั้งไว้ใน env
    ถ้ายังไม่ตั้ง PAYMENT_WEBHOOK_SECRET จะปฏิเสธทุก request เพื่อไม่ให้
    เผลอเปิดคอร์สฟรีบน production
    """
    if not PAYMENT_WEBHOOK_SECRET:
        raise HTTPException(503, "ยังไม่ได้ตั้งค่า PAYMENT_WEBHOOK_SECRET")
    if not x_signature or not hmac.compare_digest(x_signature, PAYMENT_WEBHOOK_SECRET):
        raise HTTPException(401, "signature ไม่ถูกต้อง")

    if body.status == "paid":
        r = crud.mark_payment_paid(db, body.ref, body.charge_id, body.amount)
        if r is None:
            raise HTTPException(404, "ไม่พบรายการชำระเงิน")
        if r is False:
            raise HTTPException(400, "ยอดเงินไม่ตรงกับรายการ")

        # แจ้งเตือน + เช็คเหรียญ (ป๋าเปย์) — ผูก dedupe กับ ref เผื่อ webhook ยิงซ้ำ
        user = db.query(models.User).get(r.user_id)
        if user:
            course = crud.get_course(db, r.course_id)
            gm.notify(db, user, "payment", "ชำระเงินสำเร็จ",
                      f"คอร์ส {course.title if course else ''} · ฿{r.amount:,.0f} — เปิดเรียนให้แล้ว เริ่มได้เลย",
                      href="Settings.html#billing", dedupe_key=f"paid:{r.provider_ref}")
            db.commit()
            achievements_seed.check_all(db, user)
        return {"status": "ok", "payment_status": r.status}

    p = crud.get_payment_by_ref(db, body.ref)
    if not p:
        raise HTTPException(404, "ไม่พบรายการชำระเงิน")
    if p.status == "awaiting":
        p.status = "expired"
        db.commit()
    return {"status": "ok", "payment_status": p.status}

# Coupons admin endpoints (เก่าใช้ /coupons แบบไม่มี gate ที่ถูก — ลบทิ้ง ใช้ /admin/coupons แทน)
@router.post("/admin/coupons", response_model=schemas.CouponRead)
def create_coupon_admin(p: schemas.CouponCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    c = crud.create_coupon(db, p)
    if c is None:
        raise HTTPException(400, f"Coupon code '{p.code}' already exists.")
    return c

@router.get("/admin/coupons", response_model=List[schemas.CouponRead])
def list_coupons_admin(db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.list_coupons(db)

@router.delete("/admin/coupons/{id}")
def delete_coupon_admin(id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    if crud.delete_coupon(db, id):
        return {"status": "deleted"}
    raise HTTPException(404, "Coupon not found")
