from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

# ===== User =====
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    sub: str | None = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    grade_level: Optional[str] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class UserRead(BaseModel):
    email: str
    full_name: Optional[str] = None
    id: int
    is_active: bool
    created_at: datetime
    role: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    grade_level: Optional[str] = None
    dek_code: Optional[int] = None
    last_login: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# ===== Admin list/modify =====
class PageMeta(BaseModel):
    page: int
    page_size: int
    total: int

class AdminUserListResponse(BaseModel):
    items: List[UserRead]
    meta: PageMeta

class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None            # "student" | "admin"
    is_active: Optional[bool] = None
    bio: Optional[str] = None
    grade_level: Optional[str] = None

class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = None            # default student
    is_active: Optional[bool] = None
    grade_level: Optional[str] = None

# ===== Audit =====
class DiffItem(BaseModel):
    field: str
    before: Optional[str] = None
    after: Optional[str] = None
    status: str  # "changed" | "added" | "removed" | "same"

class AuditItem(BaseModel):
    id: int
    action: str
    actor_id: Optional[int] = None
    target_id: Optional[int] = None
    data: Optional[str] = None
    created_at: datetime
    created_at_bkk: str
    created_at_iso_bkk: str
    # ใหม่: diff เฉพาะฟิลด์ที่เปลี่ยน (อาจว่างถ้าไม่มี before/after)
    diff: Optional[List[DiffItem]] = None

    model_config = ConfigDict(from_attributes=True)

class AuditListResponse(BaseModel):
    items: List[AuditItem]
    meta: PageMeta


# --- ส่วนที่ต้องเพิ่มต่อท้ายไฟล์ backend/app/schemas.py ---

# ===== Course & Lesson Schemas =====

# 1. Lesson
class LessonBase(BaseModel):
    title: str
    youtube_id: str
    doc_url: Optional[str] = None   # <--- เพิ่มบรรทัดนี้
    order: int = 0

class LessonCreate(LessonBase):
    pass

# เพิ่มตัวนี้ใหม่ สำหรับการแก้ไขบทเรียน
class LessonUpdate(BaseModel):
    title: Optional[str] = None
    youtube_id: Optional[str] = None
    doc_url: Optional[str] = None
    order: Optional[int] = None

class LessonRead(LessonBase):
    id: int
    course_id: int
    
    model_config = ConfigDict(from_attributes=True)

# 2. Course (คอร์ส)
class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    thumbnail: Optional[str] = None

class CourseCreate(CourseBase):
    pass

class CourseRead(CourseBase):
    id: int
    created_at: datetime
    # ให้ส่ง list ของบทเรียนไปด้วยเวลาดึงข้อมูลคอร์ส
    lessons: List[LessonRead] = [] 

    model_config = ConfigDict(from_attributes=True)

# 3. Enrollment (การลงทะเบียน)
class EnrollmentRead(BaseModel):
    id: int
    course_id: int
    user_id: int
    enrolled_at: datetime
    course: Optional[CourseRead] = None # เผื่ออยากดึงรายละเอียดคอร์สด้วย

    model_config = ConfigDict(from_attributes=True)

# --- ส่วนที่เพิ่มต่อท้ายไฟล์ backend/app/schemas.py ---

# Schema สำหรับแก้ไขคอร์ส (ทุกช่องเป็น Optional เผื่อแก้แค่บางอย่าง)
class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail: Optional[str] = None


# backend/app/schemas.py (ต่อท้ายไฟล์)

# ===== Mock Exam Schemas =====

class ChoiceBase(BaseModel):
    text: str
    is_correct: bool = False

class QuestionCreate(BaseModel):
    text: str
    order: int = 0
    choices: List[ChoiceBase]  # ตอนสร้างโจทย์ ต้องส่ง Choice มาด้วยเลย

class ExamCreate(BaseModel):
    title: str
    description: Optional[str] = None
    time_limit: int = 60

# สำหรับแสดงผล (Read)
class ChoiceRead(BaseModel):
    id: int
    text: str
    # ไม่ส่ง is_correct ไปให้นักเรียนดู (เดี๋ยวรู้เฉลย)
    
    model_config = ConfigDict(from_attributes=True)

class QuestionRead(BaseModel):
    id: int
    text: str
    order: int
    choices: List[ChoiceRead]
    
    model_config = ConfigDict(from_attributes=True)

class ExamRead(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    time_limit: int
    questions: List[QuestionRead] = []
    
    model_config = ConfigDict(from_attributes=True)

# สำหรับส่งคำตอบ
class AnswerItem(BaseModel):
    question_id: int
    choice_id: int

class ExamSubmit(BaseModel):
    answers: List[AnswerItem]

class ExamResultRead(BaseModel):
    id: int
    score: int
    total_score: int
    submitted_at: datetime
    exam: Optional[ExamRead] = None # เผื่ออยากรู้ว่าสอบวิชาอะไร

    model_config = ConfigDict(from_attributes=True)

    
# backend/app/schemas.py (ต่อท้ายไฟล์)

# ===== Social Schemas =====

class FriendRead(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_online: bool = False  # เดี๋ยวเราจะคำนวณเอา
    
    model_config = ConfigDict(from_attributes=True)

class LeaderboardItem(BaseModel):
    id: int
    full_name: str
    avatar_url: Optional[str] = None
    completed_count: int     # จำนวนบทเรียนที่จบ

# backend/app/schemas.py (ต่อท้ายไฟล์)

# ===== Social & Activity Schemas =====

class FriendRead(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    
    # สถานะปัจจุบัน
    is_online: bool = False
    current_activity: Optional[str] = None  # เช่น "กำลังเรียน Calculus"
    
    model_config = ConfigDict(from_attributes=True)

class LeaderboardItem(BaseModel):
    id: int
    full_name: str
    avatar_url: Optional[str] = None
    completed_count: int     # จำนวนบทเรียนที่จบ

class ActivityUpdate(BaseModel):
    activity: str  # ข้อความที่จะให้เพื่อนเห็น เช่น "เรียน Physics EP.1"