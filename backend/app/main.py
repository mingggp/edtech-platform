import os, time, json, re, urllib.request, io
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, status, Form, File, UploadFile, Query, Body, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response, StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from typing import List, Optional
from datetime import datetime, timedelta, timezone

from .database import Base, engine, get_db
from . import models, schemas, crud
from .auth import create_access_token, get_current_user, require_admin, verify_password, get_password_hash, get_current_active_user
from .models import User
from .schemas import SettingsUpdate, AdminUserListResponse, UserUpdateMe
from .promptpay import make_qr_image

from collections import defaultdict

from .badges import get_user_badges_status

load_dotenv()

# --- CONFIG ---
MY_PROMPTPAY_ID = "0630218621"  # ใส่เบอร์ PromptPay ของคุณที่นี่

app = FastAPI(title="MingSmileyFace API", version="2.2.0")
STATIC_DIR = Path("static")
UPLOAD_DIR = STATIC_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
Base.metadata.create_all(bind=engine)

BKK_TZ = timezone(timedelta(hours=7))

def _bkk_text(dt: datetime) -> str:
    return dt.replace(tzinfo=timezone.utc).astimezone(BKK_TZ).strftime("%Y-%m-%d %H:%M:%S") if dt else ""

def _bkk_iso(dt: datetime) -> str:
    return dt.replace(tzinfo=timezone.utc).astimezone(BKK_TZ).isoformat() if dt else ""

def get_youtube_duration(video_id: str) -> int:
    try:
        url = f"https://www.youtube.com/watch?v={video_id}"
        with urllib.request.urlopen(url) as response:
            html = response.read().decode()
            match = re.search(r'"lengthSeconds":"(\d+)"', html)
            if match:
                return round(int(match.group(1)) / 60)
    except:
        pass
    return 0

@app.get("/ping")
def ping():
    return {"ok": True, "msg": "pong"}

# ==========================================
#  AUTH
# ==========================================
@app.post("/auth/signup", response_model=schemas.UserRead, status_code=201)
def signup(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, payload.email):
        raise HTTPException(400, "Email registered")
    u = crud.create_user(db, payload.email, get_password_hash(payload.password), payload.full_name, payload.nickname, payload.grade_level)
    return u

@app.post("/auth/login", response_model=schemas.Token)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    u = crud.get_user_by_email(db, payload.email)
    if not u or not verify_password(payload.password, u.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    u.last_login = datetime.utcnow()
    db.commit()
    return {"access_token": create_access_token(u.email), "token_type": "bearer"}

# ==========================================
#  USER & PROFILE
# ==========================================
@app.get("/users/me", response_model=schemas.UserRead)
def read_me(u=Depends(get_current_user)):
    return u

@app.patch("/users/me")
def update_user_me(user_data: UserUpdateMe, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_data.full_name is not None: current_user.full_name = user_data.full_name
    if user_data.nickname is not None: current_user.nickname = user_data.nickname
    if user_data.grade_level is not None: current_user.grade_level = user_data.grade_level
    if user_data.dek_code is not None: current_user.dek_code = user_data.dek_code
    db.commit()
    db.refresh(current_user)
    return current_user

@app.post("/users/me/upload-image")
async def upload_user_image(file: UploadFile = File(...), db: Session = Depends(get_db), u=Depends(get_current_user)):
    ext = file.filename.split(".")[-1]
    if ext.lower() not in ["jpg", "jpeg", "png", "webp"]:
        raise HTTPException(400, "อนุญาตเฉพาะไฟล์รูปภาพ (jpg, png, webp)")
    
    fname = f"user_{u.id}_{int(time.time())}.{ext}"
    with open(UPLOAD_DIR / fname, "wb") as f:
        f.write(await file.read())
    
    url = f"/static/uploads/{fname}"
    
    # Auto-update user profile
    u.avatar_url = url
    db.commit()
    db.refresh(u)
    
    return {"url": url}

# ==========================================
#  COURSES (Public & Admin)
# ==========================================
@app.get("/courses", response_model=List[schemas.CourseRead])
def list_c(db: Session = Depends(get_db)):
    return crud.list_courses(db)

@app.get("/courses/{id}", response_model=schemas.CourseRead)
def get_c(id: int, db: Session = Depends(get_db)):
    return crud.get_course(db, id)

@app.post("/admin/courses", response_model=schemas.CourseRead)
def create_c(p: schemas.CourseCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.create_course(db, p)

@app.patch("/admin/courses/{id}", response_model=schemas.CourseRead)
def update_c(id: int, p: schemas.CourseUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.update_course(db, id, p)

@app.delete("/admin/courses/{id}", status_code=204)
def delete_c(id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    crud.delete_course(db, id)

@app.post("/admin/courses/{id}/chapters", response_model=schemas.ChapterRead)
def add_chap(id: int, p: schemas.ChapterCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.create_chapter(db, id, p)

@app.post("/admin/chapters/{id}/lessons", response_model=schemas.LessonRead)
def add_l(id: int, p: schemas.LessonCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if p.duration == 0 and p.youtube_id:
        p.duration = get_youtube_duration(p.youtube_id)
    return crud.create_lesson(db, id, p)

@app.patch("/admin/lessons/{id}", response_model=schemas.LessonRead)
def upd_l(id: int, p: schemas.LessonUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if p.youtube_id and (p.duration is None or p.duration == 0):
        p.duration = get_youtube_duration(p.youtube_id)
    return crud.update_lesson(db, id, p)

@app.delete("/admin/lessons/{id}", status_code=204)
def del_l(id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    crud.delete_lesson(db, id)

# ==========================================
#  ENROLLMENT & PAYMENT
# ==========================================
@app.post("/users/me/courses")
def enroll(course_id: int, db: Session = Depends(get_db), u=Depends(get_current_user)):
    crud.create_enrollment(db, u.id, course_id)
    return {"status": "ok"}

@app.get("/users/me/courses", response_model=List[schemas.EnrollmentRead])
def my_c(db: Session = Depends(get_db), u=Depends(get_current_user)):
    return crud.get_my_courses(db, u.id)

@app.post("/coupons/validate")
def validate_coupon(code: str = Body(..., embed=True), db: Session = Depends(get_db)):
    coupon = db.query(models.Coupon).filter(models.Coupon.code == code.upper()).first()
    if not coupon:
        raise HTTPException(400, "คูปองไม่ถูกต้อง")
    if coupon.expires_at and coupon.expires_at < datetime.utcnow():
        raise HTTPException(400, "คูปองหมดอายุแล้ว")
    if coupon.max_usage > 0 and coupon.current_usage >= coupon.max_usage:
        raise HTTPException(400, "คูปองสิทธิ์เต็มแล้ว")
    return {"code": coupon.code, "discount_type": coupon.discount_type, "discount_value": coupon.discount_value}

@app.get("/payments/qr")
def generate_qr(amount: float):
    if amount <= 0:
        return Response(status_code=204)
    img = make_qr_image(MY_PROMPTPAY_ID, amount)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")

@app.post("/payments/upload", response_model=schemas.PaymentRead)
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

# ==========================================
#  LEARNING & STATS
# ==========================================
@app.get("/courses/{cid}/my-progress")
def my_prog(cid: int, db: Session = Depends(get_db), u=Depends(get_current_user)):
    r = crud.get_user_progress_in_course(db, u.id, cid)
    return {"completed_ids": [x[0] for x in r]}

@app.post("/courses/{cid}/lessons/{lid}/toggle-progress")
def tog_prog(cid: int, lid: int, db: Session = Depends(get_db), u=Depends(get_current_user)):
    return {"completed": crud.toggle_lesson_progress(db, u.id, lid)}

@app.post("/courses/{cid}/lessons/{lid}/progress")
def upd_prog_time(cid: int, lid: int, p: schemas.ProgressUpdate, db: Session = Depends(get_db), u=Depends(get_current_user)):
    crud.update_lesson_progress_time(db, u.id, lid, p.seconds)
    return {"status": "ok"}

@app.get("/courses/{cid}/lessons/{lid}/progress")
def get_prog_time(cid: int, lid: int, db: Session = Depends(get_db), u=Depends(get_current_user)):
    return {"seconds": crud.get_lesson_progress_time(db, u.id, lid)}

@app.post("/users/me/study-time")
def add_study_time(p: schemas.StudyTimeCreate, db: Session = Depends(get_db), u=Depends(get_current_user)):
    crud.record_study_time(db, u.id, p.minutes)
    crud.update_user_activity(db, u.id, "กำลังเรียน")
    return {"status": "ok"}

@app.get("/users/me/study-stats")
def get_study_stats(db: Session = Depends(get_db), u=Depends(get_current_user)):
    return crud.get_weekly_study_stats(db, u.id)

@app.post("/users/me/friends")
def add_friend_api(email: str = Form(...), db: Session = Depends(get_db), u=Depends(get_current_user)): 
    if not crud.add_friend(db, u.id, email):
        raise HTTPException(404, "Failed")
    return {"message": "Added"}

@app.get("/users/me/friends", response_model=List[schemas.FriendRead])
def my_friends(db: Session = Depends(get_db), u=Depends(get_current_user)):
    fs = crud.get_friends(db, u.id)
    now = datetime.utcnow()
    out = []
    for f in fs:
        online = False
        if f.last_login:
            online = (now - f.last_login).total_seconds() < 300
        item = schemas.FriendRead.model_validate(f)
        item.is_online = online
        if not online:
            item.current_activity = None
        out.append(item)
    return out

@app.get("/leaderboard", response_model=List[schemas.LeaderboardItem])
def leaderboard(db: Session = Depends(get_db)):
    return [schemas.LeaderboardItem(id=u.id, full_name=u.full_name or u.email.split("@")[0], avatar_url=u.avatar_url, completed_count=s, total_minutes=u.total_minutes) for u,s in crud.get_leaderboard(db)]

# ==========================================
#  INTERACTION (Comment/Rate)
# ==========================================
@app.get("/lessons/{id}/comments", response_model=List[schemas.CommentRead])
def get_comments(id: int, db: Session = Depends(get_db), u=Depends(get_current_user)):
    return crud.get_lesson_comments(db, id)

@app.post("/lessons/{id}/comments", response_model=schemas.CommentRead)
def post_comment(id: int, p: schemas.CommentCreate, db: Session = Depends(get_db), u=Depends(get_current_user)):
    return crud.create_comment(db, u.id, id, p.text)

@app.get("/lessons/{id}/rating")
def get_rating(id: int, db: Session = Depends(get_db), u=Depends(get_current_user)):
    return {"avg": crud.get_lesson_rating_avg(db, id), "my": crud.get_user_lesson_rating(db, u.id, id)}

@app.post("/lessons/{id}/rate")
def rate_lesson(id: int, p: schemas.RatingCreate, db: Session = Depends(get_db), u=Depends(get_current_user)):
    crud.set_lesson_rating(db, u.id, id, p.score)
    return {"status": "ok"}

# ==========================================
#  ADMIN (Coupons, Exams, Reports, Settings)
# ==========================================
@app.post("/admin/coupons", response_model=schemas.CouponRead)
def create_coupon(p: schemas.CouponCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    c = crud.create_coupon(db, p)
    if c is None:
        raise HTTPException(400, f"Coupon code '{p.code}' already exists.")
    return c

@app.get("/admin/coupons", response_model=List[schemas.CouponRead])
def list_coupons(db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.list_coupons(db)

@app.delete("/admin/coupons/{id}")
def delete_coupon(id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    if crud.delete_coupon(db, id):
        return {"status": "deleted"}
    raise HTTPException(404, "Coupon not found")

@app.get("/coupons", response_model=List[schemas.CouponOut])
def read_coupons(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    # admin only check could be here
    return crud.get_coupons(db, skip=skip, limit=limit)

@app.post("/coupons", response_model=schemas.CouponOut)
def create_new_coupon(coupon: schemas.CouponCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    if current_user.role != "admin": raise HTTPException(status_code=403, detail="Not authorized")
    return crud.create_coupon(db=db, coupon=coupon)

@app.delete("/coupons/{coupon_id}")
def delete_coupon(coupon_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    if current_user.role != "admin": raise HTTPException(status_code=403, detail="Not authorized")
    crud.delete_coupon(db, coupon_id)
    return {"status": "success"}

@app.post("/admin/exams", response_model=schemas.ExamRead)
def cr_exam(p: schemas.ExamCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.create_exam(db, p)

@app.get("/exams", response_model=List[schemas.ExamRead])
def l_exam(db: Session = Depends(get_db)):
    return crud.list_exams(db)

@app.get("/exams/{id}", response_model=schemas.ExamRead)
def g_exam(id: int, db: Session = Depends(get_db)):
    e = crud.get_exam(db, id)
    if not e:
        raise HTTPException(404)
    return e

@app.post("/admin/exams/{id}/questions")
def add_q(id: int, p: schemas.QuestionCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.add_question(db, id, p)

@app.delete("/admin/questions/{id}")
def del_q(id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    if crud.delete_question(db, id):
        return {"status": "deleted"}
    raise HTTPException(404)

@app.post("/upload/image")
async def upload_generic_image(file: UploadFile = File(...), db: Session = Depends(get_db), _=Depends(require_admin)):
    ext = file.filename.split(".")[-1]
    fname = f"img_{int(time.time())}.{ext}"
    with open(UPLOAD_DIR / fname, "wb") as f:
        f.write(await file.read())
    return {"url": f"/static/uploads/{fname}"}

@app.get("/admin/users", response_model=schemas.AdminUserListResponse)
def adm_list_users(
    q: str | None = None,
    page: int = 1,
    page_size: int = 10,
    sort: str = "id:asc",
    role: str | None = None,
    active: bool | None = None,
    grade: str | None = None,
    online_status: str | None = None,
    db: Session = Depends(get_db),
    _ = Depends(require_admin)
):
    i, t = crud.admin_list_users(db, q, page, page_size, sort, role, active, grade, online_status)
    return {"items": i, "meta": {"page": page, "page_size": page_size, "total": t}}

@app.patch("/admin/users/{uid}")
def adm_update_user(uid: int, p: schemas.AdminUserUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    u = db.query(User).get(uid)
    if not u:
        raise HTTPException(404)
    return crud.admin_update_user(db, u, p)

@app.get("/admin/metrics")
def adm_metrics(db: Session = Depends(get_db), _=Depends(require_admin)):
    t = db.query(models.User).count()
    a = db.query(models.User).filter_by(role="admin").count()
    limit = datetime.utcnow() - timedelta(minutes=5)
    o = db.query(models.User).filter(models.User.last_login >= limit).count()
    n = db.query(models.User).filter(models.User.created_at >= datetime.utcnow().date()).count()
    return {"total_users": t, "admins": a, "active_users": o, "new_users_today": n}

@app.get("/admin/payment-stats")
def pay_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    if current_user.role != "admin": raise HTTPException(status_code=403, detail="Not authorized")
    
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=6)
    
    # ดึงข้อมูลการชำระเงินที่อนุมัติแล้วในช่วง 7 วันล่าสุด
    pays = db.query(models.Payment).filter(
        models.Payment.status == "approved",
        models.Payment.created_at >= start_date
    ).all()
    
    # ✅ FIX: ใช้ defaultdict(float) เพื่อป้องกัน KeyError
    d = defaultdict(float)
    
    # เตรียม keys ล่วงหน้า 7 วัน (เพื่อให้กราฟแสดงครบทุกวัน แม้วันนั้นยอดเป็น 0)
    labels = []
    for i in range(6, -1, -1):
        day_str = (today - timedelta(days=i)).strftime("%d/%m")
        d[day_str] = 0.0 # set default 0
        labels.append(day_str)

    # เติมข้อมูลจริง
    for p in pays:
        # แปลงเป็นเวลาไทย +7 ชม. (ถ้าต้องการ) หรือใช้วันที่ตาม UTC
        local_time = p.created_at + timedelta(hours=7)
        key = local_time.strftime("%d/%m")
        
        # เช็คว่า key นี้อยู่ในช่วงที่เราสนใจไหม (กันเหนียว)
        if key in d:
            d[key] += p.amount
    
    # เรียงข้อมูลตาม labels เพื่อให้กราฟไม่สลับวัน
    data = [d[label] for label in labels]
    
    return {"labels": labels, "data": data}

@app.get("/admin/payments", response_model=List[schemas.PaymentRead])
def l_pays(status: str | None = None, db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.get_payments(db, status)

@app.post("/admin/payments/{id}/{act}")
def proc_pay(id: int, act: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    return {"status": "ok", "new_status": crud.approve_payment(db, id, act).status}

@app.get("/settings")
def get_set(db: Session = Depends(get_db)):
    return crud.get_all_settings(db)

@app.patch("/admin/settings")
def upd_set(p: SettingsUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.update_settings(db, p)

@app.post("/admin/settings/banner-image")
async def upload_banner_image(file: UploadFile = File(...), db: Session = Depends(get_db), _=Depends(require_admin)):
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(400, "Image only")
    ext = file.filename.split(".")[-1]
    fname = f"banner_{int(time.time())}.{ext}"
    with open(UPLOAD_DIR / fname, "wb") as f:
        f.write(await file.read())
    url = f"/static/uploads/{fname}"
    curr = crud.get_setting(db, "banner_images")
    imgs = json.loads(curr) if curr else []
    imgs.append(url)
    crud.set_setting(db, "banner_images", json.dumps(imgs))
    return {"url": url, "images": imgs}

@app.delete("/admin/settings/banner-image")
def delete_banner_image(url: str = Body(..., embed=True), db: Session = Depends(get_db), _=Depends(require_admin)):
    curr = crud.get_setting(db, "banner_images")
    imgs = json.loads(curr) if curr else []
    if url in imgs:
        imgs.remove(url)
    crud.set_setting(db, "banner_images", json.dumps(imgs))
    return {"images": imgs}

@app.get("/admin/reports", response_model=List[dict])
def list_reports(status: str | None = None, db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.get_all_reports(db, status)

@app.post("/reports")
def report_problem(p: schemas.ReportCreate, db: Session = Depends(get_db), u=Depends(get_current_user)):
    crud.create_report(db, u.id, p)
    return {"status": "ok"}

@app.patch("/admin/reports/{id}")
def update_report(id: int, status: str = Body(..., embed=True), db: Session = Depends(get_db), _=Depends(require_admin)):
    r = crud.update_report_status(db, id, status)
    return r

@app.get("/admin/audit", response_model=schemas.AuditListResponse)
def adm_audit(
    action: str | None = None,
    actor_id: int | None = None,
    target_id: int | None = None,
    page: int = 1,
    page_size: int = 20,
    sort: str = "created_at:desc",
    db: Session = Depends(get_db),
    _ = Depends(require_admin)
):
    r, t = crud.list_audit(db, action, actor_id, target_id, None, None, page, page_size, sort)
    items = []
    for x in r:
        diffs = crud._compute_diff(x.data)
        items.append(schemas.AuditItem(
            id=x.id,
            action=x.action,
            actor_id=x.actor_id,
            target_id=x.target_id,
            data=x.data,
            created_at=x.created_at,
            created_at_bkk=_bkk_text(x.created_at),
            created_at_iso_bkk=_bkk_iso(x.created_at),
            diff=diffs
        ))
    return {"items": items, "meta": {"page": page, "page_size": page_size, "total": t}}


# ==========================================
#  BADGES SYSTEM (เพิ่มใหม่)
# ==========================================
@app.get("/users/me/achievements")
def get_my_achievements(db: Session = Depends(get_db), u = Depends(get_current_user)):
    return get_user_badges_status(db, u)

@app.post("/users/me/achievements/showcase")
def update_showcase(badges: List[str] = Body(...), db: Session = Depends(get_db), u = Depends(get_current_user)):
    # Validate: ต้องไม่เกิน 3 อัน
    if len(badges) > 3:
        raise HTTPException(400, "เลือกโชว์ได้สูงสุด 3 อัน")
    
    # Validate: ต้องเป็นเหรียญที่ปลดล็อกแล้วเท่านั้น
    unlocked_ids = set([b['id'] for b in get_user_badges_status(db, u) if b['is_unlocked']])
    for bid in badges:
        if bid not in unlocked_ids:
            raise HTTPException(400, f"คุณยังไม่ได้รับเหรียญ {bid}")
            
    # Save as comma separated string
    u.showcase_badges = ",".join(badges)
    db.commit()
    return {"status": "ok", "showcase": u.showcase_badges}


@app.get("/users/{user_id}/public", response_model=schemas.UserPublicProfile)
def get_public_profile_api(user_id: int, db: Session = Depends(get_db), u=Depends(get_current_user)):
    # อนุญาตให้ดูได้เฉพาะคนที่เป็นสมาชิก (Logged in)
    profile = crud.get_public_profile(db, user_id)
    if not profile:
        raise HTTPException(404, "User not found")
    return profile