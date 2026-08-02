import os

# ต้องตั้งก่อน import app — ไม่งั้น app/database.py จะสร้าง engine ชี้ไป PostgreSQL
# ตาม .env ของเครื่องที่รันอยู่ แล้วเทสต์จะพังถ้า Docker ไม่ได้เปิด (หรือแย่กว่านั้น
# คือไปแตะฐานข้อมูลจริง)  load_dotenv ไม่ทับค่าที่ตั้งไว้แล้ว จึงปลอดภัย
os.environ.setdefault("ENV", "test")
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app import crud
from app.auth import get_password_hash
from app.limiter import limiter

# ปิด rate limit ตอนเทสต์ — ไม่งั้นเทสต์ที่ยิงหลาย request ติดกันจะได้ 429
# แทนที่จะได้ผลลัพธ์จริง (เคยทำให้ test_password.py ตก 7 เคส)
limiter.enabled = False

# Use SQLite in-memory for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        # Seed test user
        if not crud.get_user_by_email(db, "test@example.com"):
            crud.create_user(
                db=db,
                email="test@example.com",
                hashed_password=get_password_hash("testpassword"),
                full_name="Test User",
                nickname="Test",
                grade_level="M6"
            )
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    FastAPICache.init(InMemoryBackend(), prefix="test-cache")
    yield TestClient(app)
    del app.dependency_overrides[get_db]
