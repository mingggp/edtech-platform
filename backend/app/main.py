"""FastAPI application entrypoint.

โหลด .env ก่อนทุก local imports — settings ตอน boot จึงเป็นค่า production ได้ถูกต้อง
"""
from dotenv import load_dotenv

# Load env before any local app imports!
load_dotenv()

import logging

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
from sqlalchemy import text
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import UPLOAD_DIR, settings
from .database import engine
from .limiter import limiter

log = logging.getLogger("uvicorn.error")

app = FastAPI(
    title="EdTech Platform API",
    version="3.0.0",
    debug=settings.DEBUG,
)

# ---------- Static files ---------- #
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# ---------- CORS ---------- #
# เดิมเขียนว่า  allow_origins = ["*"] if DEBUG  ซึ่งมีปัญหา 2 ชั้น:
#   1. "*" คู่กับ allow_credentials=True เป็นค่าที่ผิดสเปก เบราว์เซอร์จะไม่ยอมรับ
#      ตอนนี้ยังไม่พังเพราะเราส่ง token ทาง header ไม่ได้ใช้ cookie
#      แต่วันไหนเปลี่ยนไปใช้ cookie จะพังทันทีโดยหาสาเหตุยากมาก
#   2. dev ปล่อยผ่านหมด -> ตั้ง CORS ผิดไว้ก็ไม่มีใครรู้ จนขึ้น production แล้วเว็บเรียก API ไม่ได้
#
# แก้เป็น: dev อนุญาต localhost ทุกพอร์ตด้วย regex (ยังสะดวกอยู่ แต่ไม่ใช่ "*")
#          production ใช้ allowlist จาก .env อย่างเดียว
_cors: dict = {"allow_origins": list(settings.CORS_ORIGINS)}
if not settings.is_production:
    _cors["allow_origin_regex"] = r"^http://(localhost|127\.0\.0\.1)(:\d+)?$"

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    **_cors,
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


def _safe_errors(exc: RequestValidationError) -> list[dict]:
    """ทำรายการ error ให้แปลงเป็น JSON ได้แน่นอน

    บั๊กที่เจอ: pydantic v2 ใส่ ValueError ตัวจริงไว้ใน error["ctx"]["error"]
    ซึ่ง json แปลงไม่ได้ -> handler ตัวนี้พังเอง -> ผู้ใช้ได้ 500 แทนที่จะเป็น 422
    แปลว่า validator ไหนก็ตามที่ raise ValueError (subject, ribbon, ระดับชั้น)
    จะทำให้ API ตอบ "เซิร์ฟเวอร์พัง" ทั้งที่ความจริงคือ "ข้อมูลที่ส่งมาไม่ถูก"
    หน้าเว็บจึงแยกไม่ออกและแสดงข้อความผิดให้นักเรียน
    """
    out = []
    for e in exc.errors():
        item = {k: v for k, v in e.items() if k != "ctx"}
        ctx = e.get("ctx")
        if isinstance(ctx, dict):
            item["ctx"] = {k: str(v) for k, v in ctx.items()}
        # loc มี int ปนได้ แปลงเป็น str ให้หมดเพื่อความชัวร์
        if "loc" in item:
            item["loc"] = [str(x) for x in item["loc"]]
        item.pop("input", None)      # อาจมีรหัสผ่านของผู้ใช้ติดมา ไม่ส่งกลับ
        item.pop("url", None)
        out.append(item)
    return out


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"success": False, "error": "Validation Error", "details": _safe_errors(exc)},
    )


def _warn_if_schema_outdated() -> None:
    """เตือนตั้งแต่เปิดเซิร์ฟเวอร์ ถ้าฐานข้อมูลยังตามโค้ดไม่ทัน

    เคสจริงที่ทำให้ต้องมีอันนี้: เพิ่ม migration ให้คอมเมนต์ตอบกลับได้
    (คอลัมน์ parent_id) แต่ยังไม่ได้รัน alembic upgrade head บนเครื่องที่ใช้อยู่
    -> เปิดเว็บได้ ดูคลิปได้ ทุกอย่างดูปกติ  แต่พอกดส่งคอมเมนต์ทีเดียว
       เจอ 500 พร้อมข้อความ 'column parent_id ... does not exist'
       ซึ่งอ่านแล้วไม่รู้ว่าต้องไปทำอะไร

    แค่เตือน ไม่ทำให้แอปดับ — บางทีตั้งใจรันเวอร์ชันเก่าชั่วคราว
    """
    try:
        from .schema_check import diff_schema

        d = diff_schema(engine)
        if d.ok:
            return
        log.warning(
            "\n"
            "──────────────────────────────────────────────\n"
            " ⚠️  ฐานข้อมูลยังตามโค้ดไม่ทัน\n"
            "%s\n"
            " ฟีเจอร์ที่ใช้ของพวกนี้จะพัง 500 ตอนกดใช้งาน\n"
            "\n"
            " แก้ด้วยคำสั่งเดียว:   alembic upgrade head\n"
            "──────────────────────────────────────────────",
            "\n".join(f"   - {line}" for line in d.as_lines()),
        )
    except Exception:  # noqa: BLE001
        # ตัวเช็คเองพังไม่ควรทำให้เซิร์ฟเวอร์เปิดไม่ขึ้น
        log.debug("ตรวจ schema ไม่สำเร็จ", exc_info=True)


# ---------- Startup ---------- #
@app.on_event("startup")
async def startup():
    """เตรียมของตอนเปิดเซิร์ฟเวอร์

    เดิมบรรทัดนี้คือ  Base.metadata.create_all(bind=engine)  ซึ่งเอาออกแล้ว
    เพราะสร้างปัญหา 2 อย่าง:

      1. แย่งงานกับ Alembic — create_all สร้างตารางเองโดยไม่บอก Alembic
         พอรัน migration ทีหลังจะเจอ DuplicateTable (เคยเจอมาแล้วจริง ๆ)
         และที่แย่กว่าคือถ้า model เปลี่ยนไปแล้วแต่ตารางถูกสร้างจากของเก่า
         คอลัมน์ใหม่จะไม่มา แล้วไปพังตอน query ว่า column does not exist

      2. ทำให้แอปเปิดไม่ขึ้นเลยถ้าฐานข้อมูลไม่พร้อม — ต่อไม่ติดตั้งแต่ตอน boot
         uvicorn จะดับทันที ทั้งที่จริงแค่ Docker ยังไม่ทันขึ้น

    ตอนนี้ schema เป็นหน้าที่ของ Alembic ที่เดียว (alembic upgrade head)
    """
    FastAPICache.init(InMemoryBackend(), prefix="fastapi-cache")

    # เช็คว่าต่อฐานข้อมูลได้ไหม — เพื่อ "บอก" ไม่ใช่เพื่อ "ดับ"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        _warn_if_schema_outdated()
    except Exception as exc:  # noqa: BLE001 — อยากจับให้ครบทุกแบบจริง ๆ
        if settings.is_production:
            # production ให้ดับไปเลย ตัวคุม container จะได้ลองเปิดใหม่
            raise
        log.warning(
            "\n"
            "──────────────────────────────────────────────\n"
            " ต่อฐานข้อมูลไม่ได้ — เซิร์ฟเวอร์เปิดแล้วแต่ API จะใช้ไม่ได้\n"
            "   %s\n"
            " ถ้าเป็น Connection refused พอร์ต 5432: เปิด Docker Desktop ก่อน\n"
            " แล้วรีเฟรชหน้าเว็บ ไม่ต้องปิด uvicorn (--reload ต่อให้เองเมื่อ DB มา)\n"
            "──────────────────────────────────────────────",
            exc.__class__.__name__ + ": " + str(exc).splitlines()[0],
        )


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
