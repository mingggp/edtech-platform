import time
from typing import List
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, Body
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import get_db
from .. import grades, schemas, crud, models
from ..auth import get_current_user
from ..models import User
from ..schemas import UserUpdateMe
from ..badges import get_user_badges_status
from ..config import UPLOAD_DIR

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=schemas.UserRead)
def read_me(u=Depends(get_current_user)):
    return u

@router.patch("/me")
def update_user_me(user_data: UserUpdateMe, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_data.full_name is not None: current_user.full_name = user_data.full_name
    if user_data.nickname is not None: current_user.nickname = user_data.nickname
    if user_data.grade_level is not None:
        # รุ่น DEK คำนวณจากระดับชั้นเสมอ ไม่รับค่าจากผู้ใช้
        # (เดิมรับ dek_code ตรง ๆ ได้ = ใครก็ตั้งรุ่นตัวเองเป็นอะไรก็ได้
        #  ซึ่งมีผลกับ leaderboard ที่แยกตามรุ่น)
        current_user.grade_level = grades.normalize(user_data.grade_level)
        current_user.dek_code = grades.dek_code(current_user.grade_level)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/upload-image")
async def upload_user_image(file: UploadFile = File(...), db: Session = Depends(get_db), u=Depends(get_current_user)):
    from ..uploads import read_validated_image, save_upload
    data, ext = await read_validated_image(file)
    url = save_upload(data, ext, prefix=f"user_{u.id}")
    u.avatar_url = url
    db.commit()
    db.refresh(u)
    return {"url": url, "avatar_url": url}

@router.post("/me/friends")
def add_friend_api(email: str = Form(...), db: Session = Depends(get_db), u=Depends(get_current_user)): 
    if not crud.add_friend(db, u.id, email):
        raise HTTPException(status_code=400, detail="Cannot add friend")
    return {"message": "Friend added"}

@router.delete("/me/friends/{friend_id}")
def remove_friend_api(friend_id: int, db: Session = Depends(get_db), u=Depends(get_current_user)):
    if not crud.remove_friend(db, u.id, friend_id):
        raise HTTPException(status_code=404, detail="Friend not found")
    return {"message": "Friend removed"}

@router.get("/me/friends", response_model=List[schemas.FriendRead])
def my_friends(db: Session = Depends(get_db), u=Depends(get_current_user)):
    fs = crud.get_friends(db, u.id)
    now = datetime.utcnow()
    out = []
    for f in fs:
        online = False
        if f.last_login:
            online = (now - f.last_login).total_seconds() < 300
        item = schemas.FriendRead.model_validate(f)
        item.is_online = online
        if not online:
            item.current_activity = None
        out.append(item)
    return out

@router.get("/me/achievements")
def get_my_achievements(db: Session = Depends(get_db), u = Depends(get_current_user)):
    return get_user_badges_status(db, u)

@router.post("/me/achievements/showcase")
def update_showcase(badges: List[str] = Body(default=[]), db: Session = Depends(get_db), u = Depends(get_current_user)):
    """อัพเดท badges ที่ผู้ใช้เลือกโชว์บนโปรไฟล์ (เก็บเป็น CSV ใน user.showcase_badges)."""
    # validate ว่า badge id มีอยู่จริง — กันคนยัด string ไม่ valid
    from ..badges import ALL_BADGES
    valid_ids = {b["id"] for b in ALL_BADGES}
    cleaned = [b for b in badges if b in valid_ids][:6]  # จำกัด 6 ตัว
    u.showcase_badges = ",".join(cleaned)
    db.commit()
    return {"showcase_badges": cleaned}

@router.get("/{user_id}/public", response_model=schemas.UserPublicProfile)
def get_public_profile_api(user_id: int, db: Session = Depends(get_db), u=Depends(get_current_user)):
    profile = crud.get_public_profile(db, user_id)
    if not profile:
        raise HTTPException(404, "User not found")
    return profile

# --- Course Enrollment & Progress ---
#
# ⚠️ POST /users/me/courses ถูกย้ายไปอยู่ที่ routers/payments.py แล้ว
#
# เดิมมีสองที่: ที่นี่ (users.py) กับ payments.py — path เดียวกันเป๊ะ
# users.router ถูก include ก่อน ตัวนี้จึงชนะเสมอ และตัวนี้ "ลงทะเบียนให้เลย
# โดยไม่เช็คราคา" (คอมเมนต์เดิมเขียนว่า "For now, allow free enrollment")
# ผลคือใครล็อกอินแล้วยิง POST /users/me/courses?course_id=1 ก็ได้คอร์ส
# ราคา 2,490 ไปฟรี ๆ  แถมตอนแก้ที่ payments.py ก็ไม่มีผลอะไรเลยเพราะโดนบัง
#
# ห้ามประกาศ path นี้ซ้ำที่นี่อีก — มี test_no_duplicate_routes คอยจับ

@router.get("/me/courses")
def my_enrolled_courses(db: Session = Depends(get_db), u=Depends(get_current_user)):
    enrollments = crud.get_enrolled_courses(db, u.id)
    out = []
    for e in enrollments:
        if e.course:
            # We can calculate simple progress just by fetching complete count.
            completed = crud.get_course_progress(db, u.id, e.course.id)
            total = e.course.total_lessons
            pct = int((len(completed) / total) * 100) if total > 0 else 0
            
            out.append({
                "id": e.course.id,
                "title": e.course.title,
                "thumbnail": e.course.thumbnail,
                "progress": pct,
                "color": "bg-brand-500",
                "enrolled_at": e.enrolled_at
            })
    return out

@router.get("/me/courses/{course_id}/progress")
def my_course_progress(course_id: int, db: Session = Depends(get_db), u=Depends(get_current_user)):
    completed = crud.get_course_progress(db, u.id, course_id)
    return completed

@router.post("/me/progress/{lesson_id}")
def mark_lesson_complete(lesson_id: int, completed: bool = True, db: Session = Depends(get_db), u=Depends(get_current_user)):
    p = crud.mark_lesson_complete(db, u.id, lesson_id, completed)
    return {"success": True, "lesson_id": lesson_id, "completed": p.completed}
