from typing import List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from fastapi_cache.decorator import cache
from ..database import get_db
from .. import schemas, crud
from ..auth import require_admin, get_current_user
from ..config import get_youtube_duration

router = APIRouter(prefix="", tags=["courses"])

# public list
@router.get("/courses", response_model=List[schemas.CourseRead])
@cache(expire=60)
def list_c(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.list_courses(db, skip=skip, limit=limit, active_only=True)

@router.get("/courses/{id}", response_model=schemas.CourseRead)
def get_c(id: int, db: Session = Depends(get_db)):
    return crud.get_course(db, id)

@router.get("/courses/{id}/chapters", response_model=List[schemas.ChapterWithLessons])
def get_c_chapters(id: int, db: Session = Depends(get_db)):
    return crud.get_course_chapters(db, id)

# admin routes
@router.get("/admin/courses", response_model=List[schemas.CourseRead])
def list_c_adm(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.list_courses(db, skip=skip, limit=limit, active_only=False)

@router.post("/admin/courses", response_model=schemas.CourseRead)
def create_c(p: schemas.CourseCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.create_course(db, p)

@router.patch("/admin/courses/{id}", response_model=schemas.CourseRead)
def update_c(id: int, p: schemas.CourseUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.update_course(db, id, p)

@router.delete("/admin/courses/{id}", status_code=204)
def delete_c(id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    crud.delete_course(db, id)

@router.post("/admin/courses/{id}/chapters", response_model=schemas.ChapterRead)
def add_chap(id: int, p: schemas.ChapterCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.create_chapter(db, id, p)

@router.patch("/admin/chapters/{id}", response_model=schemas.ChapterRead)
def upd_chap(id: int, p: schemas.ChapterUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.update_chapter(db, id, p)

@router.delete("/admin/chapters/{id}", status_code=204)
def del_chap(id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    crud.delete_chapter(db, id)

@router.post("/admin/chapters/{id}/lessons", response_model=schemas.LessonRead)
def add_l(id: int, p: schemas.LessonCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if p.duration == 0 and p.youtube_id:
        p.duration = get_youtube_duration(p.youtube_id)
    return crud.create_lesson(db, id, p)

@router.patch("/admin/lessons/{id}", response_model=schemas.LessonRead)
def upd_l(id: int, p: schemas.LessonUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if p.youtube_id and (p.duration is None or p.duration == 0):
        p.duration = get_youtube_duration(p.youtube_id)
    return crud.update_lesson(db, id, p)

@router.delete("/admin/lessons/{id}", status_code=204)
def del_l(id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    crud.delete_lesson(db, id)
