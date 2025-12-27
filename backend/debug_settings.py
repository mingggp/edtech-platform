import sqlite3
import os

# หาไฟล์ Database
db_paths = ['app.db', 'backend/app.db', '../app.db']
db_path = next((p for p in db_paths if os.path.exists(p)), 'app.db')

def check_settings():
    print(f"📂 กำลังตรวจสอบข้อมูลใน: {db_path}")
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # ลองดึงข้อมูลจากตาราง settings
        cursor.execute("SELECT key, value FROM settings")
        rows = cursor.fetchall()
        
        if not rows:
            print("❌ ตาราง Settings ว่างเปล่า (ยังไม่ได้บันทึกอะไรเลย)")
        else:
            print("✅ ข้อมูลที่มีใน Database ปัจจุบัน:")
            print("-" * 40)
            for key, val in rows:
                print(f"🔑 {key.ljust(20)} : {val}")
            print("-" * 40)
            
    except Exception as e:
        print(f"⚠️ เกิดข้อผิดพลาด: {e}")
        print("ข้อแนะนำ: ตาราง 'settings' อาจจะยังไม่ได้สร้าง ให้ลองรัน init_data.py หรือ fix_db.py")
    finally:
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    check_settings()