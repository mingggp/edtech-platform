from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any, Dict
from datetime import datetime

# --- Token ---
class Token(BaseModel):
    access_token: str
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
class CourseBase(BaseModel):
    title: str
    description: str
    price: float
    category: str
    thumbnail: Optional[str] = None
    target_audience: Optional[str] = None
    highlights: Optional[str] = None

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    thumbnail: Optional[str] = None
    target_audience: Optional[str] = None
    highlights: Optional[str] = None

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

# --- Payments ---
class PaymentCreate(BaseModel):
    course_id: int
    amount: float
    slip_url: str

class PaymentRead(BaseModel):
    id: int
    user_id: int
    course_id: int
    amount: float
    status: str
    created_at: datetime
    slip_url: str
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
    total_minutes: int
    showcase_badges: Optional[str] = None
    
    # สถิติเพิ่มเติมที่คำนวณมา
    total_courses: int
    total_completed: int