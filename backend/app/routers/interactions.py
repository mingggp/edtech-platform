from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas, crud
from ..auth import get_current_user

router = APIRouter(prefix="/lessons", tags=["interactions"])

@router.get("/{id}/comments", response_model=List[schemas.CommentRead])
def get_comments(id: int, db: Session = Depends(get_db), u=Depends(get_current_user)):
    return crud.get_lesson_comments(db, id)

@router.post("/{id}/comments", response_model=schemas.CommentRead)
def post_comment(id: int, p: schemas.CommentCreate, db: Session = Depends(get_db), u=Depends(get_current_user)):
    return crud.create_comment(db, u.id, id, p.text)

@router.get("/{id}/rating")
def get_rating(id: int, db: Session = Depends(get_db), u=Depends(get_current_user)):
    return {"avg": crud.get_lesson_rating_avg(db, id), "my": crud.get_user_lesson_rating(db, u.id, id)}

@router.post("/{id}/rate")
def rate_lesson(id: int, p: schemas.RatingCreate, db: Session = Depends(get_db), u=Depends(get_current_user)):
    crud.set_lesson_rating(db, u.id, id, p.score)
    return {"status": "ok"}
