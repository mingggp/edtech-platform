from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, asc, desc, func
from typing import Optional, Tuple, List, Dict, Any
from . import models, schemas 
import json
from datetime import datetime, timedelta, date

# ==========================================
#  HELPER FUNCTIONS (Audit & Utils)
# ==========================================

def _serialize(obj):
    """Helper to serialize SQLAlchemy model to dict for Audit Log"""
    if not obj: return {}
    d = {}
    for c in obj.__table__.columns:
        val = getattr(obj, c.name)
        if isinstance(val, (datetime, date)):
            val = val.isoformat()
        d[c.name] = val
    return d

def add_audit(db: Session, action: str, actor_id: int | None, target_id: int | None, old_data: Any = None, new_data: Any = None):
    """Create Audit Log with Before/After snapshot"""
    before = _serialize(old_data) if hasattr(old_data, '__table__') else old_data
    after = _serialize(new_data) if hasattr(new_data, '__table__') else new_data
    
    data_payload = {}
    if before: data_payload["before"] = before
    if after: data_payload["after"] = after
    
    log = models.AuditLog(
        action=action, 
        actor_id=actor_id, 
        target_id=target_id, 
        data=json.dumps(data_payload, ensure_ascii=False) if data_payload else None, 
        created_at=datetime.utcnow()
    )
    db.add(log)
    db.commit()
    return log

def _compute_diff(data_str: Optional[str]):
    """Helper to compute difference for frontend display"""
    if not data_str: return []
    try:
        d = json.loads(data_str)
        before = d.get("before") or {}
        after = d.get("after") or {}
        diffs = []
        all_keys = set(before.keys()) | set(after.keys())
        
        # Fields to ignore in diff
        ignore_fields = ['updated_at', 'last_login', 'created_at', 'password', 'hashed_password']
        
        for k in all_keys:
            if k in ignore_fields: continue
            v1 = before.get(k)
            v2 = after.get(k)
            if str(v1) != str(v2):
                status = "modified"
                if k not in before: status = "added"
                if k not in after: status = "removed"
                diffs.append({"field": k, "before": str(v1), "after": str(v2), "status": status})
        return diffs
    except: return []

# ==========================================
#  USER MANAGEMENT
# ==========================================

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, email: str, hashed_password: str, full_name: str | None, nickname: str | None = None, grade_level: str | None = None):
    dek_code = None
    if grade_level:
        gl = grade_level.upper().replace(" ", "")
        dek_code = {"M6":69,"M5":70,"M4":71,"M3":72,"M2":73,"M1":74}.get(gl)
    
    user = models.User(
        email=email, 
        hashed_password=hashed_password, 
        full_name=full_name, 
        nickname=nickname, 
        grade_level=grade_level, 
        dek_code=dek_code
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    add_audit(db, "create_user", None, user.id, None, user)
    return user

def admin_list_users(db: Session, q: Optional[str], page: int, page_size: int, sort: str, role: Optional[str], active: Optional[bool], grade: Optional[str], online_status: Optional[str]):
    qs = db.query(models.User)
    
    if q:
        search = f"%{q}%"
        qs = qs.filter(or_(models.User.email.ilike(search), models.User.full_name.ilike(search)))
    
    if role and role != "all":
        qs = qs.filter(models.User.role == role)
        
    if grade and grade != "all":
        qs = qs.filter(models.User.grade_level == grade)

    if online_status and online_status != "all":
        limit_time = datetime.utcnow() - timedelta(minutes=5)
        if online_status == "online":
            qs = qs.filter(models.User.last_login >= limit_time)
        elif online_status == "offline":
            qs = qs.filter(or_(models.User.last_login < limit_time, models.User.last_login == None))
        elif online_status == "studying":
            qs = qs.filter(models.User.last_login >= limit_time, models.User.current_activity != None)

    col = models.User.id
    if sort == "id:desc": qs = qs.order_by(desc(col))
    else: qs = qs.order_by(asc(col))

    total = qs.count()
    items = qs.offset((page - 1) * page_size).limit(page_size).all()
    return items, total

def admin_update_user(db: Session, user: models.User, payload: schemas.AdminUserUpdate):
    old_snapshot = _serialize(user)
    
    if payload.full_name is not None: user.full_name = payload.full_name
    if payload.role is not None: user.role = payload.role
    if payload.grade_level is not None:
        user.grade_level = payload.grade_level
        user.dek_code = {"M6":69,"M5":70,"M4":71,"M3":72,"M2":73,"M1":74}.get(payload.grade_level)
    
    db.commit()
    db.refresh(user)
    add_audit(db, "update_user", None, user.id, old_snapshot, user)
    return user

# ==========================================
#  COURSES & CONTENT
# ==========================================

def list_courses(db: Session):
    return db.query(models.Course).order_by(models.Course.id.desc()).all()

def get_course(db: Session, course_id: int):
    return db.query(models.Course).filter(models.Course.id == course_id).first()

def create_course(db: Session, p: schemas.CourseCreate):
    c = models.Course(
        title=p.title,
        description=p.description,
        price=p.price,
        thumbnail=p.thumbnail,
        category=p.category,
        target_audience=p.target_audience, 
        highlights=p.highlights
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    add_audit(db, "create_course", None, c.id, None, c)
    return c

def update_course(db: Session, course_id: int, p: schemas.CourseUpdate):
    c = get_course(db, course_id)
    if not c: return None
    old_snapshot = _serialize(c)
    
    if p.title is not None: c.title = p.title
    if p.description is not None: c.description = p.description
    if p.price is not None: c.price = p.price
    if p.thumbnail is not None: c.thumbnail = p.thumbnail
    if p.category is not None: c.category = p.category
    if p.target_audience is not None: c.target_audience = p.target_audience
    if p.highlights is not None: c.highlights = p.highlights
    
    db.commit()
    db.refresh(c)
    add_audit(db, "update_course", None, c.id, old_snapshot, c)
    return c

def delete_course(db: Session, course_id: int):
    c = get_course(db, course_id)
    if c:
        old_snapshot = _serialize(c)
        db.delete(c)
        db.commit()
        add_audit(db, "delete_course", None, course_id, old_snapshot, None)
        return True
    return False

def create_chapter(db: Session, course_id: int, p: schemas.ChapterCreate):
    c = models.Chapter(course_id=course_id, title=p.title, order=p.order)
    db.add(c); db.commit(); db.refresh(c);
    return c

def create_lesson(db: Session, chapter_id: int, p: schemas.LessonCreate):
    l = models.Lesson(
        chapter_id=chapter_id, title=p.title, youtube_id=p.youtube_id, 
        doc_url=p.doc_url, duration=p.duration, order=p.order
    )
    db.add(l); db.commit(); db.refresh(l);
    return l

def update_lesson(db: Session, lesson_id: int, p: schemas.LessonUpdate):
    l = db.query(models.Lesson).get(lesson_id)
    if l:
        if p.title: l.title = p.title
        if p.youtube_id: l.youtube_id = p.youtube_id
        if p.doc_url is not None: l.doc_url = p.doc_url
        if p.duration is not None: l.duration = p.duration
        if p.order is not None: l.order = p.order
        db.commit()
        db.refresh(l)
    return l

def delete_lesson(db: Session, lesson_id: int):
    l = db.query(models.Lesson).get(lesson_id)
    if l:
        db.delete(l)
        db.commit()
        return True
    return False

# ==========================================
#  EXAMS (PRO) & QUESTIONS
# ==========================================

def create_exam(db: Session, p: schemas.ExamCreate):
    e = models.Exam(title=p.title, description=p.description, time_limit=p.time_limit)
    db.add(e)
    db.commit()
    db.refresh(e)
    add_audit(db, "create_exam", None, e.id, None, e)
    return e

def get_exam(db: Session, exam_id: int):
    # Eager load questions and choices
    return db.query(models.Exam).options(
        joinedload(models.Exam.questions).joinedload(models.Question.choices)
    ).filter(models.Exam.id == exam_id).first()

def list_exams(db: Session):
    return db.query(models.Exam).all()

def add_question(db: Session, exam_id: int, p: schemas.QuestionCreate):
    q = models.Question(
        exam_id=exam_id, 
        text=p.text, 
        image_url=p.image_url, 
        question_type=p.question_type, 
        order=p.order
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    
    if p.question_type == "choice":
        for c in p.choices:
            db.add(models.Choice(question_id=q.id, text=c.text, is_correct=c.is_correct))
        db.commit()
        db.refresh(q)
        
    return q

def delete_question(db: Session, qid: int):
    q = db.query(models.Question).get(qid)
    if q:
        db.delete(q)
        db.commit()
        return True
    return False

def submit_exam(db: Session, user_id: int, exam_id: int, p: schemas.ExamSubmit):
    # Simple Mock Submit - In real app, calculate score here
    return models.ExamResult(
        user_id=user_id, exam_id=exam_id, score=0, total_score=0, submitted_at=datetime.utcnow()
    )

def get_my_exam_results(db: Session, user_id: int):
    return db.query(models.ExamResult).filter(models.ExamResult.user_id == user_id).all()

# ==========================================
#  COUPONS
# ==========================================

def create_coupon(db: Session, p: schemas.CouponCreate):
    # 1. เช็คว่ามี Code นี้อยู่แล้วหรือไม่ (Case Insensitive)
    existing = db.query(models.Coupon).filter(models.Coupon.code == p.code.upper()).first()
    if existing:
        return None # ส่งค่า None กลับไปบอก main.py ว่าซ้ำ

    # 2. ป้องกัน Percent เกิน 100%
    final_value = p.discount_value
    if p.discount_type == "percent" and final_value > 100:
        final_value = 100.0

    c = models.Coupon(
        code=p.code.upper(), # บังคับตัวพิมพ์ใหญ่
        discount_type=p.discount_type,
        discount_value=final_value, 
        max_usage=p.max_usage,
        expires_at=p.expires_at
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    add_audit(db, "create_coupon", None, c.id, None, c)
    return c

def list_coupons(db: Session):
    return db.query(models.Coupon).order_by(desc(models.Coupon.created_at)).all()

def delete_coupon(db: Session, cid: int):
    c = db.query(models.Coupon).get(cid)
    if c:
        old_snapshot = _serialize(c)
        db.delete(c)
        db.commit()
        add_audit(db, "delete_coupon", None, cid, old_snapshot, None)
        return True
    return False

def get_coupons(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Coupon).offset(skip).limit(limit).all()

# ==========================================
#  INTERACTION (Comments, Ratings, Progress)
# ==========================================

def get_lesson_comments(db: Session, lesson_id: int):
    # Use joinedload to fetch user details with comments
    return db.query(models.Comment).options(joinedload(models.Comment.user)).filter(models.Comment.lesson_id == lesson_id).order_by(desc(models.Comment.created_at)).all()

def create_comment(db: Session, user_id: int, lesson_id: int, text: str):
    c = models.Comment(user_id=user_id, lesson_id=lesson_id, text=text, created_at=datetime.utcnow())
    db.add(c)
    db.commit()
    db.refresh(c) # Refresh to get ID and CreatedAt
    return c

def set_lesson_rating(db: Session, user_id: int, lesson_id: int, score: int):
    r = db.query(models.LessonRating).filter_by(user_id=user_id, lesson_id=lesson_id).first()
    if r:
        r.score = score
    else:
        r = models.LessonRating(user_id=user_id, lesson_id=lesson_id, score=score)
        db.add(r)
    db.commit()
    db.refresh(r)
    return r

def get_lesson_rating_avg(db: Session, lesson_id: int):
    # แก้จาก models.LessonRating เป็น models.Rating
    res = db.query(func.avg(models.Rating.score)).filter(models.Rating.lesson_id == lesson_id).scalar()
    return res or 0.00

def get_user_lesson_rating(db: Session, user_id: int, lesson_id: int):
    # แก้จาก models.LessonRating เป็น models.Rating
    r = db.query(models.Rating).filter(models.Rating.user_id == user_id, models.Rating.lesson_id == lesson_id).first()
    return r.score if r else 0

def toggle_lesson_progress(db: Session, user_id: int, lesson_id: int):
    p = db.query(models.LessonProgress).filter_by(user_id=user_id, lesson_id=lesson_id).first()
    if p:
        if p.completed_at: p.completed_at = None
        else: p.completed_at = datetime.utcnow()
    else:
        p = models.LessonProgress(user_id=user_id, lesson_id=lesson_id, completed_at=datetime.utcnow())
        db.add(p)
    db.commit()
    return True

def update_lesson_progress_time(db: Session, user_id: int, lesson_id: int, seconds: int):
    p = db.query(models.LessonProgress).filter_by(user_id=user_id, lesson_id=lesson_id).first()
    if p:
        p.last_watched_second = seconds
    else:
        p = models.LessonProgress(user_id=user_id, lesson_id=lesson_id, last_watched_second=seconds)
        db.add(p)
    db.commit()

def get_lesson_progress_time(db: Session, user_id: int, lesson_id: int):
    p = db.query(models.LessonProgress).filter_by(user_id=user_id, lesson_id=lesson_id).first()
    return p.last_watched_second if p else 0

def get_user_progress_in_course(db: Session, user_id: int, course_id: int):
    return db.query(models.Progress.lesson_id).join(models.Lesson).join(models.Chapter).filter(
        models.Progress.user_id == user_id,
        models.Progress.completed == True,
        models.Chapter.course_id == course_id
    ).all()

# ==========================================
#  STATS, PAYMENTS, SETTINGS, AUDIT, REPORTS
# ==========================================

def list_audit(db: Session, action, actor_id, target_id, d1, d2, page, page_size, sort):
    qs = db.query(models.AuditLog).order_by(desc(models.AuditLog.created_at))
    if action: qs = qs.filter(models.AuditLog.action.ilike(f"%{action}%"))
    total = qs.count()
    items = qs.offset((page-1)*page_size).limit(page_size).all()
    return items, total

def get_payment_stats(db: Session):
    total_rev = db.query(func.sum(models.Payment.amount)).filter(models.Payment.status == "approved").scalar() or 0.0
    pending = db.query(models.Payment).filter(models.Payment.status == "pending").count()
    top = db.query(models.Course.title, func.sum(models.Payment.amount).label("total")).join(models.Payment).filter(models.Payment.status == "approved").group_by(models.Course.id).order_by(desc("total")).limit(5).all()
    recent = db.query(models.Payment).filter(models.Payment.status == "approved", models.Payment.created_at >= (datetime.utcnow() - timedelta(days=7))).all()
    return {"total_revenue": total_rev, "pending_count": pending, "top_courses": [{"title": t, "amount": a} for t, a in top], "recent_payments": recent}

def get_payments(db: Session, status: str = None):
    q = db.query(models.Payment).order_by(models.Payment.created_at.desc())
    if status: q = q.filter(models.Payment.status == status)
    return q.all()

def approve_payment(db: Session, payment_id: int, action: str):
    p = db.query(models.Payment).get(payment_id)
    if not p: return None
    if action == "approve":
        p.status = "approved"
        create_enrollment(db, p.user_id, p.course_id)
    elif action == "reject":
        p.status = "rejected"
    db.commit()
    db.refresh(p)
    return p

def get_my_payments(db: Session, user_id: int):
    return db.query(models.Payment).filter(models.Payment.user_id == user_id).order_by(models.Payment.created_at.desc()).all()

def create_payment(db: Session, user_id: int, course_id: int, slip_url: str, amount: float, status: str = "pending"):
    p = models.Payment(user_id=user_id, course_id=course_id, slip_url=slip_url, amount=amount, status=status)
    db.add(p); db.commit(); db.refresh(p); return p

def get_enrollment(db: Session, user_id: int, course_id: int):
    return db.query(models.Enrollment).filter_by(user_id=user_id, course_id=course_id).first()

def create_enrollment(db: Session, user_id: int, course_id: int):
    if get_enrollment(db, user_id, course_id): return None
    e = models.Enrollment(user_id=user_id, course_id=course_id)
    db.add(e); db.commit(); return e

def get_my_courses(db: Session, user_id: int):
    return db.query(models.Enrollment).filter(models.Enrollment.user_id == user_id).all()

def add_friend(db: Session, user_id: int, friend_email: str):
    f = get_user_by_email(db, friend_email)
    if not f or f.id == user_id: return False
    return True

def get_friends(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id != user_id).limit(5).all()

def get_leaderboard(db: Session, limit: int = 10):
    # ✅ FIX: ใช้ models.Progress ให้ถูกต้อง (แก้ Error 500 Leaderboard)
    return db.query(
        models.User, 
        func.count(models.Progress.lesson_id).label('score')
    ).outerjoin(
        models.Progress, 
        (models.Progress.user_id == models.User.id) & (models.Progress.completed == True)
    ).group_by(models.User.id).order_by(desc('score')).limit(limit).all()

def update_user_activity(db: Session, user_id: int, activity: str):
    u = db.query(models.User).get(user_id)
    if u:
        u.current_activity = activity
        u.last_login = datetime.utcnow()
        db.commit()

def record_study_time(db: Session, user_id: int, minutes: int):
    today = datetime.utcnow().date()
    log = db.query(models.StudyLog).filter_by(user_id=user_id, date=today).first()
    if log: log.minutes += minutes
    else: log = models.StudyLog(user_id=user_id, date=today, minutes=minutes); db.add(log)
    u = db.query(models.User).get(user_id)
    if u: u.total_minutes += minutes
    db.commit()

def get_weekly_study_stats(db: Session, user_id: int):
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=6)
    
    # ✅ FIX: ใช้ created_at และแปลงเป็น Date
    logs = db.query(
        func.date(models.StudyLog.created_at).label("log_date"), 
        func.sum(models.StudyLog.minutes).label("total_minutes")
    ).filter(
        models.StudyLog.user_id == user_id, 
        models.StudyLog.created_at >= start_date
    ).group_by(
        func.date(models.StudyLog.created_at)
    ).all()

    data_map = {str(log.log_date): log.total_minutes for log in logs}
    labels = []
    data = []
    
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        d_str = str(d)
        labels.append(d.strftime("%a")) 
        data.append(data_map.get(d_str, 0))
        
    return {"labels": labels, "data": data}


def get_all_settings(db: Session):
    #return {} # 👈 ลองแก้เป็นแบบนี้บรรทัดเดียว แล้วรีเฟรชหน้าเว็บดู
    return {s.key: s.value for s in db.query(models.Setting).all()}

def get_setting(db: Session, key: str):
    s = db.query(models.Setting).filter(models.Setting.key == key).first()
    return s.value if s else None

def set_setting(db: Session, key: str, value: str):
    s = db.query(models.Setting).filter(models.Setting.key == key).first()
    if s:
        s.value = value
    else:
        s = models.Setting(key=key, value=value)
        db.add(s)
    db.commit()
    return s

def set_setting(db: Session, key: str, value: str):
    s = db.query(models.Setting).filter(models.Setting.key == key).first()
    if s:
        s.value = value
    else:
        s = models.Setting(key=key, value=value)
        db.add(s)
    db.commit()
    return s

def update_settings(db: Session, p: schemas.SettingsUpdate):
    if p.banner_active is not None: set_setting(db, "banner_active", str(p.banner_active).lower())
    if p.banner_text is not None: set_setting(db, "banner_text", p.banner_text)
    
    if hasattr(p, 'banner_color') and p.banner_color is not None: 
        set_setting(db, "banner_color", p.banner_color)
    
    if p.image_banner_active is not None: set_setting(db, "image_banner_active", str(p.image_banner_active).lower())
    
    # ✅ FIX: บันทึกรูปภาพลงฐานข้อมูล
    if p.banner_images is not None:
        set_setting(db, "banner_images", json.dumps(p.banner_images))

    if p.banner_interval is not None: set_setting(db, "banner_interval", str(p.banner_interval))
    
    if p.countdown_active is not None: set_setting(db, "countdown_active", str(p.countdown_active).lower())
    if p.countdown_title is not None: set_setting(db, "countdown_title", p.countdown_title)
    if p.countdown_date is not None: set_setting(db, "countdown_date", p.countdown_date)
    
    # ✅ FIX: บันทึก Audience
    if hasattr(p, 'countdown_audience') and p.countdown_audience is not None:
        set_setting(db, "countdown_audience", p.countdown_audience)
    
    return get_all_settings(db)

def get_all_reports(db, status=None): 
    q = db.query(models.Report).order_by(models.Report.created_at.desc())
    if status: q = q.filter(models.Report.status == status)
    return q.all()
def create_report(db, uid, p): 
    r = models.Report(user_id=uid, target_type=p.target_type, target_id=p.target_id, reason=p.reason); db.add(r); db.commit(); return r
def update_report_status(db, rid, st): 
    r = db.query(models.Report).get(rid)
    if r: r.status = st; db.commit(); return r
    return None

def get_public_profile(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: return None
    
    # นับจำนวนคอร์สที่ลง
    course_count = db.query(models.Enrollment).filter(models.Enrollment.user_id == user_id).count()
    
    # นับจำนวนบทเรียนที่เรียนจบ
    completed_count = db.query(models.Progress).filter(
        models.Progress.user_id == user_id, 
        models.Progress.completed == True
    ).count()
    
    # สร้าง Dict เพื่อส่งกลับ (ต้องตรงกับ schemas.UserPublicProfile)
    return {
        "id": user.id,
        "full_name": user.full_name,
        "nickname": user.nickname,
        "grade_level": user.grade_level,
        "dek_code": user.dek_code,
        "avatar_url": user.avatar_url,
        "total_minutes": user.total_minutes,
        "showcase_badges": user.showcase_badges,
        "total_courses": course_count,
        "total_completed": completed_count
    }