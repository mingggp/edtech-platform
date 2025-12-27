import sqlite3
import os

# ตรวจสอบ path ของ database
db_path = 'app.db'
if not os.path.exists(db_path):
    # กรณีรันจาก root folder
    db_path = 'backend/app.db'

def fix_db():
    print(f"🔧 กำลังเชื่อมต่อกับฐานข้อมูล: {db_path}")
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
    except Exception as e:
        print(f"❌ ไม่พบไฟล์ฐานข้อมูล: {e}")
        return

    # รายการคอลัมน์ที่ต้องมี (Table: [Column Definition])
    schema_changes = {
        "users": [
            "created_at DATETIME DEFAULT CURRENT_TIMESTAMP",
            "showcase_badges TEXT DEFAULT ''"
        ],
        "courses": [
            "created_at DATETIME DEFAULT CURRENT_TIMESTAMP"
        ],
        "study_logs": [
            "created_at DATETIME DEFAULT CURRENT_TIMESTAMP"
        ]
    }
    
    print("🔍 กำลังตรวจสอบโครงสร้างตาราง...")
    
    for table, columns in schema_changes.items():
        print(f"  📂 ตรวจสอบตาราง '{table}'...")
        try:
            # ดึงรายชื่อคอลัมน์ที่มีอยู่จริง
            cursor.execute(f"PRAGMA table_info({table})")
            existing_cols = [row[1] for row in cursor.fetchall()]
            
            if not existing_cols:
                print(f"     ⚠️ ไม่พบตาราง {table} (ข้าม)")
                continue

            for col_def in columns:
                col_name = col_def.split()[0]
                if col_name not in existing_cols:
                    print(f"     ➕ กำลังเพิ่มคอลัมน์ '{col_name}'...")
                    try:
                        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col_def}")
                        conn.commit()
                        print(f"        ✅ สำเร็จ!")
                    except Exception as e:
                        print(f"        ❌ เพิ่มไม่สำเร็จ: {e}")
                else:
                    print(f"     ✓ มีคอลัมน์ '{col_name}' แล้ว")
                    
        except Exception as e:
            print(f"     ❌ Error: {e}")

    conn.close()
    print("\n🎉 ซ่อมแซมฐานข้อมูลเสร็จสิ้น! กรุณา Restart Server")

if __name__ == "__main__":
    fix_db()