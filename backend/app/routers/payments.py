from typing import List, Optional
import time, io
from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile, Body
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import get_db
from .. import schemas, crud, models
from ..auth import get_current_user, get_current_active_user, require_admin
from ..promptpay import make_qr_image
from ..config import UPLOAD_DIR, MY_PROMPTPAY_ID

router = APIRouter(prefix="", tags=["payments"])

@router.post("/users/me/courses")
def enroll(course_id: int, db: Session = Depends(get_db), u=Depends(get_current_user)):
    crud.create_enrollment(db, u.id, course_id)
    return {"status": "ok"}

@router.get("/users/me/courses", response_model=List[schemas.EnrollmentRead])
def my_c(db: Session = Depends(get_db), u=Depends(get_current_user)):
    return crud.get_my_courses(db, u.id)

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

@router.post("/payments/upload", response_model=schemas.PaymentRead)
async def up_slip(
    course_id: int = Form(...),
    file: UploadFile = File(...),
    coupon_code: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    u = Depends(get_current_user)
):
    c = crud.get_course(db, course_id)
    if not c:
        raise HTTPException(404, "Course not found")
    if crud.get_enrollment(db, u.id, course_id):
        raise HTTPException(400, "คุณลงทะเบียนคอร์สนี้ไปแล้ว")
    
    final_price = c.price
    if coupon_code:
        coupon = db.query(models.Coupon).filter(models.Coupon.code == coupon_code.upper()).first()
        if coupon:
            valid = True
            if coupon.expires_at and coupon.expires_at < datetime.utcnow(): valid = False
            if coupon.max_usage > 0 and coupon.current_usage >= coupon.max_usage: valid = False
            
            if valid:
                discount = (c.price * coupon.discount_value / 100) if coupon.discount_type == "percent" else coupon.discount_value
                final_price = max(0, c.price - discount)
                coupon.current_usage += 1
                db.commit()

    ext = file.filename.split(".")[-1]
    fname = f"slip_{u.id}_{int(time.time())}.{ext}"
    with open(UPLOAD_DIR / fname, "wb") as f:
        f.write(await file.read())
    
    return crud.create_payment(db, u.id, course_id, f"/static/uploads/{fname}", final_price)

# Admin Coupons that were mixed into /coupons
@router.get("/coupons", response_model=List[schemas.CouponOut])
def read_coupons(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    return crud.get_coupons(db, skip=skip, limit=limit)

@router.post("/coupons", response_model=schemas.CouponOut)
def create_new_coupon(coupon: schemas.CouponCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    if current_user.role != "admin": raise HTTPException(status_code=403, detail="Not authorized")
    return crud.create_coupon(db=db, coupon=coupon)

@router.delete("/coupons/{coupon_id}")
def delete_coupon(coupon_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    if current_user.role != "admin": raise HTTPException(status_code=403, detail="Not authorized")
    crud.delete_coupon(db, coupon_id)
    return {"status": "success"}

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
