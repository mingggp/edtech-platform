from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, DateTime, Text
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    nickname = Column(String, nullable=True)
    grade_level = Column(String, nullable=True)
    dek_code = Column(String, nullable=True)
    role = Column(String, default="student")
    
    total_minutes = Column(Integer, default=0)
    last_login = Column(DateTime, default=datetime.utcnow)
    is_online = Column(Boolean, default=False)
    current_activity = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    showcase_badges = Column(String, nullable=True, default="") 
    
    # ✅ เพิ่ม created_at
    created_at = Column(DateTime, default=datetime.utcnow)

    enrollments = relationship("Enrollment", back_populates="user")
    payments = relationship("Payment", back_populates="user")
    study_logs = relationship("StudyLog", back_populates="user")
    comments = relationship("Comment", back_populates="user")
    ratings = relationship("Rating", back_populates="user")
    friends = relationship("Friend", foreign_keys="[Friend.user_id]", back_populates="user")

class Friend(Base):
    __tablename__ = "friends"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    friend_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", foreign_keys=[user_id], back_populates="friends")
    friend = relationship("User", foreign_keys=[friend_id])

class StudyLog(Base):
    __tablename__ = "study_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    minutes = Column(Integer)
    # ✅ เพิ่ม created_at
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="study_logs")

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    price = Column(Float, default=0.0)
    category = Column(String, default="General") 
    thumbnail = Column(String, nullable=True)
    highlights = Column(String, nullable=True) 
    target_audience = Column(String, nullable=True)
    # ✅ เพิ่ม created_at
    created_at = Column(DateTime, default=datetime.utcnow)
    
    chapters = relationship("Chapter", back_populates="course", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="course")

class Chapter(Base):
    __tablename__ = "chapters"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    title = Column(String)
    order = Column(Integer)
    
    course = relationship("Course", back_populates="chapters")
    lessons = relationship("Lesson", back_populates="chapter", cascade="all, delete-orphan")

class Lesson(Base):
    __tablename__ = "lessons"
    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id"))
    title = Column(String)
    youtube_id = Column(String)
    duration = Column(Integer, default=0)
    order = Column(Integer)
    doc_url = Column(String, nullable=True)
    
    chapter = relationship("Chapter", back_populates="lessons")
    progress = relationship("Progress", back_populates="lesson", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="lesson")
    ratings = relationship("Rating", back_populates="lesson")

class Enrollment(Base):
    __tablename__ = "enrollments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="enrollments")
    # ✅ FIX: แก้ back_populates ให้ตรงกับ Class Course ("enrollments")
    course = relationship("Course", back_populates="enrollments")

class Progress(Base):
    __tablename__ = "progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    completed = Column(Boolean, default=False)
    seconds_watched = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    lesson = relationship("Lesson", back_populates="progress")

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    slip_url = Column(String)
    amount = Column(Float)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="payments")

class Coupon(Base):
    __tablename__ = "coupons"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    discount_type = Column(String)
    discount_value = Column(Float)
    max_usage = Column(Integer, default=0)
    current_usage = Column(Integer, default=0)
    expires_at = Column(DateTime, nullable=True)

class Exam(Base):
    __tablename__ = "exams"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String, nullable=True)
    time_limit = Column(Integer, default=0)
    questions = relationship("Question", back_populates="exam", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"))
    text = Column(String)
    image_url = Column(String, nullable=True)
    question_type = Column(String, default="choice")
    order = Column(Integer)
    exam = relationship("Exam", back_populates="questions")
    choices = relationship("Choice", back_populates="question", cascade="all, delete-orphan")

class Choice(Base):
    __tablename__ = "choices"
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"))
    text = Column(String)
    is_correct = Column(Boolean, default=False)
    question = relationship("Question", back_populates="choices")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    text = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="comments")
    lesson = relationship("Lesson", back_populates="comments")

class Rating(Base):
    __tablename__ = "ratings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    score = Column(Integer)
    user = relationship("User", back_populates="ratings")
    lesson = relationship("Lesson", back_populates="ratings")

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    target_type = Column(String)
    target_id = Column(Integer, nullable=True)
    reason = Column(String)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

# ✅ FIX: ชื่อคลาส Setting (ไม่ต้องใช้ SystemSetting)
class Setting(Base):
    __tablename__ = "settings"
    key = Column(String, primary_key=True, index=True)
    value = Column(String)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String)
    actor_id = Column(Integer, nullable=True)
    target_id = Column(Integer, nullable=True)
    data = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)