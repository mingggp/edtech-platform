"""ตัวตั้งค่าให้ Alembic รู้ว่าจะ migrate ลงฐานข้อมูลไหน

ลำดับความสำคัญของที่อยู่ฐานข้อมูล (บนสุดชนะ):

  1. `-x db_url=...`                   สั่งจากบรรทัดคำสั่งตอนนั้น
  2. sqlalchemy.url ที่ตั้งผ่าน Config  ใช้ตอนเทสต์ ให้ชี้ไปฐานชั่วคราวได้
  3. settings.DATABASE_URL             ค่าจริงจาก .env — ใช้ตอนทำงานปกติ

เดิมโค้ดที่นี่บังคับใช้ (3) เสมอ ทับข้อ 1 และ 2 ทิ้งหมด ผลคือสั่งให้ migration
รันลงฐานอื่นไม่ได้เลย — เขียนเทสต์ตรวจว่า migration สร้างตารางครบไหมก็ทำไม่ได้
(และค่า sqlalchemy.url ใน alembic.ini ก็เป็นค่าหลอกที่ไม่เคยถูกใช้)
"""
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# app/__init__.py โหลด .env ให้แล้วตั้งแต่ import แรก
import app.models  # noqa: F401,E402  ต้อง import เพื่อให้ Base รู้จักทุกตาราง
from app.database import Base  # noqa: E402
from app.config import settings  # noqa: E402

target_metadata = Base.metadata


def _db_url() -> str:
    from_cli = (context.get_x_argument(as_dictionary=True) or {}).get("db_url")
    if from_cli:
        return from_cli
    from_ini = config.get_main_option("sqlalchemy.url", None)
    # ค่าตัวอย่างที่ติดมากับ alembic.ini ไม่นับ
    if from_ini and not from_ini.startswith("driver://"):
        return from_ini
    return settings.DATABASE_URL


def run_migrations_offline() -> None:
    context.configure(
        url=_db_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = _db_url()
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # ให้ SQLite แก้ตารางด้วยวิธี copy ตารางใหม่ได้ (SQLite ไม่มี ALTER แบบเต็ม)
            render_as_batch=connection.dialect.name == "sqlite",
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
