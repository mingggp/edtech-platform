# backend/app/schemas.py
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel): email: EmailStr; full_name: Optional[str] = None
class UserCreate(UserBase): password: str
class UserLogin(BaseModel): email: EmailStr; password: str
class Token(BaseModel): access_token: str; token_type: str = "bearer"
class UserUpdate(BaseModel): full_name: Optional[str]=None; avatar_url: Optional[str]=None; bio: Optional[str]=None; grade_level: Optional[str]=None
class PasswordChange(BaseModel): old_password: str; new_password: str
class UserRead(BaseModel):
    email: str; full_name: Optional[str]=None; id: int; is_active: bool; created_at: datetime; role: str; avatar_url: Optional[str]=None; bio: Optional[str]=None; grade_level: Optional[str]=None; dek_code: Optional[int]=None; last_login: Optional[datetime]=None; current_activity: Optional[str]=None; is_online: bool=False
    model_config = ConfigDict(from_attributes=True)
class PageMeta(BaseModel): page: int; page_size: int; total: int
class AdminUserListResponse(BaseModel): items: List[UserRead]; meta: PageMeta
class AdminUserUpdate(BaseModel): full_name: Optional[str]=None; role: Optional[str]=None; is_active: Optional[bool]=None; bio: Optional[str]=None; grade_level: Optional[str]=None
class AdminUserCreate(BaseModel): email: EmailStr; password: str; full_name: Optional[str]=None; role: Optional[str]=None; is_active: Optional[bool]=None; grade_level: Optional[str]=None
class LessonBase(BaseModel): title: str; youtube_id: str; doc_url: Optional[str]=None; order: int=0
class LessonCreate(LessonBase): pass
class LessonUpdate(BaseModel): title: Optional[str]=None; youtube_id: Optional[str]=None; doc_url: Optional[str]=None; order: Optional[int]=None
class LessonRead(LessonBase): id: int; course_id: int; model_config = ConfigDict(from_attributes=True)
class CourseBase(BaseModel): title: str; description: Optional[str]=None; thumbnail: Optional[str]=None
class CourseCreate(CourseBase): price: float=0.0
class CourseUpdate(BaseModel): title: Optional[str]=None; description: Optional[str]=None; thumbnail: Optional[str]=None; price: Optional[float]=None
class CourseRead(CourseBase): id: int; created_at: datetime; price: float=0.0; lessons: List[LessonRead]=[]; model_config = ConfigDict(from_attributes=True)
class EnrollmentRead(BaseModel): id: int; course_id: int; user_id: int; enrolled_at: datetime; course: Optional[CourseRead]=None; model_config = ConfigDict(from_attributes=True)
class ChoiceBase(BaseModel): text: str; is_correct: bool=False
class ChoiceRead(BaseModel): id: int; text: str; model_config = ConfigDict(from_attributes=True)
class QuestionCreate(BaseModel): text: str; order: int=0; choices: List[ChoiceBase]
class QuestionRead(BaseModel): id: int; text: str; order: int; choices: List[ChoiceRead]; model_config = ConfigDict(from_attributes=True)
class ExamCreate(BaseModel): title: str; description: Optional[str]=None; time_limit: int=60
class ExamRead(BaseModel): id: int; title: str; description: Optional[str]=None; time_limit: int; questions: List[QuestionRead]=[]; model_config = ConfigDict(from_attributes=True)
class AnswerItem(BaseModel): question_id: int; choice_id: int
class ExamSubmit(BaseModel): answers: List[AnswerItem]
class ExamResultRead(BaseModel): id: int; score: int; total_score: int; submitted_at: datetime; exam: Optional[ExamRead]=None; model_config = ConfigDict(from_attributes=True)
class DiffItem(BaseModel): field: str; before: Optional[str]=None; after: Optional[str]=None; status: str
class AuditItem(BaseModel): id: int; action: str; actor_id: Optional[int]=None; target_id: Optional[int]=None; data: Optional[str]=None; created_at: datetime; created_at_bkk: str; created_at_iso_bkk: str; diff: Optional[List[DiffItem]]=None; model_config = ConfigDict(from_attributes=True)
class AuditListResponse(BaseModel): items: List[AuditItem]; meta: PageMeta
class FriendRead(BaseModel): id: int; email: str; full_name: Optional[str]=None; avatar_url: Optional[str]=None; is_online: bool=False; current_activity: Optional[str]=None; model_config = ConfigDict(from_attributes=True)
class LeaderboardItem(BaseModel): id: int; full_name: str; avatar_url: Optional[str]=None; completed_count: int
class ActivityUpdate(BaseModel): activity: str
class PaymentRead(BaseModel): id: int; user_id: int; course_id: int; slip_url: str; amount: float; status: str; created_at: datetime; user: Optional[UserRead]=None; course: Optional[CourseRead]=None; model_config = ConfigDict(from_attributes=True)

# --- Settings Schema (Updated) ---
class SettingsUpdate(BaseModel):
    countdown_title: Optional[str] = None
    countdown_date: Optional[str] = None
    countdown_active: Optional[bool] = None
    banner_text: Optional[str] = None
    banner_active: Optional[bool] = None
    image_banner_active: Optional[bool] = None
    banner_interval: Optional[int] = None # <-- เพิ่มตัวนี้