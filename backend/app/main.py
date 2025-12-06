# backend/app/main.py
import os, time, json
from pathlib import Path
# --- เพิ่ม Body ตรงนี้ให้แล้ว ---
from fastapi import FastAPI, Depends, HTTPException, status, Form, File, UploadFile, Query, Body, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import Response, StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr, BaseModel

from .database import Base, engine, get_db
from . import models, schemas, crud
from .auth import get_password_hash, verify_password, create_access_token, get_current_user, require_admin
from .schemas import PasswordChange, AdminUserUpdate, AdminUserListResponse, AdminUserCreate, AuditListResponse, AuditItem, DiffItem, SettingsUpdate
from .promptpay import make_qr_image

from typing import List, Optional
from sqlalchemy import text as sql_text
from datetime import datetime, timedelta, timezone

load_dotenv()

# --- Email Config (ใส่ Mock ไว้ก่อน ถ้ามีของจริงค่อยแก้) ---
MAIL_USERNAME = "voravich2549@gmail.com"
MAIL_PASSWORD = "vusy xyyo dnlv nkpy" 
conf = ConnectionConfig(MAIL_USERNAME=MAIL_USERNAME, MAIL_PASSWORD=MAIL_PASSWORD, MAIL_FROM=MAIL_USERNAME, MAIL_PORT=587, MAIL_SERVER="smtp.gmail.com", MAIL_STARTTLS=True, MAIL_SSL_TLS=False, USE_CREDENTIALS=True, VALIDATE_CERTS=True)
FRONTEND_URL = "http://127.0.0.1:5500/frontend"

BKK_TZ = timezone(timedelta(hours=7))
def _as_aware_utc(dt: datetime) -> datetime:
    if dt is None: return None
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)
def _bkk_text(dt: datetime) -> str:
    if not dt: return ""
    return _as_aware_utc(dt).astimezone(BKK_TZ).strftime("%Y-%m-%d %H:%M:%S")
def _bkk_iso(dt: datetime) -> str:
    if not dt: return ""
    return _as_aware_utc(dt).astimezone(BKK_TZ).isoformat()

app = FastAPI(title="MingSmileyFace API", version="1.0.0")
STATIC_DIR = Path("static")
UPLOAD_DIR = STATIC_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# --- CORS Setup (สำคัญมากสำหรับการเชื่อมต่อ Frontend) ---
cors_origins_raw = os.getenv("CORS_ALLOW_ORIGINS", "*").strip()
allow_origins = ["*", "null"] if cors_origins_raw == "*" else [o.strip() for o in cors_origins_raw.split(",") if o.strip()] + ["null"]
app.add_middleware(CORSMiddleware, allow_origins=allow_origins, allow_origin_regex=r".*", allow_credentials=False, allow_methods=["*"], allow_headers=["*"])

@app.options("/{rest_of_path:path}")
def preflight_ok(rest_of_path: str): return Response(status_code=200)

# สร้างตารางทั้งหมด
Base.metadata.create_all(bind=engine)

@app.get("/ping")
def ping(): return {"ok": True, "msg": "pong"}

# Auth
@app.post("/auth/signup", response_model=schemas.UserRead, status_code=201)
def signup(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, payload.email): raise HTTPException(400, "Email registered")
    u = crud.create_user(db, payload.email, get_password_hash(payload.password), payload.full_name)
    crud.add_audit(db, "USER_SIGNUP", u.id, u.id, {"email": u.email})
    return u
@app.post("/auth/login", response_model=schemas.Token)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    u = crud.get_user_by_email(db, payload.email)
    if not u or not verify_password(payload.password, u.hashed_password):
        crud.add_audit(db, "LOGIN_FAIL", None, None, {"email": payload.email}); raise HTTPException(401, "Invalid credentials")
    u.last_login = datetime.utcnow(); db.commit()
    t = create_access_token(u.email); crud.add_audit(db, "LOGIN_SUCCESS", u.id, u.id, {"email": u.email})
    return {"access_token": t, "token_type": "bearer"}
@app.post("/auth/token", response_model=schemas.Token)
def login_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password): raise HTTPException(401, "Invalid credentials")
    user.last_login = datetime.utcnow(); db.commit(); return {"access_token": create_access_token(subject=user.email), "token_type": "bearer"}
@app.post("/auth/forgot-password")
async def forgot_password(bg: BackgroundTasks, email: EmailStr = Body(..., embed=True), db: Session = Depends(get_db)):
    u = crud.get_user_by_email(db, email)
    if u:
        token = create_access_token(u.email, timedelta(minutes=15))
        msg = MessageSchema(subject="Reset Password", recipients=[email], body=f"Click to reset: {FRONTEND_URL}/reset_new_password.html?token={token}", subtype=MessageType.html)
        bg.add_task(FastMail(conf).send_message, msg)
    return {"message": "Email sent"}
@app.post("/auth/reset-password-confirm")
def reset_password_confirm(token: str = Body(...), new_password: str = Body(...), db: Session = Depends(get_db)):
    try:
        from jose import jwt; from .auth import SECRET_KEY, ALGORITHM
        email = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM]).get("sub")
        if not email: raise Exception()
    except: raise HTTPException(400, "Invalid token")
    u = crud.get_user_by_email(db, email)
    if not u: raise HTTPException(404, "User not found")
    u.hashed_password = get_password_hash(new_password); db.commit()
    return {"message": "Success"}
@app.post("/auth/change-password")
def change_password(payload: schemas.PasswordChange, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if not verify_password(payload.old_password, current_user.hashed_password): raise HTTPException(400, "Password incorrect")
    current_user.hashed_password = get_password_hash(payload.new_password); db.commit()
    return {"message": "Success"}

# User
@app.get("/users/me", response_model=schemas.UserRead)
def read_me(u=Depends(get_current_user)): return u
@app.post("/users/me", response_model=schemas.UserRead)
async def update_me_combined(full_name: str=Form(None), bio: str=Form(None), grade_level: str=Form(None), file: UploadFile=File(None), db: Session=Depends(get_db), u=Depends(get_current_user)):
    if full_name: u.full_name = full_name.strip() or None
    if bio: u.bio = bio.strip() or None
    if grade_level: u.grade_level = grade_level.upper().replace(" ", ""); u.dek_code = {"M6":69,"M5":70,"M4":71,"M3":72,"M2":73,"M1":74}.get(u.grade_level)
    if file:
        if file.content_type not in ["image/jpeg","image/png","image/webp"]: raise HTTPException(400, "Image only")
        ext = { "image/jpeg":".jpg", "image/png":".png", "image/webp":".webp" }[file.content_type]
        fname = f"{u.id}_{int(time.time())}{ext}"; 
        with open(UPLOAD_DIR/fname, "wb") as f: f.write(await file.read())
        u.avatar_url = f"/static/uploads/{fname}"
    db.commit(); db.refresh(u); return u

# Social
@app.post("/users/me/friends")
def add_friend_api(email: str=Form(...), db: Session=Depends(get_db), u=Depends(get_current_user)):
    if not crud.add_friend(db, u.id, email): raise HTTPException(404, "Failed")
    return {"message": "Added"}
@app.get("/users/me/friends", response_model=List[schemas.FriendRead])
def my_friends(db: Session=Depends(get_db), u=Depends(get_current_user)):
    fs = crud.get_friends(db, u.id); now = datetime.utcnow(); out = []
    for f in fs:
        online = False
        if f.last_login: online = (now - f.last_login).total_seconds() < 300
        item = schemas.FriendRead.model_validate(f); item.is_online = online
        if not online: item.current_activity = None
        out.append(item)
    return out
@app.post("/users/me/activity")
def set_activity(p: schemas.ActivityUpdate, db: Session=Depends(get_db), u=Depends(get_current_user)):
    crud.update_user_activity(db, u.id, p.activity); return {"status": "ok"}
@app.get("/leaderboard", response_model=List[schemas.LeaderboardItem])
def leaderboard(db: Session=Depends(get_db)):
    return [schemas.LeaderboardItem(id=u.id, full_name=u.full_name or u.email.split("@")[0], avatar_url=u.avatar_url, completed_count=s) for u,s in crud.get_leaderboard(db)]

# Admin
@app.get("/admin/users", response_model=AdminUserListResponse)
def adm_list_users(q: str|None=None, page: int=1, page_size: int=10, sort: str="id:asc", role: str|None=None, active: bool|None=None, grade: str|None=None, db: Session=Depends(get_db), _=Depends(require_admin)):
    i, t = crud.admin_list_users(db, q, page, page_size, sort, role, active, grade)
    return {"items": i, "meta": {"page": page, "page_size": page_size, "total": t}}
@app.get("/admin/users/{uid}", response_model=schemas.UserRead)
def adm_get_user(uid: int, db: Session=Depends(get_db), _=Depends(require_admin)):
    u = db.query(models.User).get(uid); 
    if not u: raise HTTPException(404, "Not found")
    return u
@app.patch("/admin/users/{uid}", response_model=schemas.UserRead)
def adm_update_user(uid: int, p: AdminUserUpdate, db: Session=Depends(get_db), _=Depends(require_admin)):
    u = db.query(models.User).get(uid); 
    if not u: raise HTTPException(404, "Not found")
    return crud.admin_update_user(db, u, p)
@app.post("/admin/users/{uid}/reset-password")
def adm_reset(uid: int, db: Session=Depends(get_db), _=Depends(require_admin)):
    u = db.query(models.User).get(uid); 
    if not u: raise HTTPException(404, "Not found")
    tmp = "Temp"+str(int(time.time()))[-6:]; u.hashed_password=get_password_hash(tmp); db.commit()
    return {"temp_password": tmp}
@app.delete("/admin/users/{uid}", status_code=204)
def adm_del(uid: int, db: Session=Depends(get_db), _=Depends(require_admin)):
    u = db.query(models.User).get(uid); 
    if not u: raise HTTPException(404, "Not found")
    db.delete(u); db.commit()
@app.post("/admin/users", response_model=schemas.UserRead, status_code=201)
def adm_create(p: AdminUserCreate, db: Session=Depends(get_db), _=Depends(require_admin)):
    if crud.get_user_by_email(db, p.email): raise HTTPException(400, "Exists")
    return crud.create_user(db, p.email, get_password_hash(p.password), p.full_name)
@app.get("/admin/metrics")
def adm_metrics(db: Session=Depends(get_db), _=Depends(require_admin)):
    t = db.query(models.User).count(); a = db.query(models.User).filter_by(role="admin").count(); ac = db.query(models.User).filter_by(is_active=True).count(); n = db.query(models.User).filter(models.User.created_at >= datetime.utcnow().date()).count()
    return {"total_users": t, "admins": a, "active_users": ac, "new_users_today": n}
@app.get("/admin/audit", response_model=AuditListResponse)
def adm_audit(action: str|None=None, actor_id: int|None=None, target_id: int|None=None, page: int=1, page_size: int=20, sort: str="created_at:desc", db: Session=Depends(get_db), _=Depends(require_admin)):
    r, t = crud.list_audit(db, action, actor_id, target_id, None, None, page, page_size, sort)
    return {"items": [AuditItem(id=x.id, action=x.action, actor_id=x.actor_id, target_id=x.target_id, data=x.data, created_at=x.created_at, created_at_bkk=_bkk_text(x.created_at), created_at_iso_bkk=_bkk_iso(x.created_at), diff=crud._compute_diff(x.data)) for x in r], "meta": {"page": page, "page_size": page_size, "total": t}}

# Courses
@app.get("/courses", response_model=List[schemas.CourseRead])
def list_c(db: Session=Depends(get_db)): return crud.list_courses(db)
@app.get("/courses/{id}", response_model=schemas.CourseRead)
def get_c(id: int, db: Session=Depends(get_db)): return crud.get_course(db, id)
@app.post("/courses/{id}/enroll")
def enroll(id: int, db: Session=Depends(get_db), u=Depends(get_current_user)):
    crud.create_enrollment(db, u.id, id); return {"status": "ok"}
@app.get("/users/me/courses", response_model=List[schemas.EnrollmentRead])
def my_c(db: Session=Depends(get_db), u=Depends(get_current_user)): return crud.get_my_courses(db, u.id)
@app.post("/admin/courses", response_model=schemas.CourseRead)
def create_c(p: schemas.CourseCreate, db: Session=Depends(get_db), _=Depends(require_admin)): return crud.create_course(db, p)
@app.patch("/admin/courses/{id}", response_model=schemas.CourseRead)
def update_c(id: int, p: schemas.CourseUpdate, db: Session=Depends(get_db), _=Depends(require_admin)): return crud.update_course(db, id, p)
@app.post("/admin/courses/{id}/lessons", response_model=schemas.LessonRead)
def add_l(id: int, p: schemas.LessonCreate, db: Session=Depends(get_db), _=Depends(require_admin)): return crud.create_lesson(db, id, p)
@app.patch("/admin/lessons/{id}", response_model=schemas.LessonRead)
def upd_l(id: int, p: schemas.LessonUpdate, db: Session=Depends(get_db), _=Depends(require_admin)): return crud.update_lesson(db, id, p)
@app.post("/courses/{cid}/lessons/{lid}/toggle-progress")
def tog_prog(cid: int, lid: int, db: Session=Depends(get_db), u=Depends(get_current_user)): return {"completed": crud.toggle_lesson_progress(db, u.id, lid)}
@app.get("/courses/{cid}/my-progress")
def my_prog(cid: int, db: Session=Depends(get_db), u=Depends(get_current_user)):
    r = crud.get_user_progress_in_course(db, u.id, cid)
    return {"completed_ids": [x[0] for x in r]}

# Exams
@app.post("/admin/exams", response_model=schemas.ExamRead)
def cr_exam(p: schemas.ExamCreate, db: Session=Depends(get_db), _=Depends(require_admin)): return crud.create_exam(db, p)
@app.post("/admin/exams/{id}/questions")
def add_q(id: int, p: schemas.QuestionCreate, db: Session=Depends(get_db), _=Depends(require_admin)): return crud.add_question(db, id, p)
@app.get("/exams", response_model=List[schemas.ExamRead])
def l_exam(db: Session=Depends(get_db)): return crud.list_exams(db)
@app.get("/exams/{id}", response_model=schemas.ExamRead)
def g_exam(id: int, db: Session=Depends(get_db)): return crud.get_exam(db, id)
@app.post("/exams/{id}/submit", response_model=schemas.ExamResultRead)
def sub_exam(id: int, p: schemas.ExamSubmit, db: Session=Depends(get_db), u=Depends(get_current_user)): return crud.submit_exam(db, u.id, id, p)
@app.get("/users/me/exam-results", response_model=List[schemas.ExamResultRead])
def my_res(db: Session=Depends(get_db), u=Depends(get_current_user)): return crud.get_my_exam_results(db, u.id)

# Payments
MY_PROMPTPAY_ID = "0630218621"

@app.get("/payments/qr/{id}")
def qr(id: int, db: Session=Depends(get_db)): return StreamingResponse(make_qr_image(MY_PROMPTPAY_ID, crud.get_course(db, id).price), media_type="image/png")
@app.get("/payments/check-status/{id}")
def chk_pay(id: int, db: Session=Depends(get_db), u=Depends(get_current_user)): return {"paid": bool(crud.get_enrollment(db, u.id, id))}
@app.post("/payments/simulate-success")
def sim_pay(course_id: int=Body(..., embed=True), user_id: int=Body(..., embed=True), db: Session=Depends(get_db)):
    db.add(models.Payment(user_id=user_id, course_id=course_id, slip_url="auto", amount=0, status="approved")); crud.create_enrollment(db, user_id, course_id); return {"status": "success"}
@app.get("/users/me/payments", response_model=List[schemas.PaymentRead])
def my_pays(db: Session=Depends(get_db), u=Depends(get_current_user)): return crud.get_my_payments(db, u.id)
@app.get("/admin/payment-stats")
def pay_stats(db: Session=Depends(get_db), _=Depends(require_admin)):
    s = crud.get_payment_stats(db); d = {}
    for i in range(6, -1, -1): d[(datetime.utcnow()-timedelta(days=i)).strftime("%d/%m")] = 0.0
    for p in s["recent_payments"]: d[(p.created_at+timedelta(hours=7)).strftime("%d/%m")] += p.amount
    return {"total_revenue": s["total_revenue"], "pending_count": s["pending_count"], "top_courses": s["top_courses"], "chart_labels": list(d.keys()), "chart_data": list(d.values())}
@app.get("/admin/payments", response_model=List[schemas.PaymentRead])
def l_pays(status: str|None=None, db: Session=Depends(get_db), _=Depends(require_admin)): return crud.get_payments(db, status)
@app.post("/admin/payments/{id}/{act}")
def proc_pay(id: int, act: str, db: Session=Depends(get_db), _=Depends(require_admin)): return {"status": "ok", "new_status": crud.approve_payment(db, id, act).status}
@app.post("/payments/upload", response_model=schemas.PaymentRead)
async def up_slip(course_id: int=Form(...), file: UploadFile=File(...), db: Session=Depends(get_db), u=Depends(get_current_user)):
    c = crud.get_course(db, course_id)
    if crud.get_enrollment(db, u.id, course_id): raise HTTPException(400, "Enrolled")
    fname = f"slip_{u.id}_{int(time.time())}.jpg"; 
    with open(UPLOAD_DIR/fname, "wb") as f: f.write(await file.read())
    return crud.create_payment(db, u.id, course_id, f"/static/uploads/{fname}", c.price)

# --- Settings ---
@app.get("/settings")
def get_set(db: Session=Depends(get_db)): 
    s = crud.get_all_settings(db)
    if "banner_images" in s and s["banner_images"]:
        try: s["banner_images"] = json.loads(s["banner_images"])
        except: s["banner_images"] = []
    else: s["banner_images"] = []
    return s

@app.patch("/admin/settings")
def upd_set(p: SettingsUpdate, db: Session=Depends(get_db), _=Depends(require_admin)): return crud.update_settings(db, p)

@app.post("/admin/settings/banner-image")
async def upload_banner_image(file: UploadFile = File(...), db: Session = Depends(get_db), _=Depends(require_admin)):
    if file.content_type not in ["image/jpeg","image/png","image/webp"]: raise HTTPException(400, "Image only")
    ext = file.filename.split(".")[-1]
    fname = f"banner_{int(time.time())}.{ext}"
    with open(UPLOAD_DIR / fname, "wb") as f: f.write(await file.read())
    url = f"/static/uploads/{fname}"
    curr = crud.get_setting(db, "banner_images")
    imgs = json.loads(curr) if curr else []
    imgs.append(url)
    crud.set_setting(db, "banner_images", json.dumps(imgs))
    return {"url": url, "images": imgs}

@app.delete("/admin/settings/banner-image")
def delete_banner_image(url: str = Body(..., embed=True), db: Session = Depends(get_db), _=Depends(require_admin)):
    curr = crud.get_setting(db, "banner_images")
    if not curr: return {"images": []}
    imgs = json.loads(curr)
    if url in imgs: imgs.remove(url)
    crud.set_setting(db, "banner_images", json.dumps(imgs))
    return {"images": imgs}