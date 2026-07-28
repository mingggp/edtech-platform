from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import JWTError
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    get_password_hash,
    verify_password,
    _encode_token,
)
from ..config import settings
from ..database import get_db
from ..limiter import limiter

router = APIRouter(prefix="/auth", tags=["auth"])


class RefreshRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


@router.post("/signup", response_model=schemas.UserRead, status_code=201)
@limiter.limit("5/minute")
def signup(request: Request, payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, payload.email):
        raise HTTPException(400, "Email registered")
    u = crud.create_user(
        db,
        payload.email,
        get_password_hash(payload.password),
        payload.full_name,
        payload.nickname,
        payload.grade_level,
    )
    return u


@router.post("/login", response_model=schemas.Token)
@limiter.limit("5/minute")
def login(request: Request, payload: schemas.UserLogin, db: Session = Depends(get_db)):
    u = crud.get_user_by_email(db, payload.email)
    if not u or not verify_password(payload.password, u.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    u.last_login = datetime.utcnow()
    db.commit()
    return {
        "access_token": create_access_token(u.email),
        "refresh_token": create_refresh_token(u.email),
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=schemas.Token)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    try:
        data = decode_token(payload.refresh_token)
        if data.get("type") != "refresh":
            raise HTTPException(401, "Invalid token type")
        email = data.get("sub")
        if not email:
            raise HTTPException(401, "Invalid token payload")
        u = crud.get_user_by_email(db, email)
        if not u:
            raise HTTPException(401, "User not found")
        return {
            "access_token": create_access_token(u.email),
            "refresh_token": create_refresh_token(u.email),
            "token_type": "bearer",
        }
    except JWTError:
        raise HTTPException(401, "Invalid refresh token")


@router.post("/change-password", status_code=204)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(400, "รหัสผ่านปัจจุบันไม่ถูกต้อง")
    user.hashed_password = get_password_hash(payload.new_password)
    db.commit()


@router.post("/forgot-password", status_code=204)
@limiter.limit("3/minute")
def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """Generates reset token. Always returns 204 (don't leak whether email exists).

    TODO: ส่ง email พร้อมลิงก์ /reset-password?token=... จริงๆ
    ตอนนี้ token ถูกสร้างแต่ไม่ถูกส่งไปไหน — ใน dev ดู log เพื่อทดสอบ
    """
    user = crud.get_user_by_email(db, payload.email)
    if user:
        reset_token = _encode_token(
            {"sub": user.email, "type": "password_reset"},
            timedelta(minutes=30),
        )
        # TODO: integrate email sending. For now, print to log.
        if not settings.is_production:
            print(f"[DEV] Password reset link: /reset-password?token={reset_token}")
    # ไม่ว่ากรณีไหน — return 204 เพื่อกัน user enumeration
    return


@router.post("/reset-password", status_code=204)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    try:
        data = decode_token(payload.token)
    except JWTError:
        raise HTTPException(400, "ลิงก์ไม่ถูกต้องหรือหมดอายุ")
    if data.get("type") != "password_reset":
        raise HTTPException(400, "Token ไม่ใช่ประเภท reset")
    email = data.get("sub")
    if not email:
        raise HTTPException(400, "Token ไม่ถูกต้อง")
    user = crud.get_user_by_email(db, email)
    if not user:
        raise HTTPException(400, "ไม่พบผู้ใช้")
    user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
