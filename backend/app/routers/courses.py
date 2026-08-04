from typing import List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from fastapi_cache.decorator import cache
from ..database import get_db
from .. import schemas, crud
from ..auth import require_admin, get_current_user, get_current_user_optional
from ..config import get_youtube_duration

router = APIRouter(prefix="", tags=["courses"])

# public list
@router.get("/courses", response_model=List[schemas.CourseRead])
@cache(expire=60)
def list_c(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.list_courses(db, skip=skip, limit=limit, active_only=True)

@router.get("/courses/{id}", response_model=schemas.CourseRead)
def get_c(id: int, db: Session = Depends(get_db)):
    """คอร์สเดียว — ถ้าไม่มีต้องตอบ 404

    เดิม return None ตรง ๆ ทำให้ FastAPI serialize ไม่ผ่านแล้วตอบ 500
    หน้าเว็บเลยแยกไม่ออกว่า "ไม่มีคอร์สนี้" กับ "เซิร์ฟเวอร์พัง"
    """
    c = crud.get_course(db, id)
    if not c:
        raise HTTPException(404, "ไม่พบคอร์สนี้")
    return c

@router.get("/courses/{id}/chapters")
def get_c_chapters(
    id: int,
    db: Session = Depends(get_db),
    u=Depends(get_current_user_optional),
):
    """สารบัญคอร์ส — เห็นไม่เท่ากันระหว่างคนที่ซื้อแล้วกับคนที่ยังไม่ซื้อ

    ยังไม่ซื้อ  เห็นชื่อบท ชื่อบทเรียน ความยาว จำนวนคลิป (ข้อมูลช่วยตัดสินใจซื้อ)
    ซื้อแล้ว    เห็นเพิ่ม youtube_id กับ doc_url = ดูวิดีโอได้จริง

    ⚠️ ช่องโหว่ที่เพิ่งอุด: เดิม endpoint นี้คืน youtube_id ให้ทุกคนโดยไม่ต้อง
    ล็อกอินด้วยซ้ำ  ยิง curl ครั้งเดียวได้ไอดีวิดีโอทั้งคอร์สราคา 2,490
    เอาไปเปิดบน YouTube ฟรีได้เลย = ขายคอร์สไม่ได้เงินสักบาท

    คอร์สไม่มีอยู่ต้อง 404 ไม่ใช่คืน list ว่าง — ไม่งั้นหน้าเว็บจะขึ้นว่า
    "ยังไม่ได้เพิ่มบทเรียน" ทั้งที่จริงคือไม่มีคอร์สนี้
    """
    course = crud.get_course(db, id)
    if not course:
        raise HTTPException(404, "ไม่พบคอร์สนี้")

    chapters = crud.get_course_chapters(db, id)

    unlocked = bool(u) and (
        u.role == "admin"
        or (course.price or 0) <= 0          # คอร์สฟรีดูได้เลย
        or crud.get_enrollment(db, u.id, id) is not None
    )
    if unlocked:
        return [schemas.ChapterWithLessons.model_validate(c) for c in chapters]

    return [
        schemas.ChapterPublic(
            id=c.id, course_id=c.course_id, title=c.title, order=c.order,
            lessons=[
                schemas.LessonPublic(
                    id=l.id, chapter_id=l.chapter_id, title=l.title,
                    kind=l.kind, duration=l.duration or 0, order=l.order,
                )
                for l in c.lessons
            ],
        )
        for c in chapters
    ]

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
