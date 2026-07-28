from typing import List

from fastapi import APIRouter, Depends
from fastapi_cache.decorator import cache
from sqlalchemy.orm import Session

from .. import crud, schemas
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
    crud.record_study_time(db, u.id, p.minutes)
    crud.update_user_activity(db, u.id, "kamlang_rian")
    return {"status": "ok"}


@router.get("/users/me/study-stats")
def get_study_stats(db: Session = Depends(get_db), u=Depends(get_current_user)):
    return crud.get_weekly_study_stats(db, u.id)


@router.get("/leaderboard", response_model=List[schemas.LeaderboardItem])
@cache(expire=60)
def leaderboard(db: Session = Depends(get_db)):
    rows = crud.get_leaderboard(db)
    return [
        schemas.LeaderboardItem(
            id=u.id,
            full_name=u.full_name or u.email.split("@")[0],
            avatar_url=u.avatar_url,
            completed_count=s,
            total_minutes=u.total_minutes,
        )
        for u, s in rows
    ]
