"""User-facing exam endpoints (admin endpoints อยู่ใน routers/admin.py).

Routes:
    GET  /exams              -> list (public — ดูชื่อ/คำอธิบายได้ก่อนสมัคร)
    GET  /exams/{id}/take    -> auth — เนื้อหาข้อสอบ (ส่ง choices แต่ซ่อน is_correct)
    POST /exams/{id}/submit  -> auth — ส่งคำตอบ → คืนผล
    GET  /me/exam-results    -> auth — ประวัติสอบ
    GET  /me/exam-results/{id} -> auth — รายละเอียดผลสอบ + คำตอบที่ถูก
"""
import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..auth import get_current_user
from ..database import get_db

router = APIRouter(prefix="", tags=["exams"])


@router.get("/exams", response_model=List[schemas.ExamRead])
def list_exams(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return crud.list_exams(db, skip=skip, limit=limit)


@router.get("/exams/{id}/take")
def take_exam(id: int, db: Session = Depends(get_db), u=Depends(get_current_user)):
    """คืนข้อสอบในรูปแบบที่ ซ่อน is_correct ของแต่ละ choice — กันโกง."""
    exam = crud.get_exam(db, id)
    if not exam:
        raise HTTPException(404, "ไม่พบข้อสอบ")
    return {
        "id": exam.id,
        "title": exam.title,
        "description": exam.description,
        "time_limit": exam.time_limit,
        "questions": [
            {
                "id": q.id,
                "text": q.text,
                "image_url": q.image_url,
                "question_type": q.question_type,
                "order": q.order,
                "choices": [{"id": c.id, "text": c.text} for c in q.choices],
            }
            for q in sorted(exam.questions, key=lambda x: x.order or 0)
        ],
    }


@router.post("/exams/{id}/submit", response_model=schemas.ExamResultRead)
def submit(id: int, payload: schemas.ExamSubmit, db: Session = Depends(get_db), u=Depends(get_current_user)):
    result = crud.submit_exam(db, u.id, id, payload)
    if not result:
        raise HTTPException(404, "ไม่พบข้อสอบ")
    exam = crud.get_exam(db, id)
    return schemas.ExamResultRead(
        id=result.id,
        user_id=result.user_id,
        exam_id=result.exam_id,
        score=result.score,
        total_score=result.total_score,
        submitted_at=result.submitted_at,
        exam_title=exam.title if exam else None,
        answers_dict=json.loads(result.answers) if result.answers else {},
    )


@router.get("/me/exam-results", response_model=List[schemas.ExamResultRead])
def my_results(db: Session = Depends(get_db), u=Depends(get_current_user)):
    results = crud.get_my_exam_results(db, u.id)
    # batch load exam titles
    exam_ids = {r.exam_id for r in results}
    exams = (
        {e.id: e for e in db.query(models.Exam).filter(models.Exam.id.in_(exam_ids)).all()}
        if exam_ids
        else {}
    )
    return [
        schemas.ExamResultRead(
            id=r.id,
            user_id=r.user_id,
            exam_id=r.exam_id,
            score=r.score,
            total_score=r.total_score,
            submitted_at=r.submitted_at,
            exam_title=exams.get(r.exam_id).title if exams.get(r.exam_id) else None,
            answers_dict=json.loads(r.answers) if r.answers else {},
        )
        for r in results
    ]


@router.get("/me/exam-results/{result_id}")
def my_result_detail(result_id: int, db: Session = Depends(get_db), u=Depends(get_current_user)):
    """ผลสอบรายตัว + เฉลย (ดูได้หลังส่งแล้ว)."""
    r = crud.get_exam_result(db, result_id, user_id=u.id)
    if not r:
        raise HTTPException(404, "ไม่พบผลสอบ")
    exam = crud.get_exam(db, r.exam_id)
    answers_map = json.loads(r.answers) if r.answers else {}

    questions = []
    if exam:
        for q in sorted(exam.questions, key=lambda x: x.order or 0):
            chosen_id = answers_map.get(str(q.id))
            correct_choice = next((c for c in q.choices if c.is_correct), None)
            questions.append({
                "id": q.id,
                "text": q.text,
                "image_url": q.image_url,
                "chosen_choice_id": chosen_id,
                "correct_choice_id": correct_choice.id if correct_choice else None,
                "is_correct": chosen_id == (correct_choice.id if correct_choice else -1),
                "choices": [
                    {"id": c.id, "text": c.text, "is_correct": c.is_correct}
                    for c in q.choices
                ],
            })

    return {
        "id": r.id,
        "exam_id": r.exam_id,
        "exam_title": exam.title if exam else None,
        "score": r.score,
        "total_score": r.total_score,
        "submitted_at": r.submitted_at,
        "questions": questions,
    }
