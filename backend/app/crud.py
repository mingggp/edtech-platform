from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, asc, desc, func
from typing import Optional, Tuple, List, Dict, Any
from . import grades, models, schemas
import json
import uuid
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
    # ระดับชั้นเก็บเป็น key มาตรฐาน (m4/m5/m6/other) และรุ่น DEK คำนวณจาก
    # ปีการศึกษาปัจจุบัน ไม่ใช่ตารางตายตัวที่เก่าตามเวลา — ดู app/grades.py
    grade_level = grades.normalize(grade_level)
    user = models.User(
        email=email,
        hashed_password=hashed_password,
        full_name=full_name,
        nickname=nickname,
        grade_level=grade_level,
        dek_code=grades.dek_code(grade_level),
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
        # เดิมตารางแปลงรุ่น DEK ถูกเขียนซ้ำอีกชุดตรงนี้ ทำให้มีความจริง 2 ที่
        user.grade_level = grades.normalize(payload.grade_level)
        user.dek_code = grades.dek_code(user.grade_level)
    
    db.commit()
    db.refresh(user)
    add_audit(db, "update_user", None, user.id, old_snapshot, user)
    return user

# ==========================================
#  COURSES & CONTENT
# ==========================================

def _course_query(db: Session):
    """query คอร์สพร้อมโหลดของที่ property ต้องใช้มาให้ครบในทีเดียว

    Course.total_lessons / total_minutes / student_count อ่านจาก relationship
    ถ้าไม่ eager load ตรงนี้ การดึงคอร์ส 14 ตัวจะยิง query เพิ่มอีก ~40 ครั้ง
    (N+1) — ตอนนี้ยังไม่รู้สึก แต่พอคอร์สเยอะจะช้าชัดเจน
    """
    from sqlalchemy.orm import selectinload
    return db.query(models.Course).options(
        selectinload(models.Course.chapters).selectinload(models.Chapter.lessons),
        selectinload(models.Course.enrollments),
    )


def list_courses(db: Session, skip: int = 0, limit: int = 100, active_only: bool = False):
    qs = _course_query(db)
    if active_only:
        qs = qs.filter(models.Course.is_active == True)
    return qs.order_by(models.Course.id.desc()).offset(skip).limit(limit).all()

def get_course(db: Session, course_id: int):
    return _course_query(db).filter(models.Course.id == course_id).first()

def create_course(db: Session, p: schemas.CourseCreate):
    """สร้างคอร์สจากทุกฟิลด์ใน schema

    เดิมไล่เขียนทีละฟิลด์ พอเพิ่ม subject/level/price_old ลงใน schema แล้ว
    ลืมมาเพิ่มตรงนี้ -> สร้างคอร์สผ่าน Admin แล้ววิชาหายเงียบ ๆ ไม่มี error
    เปลี่ยนมาอ่านจาก model_dump() เพื่อไม่ให้ลืมได้อีก
    """
    data = p.model_dump()
    c = models.Course(**{k: v for k, v in data.items() if hasattr(models.Course, k)})
    db.add(c)
    db.commit()
    db.refresh(c)
    add_audit(db, "create_course", None, c.id, None, c)
    return c

def update_course(db: Session, course_id: int, p: schemas.CourseUpdate):
    """อัปเดตเฉพาะฟิลด์ที่ส่งมา (exclude_unset) — ฟิลด์ที่ไม่ส่งจะไม่ถูกแตะ

    ใช้ exclude_unset แทนการเช็ค `is not None` ทีละตัว เพราะแบบเดิม
    ล้างค่าเป็น null ไม่ได้ (เช่นอยากเอาริบบิ้นออก ส่ง null มาก็ไม่มีผล)
    """
    c = get_course(db, course_id)
    if not c:
        return None
    old_snapshot = _serialize(c)

    for k, v in p.model_dump(exclude_unset=True).items():
        if hasattr(models.Course, k):
            setattr(c, k, v)

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

def get_course_chapters(db: Session, course_id: int):
    return db.query(models.Chapter).options(joinedload(models.Chapter.lessons)).filter(models.Chapter.course_id == course_id).order_by(models.Chapter.order).all()

def enroll_course(db: Session, user_id: int, course_id: int):
    # Check if already enrolled
    existing = db.query(models.Enrollment).filter_by(user_id=user_id, course_id=course_id).first()
    if existing:
        return existing
    e = models.Enrollment(user_id=user_id, course_id=course_id)
    db.add(e)
    db.commit()
    db.refresh(e)
    return e

def get_enrolled_courses(db: Session, user_id: int):
    # Returns enrollments with joined Course
    return db.query(models.Enrollment).options(joinedload(models.Enrollment.course)).filter(models.Enrollment.user_id == user_id).all()

def get_course_progress(db: Session, user_id: int, course_id: int):
    # returns list of completed lesson IDs
    completed = db.query(models.Progress).join(models.Lesson).join(models.Chapter).filter(
        models.Progress.user_id == user_id,
        models.Chapter.course_id == course_id,
        models.Progress.completed == True
    ).all()
    return [p.lesson_id for p in completed]

def mark_lesson_complete(db: Session, user_id: int, lesson_id: int, completed: bool = True):
    p = db.query(models.Progress).filter_by(user_id=user_id, lesson_id=lesson_id).first()
    if not p:
        p = models.Progress(user_id=user_id, lesson_id=lesson_id, completed=completed)
        db.add(p)
    else:
        p.completed = completed
    db.commit()
    db.refresh(p)
    return p

def create_chapter(db: Session, course_id: int, p: schemas.ChapterCreate):
    c = models.Chapter(course_id=course_id, title=p.title, order=p.order)
    db.add(c); db.commit(); db.refresh(c);
    return c

def update_chapter(db: Session, chapter_id: int, p: schemas.ChapterUpdate):
    c = db.query(models.Chapter).get(chapter_id)
    if c:
        if p.title is not None: c.title = p.title
        if p.order is not None: c.order = p.order
        db.commit()
        db.refresh(c)
    return c

def delete_chapter(db: Session, chapter_id: int):
    c = db.query(models.Chapter).get(chapter_id)
    if c:
        db.delete(c)
        db.commit()
        return True
    return False

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

def list_exams(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Exam).offset(skip).limit(limit).all()

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
    """ตรวจคำตอบ + บันทึกผล. คะแนน 1 ข้อต่อคำถาม.

    answers shape (จาก client): {"<question_id>": <choice_id>}
    """
    exam = get_exam(db, exam_id)
    if not exam:
        return None

    score = 0
    total = len(exam.questions)
    answers_norm: dict[str, int] = {}

    for q in exam.questions:
        chosen_raw = p.answers.get(str(q.id)) or p.answers.get(q.id)
        if chosen_raw is None:
            continue
        try:
            chosen_id = int(chosen_raw)
        except (TypeError, ValueError):
            continue
        answers_norm[str(q.id)] = chosen_id
        # หาว่า choice นี้ถูกหรือไม่
        choice = next((c for c in q.choices if c.id == chosen_id), None)
        if choice and choice.is_correct:
            score += 1

    result = models.ExamResult(
        user_id=user_id,
        exam_id=exam_id,
        score=score,
        total_score=total,
        answers=json.dumps(answers_norm),
        submitted_at=datetime.utcnow(),
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


def get_my_exam_results(db: Session, user_id: int):
    return (
        db.query(models.ExamResult)
        .filter(models.ExamResult.user_id == user_id)
        .order_by(models.ExamResult.submitted_at.desc())
        .all()
    )


def get_exam_result(db: Session, result_id: int, user_id: int | None = None):
    """ดึงผลสอบ. ถ้าใส่ user_id ด้วย จะกรองให้เฉพาะของ user นั้น (กัน id-guess)."""
    q = db.query(models.ExamResult).filter(models.ExamResult.id == result_id)
    if user_id is not None:
        q = q.filter(models.ExamResult.user_id == user_id)
    return q.first()

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
    # Re-fetch with user relationship loaded so the response includes profile data
    c = db.query(models.Comment).options(joinedload(models.Comment.user)).filter(models.Comment.id == c.id).first()
    return c

def set_lesson_rating(db: Session, user_id: int, lesson_id: int, score: int):
    r = db.query(models.Rating).filter_by(user_id=user_id, lesson_id=lesson_id).first()
    if r:
        r.score = score
    else:
        r = models.Rating(user_id=user_id, lesson_id=lesson_id, score=score)
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
    """สรุปยอดขาย — นับเฉพาะรายการที่เกตเวย์ยืนยันแล้ว (paid)

    expired_count = QR หมดอายุก่อนจ่าย ใช้ดูว่ามีคนกดซื้อแล้วไม่จ่ายเยอะไหม
    ไม่ใช่คิวรอแอดมินอนุมัติ — ระบบไม่มีขั้นตอนนั้น
    """
    total_rev = db.query(func.sum(models.Payment.amount)).filter(models.Payment.status == "paid").scalar() or 0.0
    expired = db.query(models.Payment).filter(models.Payment.status == "expired").count()
    top = db.query(models.Course.title, func.sum(models.Payment.amount).label("total")).join(models.Payment).filter(models.Payment.status == "paid").group_by(models.Course.id).order_by(desc("total")).limit(5).all()
    recent = db.query(models.Payment).filter(models.Payment.status == "paid", models.Payment.created_at >= (datetime.utcnow() - timedelta(days=7))).all()
    return {"total_revenue": total_rev, "expired_count": expired, "top_courses": [{"title": t, "amount": a} for t, a in top], "recent_payments": recent}

def get_payments(db: Session, status: str = None, skip: int = 0, limit: int = 100):
    """List payments. Eager-load user + course so PaymentRead can include join fields."""
    from sqlalchemy.orm import joinedload
    q = (
        db.query(models.Payment)
        .options(
            joinedload(models.Payment.user),
            # course relationship อาจไม่มี (ดู models.Payment) — query แยก
        )
        .order_by(models.Payment.created_at.desc())
    )
    if status:
        q = q.filter(models.Payment.status == status)
    else:
        # ไม่โชว์ awaiting โดยปริยาย — เป็นสถานะชั่วคราวระหว่างรอผู้ใช้สแกน
        q = q.filter(models.Payment.status.in_(["paid", "expired"]))
    payments = q.offset(skip).limit(limit).all()

    # populate join fields ก่อน serialize (Pydantic จะอ่านจาก attribute)
    course_ids = {p.course_id for p in payments}
    courses = {
        c.id: c
        for c in db.query(models.Course).filter(models.Course.id.in_(course_ids)).all()
    } if course_ids else {}
    for p in payments:
        u = p.user
        c = courses.get(p.course_id)
        # set as transient attrs — Pydantic with from_attributes จะอ่านได้
        p.user_email = u.email if u else None
        p.user_full_name = u.full_name if u else None
        p.course_title = c.title if c else None
    return payments

def get_my_payments(db: Session, user_id: int):
    return db.query(models.Payment).filter(models.Payment.user_id == user_id).order_by(models.Payment.created_at.desc()).all()


# ---------------------------------------------------------------------------
# การชำระเงิน — ยืนยันอัตโนมัติผ่าน webhook ไม่มีขั้นตอนแอดมินอนุมัติ
# ---------------------------------------------------------------------------

QR_TTL_MINUTES = 15          # ตรงกับหน้า Checkout ที่นับถอยหลัง 15:00


def price_after_coupon(db: Session, price: float, coupon_code: str | None):
    """คืน (ราคาสุทธิ, coupon object ที่ใช้ได้จริง) — ยังไม่ตัดโควตาคูปอง"""
    if not coupon_code:
        return price, None
    coupon = db.query(models.Coupon).filter(models.Coupon.code == coupon_code.upper()).first()
    if not coupon:
        return price, None
    if coupon.expires_at and coupon.expires_at < datetime.utcnow():
        return price, None
    if coupon.max_usage > 0 and coupon.current_usage >= coupon.max_usage:
        return price, None
    discount = (price * coupon.discount_value / 100) if coupon.discount_type == "percent" else coupon.discount_value
    return max(0.0, price - discount), coupon


def create_payment_intent(db: Session, user_id: int, course_id: int, amount: float,
                          coupon_code: str | None = None, ttl_minutes: int = QR_TTL_MINUTES):
    """สร้างรายการรอชำระ + QR reference ให้ผู้ใช้สแกน"""
    ref = f"MSF-{user_id}-{course_id}-{uuid.uuid4().hex[:12].upper()}"
    p = models.Payment(
        user_id=user_id,
        course_id=course_id,
        amount=amount,
        status="awaiting",
        provider="promptpay",
        provider_ref=ref,
        coupon_code=coupon_code.upper() if coupon_code else None,
        expires_at=datetime.utcnow() + timedelta(minutes=ttl_minutes),
    )
    db.add(p); db.commit(); db.refresh(p)
    return p


def get_payment_by_ref(db: Session, ref: str):
    return db.query(models.Payment).filter(models.Payment.provider_ref == ref).first()


def expire_stale_payments(db: Session):
    """ปิดรายการที่ QR หมดอายุแล้วแต่ยังค้างสถานะ awaiting"""
    n = (
        db.query(models.Payment)
        .filter(models.Payment.status == "awaiting", models.Payment.expires_at < datetime.utcnow())
        .update({models.Payment.status: "expired"}, synchronize_session=False)
    )
    if n:
        db.commit()
    return n


def mark_payment_paid(db: Session, ref: str, charge_id: str | None = None, amount: float | None = None):
    """เกตเวย์ยืนยันว่าจ่ายแล้ว -> เปิดคอร์สให้ทันที

    เรียกซ้ำด้วย ref เดิมได้ (idempotent) เพราะเกตเวย์อาจยิง webhook ซ้ำ
    """
    p = get_payment_by_ref(db, ref)
    if not p:
        return None
    if p.status == "paid":
        return p                                   # ยิงซ้ำ — ไม่ทำอะไรเพิ่ม
    if amount is not None and abs(float(amount) - float(p.amount)) > 0.01:
        return False                               # ยอดไม่ตรง ไม่ยอมรับ
    p.status = "paid"
    p.paid_at = datetime.utcnow()
    if charge_id:
        p.charge_id = charge_id
    if p.coupon_code:
        coupon = db.query(models.Coupon).filter(models.Coupon.code == p.coupon_code).first()
        if coupon:
            coupon.current_usage += 1
    create_enrollment(db, p.user_id, p.course_id)
    db.commit(); db.refresh(p)
    return p

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
    if not f or f.id == user_id:
        return False
    # Check if already friend
    existing = db.query(models.Friend).filter(models.Friend.user_id == user_id, models.Friend.friend_id == f.id).first()
    if existing:
        return False
    new_f = models.Friend(user_id=user_id, friend_id=f.id)
    db.add(new_f)
    db.commit()
    return True

def remove_friend(db: Session, user_id: int, friend_id: int):
    f = db.query(models.Friend).filter(models.Friend.user_id == user_id, models.Friend.friend_id == friend_id).first()
    if f:
        db.delete(f)
        db.commit()
        return True
    return False

def get_friends(db: Session, user_id: int):
    # Get all users where there exists a friend link from user_id to friend_id
    friends = db.query(models.User).join(
        models.Friend, models.Friend.friend_id == models.User.id
    ).filter(models.Friend.user_id == user_id).all()
    return friends

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

def get_all_reports(db, status=None, skip: int = 0, limit: int = 100): 
    q = db.query(models.Report).order_by(models.Report.created_at.desc())
    if status: q = q.filter(models.Report.status == status)
    return q.offset(skip).limit(limit).all()

def create_report(db, uid, p):
    r = models.Report(user_id=uid, target_type=p.target_type, target_id=p.target_id, reason=p.reason)
    db.add(r); db.commit(); return r

def update_report_status(db, rid, st):
    r = db.query(models.Report).get(rid)
    if r:
        r.status = st; db.commit(); return r
    return None

def get_public_profile(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: return None
    course_count = db.query(models.Enrollment).filter(models.Enrollment.user_id == user_id).count()
    completed_count = db.query(models.Progress).filter(
        models.Progress.user_id == user_id,
        models.Progress.completed == True
    ).count()
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
        "total_completed": completed_count,
    }
