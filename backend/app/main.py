import os, time, json
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, status, Form, File, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import Response
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from .database import Base, engine, get_db
from . import models, schemas, crud
from .auth import get_password_hash, verify_password, create_access_token, get_current_user, require_admin
from .schemas import PasswordChange, AdminUserUpdate, AdminUserListResponse, AdminUserCreate, AuditListResponse, AuditItem, DiffItem

from typing import List, Optional
from sqlalchemy import text as sql_text
from datetime import datetime, timedelta, timezone

load_dotenv()

# ---------- Time helpers (ไม่พึ่ง zoneinfo) ----------
BKK_TZ = timezone(timedelta(hours=7))  # UTC+7

def _as_aware_utc(dt: datetime) -> datetime:
    if dt is None:
        return None
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)

def _bkk_text(dt: datetime) -> str:
    if not dt:
        return ""
    return _as_aware_utc(dt).astimezone(BKK_TZ).strftime("%Y-%m-%d %H:%M:%S")

def _bkk_iso(dt: datetime) -> str:
    if not dt:
        return ""
    return _as_aware_utc(dt).astimezone(BKK_TZ).isoformat()

def _parse_bkk_date(date_str: str, end_of_day=False) -> datetime:
    y, m, d = map(int, date_str.split("-"))
    if end_of_day:
        bkk = datetime(y, m, d, 23, 59, 59, 999999, tzinfo=BKK_TZ)
    else:
        bkk = datetime(y, m, d, 0, 0, 0, 0, tzinfo=BKK_TZ)
    return bkk.astimezone(timezone.utc)

# ---------- App ----------
app = FastAPI(title="EdTech Login Starter", version="0.3.3")

STATIC_DIR = Path("static")
UPLOAD_DIR = STATIC_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# ----- CORS (รองรับ file:// โดยอนุญาต Origin:null) -----
cors_origins_raw = os.getenv("CORS_ALLOW_ORIGINS", "*").strip()
if cors_origins_raw == "*":
    allow_origins = ["*", "null"]
else:
    allow_origins = [o.strip() for o in cors_origins_raw.split(",") if o.strip()]
    if "null" not in allow_origins:
        allow_origins.append("null")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=r".*",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.options("/{rest_of_path:path}")
def preflight_ok(rest_of_path: str):
    return Response(status_code=200)

Base.metadata.create_all(bind=engine)

@app.get("/ping")
def ping():
    return {"ok": True, "msg": "pong"}

# ---------- helpers ----------
def _count_admins(db):
    return db.query(models.User).filter(models.User.role == "admin", models.User.is_active == True).count()

# ---------- Auth ----------
@app.post("/auth/signup", response_model=schemas.UserRead, status_code=201)
def signup(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = crud.get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = get_password_hash(payload.password)
    user = crud.create_user(db, email=payload.email, hashed_password=hashed, full_name=payload.full_name)
    crud.add_audit(db, "USER_SIGNUP", actor_id=user.id, target_id=user.id, data={"email": user.email})
    return user

@app.post("/auth/login", response_model=schemas.Token)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.hashed_password):
        crud.add_audit(db, "LOGIN_FAIL", actor_id=None, target_id=None, data={"email": payload.email})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    user.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token(subject=user.email)
    crud.add_audit(db, "LOGIN_SUCCESS", actor_id=user.id, target_id=user.id, data={"email": user.email})
    return {"access_token": token, "token_type": "bearer"}

@app.post("/auth/token", response_model=schemas.Token)
def login_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email = form_data.username
    password = form_data.password
    user = crud.get_user_by_email(db, email=email)
    if not user or not verify_password(password, user.hashed_password):
        crud.add_audit(db, "LOGIN_FAIL", actor_id=None, target_id=None, data={"email": email})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    user.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token(subject=user.email)
    crud.add_audit(db, "LOGIN_SUCCESS", actor_id=user.id, target_id=user.id, data={"email": user.email})
    return {"access_token": token, "token_type": "bearer"}

@app.post("/auth/change-password")
def change_password(payload: schemas.PasswordChange, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if not verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="รหัสผ่านเดิมไม่ถูกต้อง")
    current_user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    crud.add_audit(db, "CHANGE_PASSWORD", actor_id=current_user.id, target_id=current_user.id, data={"email": current_user.email})
    return {"message": "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว!"}

# ---------- User profile ----------
@app.get("/users/me", response_model=schemas.UserRead)
def read_me(current_user = Depends(get_current_user)):
    return current_user

@app.patch("/users/me", response_model=schemas.UserRead)
def update_me(payload: schemas.UserUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    before = {
        "full_name": current_user.full_name,
        "avatar_url": current_user.avatar_url,
        "bio": current_user.bio,
        "grade_level": current_user.grade_level,
        "dek_code": current_user.dek_code,
    }
    if payload.full_name is not None:
        current_user.full_name = payload.full_name.strip() or None
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url.strip() or None
    if payload.bio is not None:
        current_user.bio = payload.bio.strip() or None
    if payload.grade_level is not None:
        gl = payload.grade_level.upper().replace(" ", "")
        valid = {"M1","M2","M3","M4","M5","M6"}
        if gl not in valid:
            raise HTTPException(status_code=400, detail="grade_level must be one of: M1,M2,M3,M4,M5,M6")
        current_user.grade_level = gl
        mapping = {"M6":69,"M5":70,"M4":71,"M3":72,"M2":73,"M1":74}
        current_user.dek_code = mapping.get(gl)
    db.commit()
    db.refresh(current_user)
    after = {
        "full_name": current_user.full_name,
        "avatar_url": current_user.avatar_url,
        "bio": current_user.bio,
        "grade_level": current_user.grade_level,
        "dek_code": current_user.dek_code,
    }
    crud.add_audit(db, "PROFILE_UPDATE", actor_id=current_user.id, target_id=current_user.id, data={"before": before, "after": after})
    return current_user

@app.post("/users/me", response_model=schemas.UserRead)
async def update_me_combined(
    full_name: str = Form(None),
    bio: str = Form(None),
    grade_level: str = Form(None),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    before = {
        "full_name": current_user.full_name,
        "bio": current_user.bio,
        "grade_level": current_user.grade_level,
        "avatar_url": current_user.avatar_url,
    }
    if full_name is not None:
        current_user.full_name = full_name.strip() or None
    if bio is not None:
        current_user.bio = bio.strip() or None
    if grade_level:
        gl = grade_level.upper().replace(" ", "")
        valid = {"M1","M2","M3","M4","M5","M6"}
        if gl not in valid:
            raise HTTPException(status_code=400, detail="grade_level ไม่ถูกต้อง")
        current_user.grade_level = gl
        mapping = {"M6":69,"M5":70,"M4":71,"M3":72,"M2":73,"M1":74}
        current_user.dek_code = mapping[gl]

    if file:
        ALLOWED = {"image/jpeg":".jpg","image/png":".png","image/webp":".webp"}
        if file.content_type not in ALLOWED:
            raise HTTPException(status_code=400, detail="รองรับเฉพาะ JPG, PNG, WEBP")
        data = await file.read()
        if len(data) > 2 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="ไฟล์ใหญ่เกิน 2MB")
        ext = ALLOWED[file.content_type]
        filename = f"{current_user.id}_{int(time.time())}{ext}"
        dest = UPLOAD_DIR / filename
        with open(dest, "wb") as f:
            f.write(data)
        current_user.avatar_url = f"/static/uploads/{filename}"
    db.commit()
    db.refresh(current_user)
    after = {
        "full_name": current_user.full_name,
        "bio": current_user.bio,
        "grade_level": current_user.grade_level,
        "avatar_url": current_user.avatar_url,
    }
    crud.add_audit(db, "AVATAR_UPLOAD" if file else "PROFILE_UPDATE", actor_id=current_user.id, target_id=current_user.id, data={"before": before, "after": after})
    return current_user

@app.get("/protected/hello")
def protected_hello(current_user = Depends(get_current_user)):
    return {"message": f"Hello, {current_user.email}!"}

Base.metadata.create_all(bind=engine)

# ---------- Admin: Users ----------
@app.get("/admin/users", response_model=AdminUserListResponse)
def admin_list_users(
    q: str | None = Query(None, description="search by email/full_name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort: str = Query("id:asc"),
    role: str | None = Query(None, pattern="^(admin|student)$"),
    active: bool | None = Query(None),
    db: Session = Depends(get_db),
    _adm = Depends(require_admin),
):
    items, total = crud.admin_list_users(db, q=q, page=page, page_size=page_size, sort=sort, role=role, active=active)
    return {"items": items, "meta": {"page": page, "page_size": page_size, "total": total}}

@app.get("/admin/users/{user_id}", response_model=schemas.UserRead)
def admin_get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _adm = Depends(require_admin),
):
    u = db.query(models.User).get(user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return u

@app.patch("/admin/users/{user_id}", response_model=schemas.UserRead)
def admin_update_user(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_admin = Depends(require_admin),
):
    u = db.query(models.User).get(user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    if u.id == current_admin.id and payload.is_active is False:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")

    if u.role == "admin":
        admins = _count_admins(db)
        if admins == 1:
            if payload.role == "student" or payload.is_active is False:
                raise HTTPException(status_code=400, detail="Cannot remove the last active admin")

    before = {
        "full_name": u.full_name, "role": u.role, "is_active": u.is_active,
        "bio": u.bio, "grade_level": u.grade_level, "dek_code": u.dek_code
    }
    try:
        u = crud.admin_update_user(db, u, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    after = {
        "full_name": u.full_name, "role": u.role, "is_active": u.is_active,
        "bio": u.bio, "grade_level": u.grade_level, "dek_code": u.dek_code
    }
    crud.add_audit(db, "USER_UPDATE", actor_id=current_admin.id, target_id=u.id, data={"before": before, "after": after})
    return u

@app.post("/admin/users/{user_id}/reset-password")
def admin_reset_password(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin = Depends(require_admin),
):
    u = db.query(models.User).get(user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    temp_password = "Temp" + str(int(time.time()))[-6:]
    u.hashed_password = get_password_hash(temp_password)
    db.commit()
    crud.add_audit(db, "RESET_PASSWORD", actor_id=current_admin.id, target_id=u.id, data={"email": u.email})
    return {"message": "Temporary password set", "temp_password": temp_password}

@app.delete("/admin/users/{user_id}", status_code=204)
def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin = Depends(require_admin),
):
    u = db.query(models.User).get(user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    if u.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    if u.role == "admin" and _count_admins(db) == 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last active admin")

    db.delete(u)
    db.commit()
    crud.add_audit(db, "USER_DELETE", actor_id=current_admin.id, target_id=u.id, data={"email": u.email})

@app.post("/admin/users", response_model=schemas.UserRead, status_code=201)
def admin_create_user(
    payload: AdminUserCreate,
    db: Session = Depends(get_db),
    current_admin = Depends(require_admin),
):
    if crud.get_user_by_email(db, payload.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if payload.role and payload.role not in {"student", "admin"}:
        raise HTTPException(status_code=400, detail="role must be 'student' or 'admin'")
    hashed = get_password_hash(payload.password)
    user = models.User(
        email=payload.email,
        hashed_password=hashed,
        full_name=(payload.full_name or "").strip() or None,
        role=payload.role or "student",
        is_active=True if payload.is_active is None else payload.is_active,
        grade_level=payload.grade_level
    )
    if user.grade_level:
        gl = user.grade_level.upper().replace(" ", "")
        if gl not in {"M1","M2","M3","M4","M5","M6"}:
            raise HTTPException(status_code=400, detail="grade_level must be M1..M6")
        mapping = {"M6":69,"M5":70,"M4":71,"M3":72,"M2":73,"M1":74}
        user.grade_level = gl
        user.dek_code = mapping.get(gl)

    db.add(user)
    db.commit()
    db.refresh(user)
    crud.add_audit(db, "USER_CREATE", actor_id=current_admin.id, target_id=user.id, data={"email": user.email, "role": user.role})
    return user

@app.get("/admin/metrics")
def admin_metrics(db: Session = Depends(get_db), _adm = Depends(require_admin)):
    total = db.query(models.User).count()
    admins = db.query(models.User).filter(models.User.role == "admin").count()
    active = db.query(models.User).filter(models.User.is_active == True).count()
    today = datetime.utcnow().date()
    new_today = db.query(models.User).filter(models.User.created_at >= today).count()
    return {
        "total_users": total,
        "admins": admins,
        "active_users": active,
        "new_users_today": new_today,
    }

# ---------- Admin: Audit (เพิ่ม diff) ----------
def _compute_diff(data_str: Optional[str]) -> Optional[List[DiffItem]]:
    if not data_str:
        return None
    try:
        data = json.loads(data_str)
    except Exception:
        return None
    before = data.get("before")
    after = data.get("after")
    if not isinstance(before, dict) or not isinstance(after, dict):
        return None

    keys = set(before.keys()) | set(after.keys())
    diffs: List[DiffItem] = []
    for k in sorted(keys):
        b = before.get(k)
        a = after.get(k)
        if b == a:
            # ข้าม "same" เพื่อให้โชว์เฉพาะที่เปลี่ยน (กระชับ)
            continue
        status = "changed"
        if k not in before:
            status = "added"
        elif k not in after:
            status = "removed"
        diffs.append(DiffItem(field=k, before=None if b is None else str(b), after=None if a is None else str(a), status=status))
    return diffs or []

@app.get("/admin/audit", response_model=AuditListResponse)
def admin_audit_list(
    action: Optional[str] = Query(None, description="contains action"),
    actor_id: Optional[int] = Query(None),
    target_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None, description="YYYY-MM-DD (BKK)"),
    date_to: Optional[str] = Query(None, description="YYYY-MM-DD (BKK)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    sort: str = Query("created_at:desc"),
    db: Session = Depends(get_db),
    _adm = Depends(require_admin),
):
    rows, total = crud.list_audit(db, action, actor_id, target_id, None, None, page, page_size, sort)

    # filter ช่วงวันที่แบบไทย → UTC
    if date_from or date_to:
        def in_range(rdt: datetime) -> bool:
            if not rdt: return False
            utc = _as_aware_utc(rdt)
            if date_from and utc < _parse_bkk_date(date_from, False): return False
            if date_to and utc > _parse_bkk_date(date_to, True): return False
            return True
        rows = [r for r in rows if in_range(r.created_at)]

    items: List[AuditItem] = []
    for r in rows:
        items.append(AuditItem(
            id=r.id,
            action=r.action,
            actor_id=r.actor_id,
            target_id=r.target_id,
            data=r.data,
            created_at=r.created_at,
            created_at_bkk=_bkk_text(r.created_at),
            created_at_iso_bkk=_bkk_iso(r.created_at),
            diff=_compute_diff(r.data)
        ))
    return {"items": items, "meta": {"page": page, "page_size": page_size, "total": total}}


# --- ส่วนที่เพิ่มต่อท้ายไฟล์ backend/app/main.py ---

# ---------- Courses (Public / Student) ----------
@app.get("/courses", response_model=List[schemas.CourseRead])
def list_courses(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    # ใครๆ ก็ดูรายชื่อคอร์สได้
    return crud.list_courses(db, skip=skip, limit=limit)

@app.get("/courses/{course_id}", response_model=schemas.CourseRead)
def get_course_detail(
    course_id: int,
    db: Session = Depends(get_db)
):
    course = crud.get_course(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@app.post("/courses/{course_id}/enroll")
def enroll_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # ต้องล็อกอินถึงจะลงทะเบียนได้
    course = crud.get_course(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    crud.create_enrollment(db, user_id=current_user.id, course_id=course_id)
    return {"message": "Enrollment successful", "course_id": course_id}

@app.get("/users/me/courses", response_model=List[schemas.EnrollmentRead])
def get_my_courses(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return crud.get_my_courses(db, user_id=current_user.id)


# ---------- Admin: Manage Courses ----------
@app.post("/admin/courses", response_model=schemas.CourseRead)
def create_course(
    payload: schemas.CourseCreate,
    db: Session = Depends(get_db),
    _adm = Depends(require_admin) # บังคับ Admin เท่านั้น
):
    return crud.create_course(db, payload)

@app.post("/admin/courses/{course_id}/lessons", response_model=schemas.LessonRead)
def add_lesson(
    course_id: int,
    payload: schemas.LessonCreate,
    db: Session = Depends(get_db),
    _adm = Depends(require_admin)
):
    course = crud.get_course(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return crud.create_lesson(db, course_id, payload)

# --- ส่วนที่เพิ่มต่อท้ายไฟล์ backend/app/main.py ---

@app.patch("/admin/courses/{course_id}", response_model=schemas.CourseRead)
def update_course_endpoint(
    course_id: int,
    payload: schemas.CourseUpdate,
    db: Session = Depends(get_db),
    _adm = Depends(require_admin)
):
    course = crud.update_course(db, course_id, payload)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

# backend/app/main.py (ต่อท้ายไฟล์)

@app.patch("/admin/lessons/{lesson_id}", response_model=schemas.LessonRead)
def update_lesson(
    lesson_id: int,
    payload: schemas.LessonUpdate,
    db: Session = Depends(get_db),
    _adm = Depends(require_admin)
):
    lesson = crud.update_lesson(db, lesson_id, payload)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


# backend/app/main.py (ต่อท้ายไฟล์)

@app.post("/courses/{course_id}/lessons/{lesson_id}/toggle-progress")
def toggle_progress(
    course_id: int,
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # ตรวจสอบว่า lesson นี้อยู่ใน course นี้จริงไหม (กันมั่ว)
    lesson = crud.get_lesson(db, lesson_id)
    if not lesson or lesson.course_id != course_id:
        raise HTTPException(status_code=404, detail="Lesson not found in this course")
        
    is_completed = crud.toggle_lesson_progress(db, current_user.id, lesson_id)
    return {"completed": is_completed, "lesson_id": lesson_id}

@app.get("/courses/{course_id}/my-progress")
def get_my_course_progress(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # คืนค่าเป็น List ของ lesson_id ที่เรียนจบแล้ว เช่น [1, 3, 5]
    result = crud.get_user_progress_in_course(db, current_user.id, course_id)
    # แปลงจาก list of tuples เป็น list of int ธรรมดา
    completed_ids = [row[0] for row in result]
    return {"completed_ids": completed_ids}

# backend/app/main.py (ต่อท้ายไฟล์)

# ---------- Exams (Admin) ----------
@app.post("/admin/exams", response_model=schemas.ExamRead)
def create_exam(
    payload: schemas.ExamCreate,
    db: Session = Depends(get_db),
    _adm = Depends(require_admin)
):
    return crud.create_exam(db, payload)

@app.post("/admin/exams/{exam_id}/questions")
def add_question(
    exam_id: int,
    payload: schemas.QuestionCreate,
    db: Session = Depends(get_db),
    _adm = Depends(require_admin)
):
    return crud.add_question(db, exam_id, payload)

# ---------- Exams (Student) ----------
@app.get("/exams", response_model=List[schemas.ExamRead])
def list_exams(db: Session = Depends(get_db)):
    return crud.list_exams(db)

@app.get("/exams/{exam_id}", response_model=schemas.ExamRead)
def get_exam_detail(exam_id: int, db: Session = Depends(get_db)):
    ex = crud.get_exam(db, exam_id)
    if not ex:
        raise HTTPException(status_code=404, detail="Exam not found")
    return ex

@app.post("/exams/{exam_id}/submit", response_model=schemas.ExamResultRead)
def submit_exam(
    exam_id: int, 
    payload: schemas.ExamSubmit,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = crud.submit_exam(db, current_user.id, exam_id, payload)
    if not result:
        raise HTTPException(status_code=404, detail="Exam error")
    return result

@app.get("/users/me/exam-results", response_model=List[schemas.ExamResultRead])
def get_my_exam_results(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return crud.get_my_exam_results(db, current_user.id)


# backend/app/main.py (ต่อท้ายไฟล์)

# ---------- Social APIs ----------

@app.post("/users/me/friends")
def add_friend(
    email: str = Form(...), # รับ email เพื่อนที่จะแอด
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    res = crud.add_friend(db, current_user.id, email)
    if not res:
        raise HTTPException(status_code=404, detail="User not found or cannot add self")
    return {"message": "Friend added"}

@app.get("/users/me/friends", response_model=List[schemas.FriendRead])
def my_friends(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    friends = crud.get_friends(db, current_user.id)
    
    # คำนวณ Online Status (ใคร Login ภายใน 10 นาทีถือว่า Online)
    now = datetime.utcnow()
    output = []
    for f in friends:
        is_online = False
        if f.last_login:
            # last_login ใน db เป็น naive utc
            diff = now - f.last_login
            if diff.total_seconds() < 600: # 10 นาที
                is_online = True
        
        # แปลงเป็น Schema
        item = schemas.FriendRead.model_validate(f)
        item.is_online = is_online
        output.append(item)
        
    return output

@app.get("/leaderboard", response_model=List[schemas.LeaderboardItem])
def get_leaderboard(db: Session = Depends(get_db)):
    results = crud.get_leaderboard(db)
    # แปลงผลลัพธ์เป็น Schema
    output = []
    for user, score in results:
        output.append(schemas.LeaderboardItem(
            id=user.id,
            full_name=user.full_name or user.email.split("@")[0],
            avatar_url=user.avatar_url,
            completed_count=score
        ))
    return output

# backend/app/main.py (ต่อท้ายไฟล์)

# ---------- Social APIs ----------

@app.post("/users/me/friends")
def add_friend_api(
    email: str = Form(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    res = crud.add_friend(db, current_user.id, email)
    if not res:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Friend added"}

@app.get("/users/me/friends", response_model=List[schemas.FriendRead])
def my_friends(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    friends = crud.get_friends(db, current_user.id)
    now = datetime.utcnow()
    output = []
    
    for f in friends:
        # เช็คว่า Online หรือไม่ (Login ภายใน 5 นาที)
        is_active_recently = False
        if f.last_login:
            diff = (now - f.last_login).total_seconds()
            is_active_recently = diff < 300 # 5 นาที
            
        item = schemas.FriendRead.model_validate(f)
        item.is_online = is_active_recently
        
        # ถ้าไม่ออนไลน์ ให้เคลียร์ activity เป็น None
        if not is_active_recently:
            item.current_activity = None
            
        output.append(item)
    return output

@app.post("/users/me/activity")
def set_activity(
    payload: schemas.ActivityUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    crud.update_user_activity(db, current_user.id, payload.activity)
    return {"status": "ok"}

@app.get("/leaderboard", response_model=List[schemas.LeaderboardItem])
def get_leaderboard_api(db: Session = Depends(get_db)):
    results = crud.get_leaderboard(db)
    output = []
    for user, score in results:
        output.append(schemas.LeaderboardItem(
            id=user.id,
            full_name=user.full_name or user.email.split("@")[0],
            avatar_url=user.avatar_url,
            completed_count=score
        ))
    return output