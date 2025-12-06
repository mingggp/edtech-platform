from sqlalchemy.orm import Session
from sqlalchemy import or_, asc, desc, func
from typing import Optional, Tuple, List, Dict, Any
from . import models
from .schemas import AdminUserUpdate, CourseUpdate, LessonUpdate, LessonCreate, CourseCreate, QuestionCreate, ExamCreate, ExamSubmit, SettingsUpdate
import json
from datetime import datetime, timedelta

def get_user_by_email(db: Session, email: str) -> Optional[models.User]: return db.query(models.User).filter(models.User.email == email).first()
def create_user(db: Session, email: str, hashed_password: str, full_name: str | None): user = models.User(email=email, hashed_password=hashed_password, full_name=full_name); db.add(user); db.commit(); db.refresh(user); return user
def admin_list_users(db: Session, q: Optional[str], page: int, page_size: int, sort: str, role: Optional[str] = None, active: Optional[bool] = None, grade: Optional[str] = None) -> Tuple[List[models.User], int]:
    qs = db.query(models.User)
    if q: qs = qs.filter(or_(models.User.email.ilike(f"%{q}%"), models.User.full_name.ilike(f"%{q}%")))
    if role in {"admin", "student"}: qs = qs.filter(models.User.role == role)
    if active is True: qs = qs.filter(models.User.is_active == True)
    elif active is False: qs = qs.filter(models.User.is_active == False)
    if grade: qs = qs.filter(models.User.grade_level == grade)
    if ":" in sort: f, d = sort.split(":", 1)
    else: f, d = sort, "asc"
    fm = {"id": models.User.id, "email": models.User.email, "full_name": models.User.full_name, "role": models.User.role, "created_at": models.User.created_at, "last_login": models.User.last_login, "grade_level": models.User.grade_level}
    col = fm.get(f, models.User.id)
    qs = qs.order_by(desc(col) if d.lower() == "desc" else asc(col))
    total = qs.count(); items = qs.offset((page - 1) * page_size).limit(page_size).all()
    return items, total
def admin_update_user(db: Session, user: models.User, payload: AdminUserUpdate) -> models.User:
    if payload.full_name is not None: user.full_name = (payload.full_name or "").strip() or None
    if payload.role is not None: user.role = payload.role
    if payload.is_active is not None: user.is_active = payload.is_active
    if payload.bio is not None: user.bio = (payload.bio or "").strip() or None
    if payload.grade_level is not None:
        gl = payload.grade_level.upper().replace(" ", "")
        if gl not in {"M1","M2","M3","M4","M5","M6"}: raise ValueError("Invalid Grade")
        user.grade_level = gl; user.dek_code = {"M6":69,"M5":70,"M4":71,"M3":72,"M2":73,"M1":74}.get(gl)
    db.commit(); db.refresh(user); return user

def add_audit(db: Session, action: str, actor_id: int | None, target_id: int | None, data: Dict[str, Any] | None = None): log = models.AuditLog(action=action, actor_id=actor_id, target_id=target_id, data=json.dumps(data, ensure_ascii=False) if data else None, created_at=datetime.utcnow()); db.add(log); db.commit(); db.refresh(log); return log
def list_audit(db: Session, action: Optional[str], actor_id: Optional[int], target_id: Optional[int], date_from: Optional[str], date_to: Optional[str], page: int, page_size: int, sort: str):
    qs = db.query(models.AuditLog)
    if action: qs = qs.filter(models.AuditLog.action.ilike(f"%{action}%"))
    if actor_id: qs = qs.filter(models.AuditLog.actor_id == actor_id)
    if target_id: qs = qs.filter(models.AuditLog.target_id == target_id)
    if ":" in sort: f, d = sort.split(":", 1)
    else: f, d = sort, "desc"
    from sqlalchemy import desc as sdesc, asc as sasc
    col = models.AuditLog.id if f == 'id' else models.AuditLog.created_at
    qs = qs.order_by(sdesc(col) if d.lower() == "desc" else sasc(col))
    total = qs.count(); items = qs.offset((page - 1) * page_size).limit(page_size).all(); return items, total

def create_course(db: Session, payload: CourseCreate): c = models.Course(title=payload.title, description=payload.description, thumbnail=payload.thumbnail, price=payload.price); db.add(c); db.commit(); db.refresh(c); return c
def list_courses(db: Session, skip: int = 0, limit: int = 100): return db.query(models.Course).order_by(models.Course.id.desc()).offset(skip).limit(limit).all()
def get_course(db: Session, course_id: int): return db.query(models.Course).filter(models.Course.id == course_id).first()
def update_course(db: Session, course_id: int, payload: CourseUpdate):
    c = get_course(db, course_id)
    if not c: return None
    if payload.title is not None: c.title = payload.title
    if payload.description is not None: c.description = payload.description
    if payload.thumbnail is not None: c.thumbnail = payload.thumbnail
    if payload.price is not None: c.price = payload.price
    db.commit(); db.refresh(c); return c
def create_lesson(db: Session, course_id: int, payload: LessonCreate): l = models.Lesson(course_id=course_id, title=payload.title, youtube_id=payload.youtube_id, doc_url=payload.doc_url, order=payload.order); db.add(l); db.commit(); db.refresh(l); return l
def get_lesson(db: Session, lesson_id: int): return db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
def update_lesson(db: Session, lesson_id: int, payload: LessonUpdate):
    l = get_lesson(db, lesson_id)
    if not l: return None
    if payload.title: l.title = payload.title
    if payload.youtube_id: l.youtube_id = payload.youtube_id
    if payload.doc_url is not None: l.doc_url = payload.doc_url
    if payload.order is not None: l.order = payload.order
    db.commit(); db.refresh(l); return l
def get_enrollment(db: Session, user_id: int, course_id: int): return db.query(models.Enrollment).filter_by(user_id=user_id, course_id=course_id).first()
def create_enrollment(db: Session, user_id: int, course_id: int):
    if get_enrollment(db, user_id, course_id): return
    e = models.Enrollment(user_id=user_id, course_id=course_id); db.add(e); db.commit(); return e
def get_my_courses(db: Session, user_id: int): return db.query(models.Enrollment).filter(models.Enrollment.user_id == user_id).all()
def toggle_lesson_progress(db: Session, user_id: int, lesson_id: int):
    p = db.query(models.LessonProgress).filter_by(user_id=user_id, lesson_id=lesson_id).first()
    if p: db.delete(p); db.commit(); return False
    else: db.add(models.LessonProgress(user_id=user_id, lesson_id=lesson_id)); db.commit(); return True
def get_user_progress_in_course(db: Session, user_id: int, course_id: int): return db.query(models.LessonProgress.lesson_id).join(models.Lesson).filter(models.LessonProgress.user_id == user_id, models.Lesson.course_id == course_id).all()

def create_exam(db: Session, payload: ExamCreate): e = models.Exam(title=payload.title, description=payload.description, time_limit=payload.time_limit); db.add(e); db.commit(); db.refresh(e); return e
def list_exams(db: Session): return db.query(models.Exam).order_by(models.Exam.id.desc()).all()
def get_exam(db: Session, exam_id: int): return db.query(models.Exam).filter(models.Exam.id == exam_id).first()
def add_question(db: Session, exam_id: int, payload: QuestionCreate):
    q = models.Question(exam_id=exam_id, text=payload.text, order=payload.order); db.add(q); db.commit(); db.refresh(q)
    for c in payload.choices: db.add(models.Choice(question_id=q.id, text=c.text, is_correct=c.is_correct))
    db.commit(); return q
def submit_exam(db: Session, user_id: int, exam_id: int, payload: ExamSubmit):
    exam = get_exam(db, exam_id)
    if not exam: return None
    score = 0; q_dict = {q.id: q for q in exam.questions}; total = len(q_dict)
    for ans in payload.answers:
        q = q_dict.get(ans.question_id)
        if q:
            sel = next((c for c in q.choices if c.id == ans.choice_id), None)
            if sel and sel.is_correct: score += 1
    r = models.ExamResult(user_id=user_id, exam_id=exam_id, score=score, total_score=total); db.add(r); db.commit(); db.refresh(r); return r
def get_my_exam_results(db: Session, user_id: int): return db.query(models.ExamResult).filter(models.ExamResult.user_id == user_id).order_by(models.ExamResult.submitted_at.desc()).all()

def add_friend(db: Session, user_id: int, friend_email: str):
    friend = get_user_by_email(db, friend_email)
    if not friend or friend.id == user_id: return None
    user = db.query(models.User).get(user_id)
    if friend not in user.friends: user.friends.append(friend); friend.friends.append(user); db.commit()
    return user
def get_friends(db: Session, user_id: int): return db.query(models.User).get(user_id).friends
def get_leaderboard(db: Session, limit: int = 10): return db.query(models.User, func.count(models.LessonProgress.lesson_id).label('score')).outerjoin(models.LessonProgress).group_by(models.User.id).order_by(desc('score')).limit(limit).all()
def update_user_activity(db: Session, user_id: int, activity: str):
    u = db.query(models.User).get(user_id)
    if u: u.current_activity = activity; u.last_login = datetime.utcnow(); db.commit()

def create_payment(db: Session, user_id: int, course_id: int, slip_url: str, amount: float, status: str = "pending"): p = models.Payment(user_id=user_id, course_id=course_id, slip_url=slip_url, amount=amount, status=status); db.add(p); db.commit(); db.refresh(p); return p
def get_payments(db: Session, status: str = None):
    q = db.query(models.Payment).order_by(models.Payment.created_at.desc())
    if status: q = q.filter(models.Payment.status == status)
    return q.all()
def get_my_payments(db: Session, user_id: int): return db.query(models.Payment).filter(models.Payment.user_id == user_id).order_by(models.Payment.created_at.desc()).all()
def approve_payment(db: Session, payment_id: int, action: str):
    p = db.query(models.Payment).get(payment_id)
    if not p: return None
    if action == "approve": p.status = "approved"; create_enrollment(db, p.user_id, p.course_id)
    elif action == "reject": p.status = "rejected"
    db.commit(); db.refresh(p); return p
def get_payment_stats(db: Session):
    total_rev = db.query(func.sum(models.Payment.amount)).filter(models.Payment.status == "approved").scalar() or 0.0
    pending = db.query(models.Payment).filter(models.Payment.status == "pending").count()
    top = db.query(models.Course.title, func.sum(models.Payment.amount).label("total")).join(models.Payment).filter(models.Payment.status == "approved").group_by(models.Course.id).order_by(desc("total")).limit(5).all()
    recent = db.query(models.Payment).filter(models.Payment.status == "approved", models.Payment.created_at >= datetime.utcnow() - timedelta(days=7)).all()
    return {"total_revenue": total_rev, "pending_count": pending, "top_courses": [{"title": t, "amount": a} for t, a in top], "recent_payments": recent}

def get_setting(db: Session, key: str):
    s = db.query(models.SystemSetting).filter_by(key=key).first()
    return s.value if s else None
def set_setting(db: Session, key: str, value: str):
    s = db.query(models.SystemSetting).filter_by(key=key).first()
    if not s: s = models.SystemSetting(key=key, value=value); db.add(s)
    else: s.value = value
    db.commit(); return s
def get_all_settings(db: Session): return {s.key: s.value for s in db.query(models.SystemSetting).all()}
def update_settings(db: Session, payload: SettingsUpdate):
    if payload.countdown_title is not None: set_setting(db, "countdown_title", payload.countdown_title)
    if payload.countdown_date is not None: set_setting(db, "countdown_date", payload.countdown_date)
    if payload.countdown_active is not None: set_setting(db, "countdown_active", "true" if payload.countdown_active else "false")
    if payload.banner_text is not None: set_setting(db, "banner_text", payload.banner_text)
    if payload.banner_active is not None: set_setting(db, "banner_active", "true" if payload.banner_active else "false")
    if payload.image_banner_active is not None: set_setting(db, "image_banner_active", "true" if payload.image_banner_active else "false")
    if payload.banner_interval is not None: set_setting(db, "banner_interval", str(payload.banner_interval)) # <--- เพิ่มบรรทัดนี้
    return get_all_settings(db)