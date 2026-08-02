from pydantic import BaseModel, EmailStr, Field, PlainSerializer, model_validator
from typing import Annotated, List, Optional, Any, Dict
from datetime import datetime, timezone


# ---------------------------------------------------------------------------
# เวลา — ต้องบอก timezone ติดไปด้วยเสมอ
# ---------------------------------------------------------------------------
# ทั้งระบบเก็บเวลาเป็น UTC แบบ "ไม่ติด timezone" (datetime.utcnow) ในฐานข้อมูล
# ซึ่งใช้ได้ตราบใดที่ฝั่ง Python คุยกันเอง เพราะเทียบกันด้วยมาตรฐานเดียวกัน
#
# ปัญหาอยู่ตอนส่งออกเป็น JSON:  "2026-08-02T13:58:53"  ไม่มี Z ไม่มี +00:00
# JavaScript เจอสตริงแบบนี้จะตีความเป็น "เวลาท้องถิ่น" ตามสเปก
# เครื่องที่ตั้งเวลาไทย (UTC+7) จึงอ่านเป็นเวลาที่ผ่านมาแล้ว 7 ชั่วโมง
#
# ของจริงที่เกิดขึ้น: QR ที่เพิ่งสร้างสด ๆ อายุ 15 นาที พอถึงเบราว์เซอร์กลายเป็น
# "หมดอายุไปแล้ว 405 นาที" -> หน้าจ่ายเงินขึ้น "QR หมดอายุแล้ว" ทันทีที่เปิด
# กดสร้างใหม่ก็เด้งกลับมาหน้าเดิมทุกครั้ง = นักเรียนจ่ายเงินไม่ได้เลยสักคน
#
# ทางแก้: เติม timezone ตอน serialize ให้ทุกฟิลด์ที่เป็นเวลา
# ใช้ UtcDatetime แทน datetime ในทุก schema ที่ส่งออก (มีเทสต์บังคับไว้)
def _to_utc_iso(dt: datetime) -> str:
    if dt.tzinfo is None:                       # ค่าจากฐานข้อมูล = UTC แต่ไม่ติดป้าย
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


UtcDatetime = Annotated[
    datetime,
    PlainSerializer(_to_utc_iso, return_type=str, when_used="json"),
]

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
    created_at: Optional[UtcDatetime] = None
    
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
# ป้ายบนการ์ดคอร์ส — แอดมินเลือกเอง (ไม่ได้คำนวณ)
RIBBONS = ("hot", "new", "rec", "free")


def _check_subject_level(subject, level):
    if subject is not None and subject not in SUBJECTS:
        raise ValueError(f"subject ต้องเป็นหนึ่งใน {SUBJECTS}")
    if level is not None:
        if level not in LEVELS:
            raise ValueError(f"level ต้องเป็นหนึ่งใน {LEVELS}")
        if subject is not None and subject not in LEVELABLE:
            raise ValueError(f"{subject} ไม่มีระดับย่อย (ใช้ได้เฉพาะ {LEVELABLE})")


def _check_ribbon(ribbon):
    if ribbon is not None and ribbon not in RIBBONS:
        raise ValueError(f"ribbon ต้องเป็นหนึ่งใน {RIBBONS} หรือเว้นว่าง")


class CourseBase(BaseModel):
    title: str
    description: str
    price: float
    price_old: Optional[float] = None
    subject: Optional[str] = None          # math | phys | tpat3 | tgat2
    level: Optional[str] = None            # m4 | m5 | m6 | alevel (เฉพาะ math/phys)
    ribbon: Optional[str] = None           # hot | new | rec | free
    category: str
    thumbnail: Optional[str] = None
    target_audience: Optional[str] = None
    highlights: Optional[str] = None
    is_active: bool = False

    @model_validator(mode="after")
    def _validate(self):
        _check_subject_level(self.subject, self.level)
        _check_ribbon(self.ribbon)
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
    ribbon: Optional[str] = None
    category: Optional[str] = None
    thumbnail: Optional[str] = None
    target_audience: Optional[str] = None
    highlights: Optional[str] = None
    is_active: Optional[bool] = None

    @model_validator(mode="after")
    def _validate(self):
        _check_subject_level(self.subject, self.level)
        _check_ribbon(self.ribbon)
        return self

class CourseRead(CourseBase):
    id: int
    # ค่าคำนวณจาก models.Course — ไม่มีในตาราง ไม่ต้องกรอก
    total_lessons: int = 0        # จำนวนบทเรียนทั้งหมด
    total_videos: int = 0         # เฉพาะคลิปวิดีโอ
    total_exercises: int = 0      # เฉพาะแบบฝึกหัด
    total_minutes: int = 0        # ความยาวรวม (นาที)
    student_count: int = 0        # จำนวนคนที่ลงเรียน
    created_at: Optional[UtcDatetime] = None

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

LESSON_KINDS = ("video", "quiz", "doc")


class LessonBase(BaseModel):
    title: str
    kind: str = "video"           # video | quiz | doc
    youtube_id: str
    duration: int
    order: int
    doc_url: Optional[str] = None

    @model_validator(mode="after")
    def _validate_kind(self):
        if self.kind not in LESSON_KINDS:
            raise ValueError(f"kind ต้องเป็นหนึ่งใน {LESSON_KINDS}")
        return self

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
    enrolled_at: UtcDatetime
    class Config: from_attributes = True

class ProgressUpdate(BaseModel):
    seconds_watched: int
    completed: bool = False

class StudyTimeCreate(BaseModel):
    minutes: int

class DailyGoalUpdate(BaseModel):
    """เป้าหมายรายวัน (นาที) — จำกัดช่วงไว้กันค่าเพี้ยนจาก client"""
    minutes: int = Field(ge=5, le=600)

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
    created_at: UtcDatetime
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
    expires_at: Optional[UtcDatetime] = None

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
    expires_at: UtcDatetime
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
    created_at: UtcDatetime
    expires_at: Optional[UtcDatetime] = None
    paid_at: Optional[UtcDatetime] = None
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
    created_at: UtcDatetime
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
    submitted_at: UtcDatetime
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
