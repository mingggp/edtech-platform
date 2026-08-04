"""คอมเมนต์ใต้บทเรียน + ให้คะแนน

กติกาความปลอดภัยของไฟล์นี้ (สำคัญกว่าที่คิด เพราะผู้ใช้เป็นเด็ก ม.ปลาย):

1. ต้องซื้อคอร์สก่อนถึงจะ "อ่าน" และ "เขียน" ได้
   คอมเมนต์คือเนื้อหาในคอร์ส — มีคำถาม คำตอบ เฉลย และวิธีคิดของพี่หมิง
   ถ้าเปิดให้ใครก็อ่านได้ ก็เท่ากับแจกส่วนหนึ่งของคอร์สฟรี
   และเป็นช่องให้คนนอกเข้ามาสแปมใต้คลิปด้วย

2. ห้ามส่งข้อมูลส่วนตัวของคนเขียนออกไปเกินจำเป็น
   ส่งแค่ ชื่อเล่น/ชื่อจริง รูป และบทบาท — ไม่ส่งอีเมล ระดับชั้น รุ่น DEK
   (ดู schemas.CommentAuthor ว่าเคยหลุดอะไรไปบ้าง)

3. จำกัดความถี่ กันสแปม
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from .. import gamification as gm
from ..auth import get_current_user
from ..database import get_db
from ..limiter import limiter

router = APIRouter(prefix="/lessons", tags=["interactions"])

#  เขียนได้กี่คอมเมนต์ต่อนาที
COMMENT_PER_MINUTE = 5


def _require_lesson_access(db: Session, u: models.User, lesson_id: int) -> int:
    """ต้องเป็นเจ้าของคอร์ส (หรือแอดมิน) ถึงจะยุ่งกับคอมเมนต์ของบทเรียนนี้ได้

    คืน course_id เผื่อผู้เรียกเอาไปใช้ต่อ
    """
    course_id = crud.get_course_id_for_lesson(db, lesson_id)
    if course_id is None:
        raise HTTPException(404, "ไม่พบบทเรียนนี้")
    if u.role == "admin":
        return course_id

    course = crud.get_course(db, course_id)
    if course and (course.price or 0) <= 0:
        return course_id                      # คอร์สฟรี เปิดให้เลย
    if crud.get_enrollment(db, u.id, course_id) is None:
        raise HTTPException(403, "ต้องลงทะเบียนคอร์สนี้ก่อนถึงจะดูคอมเมนต์ได้")
    return course_id


def _to_read(c: models.Comment, viewer: models.User) -> schemas.CommentRead:
    """แปลงเป็นรูปแบบที่ส่งออก + คำนวณว่าคนที่กำลังดูลบได้ไหม

    ให้ backend เป็นคนตัดสินเรื่องสิทธิ์ลบ ไม่ปล่อยให้หน้าเว็บเดาเอง
    กติกาจะได้อยู่ที่เดียว และหน้าเว็บปลอมไม่ได้
    """
    data = schemas.CommentRead.model_validate(c)
    data.can_delete = (c.user_id == viewer.id) or viewer.role == "admin"
    data.replies = [_to_read(r, viewer) for r in (c.replies or [])]
    return data


@router.get("/{id}/comments", response_model=List[schemas.CommentRead])
def get_comments(id: int, db: Session = Depends(get_db), u=Depends(get_current_user)):
    _require_lesson_access(db, u, id)
    return [_to_read(c, u) for c in crud.get_lesson_comments(db, id)]


@router.post("/{id}/comments", response_model=schemas.CommentRead, status_code=201)
@limiter.limit(f"{COMMENT_PER_MINUTE}/minute")
def post_comment(
    request: Request,
    id: int,
    p: schemas.CommentCreate,
    db: Session = Depends(get_db),
    u=Depends(get_current_user),
):
    _require_lesson_access(db, u, id)

    parent = None
    if p.parent_id is not None:
        parent = crud.get_comment(db, p.parent_id)
        if not parent or parent.lesson_id != id:
            raise HTTPException(404, "ไม่พบคอมเมนต์ที่จะตอบกลับ")
        if parent.parent_id is not None:
            # ตอบกลับได้ชั้นเดียว — ตอบใต้คำตอบให้เด้งไปอยู่ใต้คอมเมนต์หลักแทน
            # ไม่ปฏิเสธ เพราะผู้ใช้ไม่ได้ทำอะไรผิด แค่ทำให้เธรดไม่ซ้อนลึก
            parent = crud.get_comment(db, parent.parent_id)

    c = crud.create_comment(db, u.id, id, p.text, parent_id=parent.id if parent else None)

    # แจ้งเตือนเจ้าของคอมเมนต์ว่ามีคนตอบ — ไม่แจ้งถ้าตอบตัวเอง
    if parent and parent.user_id != u.id:
        owner = db.get(models.User, parent.user_id)
        if owner:
            who = u.nickname or u.full_name or "มีคน"
            gm.notify(
                db, owner, "comment_reply",
                title=f"{who} ตอบคอมเมนต์ของคุณ",
                body=p.text[:120],
                href=f"/learn/{crud.get_course_id_for_lesson(db, id)}",
            )
            db.commit()

    return _to_read(c, u)


@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(comment_id: int, db: Session = Depends(get_db), u=Depends(get_current_user)):
    """ลบคอมเมนต์ — เจ้าของลบของตัวเองได้ แอดมินลบได้ทุกอัน

    คืน 404 (ไม่ใช่ 403) เมื่อไม่ใช่ของตัวเอง เพื่อไม่ให้คนไล่เดาว่า
    คอมเมนต์ไอดีไหนมีอยู่จริงบ้าง
    """
    c = crud.get_comment(db, comment_id)
    if not c:
        raise HTTPException(404, "ไม่พบคอมเมนต์นี้")
    if c.user_id != u.id and u.role != "admin":
        raise HTTPException(404, "ไม่พบคอมเมนต์นี้")
    crud.delete_comment(db, c)


@router.get("/{id}/rating")
def get_rating(id: int, db: Session = Depends(get_db), u=Depends(get_current_user)):
    _require_lesson_access(db, u, id)
    return {"avg": crud.get_lesson_rating_avg(db, id), "my": crud.get_user_lesson_rating(db, u.id, id)}


@router.post("/{id}/rate")
def rate_lesson(id: int, p: schemas.RatingCreate, db: Session = Depends(get_db), u=Depends(get_current_user)):
    """ให้ดาวบทเรียน — ต้องซื้อคอร์สก่อน ไม่งั้นใครก็มาปั่นคะแนนได้"""
    _require_lesson_access(db, u, id)
    if not 1 <= p.score <= 5:
        raise HTTPException(422, "คะแนนต้องอยู่ระหว่าง 1 ถึง 5")
    crud.set_lesson_rating(db, u.id, id, p.score)
    return {"status": "ok"}
