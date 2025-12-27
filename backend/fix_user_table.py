from app.database import engine
from sqlalchemy import text

def fix():
    with engine.connect() as conn:
        print("🔧 กำลังอัปเดตตาราง Users...")
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP"))
            print("✅ เพิ่ม created_at ใน users สำเร็จ")
        except Exception as e:
            print(f"⚠️  {e}")
            
    print("🎉 เสร็จสิ้น!")

if __name__ == "__main__":
    fix()