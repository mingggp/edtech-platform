# backend/tools/migrate_fix_users_pk.py
import sqlite3, os, sys
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "app.db")
DB_PATH = os.path.abspath(DB_PATH)

print("DB:", DB_PATH)
if not os.path.exists(DB_PATH):
    print("❌ ไม่พบไฟล์ฐานข้อมูล:", DB_PATH)
    sys.exit(1)

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

def table_info(name):
    return list(conn.execute(f"PRAGMA table_info({name})"))

def has_pk(name):
    return any(col["pk"] == 1 for col in table_info(name))

def column_names(name):
    return [col["name"] for col in table_info(name)]

print("ตรวจสอบตาราง users ...")
cols = table_info("users")
if not cols:
    print("❌ ไม่มีตาราง 'users' ใน DB")
    sys.exit(1)

print("คอลัมน์เดิม:", [c["name"] for c in cols])
pk_ok = has_pk("users")
print("มี Primary Key แล้วหรือไม่?:", pk_ok)

if pk_ok:
    print("✅ สคีมาถูกต้อง ไม่ต้องแก้")
    sys.exit(0)

print("⚠️ ไม่พบ PK ใน 'users' → เริ่มกระบวนการย้ายตารางอย่างปลอดภัย...")

# สคีมาใหม่ที่ถูกต้อง (ให้ตรงกับ models.User)
create_new = """
CREATE TABLE users_new (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'student',
    is_active INTEGER NOT NULL DEFAULT 1,
    avatar_url TEXT,
    bio TEXT,
    grade_level TEXT,
    dek_code INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
"""

conn.execute("BEGIN;")
try:
    # 1) สร้างตารางใหม่
    conn.execute(create_new)

    # 2) คอลัมน์ทั้งสองฝั่ง
    old_cols = set(column_names("users"))
    new_cols = set(column_names("users_new"))
    common = [c for c in [
        "id","email","hashed_password","full_name","role","is_active",
        "avatar_url","bio","grade_level","dek_code","created_at","last_login"
    ] if c in old_cols and c in new_cols]

    if not common:
        raise RuntimeError("ไม่พบคอลัมน์ร่วมระหว่าง users และ users_new")

    cols_csv = ", ".join(common)
    conn.execute(f"INSERT INTO users_new ({cols_csv}) SELECT {cols_csv} FROM users;")

    # 3) ลบตารางเก่า แล้ว rename
    conn.execute("DROP TABLE users;")
    conn.execute("ALTER TABLE users_new RENAME TO users;")

    # 4) ทำให้แน่ใจว่า email unique (ถ้า constraint ไม่พอ)
    #   หมายเหตุ: เราใส่ UNIQUE ในสคีมาไปแล้ว แต่อันนี้เผื่อไว้
    conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);")

    conn.commit()
    print("✅ ย้ายตารางสำเร็จ และตั้งค่า PK ให้เรียบร้อย")
except Exception as e:
    conn.rollback()
    print("❌ เกิดข้อผิดพลาด:", e)
    sys.exit(2)
finally:
    conn.close()

print("เสร็จสิ้น")
