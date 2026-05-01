import time, json
from typing import List
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, Body, File, UploadFile
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from ..database import get_db
from .. import schemas, crud, models
from ..models import User
from ..auth import require_admin, get_current_active_user, get_current_user
from ..schemas import SettingsUpdate
from ..config import UPLOAD_DIR, _bkk_text, _bkk_iso

router = APIRouter(prefix="", tags=["admin-stats-exams"])

@router.post("/admin/exams", response_model=schemas.ExamRead)
def cr_exam(p: schemas.ExamCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.create_exam(db, p)

@router.get("/exams", response_model=List[schemas.ExamRead])
def l_exam(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.list_exams(db, skip=skip, limit=limit)

@router.get("/exams/{id}", response_model=schemas.ExamRead)
def g_exam(id: int, db: Session = Depends(get_db)):
    e = crud.get_exam(db, id)
    if not e:
        raise HTTPException(404)
    return e

@router.post("/admin/exams/{id}/questions")
def add_q(id: int, p: schemas.QuestionCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.add_question(db, id, p)

@router.delete("/admin/questions/{id}")
def del_q(id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    if crud.delete_question(db, id):
        return {"status": "deleted"}
    raise HTTPException(404)

@router.post("/upload/image")
async def upload_generic_image(file: UploadFile = File(...), db: Session = Depends(get_db), _=Depends(require_admin)):
    ext = file.filename.split(".")[-1]
    fname = f"img_{int(time.time())}.{ext}"
    with open(UPLOAD_DIR / fname, "wb") as f:
        f.write(await file.read())
    return {"url": f"/static/uploads/{fname}"}

@router.get("/admin/users", response_model=schemas.AdminUserListResponse)
def adm_list_users(
    q: str | None = None,
    page: int = 1,
    page_size: int = 10,
    sort: str = "id:asc",
    role: str | None = None,
    active: bool | None = None,
    grade: str | None = None,
    online_status: str | None = None,
    db: Session = Depends(get_db),
    _ = Depends(require_admin)
):
    i, t = crud.admin_list_users(db, q, page, page_size, sort, role, active, grade, online_status)
    return {"items": i, "meta": {"page": page, "page_size": page_size, "total": t}}

@router.patch("/admin/users/{uid}")
def adm_update_user(uid: int, p: schemas.AdminUserUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    u = db.query(User).get(uid)
    if not u:
        raise HTTPException(404)
    return crud.admin_update_user(db, u, p)

@router.get("/admin/metrics")
def adm_metrics(db: Session = Depends(get_db), _=Depends(require_admin)):
    t = db.query(models.User).count()
    a = db.query(models.User).filter_by(role="admin").count()
    limit = datetime.utcnow() - timedelta(minutes=5)
    o = db.query(models.User).filter(models.User.last_login >= limit).count()
    n = db.query(models.User).filter(models.User.created_at >= datetime.utcnow().date()).count()
    return {"total_users": t, "admins": a, "active_users": o, "new_users_today": n}

@router.get("/admin/payment-stats")
def pay_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    if current_user.role != "admin": raise HTTPException(status_code=403, detail="Not authorized")
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=6)
    pays = db.query(models.Payment).filter(
        models.Payment.status == "approved",
        models.Payment.created_at >= start_date
    ).all()
    d = defaultdict(float)
    labels = []
    for i in range(6, -1, -1):
        day_str = (today - timedelta(days=i)).strftime("%d/%m")
        d[day_str] = 0.0
        labels.append(day_str)
    for p in pays:
        local_time = p.created_at + timedelta(hours=7)
        key = local_time.strftime("%d/%m")
        if key in d:
            d[key] += p.amount
    data = [d[label] for label in labels]
    return {"labels": labels, "data": data}

@router.get("/admin/payments", response_model=List[schemas.PaymentRead])
def l_pays(status: str | None = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.get_payments(db, status, skip=skip, limit=limit)

@router.post("/admin/payments/{id}/{act}")
def proc_pay(id: int, act: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    return {"status": "ok", "new_status": crud.approve_payment(db, id, act).status}

@router.get("/settings")
def get_set(db: Session = Depends(get_db)):
    return crud.get_all_settings(db)

@router.patch("/admin/settings")
def upd_set(p: SettingsUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.update_settings(db, p)

@router.post("/admin/settings/banner-image")
async def upload_banner_image(file: UploadFile = File(...), db: Session = Depends(get_db), _=Depends(require_admin)):
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(400, "Image only")
    ext = file.filename.split(".")[-1]
    fname = f"banner_{int(time.time())}.{ext}"
    with open(UPLOAD_DIR / fname, "wb") as f:
        f.write(await file.read())
    url = f"/static/uploads/{fname}"
    curr = crud.get_setting(db, "banner_images")
    imgs = json.loads(curr) if curr else []
    imgs.append(url)
    crud.set_setting(db, "banner_images", json.dumps(imgs))
    return {"url": url, "images": imgs}

@router.delete("/admin/settings/banner-image")
def delete_banner_image(url: str = Body(..., embed=True), db: Session = Depends(get_db), _=Depends(require_admin)):
    curr = crud.get_setting(db, "banner_images")
    imgs = json.loads(curr) if curr else []
    if url in imgs:
        imgs.remove(url)
    crud.set_setting(db, "banner_images", json.dumps(imgs))
    return {"images": imgs}

@router.get("/admin/reports", response_model=List[dict])
def list_reports(status: str | None = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.get_all_reports(db, status, skip=skip, limit=limit)

@router.post("/reports")
def report_problem(p: schemas.ReportCreate, db: Session = Depends(get_db), u=Depends(get_current_user)):
    crud.create_report(db, u.id, p)
    return {"status": "ok"}

@router.patch("/admin/reports/{id}")
def update_report(id: int, status: str = Body(..., embed=True), db: Session = Depends(get_db), _=Depends(require_admin)):
    r = crud.update_report_status(db, id, status)
    return r

@router.get("/admin/audit", response_model=schemas.AuditListResponse)
def adm_audit(
    action: str | None = None,
    actor_id: int | None = None,
    target_id: int | None = None,
    page: int = 1,
    page_size: int = 20,
    sort: str = "created_at:desc",
    db: Session = Depends(get_db),
    _ = Depends(require_admin)
):
    r, t = crud.list_audit(db, action, actor_id, target_id, None, None, page, page_size, sort)
    items = []
    for x in r:
        diffs = crud._compute_diff(x.data)
        items.append(schemas.AuditItem(
            id=x.id,
            action=x.action,
            actor_id=x.actor_id,
            target_id=x.target_id,
            data=x.data,
            created_at=x.created_at,
            created_at_bkk=_bkk_text(x.created_at),
            created_at_iso_bkk=_bkk_iso(x.created_at),
            diff=diffs
        ))
    return {"items": items, "meta": {"page": page, "page_size": page_size, "total": t}}
