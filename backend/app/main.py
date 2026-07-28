"""FastAPI application entrypoint.

โหลด .env ก่อนทุก local imports — settings ตอน boot จึงเป็นค่า production ได้ถูกต้อง
"""
from dotenv import load_dotenv

# Load env before any local app imports!
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import UPLOAD_DIR, settings
from .database import Base, engine
from .limiter import limiter

app = FastAPI(
    title="EdTech Platform API",
    version="3.0.0",
    debug=settings.DEBUG,
)

# ---------- Static files ---------- #
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# ---------- CORS ---------- #
# ใน production ใช้ allowlist; ใน dev ใช้ทั้งหมดเพื่อความสะดวก
_allow_origins = ["*"] if settings.DEBUG else list(settings.CORS_ORIGINS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Rate limit ---------- #
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


# ---------- Exception handlers ---------- #
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"success": False, "error": "Validation Error", "details": exc.errors()},
    )


# ---------- Startup ---------- #
@app.on_event("startup")
async def startup():
    FastAPICache.init(InMemoryBackend(), prefix="fastapi-cache")
    # Dev เท่านั้น — production ใช้ Alembic อย่างเดียว
    if not settings.is_production:
        Base.metadata.create_all(bind=engine)


# ---------- Health check ---------- #
@app.get("/ping", tags=["health"])
def ping():
    return {"ok": True, "msg": "pong", "env": settings.ENV}


# ---------- Routers ---------- #
from .routers import admin, auth, courses, exams, interactions, learning, payments, users  # noqa: E402

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(courses.router)
app.include_router(payments.router)
app.include_router(learning.router)
app.include_router(admin.router)
app.include_router(interactions.router)
app.include_router(exams.router)
