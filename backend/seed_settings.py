from app.database import SessionLocal, engine
from app import models
import json

def seed_settings():
    db = SessionLocal()
    print("🌱 กำลังใส่ข้อมูลเริ่มต้นลงตาราง Settings...")

    # ข้อมูลเริ่มต้น
    default_settings = {
        "banner_active": "true",
        "banner_text": "ยินดีต้อนรับสู่ระบบการเรียนรู้ใหม่! 🚀 โปรโมชั่นพิเศษลด 50% วันนี้วันเดียว",
        "banner_color": "#4f46e5",
        "image_banner_active": "true",
        "banner_interval": "5",
        "banner_images": json.dumps([
            "https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
            "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        ]),
        "countdown_active": "true",
        "countdown_title": "A-Level Exam 2025",
        "countdown_date": "2025-10-22T09:00"
    }

    try:
        # ลบข้อมูลเก่าทิ้งก่อน (ถ้ามี) เพื่อความชัวร์
        db.query(models.Setting).delete()
        
        # ใส่ข้อมูลใหม่
        for key, value in default_settings.items():
            setting = models.Setting(key=key, value=value)
            db.add(setting)
        
        db.commit()
        print("✅ ใส่ข้อมูลสำเร็จ! (Banner, Images, Countdown มาครบ)")
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_settings()