"""กีม — XP · เลเวล · สตรีค · เป้าหมายรายวัน · เหรียญ · แจ้งเตือน

รวมไว้ไฟล์เดียวเพราะทุกอย่างผูกกับ "วันไทย" เหมือนกันหมด

------------------------------------------------------------------------
กับดักที่ตั้งใจกันไว้ตั้งแต่แรก (เคยพังกันมาแล้วในระบบแบบนี้)
------------------------------------------------------------------------
1) เขตเวลา
   ไทยคือ UTC+7 ถ้าใช้ utcnow().date() ตรง ๆ "วันใหม่" จะเริ่ม 7 โมงเช้า
   เด็กที่เรียนตอนตี 1 จะถูกนับเป็นเมื่อวาน สตรีคหลุดทั้งที่เรียนทุกวัน
   -> ใช้ th_today() / th_date() เท่านั้น

2) XP เด้งซ้ำ
   client กดซ้ำ / เน็ตหลุดแล้ว retry / ดูบทเรียนเดิมจบอีกรอบ
   -> XpEvent มี unique (user, source, source_key) ให้ DB กันให้เอง
      ไม่ใช่เช็คด้วย if ในโค้ด (แข่งกันเขียนพร้อมกันจะหลุด)

3) เปลี่ยนเป้าหมายรายวันแล้วประวัติเปลี่ยนตาม
   -> DailyActivity เก็บ goal_minutes ของวันนั้นไว้เลย

4) ตัวกันสตรีคหลุด (freeze) โดนกินรวดเดียวหลายใบ
   คนหายไป 5 วันแล้วกลับมา ไม่ควรเสีย freeze 5 ใบเงียบ ๆ
   -> กันได้แค่ "ช่องว่าง 1 วัน" เท่านั้น ขาดเกินนั้นสตรีคเริ่มใหม่

5) Leaderboard ช้าเมื่อคนเยอะ
   -> ไม่ไล่รวม XpEvent ตอนแสดงผล อ่านจาก DailyActivity ที่ index แล้ว
      และ User.xp_total / total_minutes ที่เป็นยอดสรุป

6) ยอดสรุปเพี้ยนจากยอดจริง
   -> recalc_user_totals() คำนวณใหม่จาก ledger ได้ทุกเมื่อ
"""
from datetime import datetime, date, timedelta
from typing import Optional

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from . import models

# ---------------------------------------------------------------------------
# เวลาไทย
# ---------------------------------------------------------------------------
TH_OFFSET = timedelta(hours=7)


def th_now() -> datetime:
    return datetime.utcnow() + TH_OFFSET


def th_date(dt: Optional[datetime] = None) -> date:
    """แปลงเวลา UTC (ที่เก็บใน DB) เป็น 'วันไทย'"""
    return ((dt or datetime.utcnow()) + TH_OFFSET).date()


def th_today() -> date:
    return th_date()


# ---------------------------------------------------------------------------
# เลเวล
# ---------------------------------------------------------------------------
# XP ที่ต้องใช้เพื่อขึ้นจากเลเวล n ไป n+1
#   n=1  -> 100      (เลเวลแรกไวหน่อย ให้รู้สึกว่าขยับได้)
#   n=14 -> 4,000    (ตรงกับตัวเลขในหน้า XP & Level ของดีไซน์)
# อยากปรับความยาก แก้ที่บรรทัดเดียวนี้ ไม่ต้อง migrate อะไร
def xp_to_next(level: int) -> int:
    return 300 * max(1, level) - 200


MAX_LEVEL = 99


def level_for_xp(xp_total: int):
    """คืน (level, xp ที่สะสมอยู่ในเลเวลนี้, xp ที่ต้องใช้จบเลเวลนี้)"""
    lv, remain = 1, max(0, int(xp_total))
    while lv < MAX_LEVEL:
        need = xp_to_next(lv)
        if remain < need:
            break
        remain -= need
        lv += 1
    return lv, remain, xp_to_next(lv)


# ---------------------------------------------------------------------------
# XP
# ---------------------------------------------------------------------------
XP_RULES = {
    "lesson": 20,        # ดูบทเรียนจบ 1 บท
    "exam": 120,         # ทำข้อสอบจบ 1 ชุด
    "streak": 30,        # รักษาสตรีคได้อีก 1 วัน
    "goal": 25,          # ทำครบเป้าหมายรายวัน
    "enroll": 50,        # เริ่มคอร์สใหม่
}


def award_xp(db: Session, user: models.User, source: str, source_key: str,
             amount: Optional[int] = None, note: Optional[str] = None):
    """ให้ XP แบบให้ได้ครั้งเดียวต่อ (source, source_key)

    คืน XpEvent ถ้าให้จริง / None ถ้าเคยให้ไปแล้ว
    ปล่อยให้ DB เป็นคนกันซ้ำ (unique constraint) เพราะถ้าเช็คด้วย SELECT ก่อน
    แล้วมี request สองอันเข้ามาพร้อมกัน จะเล็ดลอดไปได้ทั้งคู่
    """
    amount = XP_RULES.get(source, 10) if amount is None else amount
    ev = models.XpEvent(user_id=user.id, source=source, source_key=str(source_key),
                        amount=amount, note=note)
    db.add(ev)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        return None

    before_level = user.level
    user.xp_total = (user.xp_total or 0) + amount
    user.level = level_for_xp(user.xp_total)[0]

    today = th_today()
    row = _get_or_create_day(db, user, today)
    row.xp += amount

    if user.level > before_level:
        notify(db, user, "achievement",
               f"เลเวลอัป! ตอนนี้ LV {user.level}",
               f"ได้รับ {amount} XP จาก{note or 'การเรียน'} — เก่งขึ้นทุกวัน",
               href="XP & Level.html", dedupe_key=f"level:{user.level}")
    db.commit()
    return ev


# ---------------------------------------------------------------------------
# กิจกรรมรายวัน + สตรีค
# ---------------------------------------------------------------------------

def _get_or_create_day(db: Session, user: models.User, day: date) -> models.DailyActivity:
    row = (db.query(models.DailyActivity)
             .filter_by(user_id=user.id, day=day).first())
    if row:
        return row
    row = models.DailyActivity(
        user_id=user.id, day=day, minutes=0, xp=0,
        goal_minutes=user.daily_goal_minutes or 30, met_goal=False,
    )
    db.add(row)
    try:
        db.flush()
    except IntegrityError:          # แข่งกันสร้างวันเดียวกัน
        db.rollback()
        row = (db.query(models.DailyActivity)
                 .filter_by(user_id=user.id, day=day).first())
    return row


def record_study(db: Session, user: models.User, minutes: int):
    """บันทึกเวลาเรียน แล้วอัปเดตสตรีค / เป้าหมาย / XP ให้ครบในทีเดียว"""
    minutes = max(0, int(minutes))
    if minutes == 0:
        return None

    today = th_today()
    row = _get_or_create_day(db, user, today)
    was_met = row.met_goal
    row.minutes += minutes
    user.total_minutes = (user.total_minutes or 0) + minutes

    if not row.met_goal and row.minutes >= row.goal_minutes:
        row.met_goal = True

    _bump_streak(db, user, today)
    db.commit()

    # ให้ XP หลัง commit เพื่อให้ row วันนี้มีอยู่จริงแล้ว
    if row.met_goal and not was_met:
        award_xp(db, user, "goal", today.isoformat(), note="ทำครบเป้าหมายรายวัน")
    return row


def _bump_streak(db: Session, user: models.User, today: date):
    """อัปเดตสตรีคเมื่อมีการเรียนในวัน `today`

    เรียกซ้ำในวันเดิมได้ ไม่ทำให้สตรีคเพิ่มรัว ๆ
    """
    last = user.last_active_day
    if last == today:
        return                                   # วันนี้นับไปแล้ว

    if last is None:
        user.streak_current = 1
    else:
        gap = (today - last).days
        if gap == 1:
            user.streak_current += 1
        elif gap == 2 and (user.streak_freezes or 0) > 0:
            # ขาดไป 1 วัน — ใช้ตัวกันหลุด 1 ใบ (กันได้แค่ช่องว่างวันเดียว)
            user.streak_freezes -= 1
            missed = today - timedelta(days=1)
            mrow = _get_or_create_day(db, user, missed)
            mrow.freeze_used = True
            user.streak_current += 1
            notify(db, user, "streak", "ตัวกันหลุดช่วยไว้แล้ว ❄️",
                   f"เมื่อวานพลาดไป แต่สตรีคยังอยู่ที่ {user.streak_current} วัน",
                   href="Streak & Daily Goal.html",
                   dedupe_key=f"freeze:{missed.isoformat()}")
        else:
            user.streak_current = 1              # ขาดเกิน 1 วัน เริ่มใหม่

    user.last_active_day = today
    if user.streak_current > (user.streak_best or 0):
        user.streak_best = user.streak_current

    if user.streak_current > 1:
        award_xp(db, user, "streak", today.isoformat(),
                 note=f"สตรีค {user.streak_current} วัน")


def streak_status(db: Session, user: models.User):
    """สถานะสตรีคสำหรับหน้า Streak & Daily Goal

    เผื่อกรณีที่ผู้ใช้หายไปหลายวันแล้วเพิ่งเปิดหน้า — ต้องรายงานว่าหลุดแล้ว
    ถึงแม้ยังไม่มีกิจกรรมใหม่มา trigger การคำนวณ
    """
    today = th_today()
    last = user.last_active_day
    current = user.streak_current or 0
    if last is not None:
        gap = (today - last).days
        if gap >= 2 and not (gap == 2 and (user.streak_freezes or 0) > 0):
            current = 0                          # หลุดแล้ว (ยังไม่เขียนลง DB)
    row = (db.query(models.DailyActivity)
             .filter_by(user_id=user.id, day=today).first())
    return {
        "current": current,
        "best": user.streak_best or 0,
        "freezes": user.streak_freezes or 0,
        "studied_today": bool(row and row.minutes > 0),
        "minutes_today": row.minutes if row else 0,
        "goal_minutes": row.goal_minutes if row else (user.daily_goal_minutes or 30),
        "met_goal_today": bool(row and row.met_goal),
    }


def set_daily_goal(db: Session, user: models.User, minutes: int):
    """เปลี่ยนเป้าหมายรายวัน — มีผลกับวันนี้เป็นต้นไป ไม่ย้อนแก้ประวัติ"""
    minutes = max(5, min(600, int(minutes)))
    user.daily_goal_minutes = minutes
    row = (db.query(models.DailyActivity)
             .filter_by(user_id=user.id, day=th_today()).first())
    if row:
        row.goal_minutes = minutes
        row.met_goal = row.minutes >= minutes
    db.commit()
    return minutes


# ---------------------------------------------------------------------------
# เหรียญ
# ---------------------------------------------------------------------------

def unlock(db: Session, user: models.User, badge_id: str):
    """ปลดล็อกเหรียญ — ได้ครั้งเดียว คืน None ถ้าเคยได้แล้ว"""
    ua = models.UserAchievement(user_id=user.id, achievement_id=badge_id)
    db.add(ua)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        return None
    badge = db.query(models.Achievement).get(badge_id)
    notify(db, user, "achievement", "ปลดล็อกเหรียญใหม่",
           f"“{badge.name if badge else badge_id}” — {badge.description if badge else ''}",
           href="Achievements.html", dedupe_key=f"badge:{badge_id}")
    db.commit()
    return ua


def unlocked_ids(db: Session, user_id: int):
    return {r.achievement_id for r in
            db.query(models.UserAchievement).filter_by(user_id=user_id).all()}


# ---------------------------------------------------------------------------
# แจ้งเตือน
# ---------------------------------------------------------------------------

def notify(db: Session, user: models.User, type_: str, title: str,
           body: str = "", href: Optional[str] = None,
           dedupe_key: Optional[str] = None):
    """สร้างแจ้งเตือน — ถ้ามี dedupe_key แล้วซ้ำ จะไม่สร้างใหม่

    ไม่ commit ในนี้ ปล่อยให้ผู้เรียกคุม transaction เอง
    """
    n = models.Notification(user_id=user.id, type=type_, title=title,
                            body=body, href=href, dedupe_key=dedupe_key)
    db.add(n)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        return None
    return n


def list_notifications(db: Session, user_id: int, limit: int = 50, unread_only: bool = False):
    q = db.query(models.Notification).filter_by(user_id=user_id)
    if unread_only:
        q = q.filter(models.Notification.read_at.is_(None))
    return q.order_by(models.Notification.created_at.desc()).limit(limit).all()


def mark_all_read(db: Session, user_id: int):
    n = (db.query(models.Notification)
           .filter(models.Notification.user_id == user_id,
                   models.Notification.read_at.is_(None))
           .update({models.Notification.read_at: datetime.utcnow()},
                   synchronize_session=False))
    db.commit()
    return n


# ---------------------------------------------------------------------------
# Leaderboard
# ---------------------------------------------------------------------------
PERIODS = ("day", "week", "month", "all")


def _period_start(period: str, today: date) -> Optional[date]:
    if period == "day":
        return today
    if period == "week":
        return today - timedelta(days=today.weekday())      # จันทร์เป็นวันแรก
    if period == "month":
        return today.replace(day=1)
    return None                                              # all


def leaderboard(db: Session, period: str = "week", grade: Optional[str] = None,
                limit: int = 50):
    """อันดับตามเวลาเรียน (นาที) — ตรงกับที่หน้า Leaderboard ใช้

    ช่วง day/week/month อ่านจาก daily_activity (มี index (day, user_id))
    ช่วง all อ่าน User.total_minutes ตรง ๆ ไม่ต้องรวมทั้งตาราง
    """
    if period not in PERIODS:
        period = "week"
    start = _period_start(period, th_today())

    if start is None:
        q = db.query(models.User, models.User.total_minutes.label("minutes"))
        if grade and grade != "all":
            q = q.filter(models.User.grade_level == grade)
        rows = q.order_by(models.User.total_minutes.desc()).limit(limit).all()
    else:
        sub = (db.query(models.DailyActivity.user_id.label("uid"),
                        func.sum(models.DailyActivity.minutes).label("minutes"))
                 .filter(models.DailyActivity.day >= start)
                 .group_by(models.DailyActivity.user_id).subquery())
        q = (db.query(models.User, sub.c.minutes)
               .join(sub, sub.c.uid == models.User.id))
        if grade and grade != "all":
            q = q.filter(models.User.grade_level == grade)
        rows = q.order_by(sub.c.minutes.desc()).limit(limit).all()

    return [
        {
            "rank": i + 1,
            "user_id": u.id,
            "name": u.nickname or u.full_name or u.email.split("@")[0],
            "grade_level": u.grade_level,
            "avatar_url": u.avatar_url,
            "level": u.level,
            "xp_total": u.xp_total,
            "streak": u.streak_current,
            "minutes": int(m or 0),
        }
        for i, (u, m) in enumerate(rows)
    ]


# ---------------------------------------------------------------------------
# ซ่อมข้อมูล
# ---------------------------------------------------------------------------

def recalc_user_totals(db: Session, user: models.User):
    """คำนวณยอดสรุปใหม่จาก ledger — ใช้เวลาข้อมูลเพี้ยนหรือหลัง import

    ไม่แตะ streak_freezes เพราะเป็นของที่ผู้ใช้ได้มา ไม่ใช่ค่าที่คำนวณได้
    """
    user.xp_total = int(db.query(func.coalesce(func.sum(models.XpEvent.amount), 0))
                          .filter(models.XpEvent.user_id == user.id).scalar() or 0)
    user.level = level_for_xp(user.xp_total)[0]
    user.total_minutes = int(db.query(func.coalesce(func.sum(models.DailyActivity.minutes), 0))
                               .filter(models.DailyActivity.user_id == user.id).scalar() or 0)

    days = [r.day for r in (db.query(models.DailyActivity)
                              .filter(models.DailyActivity.user_id == user.id,
                                      models.DailyActivity.minutes > 0)
                              .order_by(models.DailyActivity.day).all())]
    best = cur = 0
    prev = None
    for d in days:
        cur = 1 if (prev is None or (d - prev).days != 1) else cur + 1
        best = max(best, cur)
        prev = d
    user.streak_best = best
    user.last_active_day = days[-1] if days else None
    user.streak_current = cur if days else 0
    db.commit()
    return user
