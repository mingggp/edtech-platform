import os, time, json, re, urllib.request
from pathlib import Path
from dotenv import load_dotenv

# Load env before any local app imports!
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone

from .database import Base, engine
from . import models
from .config import UPLOAD_DIR, MY_PROMPTPAY_ID
from .limiter import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend

app = FastAPI(title="EdTech Platform API", version="3.0.0")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"success": False, "error": "Validation Error", "details": exc.errors()}
    )


@app.on_event("startup")
async def startup():
    FastAPICache.init(InMemoryBackend(), prefix="fastapi-cache")


# Optional: Disable this if Alembic handles DB lifecycle
Base.metadata.create_all(bind=engine)

@app.get("/ping")
def ping():
    return {"ok": True, "msg": "pong"}

# --- ROUTERS ---
from .routers import auth, users, courses, payments, learning, admin, interactions

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(courses.router)
app.include_router(payments.router)
app.include_router(learning.router)
app.include_router(admin.router)
app.include_router(interactions.router)