"""แคตตาล็อกเหรียญ + เงื่อนไขปลดล็อก

id ทุกตัวต้องตรงกับ data-badge ใน Achievements.html ห้ามเปลี่ยนพลการ
เพราะหน้าเว็บอ้างด้วย id นี้ และ UserAchievement เก็บ id ไว้เป็น FK

เพิ่มเหรียญใหม่: ใส่ใน CATALOG แล้วเขียนเงื่อนไขใน RULES
ลบเหรียญ: อย่าลบ row ออกจาก DB (คนที่ปลดไปแล้วจะพัง) ให้ตั้ง sort_order=-1 แทน
"""
from datetime import timedelta

from sqlalchemy.orm import Session

from . import models
from .gamification import th_date

CATALOG = [
    # id,          ชื่อ,           คำอธิบาย,                                        tier,      icon, หมวด
    ("newbie",    "ผู้มาใหม่",     "สมัครสมาชิกและยืนยันอีเมลสำเร็จ",                "common",  "👶", "General"),
    ("firststep", "ก้าวแรก",       "กดเข้าเรียนบทเรียนแรก",                          "common",  "👣", "Learning"),
    ("collector", "นักสะสม",       "บันทึกคอร์สไว้ดูทีหลังครบ 10 คอร์ส",             "common",  "📚", "General"),
    ("payer",     "ป๋าเปย์",       "ลงทุนกับตัวเอง — ซื้อคอร์สแรกสำเร็จ",            "rare",    "💎", "General"),
    ("hotstreak", "เครื่องร้อน",   "เรียนต่อเนื่อง 7 วันไม่ขาด",                     "rare",    "🔥", "Streak"),
    ("nightowl",  "นกฮูก",         "เรียนหลังเที่ยงคืนครบ 10 ครั้ง",                 "rare",    "🦉", "Crazy"),
    ("marathon",  "มาราธอน",       "เรียนสะสมครบ 100 ชั่วโมง",                       "epic",    "🏃", "Learning"),
    ("weekend",   "นักรบวันหยุด",  "เรียนในวันเสาร์–อาทิตย์ครบ 10 ครั้ง",            "epic",    "🏖️", "Crazy"),
    ("zombie",    "ซอมบี้",        "เรียนทุกวันไม่ขาดครบ 100 วันต่อเนื่อง",          "legend",  "🧟", "Crazy"),
]


def seed(db: Session):
    """เขียนแคตตาล็อกลง DB — เรียกซ้ำได้ (อัปเดตข้อความให้ตรงของใหม่)"""
    for i, (bid, name, desc, tier, icon, cat) in enumerate(CATALOG):
        row = db.query(models.Achievement).get(bid)
        if row is None:
            db.add(models.Achievement(id=bid, name=name, description=desc,
                                      tier=tier, icon=icon, category=cat, sort_order=i))
        else:
            row.name, row.description, row.tier = name, desc, tier
            row.icon, row.category, row.sort_order = icon, cat, i
    db.commit()


# ---------------------------------------------------------------------------
# เงื่อนไขปลดล็อก
# ---------------------------------------------------------------------------
# แต่ละอันคืน True/False จาก state ที่ส่งเข้ามา
# เขียนเป็นฟังก์ชันบริสุทธิ์เพื่อให้เทสต์ง่ายและไม่ยิง query ซ้ำซ้อน

def _night_count(db: Session, user_id: int) -> int:
    """จำนวนครั้งที่เรียนช่วงหลังเที่ยงคืน–ตี 5 (เวลาไทย)"""
    logs = db.query(models.StudyLog).filter(models.StudyLog.user_id == user_id).all()
    return sum(1 for l in logs if 0 <= (l.created_at + timedelta(hours=7)).hour < 5)


def _weekend_count(db: Session, user_id: int) -> int:
    rows = db.query(models.DailyActivity).filter(
        models.DailyActivity.user_id == user_id,
        models.DailyActivity.minutes > 0).all()
    return sum(1 for r in rows if r.day.weekday() >= 5)


def check_all(db: Session, user: models.User):
    """ตรวจทุกเหรียญแล้วปลดอันที่เข้าเงื่อนไข — คืน list ของ id ที่เพิ่งปลด

    ปลอดภัยเมื่อเรียกบ่อย: unlock() กันซ้ำด้วย unique constraint อยู่แล้ว
    """
    from .gamification import unlock, unlocked_ids

    have = unlocked_ids(db, user.id)
    newly = []

    def try_unlock(bid, cond):
        if bid in have or not cond:
            return
        if unlock(db, user, bid):
            newly.append(bid)

    enrolled = db.query(models.Enrollment).filter_by(user_id=user.id).count()
    paid = db.query(models.Payment).filter_by(user_id=user.id, status="paid").count()
    lessons_done = db.query(models.Progress).filter_by(user_id=user.id, completed=True).count()

    try_unlock("newbie", True)
    try_unlock("firststep", lessons_done >= 1)
    try_unlock("collector", enrolled >= 10)
    try_unlock("payer", paid >= 1)
    try_unlock("hotstreak", (user.streak_current or 0) >= 7 or (user.streak_best or 0) >= 7)
    try_unlock("marathon", (user.total_minutes or 0) >= 100 * 60)
    try_unlock("zombie", (user.streak_best or 0) >= 100)
    # สองอันนี้ต้องนับจากตาราง — เช็คทีหลังเพื่อไม่ให้ query ถ้าไม่จำเป็น
    if "nightowl" not in have:
        try_unlock("nightowl", _night_count(db, user.id) >= 10)
    if "weekend" not in have:
        try_unlock("weekend", _weekend_count(db, user.id) >= 10)

    return newly
