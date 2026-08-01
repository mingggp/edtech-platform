from sqlalchemy import (
    Column, Integer, String, Boolean, ForeignKey, Float, DateTime, Date, Text,
    UniqueConstraint, Index,
)
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

    # ---- กีม (XP / เลเวล / สตรีค) --------------------------------------
    # ค่าพวกนี้เป็น "ยอดสรุป" เพื่อให้หน้า Dashboard/Leaderboard อ่านเร็ว
    # ความจริงอยู่ที่ xp_events + daily_activity — คำนวณกลับได้เสมอ
    # (ดู gamification.recalc_user_totals ถ้าข้อมูลเพี้ยน)
    xp_total = Column(Integer, default=0, nullable=False)
    level = Column(Integer, default=1, nullable=False)
    streak_current = Column(Integer, default=0, nullable=False)
    streak_best = Column(Integer, default=0, nullable=False)
    streak_freezes = Column(Integer, default=2, nullable=False)   # ตัวกันสตรีคหลุด
    daily_goal_minutes = Column(Integer, default=30, nullable=False)
    last_active_day = Column(Date, nullable=True)                 # วันที่ล่าสุด (เวลาไทย)

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
    price_old = Column(Float, nullable=True)          # ราคาก่อนลด (ขีดฆ่าบนการ์ด)

    # วิชา — ต้องเป็น 1 ใน 4 นี้เท่านั้น ตรงกับ subjects.js ฝั่งหน้าเว็บ
    #   math | phys | tpat3 | tgat2       (ห้ามเพิ่ม ห้ามใช้ชื่อไทยเป็นคีย์)
    subject = Column(String, index=True, nullable=True)
    # ระดับ — ใช้ได้เฉพาะ math / phys เท่านั้น  m4 | m5 | m6 | alevel
    # tpat3 / tgat2 ต้องเป็น None
    level = Column(String, index=True, nullable=True)

    # ป้ายการตลาดบนการ์ดคอร์ส — แอดมินเลือกเอง ไม่ได้คำนวณจากอะไร
    #   hot = ขายดี · new = มาใหม่ · rec = แนะนำ · free = เรียนฟรี · None = ไม่มีป้าย
    ribbon = Column(String, nullable=True)

    category = Column(String, default="General")      # legacy — ใช้ subject แทน
    thumbnail = Column(String, nullable=True)
    highlights = Column(String, nullable=True) 
    target_audience = Column(String, nullable=True)
    # ✅ เพิ่ม is_active
    is_active = Column(Boolean, default=False)
    # ✅ เพิ่ม created_at
    created_at = Column(DateTime, default=datetime.utcnow)
    
    chapters = relationship("Chapter", back_populates="course", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="course")

    # ------------------------------------------------------------------
    # ค่าที่คำนวณจากข้อมูลที่มีอยู่ — ไม่ต้องกรอกเอง ไม่มีวันไม่ตรงกับของจริง
    #
    # ⚠️ property พวกนี้ต้องโหลด relationship ก่อน ถ้าไม่ eager load
    #    การ list คอร์ส 14 ตัวจะยิง query เพิ่มอีกหลายสิบครั้ง (N+1)
    #    -> crud.list_courses ใส่ selectinload ไว้แล้ว
    # ------------------------------------------------------------------

    @property
    def total_lessons(self) -> int:
        """จำนวนบทเรียนทั้งหมดในคอร์ส"""
        if not self.chapters:
            return 0
        return sum(len(ch.lessons) for ch in self.chapters)

    @property
    def total_minutes(self) -> int:
        """ความยาวรวมของคอร์ส (นาที) — บวกจาก Lesson.duration ทุกบท

        Lesson.duration เก็บเป็น "นาที" (ดู config.get_youtube_duration)
        """
        if not self.chapters:
            return 0
        return sum((l.duration or 0) for ch in self.chapters for l in ch.lessons)

    @property
    def _all_lessons(self):
        return [l for ch in (self.chapters or []) for l in ch.lessons]

    @property
    def total_videos(self) -> int:
        """จำนวนคลิปวิดีโอ"""
        return sum(1 for l in self._all_lessons if l.kind == "video")

    @property
    def total_exercises(self) -> int:
        """จำนวนแบบฝึกหัด/แบบทดสอบท้ายบท"""
        return sum(1 for l in self._all_lessons if l.kind == "quiz")

    @property
    def student_count(self) -> int:
        """จำนวนคนที่ลงเรียนคอร์สนี้"""
        return len(self.enrollments or [])


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
    # ประเภทบทเรียน — video = คลิปสอน · quiz = แบบฝึกหัด · doc = เอกสาร/ชีท
    # ใช้แยกนับ "จำนวนคลิป" กับ "จำนวนแบบฝึกหัด" บนหน้ารายละเอียดคอร์ส
    kind = Column(String, default="video", nullable=False)
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
    """การชำระเงินผ่าน PromptPay — ยืนยันอัตโนมัติด้วย webhook จากเกตเวย์

    ไม่มีการอัปโหลดสลิป และไม่มีสถานะ "รอแอดมินอนุมัติ" (ดู CLAUDE.md)
    แอดมินดูรายการได้อย่างเดียว กดอนุมัติเองไม่ได้

    สถานะ:
      awaiting  สร้าง QR แล้ว รอผู้ใช้จ่ายภายใน expires_at (ชั่วคราว หน้า
                แอดมินไม่แสดงโดยปริยาย — ไม่ใช่คิวให้ตรวจ)
      paid      เกตเวย์ยืนยันแล้ว ระบบเปิดคอร์สให้อัตโนมัติ
      expired   QR หมดอายุก่อนจ่าย ผู้ใช้สร้างใหม่ได้ทันที
    """
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    amount = Column(Float)
    status = Column(String, default="awaiting", index=True)

    # เกตเวย์ (Opn / 2C2P / GB Prime Pay)
    provider = Column(String, default="promptpay")
    provider_ref = Column(String, unique=True, index=True)   # อ้างอิงที่เราสร้าง ส่งให้เกตเวย์
    charge_id = Column(String, nullable=True)                # id ฝั่งเกตเวย์ (ได้ตอน webhook)
    coupon_code = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)             # QR ใช้ได้ถึงเมื่อไหร่
    paid_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="payments")

    @property
    def is_expired(self):
        return (
            self.status == "awaiting"
            and self.expires_at is not None
            and self.expires_at < datetime.utcnow()
        )

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


class ExamResult(Base):
    """บันทึกผลการสอบของผู้ใช้แต่ละครั้ง — ใช้ดูประวัติ + leaderboard.

    answers JSON shape: {"<question_id>": <choice_id>}  (string keys for JSON compat)
    """
    __tablename__ = "exam_results"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), index=True)
    score = Column(Integer, default=0)         # คะแนนที่ได้
    total_score = Column(Integer, default=0)   # คะแนนเต็ม
    answers = Column(String, nullable=True)    # JSON dump
    submitted_at = Column(DateTime, default=datetime.utcnow)

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


# ===========================================================================
#  กีม — XP · สตรีค · เหรียญ · แจ้งเตือน
#  หมายเหตุสำคัญ: "วัน" ในระบบนี้คือวันตามเวลาไทย (UTC+7) เสมอ
#  ดู gamification.th_today() — ห้ามใช้ datetime.utcnow().date() ตรง ๆ
#  ไม่งั้นสตรีคจะตัดตอน 7 โมงเช้าแทนที่จะเป็นเที่ยงคืน
# ===========================================================================

class XpEvent(Base):
    """บันทึกทุกครั้งที่ได้ XP — เป็นแหล่งความจริง ยอดรวมใน User คือสรุป

    (source, source_key) ต้องไม่ซ้ำต่อผู้ใช้ 1 คน เพื่อกัน XP เด้งซ้ำ
    เช่น ดูบทเรียนเดิมจบรอบสอง หรือ client ยิง API ซ้ำ
      source='lesson'  source_key='42'
      source='exam'    source_key='result:918'
      source='streak'  source_key='2026-07-28'
    """
    __tablename__ = "xp_events"
    __table_args__ = (
        UniqueConstraint("user_id", "source", "source_key", name="uq_xp_once"),
        Index("ix_xp_user_created", "user_id", "created_at"),
    )
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    source = Column(String, nullable=False)
    source_key = Column(String, nullable=False)
    amount = Column(Integer, nullable=False)
    note = Column(String, nullable=True)              # ข้อความที่โชว์ในไทม์ไลน์ XP
    created_at = Column(DateTime, default=datetime.utcnow)


class DailyActivity(Base):
    """สรุปการเรียนราย "วันไทย" — ใช้ทำสตรีค เป้าหมายรายวัน และ leaderboard

    goal_minutes เก็บค่าเป้าหมาย ณ วันนั้น (ไม่ใช่อ่านจาก User ตอนแสดงผล)
    ไม่งั้นพอผู้ใช้เปลี่ยนเป้าหมาย ประวัติย้อนหลังจะเปลี่ยนตามไปด้วย
    """
    __tablename__ = "daily_activity"
    __table_args__ = (
        UniqueConstraint("user_id", "day", name="uq_daily_once"),
        Index("ix_daily_day_user", "day", "user_id"),
    )
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    day = Column(Date, nullable=False)               # วันตามเวลาไทย
    minutes = Column(Integer, default=0, nullable=False)
    xp = Column(Integer, default=0, nullable=False)
    goal_minutes = Column(Integer, default=30, nullable=False)
    met_goal = Column(Boolean, default=False, nullable=False)
    freeze_used = Column(Boolean, default=False, nullable=False)   # วันนี้ถูกกันหลุดไว้


class Achievement(Base):
    """แคตตาล็อกเหรียญ — id ต้องตรงกับ data-badge ใน Achievements.html"""
    __tablename__ = "achievements"
    id = Column(String, primary_key=True)            # newbie, hotstreak, ...
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    tier = Column(String, default="common")          # common | rare | epic | legend
    icon = Column(String, nullable=True)
    category = Column(String, default="General")
    sort_order = Column(Integer, default=0)


class UserAchievement(Base):
    """เหรียญที่ปลดล็อกแล้ว — unique กันปลดซ้ำและเก็บวันที่ไว้โชว์"""
    __tablename__ = "user_achievements"
    __table_args__ = (
        UniqueConstraint("user_id", "achievement_id", name="uq_badge_once"),
    )
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    achievement_id = Column(String, ForeignKey("achievements.id"), index=True)
    unlocked_at = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    """แจ้งเตือนในเว็บ — type ตรงกับที่ notifications.js ใช้

    dedupe_key กันแจ้งซ้ำ เช่น เตือน "สตรีคใกล้หลุด" วันละครั้งพอ
    ใช้ค่า None ได้ถ้าไม่ต้องกันซ้ำ (SQLite/Postgres ยอมให้ NULL ซ้ำได้ใน unique)
    """
    __tablename__ = "notifications"
    __table_args__ = (
        UniqueConstraint("user_id", "dedupe_key", name="uq_notif_dedupe"),
        Index("ix_notif_user_created", "user_id", "created_at"),
    )
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    type = Column(String, nullable=False)            # payment|streak|achievement|exam|lesson|social|system
    title = Column(String, nullable=False)
    body = Column(String, nullable=True)
    href = Column(String, nullable=True)
    dedupe_key = Column(String, nullable=True)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
