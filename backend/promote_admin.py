"""ตั้งผู้ใช้ให้เป็นแอดมิน

    python promote_admin.py <email>

หมายเหตุ: ที่อยู่ฐานข้อมูลอ่านจาก app.config เท่านั้น เดิมไฟล์นี้เขียน
default เป็น postgresql://... ไว้เอง ซึ่งไม่ตรงกับที่อื่นที่เขียนว่า sqlite
พอ .env หาย สคริปต์นี้กับเซิร์ฟเวอร์จะไปคนละฐานโดยไม่มีใครรู้
"""
import os
import sys

# ให้หา package `app` เจอเวลารันจากโฟลเดอร์ backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# import นี้จะพา app/__init__.py มาโหลด .env ให้เองก่อนอ่าน settings
from app.config import settings          # noqa: E402
from app.database import SessionLocal    # noqa: E402
from app.models import User              # noqa: E402


def main() -> int:
    if len(sys.argv) < 2:
        print("วิธีใช้: python promote_admin.py <email>")
        return 1

    email = sys.argv[1].strip().lower()
    print(f"ฐานข้อมูล: {settings.DATABASE_URL}")

    try:
        db = SessionLocal()
    except Exception as e:
        print("❌ ต่อฐานข้อมูลไม่ได้")
        print(f"   {e}")
        print("   ถ้าเป็น Connection refused พอร์ต 5432 ให้เปิด Docker Desktop ก่อน")
        return 1

    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"❌ ไม่พบผู้ใช้อีเมล '{email}'")
            return 1
        if user.role == "admin":
            print(f"ℹ️  '{email}' เป็นแอดมินอยู่แล้ว")
            return 0
        user.role = "admin"
        db.commit()
        print(f"✅ ตั้ง '{email}' เป็นแอดมินแล้ว — ออกจากระบบแล้วเข้าใหม่เพื่อให้มีผล")
        return 0
    except Exception as e:
        db.rollback()
        print("❌ ทำงานไม่สำเร็จ")
        print(f"   {e}")
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
