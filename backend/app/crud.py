# backend/app/crud.py (ส่วนบนสุด)
from sqlalchemy.orm import Session
from sqlalchemy import or_, asc, desc
from typing import Optional, Tuple, List, Dict, Any
from . import models
from .schemas import AdminUserUpdate
from . import schemas  # <--- บรรทัดนี้สำคัญมาก เพิ่มเข้ามาเพื่อให้รู้จัก CourseCreate

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, email: str, hashed_password: str, full_name: str | None):
    user = models.User(email=email, hashed_password=hashed_password, full_name=full_name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# ---------- Admin: list users ----------
def admin_list_users(
    db: Session,
    q: Optional[str],
    page: int,
    page_size: int,
    sort: str,
    role: Optional[str] = None,     # "admin" | "student"
    active: Optional[bool] = None,  # True | False
) -> Tuple[List[models.User], int]:
    qs = db.query(models.User)
    if q:
        like = f"%{q}%"
        qs = qs.filter(or_(models.User.email.ilike(like),
                           models.User.full_name.ilike(like)))
    if role in {"admin", "student"}:
        qs = qs.filter(models.User.role == role)
    if active is True:
        qs = qs.filter(models.User.is_active == True)
    elif active is False:
        qs = qs.filter(models.User.is_active == False)

    if ":" in sort:
        field, direction = sort.split(":", 1)
    else:
        field, direction = sort, "asc"
    field_map = {
        "id": models.User.id,
        "email": models.User.email,
        "full_name": models.User.full_name,
        "role": models.User.role,
        "created_at": models.User.created_at,
        "last_login": models.User.last_login,
        "is_active": models.User.is_active,
        "grade_level": models.User.grade_level,
        "dek_code": models.User.dek_code,
    }
    col = field_map.get(field, models.User.id)
    qs = qs.order_by(desc(col) if direction.lower() == "desc" else asc(col))

    total = qs.count()
    items = qs.offset((page - 1) * page_size).limit(page_size).all()
    return items, total

def admin_update_user(db: Session, user: models.User, payload: AdminUserUpdate) -> models.User:
    if payload.full_name is not None:
        user.full_name = (payload.full_name or "").strip() or None
    if payload.role is not None:
        if payload.role not in {"student", "admin"}:
            raise ValueError("role must be 'student' or 'admin'")
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.bio is not None:
        user.bio = (payload.bio or "").strip() or None
    if payload.grade_level is not None:
        gl = payload.grade_level.upper().replace(" ", "")
        if gl not in {"M1","M2","M3","M4","M5","M6"}:
            raise ValueError("grade_level must be M1..M6")
        user.grade_level = gl
        mapping = {"M6":69,"M5":70,"M4":71,"M3":72,"M2":73,"M1":74}
        user.dek_code = mapping.get(gl)
    db.commit()
    db.refresh(user)
    return user

# ---------- Audit helpers ----------
import json
from datetime import datetime

def add_audit(db: Session, action: str, actor_id: int | None, target_id: int | None, data: Dict[str, Any] | None = None) -> models.AuditLog:
    log = models.AuditLog(
        action=action,
        actor_id=actor_id,
        target_id=target_id,
        data=json.dumps(data, ensure_ascii=False) if data is not None else None,
        created_at=datetime.utcnow(),   # เก็บเป็น UTC naive
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

def list_audit(
    db: Session,
    action: Optional[str],
    actor_id: Optional[int],
    target_id: Optional[int],
    date_from: Optional[str],
    date_to: Optional[str],
    page: int,
    page_size: int,
    sort: str,
) -> Tuple[List[models.AuditLog], int]:
    qs = db.query(models.AuditLog)

    if action:
        like = f"%{action}%"
        qs = qs.filter(models.AuditLog.action.ilike(like))
    if actor_id:
        qs = qs.filter(models.AuditLog.actor_id == actor_id)
    if target_id:
        qs = qs.filter(models.AuditLog.target_id == target_id)

    # หมายเหตุ: ที่นี่ปล่อย filter วันที่ไว้ให้ทำฝั่ง main (เราเก็บ created_at เป็น UTC naive)
    if ":" in sort:
        field, direction = sort.split(":", 1)
    else:
        field, direction = sort, "desc"
    from sqlalchemy import desc as sdesc, asc as sasc
    field_map = {
        "id": models.AuditLog.id,
        "created_at": models.AuditLog.created_at,
        "action": models.AuditLog.action,
    }
    col = field_map.get(field, models.AuditLog.created_at)
    qs = qs.order_by(sdesc(col) if direction.lower() == "desc" else sasc(col))

    total = qs.count()
    items = qs.offset((page - 1) * page_size).limit(page_size).all()
    return items, total


# --- ส่วนที่เพิ่มต่อท้ายไฟล์ backend/app/crud.py ---

# ---------- Courses & Lessons ----------
def create_course(db: Session, payload: schemas.CourseCreate):
    db_course = models.Course(
        title=payload.title,
        description=payload.description,
        thumbnail=payload.thumbnail
    )
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

def list_courses(db: Session, skip: int = 0, limit: int = 100):
    # ดึงข้อมูลคอร์สทั้งหมด
    return db.query(models.Course).order_by(models.Course.id.desc()).offset(skip).limit(limit).all()

def get_course(db: Session, course_id: int):
    # ดึงคอร์สรายตัว
    return db.query(models.Course).filter(models.Course.id == course_id).first()

def create_lesson(db: Session, course_id: int, payload: schemas.LessonCreate):
    db_lesson = models.Lesson(
        course_id=course_id,
        title=payload.title,
        youtube_id=payload.youtube_id,
        doc_url=payload.doc_url,
        order=payload.order
    )
    db.add(db_lesson)
    db.commit()
    db.refresh(db_lesson)
    return db_lesson


def get_lesson(db: Session, lesson_id: int):
    return db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()

def update_lesson(db: Session, lesson_id: int, payload: schemas.LessonUpdate):
    lesson = get_lesson(db, lesson_id)
    if not lesson:
        return None
    
    if payload.title is not None:
        lesson.title = payload.title
    if payload.youtube_id is not None:
        lesson.youtube_id = payload.youtube_id
    if payload.doc_url is not None:
        lesson.doc_url = payload.doc_url
    if payload.order is not None:
        lesson.order = payload.order
        
    db.commit()
    db.refresh(lesson)
    return lesson


def get_enrollment(db: Session, user_id: int, course_id: int):
    return db.query(models.Enrollment).filter_by(user_id=user_id, course_id=course_id).first()

def create_enrollment(db: Session, user_id: int, course_id: int):
    # เช็คก่อนว่าลงไปหรือยัง
    existing = get_enrollment(db, user_id, course_id)
    if existing:
        return existing
    
    new_enr = models.Enrollment(user_id=user_id, course_id=course_id)
    db.add(new_enr)
    db.commit()
    db.refresh(new_enr)
    return new_enr

def get_my_courses(db: Session, user_id: int):
    # ดึงรายการที่นักเรียนคนนี้ลงทะเบียนไว้
    # join กับ Course เพื่อให้ได้ข้อมูลคอร์สมาด้วย (ถ้าต้องการในอนาคต)
    return db.query(models.Enrollment).filter(models.Enrollment.user_id == user_id).all()


# --- ส่วนที่เพิ่มต่อท้ายไฟล์ backend/app/crud.py ---

def update_course(db: Session, course_id: int, payload: schemas.CourseUpdate):
    course = get_course(db, course_id)
    if not course:
        return None
    
    # ถ้ามีการส่งค่ามาใหม่ ให้ทับค่าเดิม
    if payload.title is not None:
        course.title = payload.title
    if payload.description is not None:
        course.description = payload.description
    if payload.thumbnail is not None:
        course.thumbnail = payload.thumbnail

    db.commit()
    db.refresh(course)
    return course


# backend/app/crud.py (ต่อท้ายไฟล์)

def toggle_lesson_progress(db: Session, user_id: int, lesson_id: int):
    # เช็คว่ามีบันทึกอยู่แล้วไหม
    progress = db.query(models.LessonProgress).filter_by(user_id=user_id, lesson_id=lesson_id).first()
    
    if progress:
        # ถ้ามีแล้ว -> ลบออก (Unmark)
        db.delete(progress)
        db.commit()
        return False # แจ้งกลับว่าตอนนี้สถานะคือ "ยังไม่เสร็จ"
    else:
        # ถ้ายังไม่มี -> สร้างใหม่ (Mark done)
        new_prog = models.LessonProgress(user_id=user_id, lesson_id=lesson_id)
        db.add(new_prog)
        db.commit()
        return True # แจ้งกลับว่าตอนนี้สถานะคือ "เสร็จแล้ว"

def get_user_progress_in_course(db: Session, user_id: int, course_id: int):
    # ดึง ID ของบทเรียนทั้งหมดในคอร์สนี้ ที่ User คนนี้เรียนจบแล้ว
    # (ต้อง Join ตาราง Lesson เพื่อกรองเฉพาะ lesson ที่อยู่ใน course_id นี้)
    return db.query(models.LessonProgress.lesson_id)\
             .join(models.Lesson, models.Lesson.id == models.LessonProgress.lesson_id)\
             .filter(models.LessonProgress.user_id == user_id, models.Lesson.course_id == course_id)\
             .all()

# backend/app/crud.py (ต่อท้ายไฟล์)

# ---------- Mock Exam ----------
def create_exam(db: Session, payload: schemas.ExamCreate):
    ex = models.Exam(
        title=payload.title,
        description=payload.description,
        time_limit=payload.time_limit
    )
    db.add(ex)
    db.commit()
    db.refresh(ex)
    return ex

def list_exams(db: Session):
    return db.query(models.Exam).order_by(models.Exam.id.desc()).all()

def get_exam(db: Session, exam_id: int):
    return db.query(models.Exam).filter(models.Exam.id == exam_id).first()

def add_question(db: Session, exam_id: int, payload: schemas.QuestionCreate):
    # 1. สร้างโจทย์
    q = models.Question(exam_id=exam_id, text=payload.text, order=payload.order)
    db.add(q)
    db.commit()
    db.refresh(q)
    
    # 2. สร้าง Choice
    for c in payload.choices:
        ch = models.Choice(question_id=q.id, text=c.text, is_correct=c.is_correct)
        db.add(ch)
    db.commit()
    db.refresh(q)
    return q

def submit_exam(db: Session, user_id: int, exam_id: int, payload: schemas.ExamSubmit):
    # ดึงเฉลยมาตรวจ
    exam = get_exam(db, exam_id)
    if not exam:
        return None
    
    score = 0
    total = 0
    
    # โหลด Question ทั้งหมดของ Exam นี้มาเช็ค
    # (วิธีบ้านๆ: วนลูปเช็คทีละข้อ)
    q_dict = {q.id: q for q in exam.questions}
    total = len(q_dict)

    for ans in payload.answers:
        question = q_dict.get(ans.question_id)
        if question:
            # หา choice ที่ user เลือก
            selected = next((c for c in question.choices if c.id == ans.choice_id), None)
            if selected and selected.is_correct:
                score += 1

    # บันทึกผล
    result = models.ExamResult(
        user_id=user_id,
        exam_id=exam_id,
        score=score,
        total_score=total
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result

def get_my_exam_results(db: Session, user_id: int):
    return db.query(models.ExamResult).filter(models.ExamResult.user_id == user_id).order_by(models.ExamResult.submitted_at.desc()).all()

# backend/app/crud.py (ต่อท้ายไฟล์)

# ---------- Social Features ----------

def add_friend(db: Session, user_id: int, friend_email: str):
    # หา user ที่จะแอด
    friend = get_user_by_email(db, friend_email)
    if not friend:
        return None
    if friend.id == user_id:
        return None # แอดตัวเองไม่ได้
        
    user = db.query(models.User).get(user_id)
    
    # เช็คว่าเป็นเพื่อนกันยัง
    if friend in user.friends:
        return user # เป็นแล้ว
        
    user.friends.append(friend)
    # ถ้าอยากให้เป็นเพื่อนกันทั้ง 2 ฝั่งทันที (Friendship แบบ Facebook)
    friend.friends.append(user) 
    
    db.commit()
    return user

def get_friends(db: Session, user_id: int):
    user = db.query(models.User).get(user_id)
    return user.friends if user else []

def get_leaderboard(db: Session, limit: int = 10):
    # จัดอันดับตามจำนวน LessonProgress ที่ทำเสร็จ
    # query นี้จะซับซ้อนหน่อย คือนับจำนวน row ใน lesson_progress ของแต่ละ user
    from sqlalchemy import func
    
    results = db.query(
        models.User,
        func.count(models.LessonProgress.lesson_id).label('score')
    ).outerjoin(models.LessonProgress).group_by(models.User.id).order_by(desc('score')).limit(limit).all()
    
    return results # คืนค่าเป็น list ของ (User, score)

# backend/app/crud.py (ต่อท้ายไฟล์)

# ---------- Social Features ----------

def add_friend(db: Session, user_id: int, friend_email: str):
    friend = get_user_by_email(db, friend_email)
    if not friend or friend.id == user_id:
        return None
        
    user = db.query(models.User).get(user_id)
    if friend not in user.friends:
        user.friends.append(friend)
        friend.friends.append(user) # เป็นเพื่อนกันทั้ง 2 ฝั่ง
        db.commit()
    return user

def get_friends(db: Session, user_id: int):
    user = db.query(models.User).get(user_id)
    return user.friends if user else []

def get_leaderboard(db: Session, limit: int = 10):
    from sqlalchemy import func
    # เรียงตามจำนวนบทเรียนที่เรียนจบ (LessonProgress)
    results = db.query(
        models.User,
        func.count(models.LessonProgress.lesson_id).label('score')
    ).outerjoin(models.LessonProgress).group_by(models.User.id).order_by(desc('score')).limit(limit).all()
    return results

# อัปเดตว่ากำลังทำอะไรอยู่ (สำหรับสถานะสีฟ้า)
# *หมายเหตุ: เราจะแอบใช้ field 'bio' หรือสร้าง field ใหม่ก็ได้ 
# แต่เพื่อความง่าย ผมขอใช้เทคนิคเก็บลง Memory ชั่วคราว หรือใช้ last_login คู่กับ table ใหม่
# เอาแบบง่ายสุดคือ: เราจะใช้ last_login เป็นตัวบอก Online ส่วน Activity เดี๋ยวเราเพิ่ม column พิเศษใน User ดีกว่าครับ

def update_user_activity(db: Session, user_id: int, activity: str):
    user = db.query(models.User).get(user_id)
    if user:
        user.current_activity = activity
        user.last_login = datetime.utcnow() # ถือว่า active ด้วย
        db.commit()