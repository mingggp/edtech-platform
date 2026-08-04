"""Authentication and authorization utilities.

JWT (HS256) for access and refresh tokens.
Password hashed with pbkdf2_sha256 (passlib).

Dependencies:
    get_current_user        -> get user from JWT (raises 401 if invalid)
    get_current_active_user -> wrapper for checking is_active in the future
    require_admin           -> checks role == "admin" (raises 403)
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from . import crud, models
from .config import settings
from .database import get_db

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


# ---------- Password ---------- #

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# ---------- Token ---------- #

def _encode_token(payload: dict, expires_delta: timedelta) -> str:
    now = datetime.now(tz=timezone.utc)
    to_encode = {**payload, "iat": now, "exp": now + expires_delta}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    return _encode_token(
        {"sub": subject, "type": "access"},
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    return _encode_token(
        {"sub": subject, "type": "refresh"},
        expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str) -> dict:
    """Decode JWT, raise JWTError if invalid."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


# ---------- Dependencies ---------- #

_credentials_exc = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> models.User:
    try:
        payload = decode_token(token)
        if payload.get("type") not in (None, "access"):
            raise _credentials_exc
        email = payload.get("sub")
        if not email:
            raise _credentials_exc
    except JWTError:
        raise _credentials_exc

    user = crud.get_user_by_email(db, email=email)
    if user is None:
        raise _credentials_exc
    return user


_optional_scheme = OAuth2PasswordBearer(tokenUrl="auth/token", auto_error=False)


def get_current_user_optional(
    db: Session = Depends(get_db),
    token: str | None = Depends(_optional_scheme),
) -> models.User | None:
    """คืนผู้ใช้ถ้าล็อกอินอยู่ ไม่ล็อกอินก็คืน None (ไม่ error)

    ใช้กับหน้าที่คนทั่วไปดูได้ แต่ "เห็นไม่เท่ากัน" ระหว่างคนซื้อกับคนยังไม่ซื้อ
    เช่นสารบัญคอร์ส — ใครก็ดูชื่อบทเรียนได้ แต่ลิงก์วิดีโอต้องซื้อก่อน

    token พังหรือหมดอายุก็คืน None เหมือนไม่ได้ล็อกอิน ไม่โยน 401
    เพราะหน้าพวกนี้ควรใช้งานได้อยู่ดี
    """
    if not token:
        return None
    try:
        payload = decode_token(token)
        if payload.get("type") not in (None, "access"):
            return None
        email = payload.get("sub")
        if not email:
            return None
    except JWTError:
        return None
    return crud.get_user_by_email(db, email=email)


def get_current_active_user(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    return current_user


def require_admin(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user
