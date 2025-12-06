from app.database import engine, Base
from app.models import SystemSetting, Payment

print("🔄 กำลังตรวจสอบและสร้างตารางที่ขาดหาย...")
Base.metadata.create_all(bind=engine)
print("✅ เสร็จสิ้น! ตาราง SystemSetting และ Payment พร้อมใช้งานแล้ว")