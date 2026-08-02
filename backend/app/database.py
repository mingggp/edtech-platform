"""การเชื่อมต่อฐานข้อมูล

จุดสำคัญ: ที่อยู่ฐานข้อมูลต้องอ่านจาก `settings` ที่เดียวเท่านั้น

เดิมไฟล์นี้เรียก os.getenv("DATABASE_URL", "sqlite:///./app.db") เอง ซ้ำกับ
config.py ที่ก็เขียนค่า default เดียวกันไว้ พอมีค่า default เขียนไว้ 2 ที่
วันไหนแก้ที่เดียวมันจะแยกทางกันเงียบ ๆ — เป็นบั๊กสายพันธุ์เดียวกับที่เคยเจอ
(seed ลง SQLite แต่เซิร์ฟเวอร์อ่าน PostgreSQL แล้วงงว่าคอร์สหายไปไหน)

การ import `settings` ยังทำให้แน่ใจว่า .env ถูกโหลดแล้ว เพราะ app/__init__.py
เรียก load_dotenv() ไว้ก่อนโมดูลไหนจะทำงาน
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import settings

DATABASE_URL = settings.DATABASE_URL

# SQLite ต้องปลดล็อกการใช้ข้าม thread เพราะ FastAPI ทำงานหลาย thread
_connect_args = (
    {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

engine = create_engine(
    DATABASE_URL,
    connect_args=_connect_args,
    # เช็คว่า connection ยังใช้ได้ก่อนหยิบมาจาก pool
    # กันเคส: Docker/Postgres รีสตาร์ท -> connection เก่าใน pool ตายหมด
    # แต่แอปยังหยิบมาใช้แล้วพังเป็น "server closed the connection unexpectedly"
    # ทั้งที่ฐานข้อมูลกลับมาปกติแล้ว  (SQLite ไม่มีปัญหานี้แต่ใส่ไว้ก็ไม่เสียหาย)
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency — เปิด session ต่อ 1 request แล้วปิดให้เสมอ"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
