"""ตรวจสุขภาพฐานข้อมูล — บอกว่าตอนนี้ตารางตรงกับโค้ดหรือยัง

รันเมื่อเจอ error แปลก ๆ ประเภท "column ... does not exist"
หรือ "relation ... already exists"

    python check_db.py

อ่านอย่างเดียว ไม่แก้อะไร ปลอดภัย 100%
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import inspect, text

from app.database import engine
from app import models  # noqa: F401  (ต้อง import เพื่อให้ Base รู้จักทุกตาราง)
from app.database import Base


def main():
    url = str(engine.url)
    if "@" in url:                       # ซ่อนรหัสผ่าน
        url = url.split("://")[0] + "://***@" + url.split("@")[-1]
    print(f"\nฐานข้อมูล: {url}\n")

    insp = inspect(engine)
    try:
        existing = set(insp.get_table_names())
    except Exception as e:
        print(f"❌ ต่อฐานข้อมูลไม่ได้: {e}")
        return 1

    # ---- เวอร์ชันที่ alembic คิดว่าอยู่ ----
    try:
        with engine.connect() as c:
            ver = c.execute(text("SELECT version_num FROM alembic_version")).scalar()
    except Exception:
        ver = None
    print(f"alembic คิดว่าอยู่เวอร์ชัน: {ver or '(ไม่มีตาราง alembic_version)'}")
    print("เวอร์ชันล่าสุดในโค้ด:      c7d8e9f0a1b2\n")

    # ---- เทียบตาราง/คอลัมน์ ----
    missing_tables, missing_cols = [], []
    for name, table in Base.metadata.tables.items():
        if name not in existing:
            missing_tables.append(name)
            continue
        have = {c["name"] for c in insp.get_columns(name)}
        want = {c.name for c in table.columns}
        gap = sorted(want - have)
        if gap:
            missing_cols.append((name, gap))

    if not missing_tables and not missing_cols:
        print("✅ ตารางในฐานข้อมูลตรงกับโค้ดครบทุกอย่าง")
        if ver != "c7d8e9f0a1b2":
            print("⚠️  แต่ alembic จดเวอร์ชันไม่ตรง — แก้ด้วย: alembic stamp head")
        n = 0
        try:
            with engine.connect() as c:
                n = c.execute(text("SELECT count(*) FROM courses")).scalar() or 0
        except Exception:
            pass
        print(f"\nจำนวนคอร์สในฐานข้อมูล: {n}")
        if n == 0:
            print("⚠️  ยังไม่มีคอร์สเลย — รัน: python init_data.py --yes")
        return 0

    print("❌ ฐานข้อมูลยังไม่ตรงกับโค้ด\n")
    if missing_tables:
        print("   ตารางที่ยังไม่มี:")
        for t in missing_tables:
            print(f"     - {t}")
    if missing_cols:
        print("   คอลัมน์ที่ยังไม่มี:")
        for t, cols in missing_cols:
            print(f"     - {t}: {', '.join(cols)}")

    print("\n👉 วิธีแก้ (เลือกอย่างใดอย่างหนึ่ง)")
    print("   ก) ล้างแล้วสร้างใหม่ — เร็วสุด ข้อมูลทดสอบหายหมด:")
    print("        python init_data.py --yes")
    print("   ข) ถ้ามีข้อมูลที่ไม่อยากให้หาย:")
    print("        alembic stamp <เวอร์ชันที่ตรงกับของจริง>  แล้วค่อย alembic upgrade head")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
