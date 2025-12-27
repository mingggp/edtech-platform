from sqlalchemy.orm import Session
from . import models
from datetime import datetime, timedelta

# นิยามเหรียญทั้งหมด
ALL_BADGES = [
    {"id": "newbie", "name": "ผู้มาใหม่", "desc": "สมัครสมาชิกเข้าสู่ระบบ", "icon": "👶", "category": "General"},
    {"id": "first_class", "name": "ก้าวแรก", "desc": "กดเข้าเรียนบทเรียนแรก", "icon": "👣", "category": "Learning"},
    {"id": "one_hour", "name": "เครื่องร้อน", "desc": "เรียนสะสมครบ 1 ชั่วโมง", "icon": "⏱️", "category": "Learning"},
    {"id": "supporter", "name": "ป๋าเปย์", "desc": "ซื้อคอร์สเรียน 1 คอร์สขึ้นไป", "icon": "💎", "category": "General"},
    {"id": "night_owl", "name": "นกฮูก", "desc": "เข้าเรียนช่วง 4 ทุ่ม - ตี 2", "icon": "🦉", "category": "Crazy"},
    {"id": "zombie", "name": "ซอมบี้", "desc": "ยังไม่นอนอีกหรอ? (เรียนช่วง ตี 3 - ตี 5)", "icon": "🧟", "category": "Crazy"},
    {"id": "weekend_warrior", "name": "นักรบวันหยุด", "desc": "ขยันเรียนในวันเสาร์-อาทิตย์", "icon": "🏖️", "category": "Crazy"},
]

def check_badges(db: Session, user: models.User):
    unlocked = []
    
    # 1. Newbie (ได้ทุกคน)
    unlocked.append("newbie")

    # 2. Supporter (มี Enrollment)
    enroll_count = db.query(models.Enrollment).filter(models.Enrollment.user_id == user.id).count()
    if enroll_count > 0:
        unlocked.append("supporter")

    # 3. Time Based (1 Hour)
    if user.total_minutes >= 60:
        unlocked.append("one_hour")

    # --- เช็คจากประวัติการเรียน (Logs) ---
    # ดึง log 50 รายการล่าสุดมาเช็คพฤติกรรม
    logs = db.query(models.StudyLog).filter(models.StudyLog.user_id == user.id).order_by(models.StudyLog.created_at.desc()).limit(50).all()
    
    if logs:
        unlocked.append("first_class") # มี log แปลว่าเคยเรียน
        
        has_night = False
        has_zombie = False
        has_weekend = False

        for log in logs:
            # แปลงเวลาเป็นเวลาไทยคร่าวๆ (UTC+7)
            th_time = log.created_at + timedelta(hours=7)
            hour = th_time.hour
            weekday = th_time.weekday() # 5=Sat, 6=Sun

            if 22 <= hour or hour <= 2: has_night = True
            if 3 <= hour <= 5: has_zombie = True
            if weekday in [5, 6]: has_weekend = True

        if has_night: unlocked.append("night_owl")
        if has_zombie: unlocked.append("zombie")
        if has_weekend: unlocked.append("weekend_warrior")

    return unlocked

def get_user_badges_status(db: Session, user: models.User):
    my_unlocks = set(check_badges(db, user))
    my_showcase = user.showcase_badges.split(",") if user.showcase_badges else []
    
    result = []
    for b in ALL_BADGES:
        item = b.copy()
        item["is_unlocked"] = b["id"] in my_unlocks
        item["is_showcased"] = b["id"] in my_showcase
        result.append(item)
    
    return result