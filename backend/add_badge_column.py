from app.database import engine
from sqlalchemy import text

def add_column():
    with engine.connect() as conn:
        try:
            # เพิ่มคอลัมน์ showcase_badges (เก็บเป็น text เช่น "newbie,night_owl")
            conn.execute(text("ALTER TABLE users ADD COLUMN showcase_badges VARCHAR"))
            print("✅ เพิ่มคอลัมน์ showcase_badges สำเร็จ!")
        except Exception as e:
            print(f"⚠️ อาจจะมีคอลัมน์นี้อยู่แล้ว หรือเกิดข้อผิดพลาด: {e}")

if __name__ == "__main__":
    add_column()