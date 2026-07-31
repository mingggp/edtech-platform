from typing import List

from fastapi import APIRouter, Depends
from fastapi_cache.decorator import cache
from sqlalchemy.orm import Session

from .. import crud, schemas, models, achievements_seed
from .. import gamification as gm
from ..auth import get_current_user
from ..database import get_db

router = APIRouter(prefix="", tags=["learning"])


@router.get("/courses/{cid}/my-progress")
def my_prog(cid: int, db: Session = Depends(get_db), u=Depends(get_current_user)):
    r = crud.get_user_progress_in_course(db, u.id, cid)
    return {"completed_ids": [x[0] for x in r]}


@router.post("/courses/{cid}/lessons/{lid}/toggle-progress")
def tog_prog(cid: int, lid: int, db: Session = Depends(get_db), u=Depends(get_current_user)):
    return {"completed": crud.toggle_lesson_progress(db, u.id, lid)}


@router.post("/courses/{cid}/lessons/{lid}/progress")
def upd_prog_time(cid: int, lid: int, p: schemas.ProgressUpdate, db: Session = Depends(get_db), u=Depends(get_current_user)):
    # ProgressUpdate field is `seconds_watched` — เคย bug ที่ใช้ p.seconds (field ไม่มี)
    crud.update_lesson_progress_time(db, u.id, lid, p.seconds_watched)
    return {"status": "ok"}


@router.get("/courses/{cid}/lessons/{lid}/progress")
def get_prog_time(cid: int, lid: int, db: Session = Depends(get_db), u=Depends(get_current_user)):
    return {"seconds": crud.get_lesson_progress_time(db, u.id, lid)}


@router.post("/users/me/study-time")
def add_study_time(p: schemas.StudyTimeCreate, db: Session = Depends(get_db), u=Depends(get_current_user)):
    """บันทึกเวลาเรียน — จุดเดียวที่ขยับ สตรีค / เป้าหมายรายวัน / XP / เหรียญ

    เดิมอัปเดตแค่ total_minutes ตอนนี้ต่อเข้าระบบกีมด้วย
    """
    crud.record_study_time(db, u.id, p.minutes)          # StudyLog (ใช้ดูช่วงเวลาที่เรียน)
    gm.record_study(db, u, p.minutes)                    # DailyActivity + สตรีค + XP
    crud.update_user_activity(db, u.id, "kamlang_rian")
    newly = achievements_seed.check_all(db, u)
    st = gm.streak_status(db, u)
    return {"status": "ok", "streak": st, "xp_total": u.xp_total,
            "level": u.level, "new_badges": newly}


@router.get("/users/me/study-stats")
def get_study_stats(db: Session = Depends(get_db), u=Depends(get_current_user)):
    return crud.get_weekly_study_stats(db, u.id)


# ---------------------------------------------------------------------------
# กีม — XP · สตรีค · เหรียญ · แจ้งเตือน
# ---------------------------------------------------------------------------

@router.get("/users/me/gamification")
def my_gamification(db: Session = Depends(get_db), u=Depends(get_current_user)):
    """ข้อมูลรวมสำหรับ Dashboard / XP & Level / Streak & Daily Goal"""
    lv, into, need = gm.level_for_xp(u.xp_total or 0)
    return {
        "xp_total": u.xp_total or 0,
        "level": lv,
        "xp_into_level": into,
        "xp_for_next_level": need,
        "streak": gm.streak_status(db, u),
        "badges": sorted(gm.unlocked_ids(db, u.id)),
    }


@router.get("/users/me/xp-history")
def my_xp_history(limit: int = 30, db: Session = Depends(get_db), u=Depends(get_current_user)):
    rows = (db.query(models.XpEvent)
              .filter(models.XpEvent.user_id == u.id)
              .order_by(models.XpEvent.created_at.desc()).limit(limit).all())
    return [{"amount": r.amount, "source": r.source, "note": r.note,
             "created_at": r.created_at} for r in rows]


@router.put("/users/me/daily-goal")
def set_goal(p: schemas.DailyGoalUpdate, db: Session = Depends(get_db), u=Depends(get_current_user)):
    """เปลี่ยนเป้าหมายรายวัน — มีผลวันนี้เป็นต้นไป ไม่ย้อนแก้ประวัติ"""
    return {"daily_goal_minutes": gm.set_daily_goal(db, u, p.minutes)}


@router.get("/users/me/notifications")
def my_notifications(limit: int = 50, unread_only: bool = False,
                     db: Session = Depends(get_db), u=Depends(get_current_user)):
    rows = gm.list_notifications(db, u.id, limit=limit, unread_only=unread_only)
    return [{"id": n.id, "type": n.type, "title": n.title, "body": n.body,
             "href": n.href, "read": n.read_at is not None,
             "created_at": n.created_at} for n in rows]


@router.post("/users/me/notifications/read-all")
def read_all_notifications(db: Session = Depends(get_db), u=Depends(get_current_user)):
    return {"marked": gm.mark_all_read(db, u.id)}


@router.get("/leaderboard")
def leaderboard(period: str = "week", grade: str | None = None, limit: int = 50,
                db: Session = Depends(get_db)):
    """อันดับตามเวลาเรียน — period: day | week | month | all

    ไม่ cache เพราะผลลัพธ์ขึ้นกับ period/grade และเปลี่ยนบ่อย
    ถ้าคนเยอะจนช้า ค่อยทำ snapshot รายชั่วโมงแทน (daily_activity มี index แล้ว)
    """
    return gm.leaderboard(db, period=period, grade=grade, limit=limit)
