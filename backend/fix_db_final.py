from app.database import engine
from sqlalchemy import text

def fix():
    with engine.connect() as conn:
        print("🔧 กำลังอัปเดต Database...")
        try:
            conn.execute(text("ALTER TABLE study_logs ADD COLUMN created_at DATETIME"))
            print("✅ เพิ่ม created_at ใน study_logs สำเร็จ")
        except Exception as e:
            print(f"⚠️  study_logs: {e}")

        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN showcase_badges VARCHAR"))
            print("✅ เพิ่ม showcase_badges ใน users สำเร็จ")
        except Exception as e:
            print(f"⚠️  users: {e}")
            
    print("🎉 เสร็จสิ้น!")

if __name__ == "__main__":
    fix()