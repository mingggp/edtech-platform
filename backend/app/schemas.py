from pydantic import BaseModel, EmailStr, model_validator
from typing import List, Optional, Any, Dict
from datetime import datetime

# --- Token ---
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- User ---
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    full_name: str
    nickname: Optional[str] = None
    grade_level: Optional[str] = None
    dek_code: Optional[str] = None

class UserLogin(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    nickname: Optional[str] = None
    grade_level: Optional[str] = None
    dek_code: Optional[str] = None

class UserUpdateMe(BaseModel):
    full_name: Optional[str] = None
    nickname: Optional[str] = None
    grade_level: Optional[str] = None
    dek_code: Optional[str] = None

class AdminUserUpdate(BaseModel):
    role: Optional[str] = None
    full_name: Optional[str] = None
    nickname: Optional[str] = None
    grade_level: Optional[str] = None
    dek_code: Optional[str] = None

class UserRead(UserBase):
    id: int
    full_name: Optional[str] = None
    nickname: Optional[str] = None
    grade_level: Optional[str] = None
    dek_code: Optional[str] = None
    role: str
    total_minutes: int
    avatar_url: Optional[str] = None
    showcase_badges: Optional[str] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Alias for backward compatibility
class UserOut(UserRead):
    pass

class AdminUserListResponse(BaseModel):
    items: List[UserRead]
    meta: dict

# --- Course ---
# 4 วิชาที่สอน — ต้องตรงกับ subjects.js ฝั่งหน้าเว็บ ห้ามเพิ่ม (ดู CLAUDE.md)
SUBJECTS = ("math", "phys", "tpat3", "tgat2")
# ระดับ — ใช้ได้เฉพาะ math / phys
LEVELS = ("m4", "m5", "m6", "alevel")
# วิชาที่มีระดับย่อยได้
LEVELABLE = ("math", "phys")


def _check_subject_level(subject, level):
    if subject is not None and subject not in SUBJECTS:
        raise ValueError(f"subject ต้องเป็นหนึ่งใน {SUBJECTS}")
    if level is not None:
        if level not in LEVELS:
            raise ValueError(f"level ต้องเป็นหนึ่งใน {LEVELS}")
        if subject is not None and subject not in LEVELABLE:
            raise ValueError(f"{subject} ไม่มีระดับย่อย (ใช้ได้เฉพาะ {LEVELABLE})")


class CourseBase(BaseModel):
    title: str
    description: str
    price: float
    price_old: Optional[float] = None
    subject: Optional[str] = None          # math | phys | tpat3 | tgat2
    level: Optional[str] = None            # m4 | m5 | m6 | alevel (เฉพาะ math/phys)
    category: str
    thumbnail: Optional[str] = None
    target_audience: Optional[str] = None
    highlights: Optional[str] = None
    is_active: bool = False

    @model_validator(mode="after")
    def _validate(self):
        _check_subject_level(self.subject, self.level)
        return self

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    price_old: Optional[float] = None
    subject: Optional[str] = None
    level: Optional[str] = None
    category: Optional[str] = None
    thumbnail: Optional[str] = None
    target_audience: Optional[str] = None
    highlights: Optional[str] = None
    is_active: Optional[bool] = None

    @model_validator(mode="after")
    def _validate(self):
        _check_subject_level(self.subject, self.level)
        return self

class CourseRead(CourseBase):
    id: int
    total_lessons: int = 0
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class CourseOut(CourseRead):
    pass

# --- Chapters & Lessons ---
class ChapterBase(BaseModel):
    title: str
    order: int

class ChapterCreate(ChapterBase):
    pass

class ChapterRead(ChapterBase):
    id: int
    course_id: int
    class Config: from_attributes = True

class ChapterUpdate(BaseModel):
    title: Optional[str] = None
    order: Optional[int] = None

class LessonBase(BaseModel):
    title: str
    youtube_id: str
    duration: int
    order: int
    doc_url: Optional[str] = None

class LessonCreate(LessonBase):
    pass

class LessonUpdate(BaseModel):
    title: Optional[str] = None
    youtube_id: Optional[str] = None
    duration: Optional[int] = None
    order: Optional[int] = None
    doc_url: Optional[str] = None

class LessonRead(LessonBase):
    id: int
    chapter_id: int
    class Config: from_attributes = True

class LessonOut(LessonRead):
    pass

class ChapterWithLessons(ChapterRead):
    lessons: List[LessonRead] = []
    class Config: from_attributes = True

# --- Enrollment & Progress ---
class EnrollmentRead(BaseModel):
    id: int
    course_id: int
    user_id: int
    enrolled_at: datetime
    class Config: from_attributes = True

class ProgressUpdate(BaseModel):
    seconds_watched: int
    completed: bool = False

class StudyTimeCreate(BaseModel):
    minutes: int

# --- Friends ---
class FriendRead(BaseModel):
    id: int
    full_name: Optional[str]
    nickname: Optional[str]
    email: str
    avatar_url: Optional[str]
    is_online: bool = False
    current_activity: Optional[str] = None
    class Config: from_attributes = True

class FriendRequest(BaseModel):
    email: str

# --- Comments & Ratings ---
class CommentCreate(BaseModel):
    text: str

class CommentRead(BaseModel):
    id: int
    user_id: int
    text: str
    created_at: datetime
    user: UserRead
    class Config: from_attributes = True

class RatingCreate(BaseModel):
    score: int

# --- Coupons ---
class CouponBase(BaseModel):
    code: str
    discount_type: str
    discount_value: float
    max_usage: int = 0
    expires_at: Optional[datetime] = None

class CouponCreate(CouponBase):
    pass

class CouponRead(CouponBase):
    id: int
    current_usage: int
    class Config: from_attributes = True

class CouponOut(CouponRead): 
    pass

class CheckoutCreate(BaseModel):
    """ผู้ใช้กดซื้อคอร์ส -> สร้าง QR พร้อมเพย์ให้สแกน"""
    course_id: int
    coupon_code: Optional[str] = None

class CheckoutRead(BaseModel):
    """ข้อมูลที่หน้า Checkout ต้องใช้เพื่อโชว์ QR + นับถอยหลัง"""
    ref: str
    amount: float
    status: str
    expires_at: datetime
    qr_url: str

class PaymentWebhook(BaseModel):
    """payload ที่เกตเวย์ยิงกลับมาเมื่อผู้ใช้จ่ายสำเร็จ"""
    ref: str
    status: str                       # 'paid' | 'expired' | 'failed'
    charge_id: Optional[str] = None
    amount: Optional[float] = None

class PaymentRead(BaseModel):
    id: int
    user_id: int
    course_id: int
    amount: float
    status: str                       # awaiting | paid | expired
    created_at: datetime
    expires_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    provider: Optional[str] = None
    provider_ref: Optional[str] = None
    coupon_code: Optional[str] = None
    # join fields — populated by crud (Optional เพื่อ backward compat)
    user_email: Optional[str] = None
    user_full_name: Optional[str] = None
    course_title: Optional[str] = None
    class Config: from_attributes = True

# --- Reports ---
class ReportCreate(BaseModel):
    target_type: str
    target_id: Optional[int]
    reason: str

# --- Audit ---
class AuditItem(BaseModel):
    id: int
    action: str
    actor_id: Optional[int]
    target_id: Optional[int]
    data: Optional[str]
    created_at: datetime
    created_at_bkk: str = ""
    created_at_iso_bkk: str = ""
    diff: List[dict] = []

class AuditListResponse(BaseModel):
    items: List[AuditItem]
    meta: dict

# --- Settings ---
class SettingsUpdate(BaseModel):
    banner_active: Optional[bool] = None
    banner_text: Optional[str] = None
    banner_color: Optional[str] = None
    image_banner_active: Optional[bool] = None
    banner_images: Optional[List[str]] = None
    banner_interval: Optional[int] = None
    countdown_active: Optional[bool] = None
    countdown_title: Optional[str] = None
    countdown_date: Optional[str] = None
    countdown_audience: Optional[str] = None

# --- EXAMS SYSTEM (✅ ส่วนที่เพิ่มเข้ามาแก้ Error) ---
class ChoiceBase(BaseModel):
    text: str
    is_correct: bool = False

class ChoiceCreate(ChoiceBase):
    pass

class ChoiceRead(ChoiceBase):
    id: int
    class Config: from_attributes = True

class QuestionBase(BaseModel):
    text: str
    image_url: Optional[str] = None
    question_type: str = "choice"
    order: int = 0

class QuestionCreate(QuestionBase):
    choices: List[ChoiceCreate] = []

class QuestionRead(QuestionBase):
    id: int
    choices: List[ChoiceRead] = []
    class Config: from_attributes = True

class ExamBase(BaseModel):
    title: str
    description: Optional[str] = None
    time_limit: int = 0

class ExamCreate(ExamBase):
    pass

class ExamRead(ExamBase):
    id: int
    questions: List[QuestionRead] = []
    class Config: from_attributes = True

class ExamSubmit(BaseModel):
    answers: Dict[str, Any]


class ExamResultRead(BaseModel):
    id: int
    user_id: int
    exam_id: int
    score: int
    total_score: int
    submitted_at: datetime
    # join + parsed
    exam_title: Optional[str] = None
    answers_dict: Optional[Dict[str, int]] = None
    class Config: from_attributes = True

# --- Other Features ---
class LeaderboardItem(BaseModel):
    id: int
    full_name: str
    avatar_url: Optional[str] = None
    completed_count: int
    total_minutes: int

class BadgeOut(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    category: Optional[str] = None
    is_unlocked: bool
    is_showcased: bool


class UserPublicProfile(BaseModel):
    id: int
    full_name: Optional[str] = None
    nickname: Optional[str] = None
    grade_level: Optional[str] = None
    dek_code: Optional[str] = None
    avatar_url: Optional[str] = None
    total_minutes: int = 0
    showcase_badges: Optional[str] = None
    total_courses: int = 0
    total_completed: int = 0
