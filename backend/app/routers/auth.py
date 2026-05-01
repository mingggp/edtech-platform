from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
from jose import jwt, JWTError

from ..database import get_db
from .. import schemas, crud
from ..auth import create_access_token, create_refresh_token, verify_password, get_password_hash, SECRET_KEY, ALGORITHM
from ..limiter import limiter

router = APIRouter(prefix="/auth", tags=["auth"])

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/signup", response_model=schemas.UserRead, status_code=201)
@limiter.limit("5/minute")
def signup(request: Request, payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, payload.email):
        raise HTTPException(400, "Email registered")
    u = crud.create_user(db, payload.email, get_password_hash(payload.password), payload.full_name, payload.nickname, payload.grade_level)
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
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=schemas.Token)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    try:
        data = jwt.decode(payload.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
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
            "token_type": "bearer"
        }
    except JWTError:
        raise HTTPException(401, "Invalid refresh token")

