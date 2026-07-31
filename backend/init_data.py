# backend/init_data.py
"""สร้างข้อมูลตั้งต้นสำหรับพัฒนา/ทดสอบ

คอร์สทั้ง 14 ตัวถอดมาจาก `Claude Design version 1.0/courses.js` ซึ่งเป็น
source of truth ฝั่งหน้าเว็บ — ถ้าแก้คอร์สที่นั่น อย่าลืมมาแก้ที่นี่ด้วย
(ยังไม่ได้ทำ import อัตโนมัติ เพราะ backend ไม่ควรผูกกับไฟล์ดีไซน์โดยตรง)

⚠️  สคริปต์นี้ล้างฐานข้อมูลทั้งหมด — ห้ามรันบน production
    ต้องใส่ --yes หรือตั้ง ALLOW_DB_RESET=1 ถึงจะทำงาน
"""
import argparse
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app import models, achievements_seed
from app.auth import get_password_hash

# --------------------------------------------------------------------------
# คอร์ส — ถอดจาก courses.js (subject/level ตรงกับ subjects.js)
# --------------------------------------------------------------------------
COURSES = [
    dict(slug='amath-calculus', subject='math', level='alevel',
         title='แคลคูลัส · ขั้นเทพ', price=2490, price_old=3990,
         lessons='24 บท', hours='18 ชม.', audience='ม.6 · เตรียมสอบ',
         description='เริ่มจากศูนย์ — ไล่ขั้นจาก ลิมิต → อนุพันธ์ → ปริพันธ์ → โจทย์รวมแนวข้อสอบ. คอร์สที่นักเรียนพี่หมิงสอบติด วิศว'),
    dict(slug='amath-alevel1', subject='math', level='alevel',
         title='A-Level คณิต 1 · ฉบับเก็บคะแนน', price=1990, price_old=2990,
         lessons='22 บท', hours='20 ชม.', audience='เตรียมสอบ · TCAS',
         description='ครบทุกบทที่ออกใน A-Level คณิตประยุกต์ 1 — เน้นโจทย์เก็บคะแนนและเทคนิคทำเร็ว.'),
    dict(slug='math-trig', subject='math', level='m5',
         title='ตรีโกณมิติ ม.5 เทอม 1', price=0, price_old=None,
         lessons='10 บท', hours='7 ชม.', audience='ม.5 · ในเทอม',
         description='ปูพื้นตรีโกณมิติให้แน่นตั้งแต่ในห้องเรียน — คอร์สฟรีให้ลองสัมผัสวิธีสอนของพี่หมิงก่อน.'),
    dict(slug='math-func', subject='math', level='m4',
         title='ฟังก์ชัน & ลอการิทึม', price=1190, price_old=None,
         lessons='12 บท', hours='9 ชม.', audience='ม.4',
         description='ปูพื้นฟังก์ชัน เอกซ์โพเนนเชียล และลอการิทึมสำหรับ ม.4 — เข้าใจนิยาม กราฟ และการแก้สมการก่อนขึ้นบทยาก.'),
    dict(slug='math-stats', subject='math', level='m6',
         title='ความน่าจะเป็นและสถิติ', price=1790, price_old=None,
         lessons='14 บท', hours='11 ชม.', audience='ม.6 · ในเทอม',
         description='เก็บครบความน่าจะเป็นและสถิติ ม.6 — เข้าใจคอนเซปต์ ไม่ใช่ท่องสูตร พร้อมโจทย์หลากหลาย.'),
    dict(slug='aphys-full', subject='phys', level='alevel',
         title='A-Level ฟิสิกส์ · ครบสนามสอบ', price=2290, price_old=3490,
         lessons='24 บท', hours='21 ชม.', audience='เตรียมสอบ · TCAS',
         description='ครบทุกบทของ A-Level ฟิสิกส์ — กลศาสตร์ ไฟฟ้า คลื่น ความร้อน ฟิสิกส์ยุคใหม่ พร้อมโจทย์ข้อสอบจริง.'),
    dict(slug='aphys-mechanics', subject='phys', level='alevel',
         title='กลศาสตร์ & โมเมนตัม · A-Level', price=1990, price_old=None,
         lessons='18 บท', hours='15 ชม.', audience='เตรียมสอบ · TCAS',
         description='เจาะลึกกลศาสตร์และโมเมนตัมสำหรับ A-Level ฟิสิกส์ — เข้าใจหลักการ ทำโจทย์ยากได้.'),
    dict(slug='phys-kinematics', subject='phys', level='m4',
         title='จลนศาสตร์เบื้องต้น', price=1290, price_old=None,
         lessons='12 บท', hours='9 ชม.', audience='ม.4',
         description='เริ่มต้นฟิสิกส์ ม.4 ด้วยการเคลื่อนที่แนวตรง ความเร็ว ความเร่ง และกราฟการเคลื่อนที่ — พื้นฐานที่ใช้ต่อทุกบท.'),
    dict(slug='phys-electric', subject='phys', level='m5',
         title='ไฟฟ้าสถิตและกระแส', price=1790, price_old=2490,
         lessons='16 บท', hours='12 ชม.', audience='ม.5 · ในเทอม',
         description='เข้าใจไฟฟ้าสถิตและไฟฟ้ากระแสแบบเห็นภาพ — ปูพื้นแน่นก่อนต่อ A-Level และ TPAT3.'),
    dict(slug='phys-wave', subject='phys', level='m6',
         title='คลื่นและเสียง · เต็มรูป', price=1890, price_old=None,
         lessons='14 บท', hours='12 ชม.', audience='ม.6 · ในเทอม',
         description='ครบเรื่องคลื่นกล คลื่นเสียง และปรากฏการณ์ที่ออกสอบบ่อย — เข้าใจตั้งแต่ในห้องเรียน.'),
    dict(slug='tpat3-latest', subject='tpat3', level=None,
         title='ตะลุย TPAT3 ปีล่าสุด', price=2290, price_old=3490,
         lessons='20 บท', hours='22 ชม.', audience='เตรียมสอบ · TCAS',
         description='รวมแนวข้อสอบ TPAT3 ปีล่าสุดทุกพาร์ต — ฟิสิกส์ เคมีพื้นฐานการคำนวณ ตรรกะ และมิติสัมพันธ์ พร้อมเฉลยละเอียด.'),
    dict(slug='tpat3-logic', subject='tpat3', level=None,
         title='TPAT3 · ตรรกะวิศวกร', price=1890, price_old=None,
         lessons='14 บท', hours='12 ชม.', audience='เตรียมสอบ · TCAS',
         description='ฝึกการคิดเชิงตรรกะและมิติสัมพันธ์แบบที่ TPAT3 ชอบออก — เห็นโจทย์ปุ๊บรู้วิธีคิดปั๊บ.'),
    dict(slug='tpat3-mock', subject='tpat3', level=None,
         title='ข้อสอบจำลอง TPAT3 · 5 ชุด', price=1490, price_old=None,
         lessons='5 ชุด', hours='16 ชม.', audience='เตรียมสอบ · TCAS',
         description='ซ้อมจริงด้วยชุดข้อสอบจำลอง 5 ชุด จับเวลาเหมือนสนามจริง พร้อมเฉลยรายข้อและวิเคราะห์จุดอ่อน.'),
    dict(slug='tgat2-logic', subject='tgat2', level=None,
         title='TGAT2 · การคิดอย่างมีเหตุผล', price=1990, price_old=2890,
         lessons='20 บท', hours='16 ชม.', audience='เตรียมสอบ · TCAS',
         description='เจาะ TGAT2 ส่วนการคิดอย่างมีตรรกะและตัวเลข — จับแพตเทิร์นข้อสอบจริง ทำทันเวลา ทุกพาร์ต.'),
]


def _guard(force: bool):
    """กันรันทับฐานข้อมูลจริง — พลาดทีเดียวข้อมูลนักเรียนหายหมด"""
    url = os.getenv("DATABASE_URL", "sqlite:///./app.db")
    if force or os.getenv("ALLOW_DB_RESET") == "1":
        return
    print("❌ สคริปต์นี้จะลบข้อมูลทั้งหมดใน:", url)
    print("   ถ้าแน่ใจแล้วให้รัน:  python init_data.py --yes")
    sys.exit(1)


def init_db(force: bool = False):
    _guard(force)
    print("🗑️  ล้างข้อมูลเก่าและสร้างตารางใหม่...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("👤 สร้างผู้ใช้...")
        admin = models.User(
            email="admin@test.com",
            hashed_password=get_password_hash("password"),
            full_name="หมิง (เจ้าของ)",
            nickname="หมิง",
            role="admin",
            is_online=True,
        )
        student = models.User(
            email="student@test.com",
            hashed_password=get_password_hash("password"),
            full_name="น้องปาล์ม ทดสอบระบบ",
            nickname="ปาล์ม",
            role="student",
            grade_level="M6",
            dek_code="69",
            daily_goal_minutes=30,
        )
        db.add_all([admin, student])
        db.commit()

        print("🏅 สร้างแคตตาล็อกเหรียญ...")
        achievements_seed.seed(db)

        print(f"📚 สร้างคอร์ส {len(COURSES)} คอร์ส...")
        created = []
        for c in COURSES:
            course = models.Course(
                title=c["title"],
                description=c["description"],
                price=float(c["price"]),
                price_old=float(c["price_old"]) if c["price_old"] else None,
                subject=c["subject"],
                level=c["level"],
                category="General",
                highlights=f"✅ {c['lessons']}\n✅ {c['hours']}\n✅ สอนโดยพี่หมิง",
                target_audience=c["audience"],
                is_active=True,
            )
            db.add(course)
            created.append((c, course))
        db.commit()

        print("🎥 ใส่บทเรียนตัวอย่างให้ทุกคอร์ส...")
        for c, course in created:
            ch = models.Chapter(course_id=course.id, title="บทนำ", order=1)
            db.add(ch)
            db.commit()
            for i in (1, 2):
                db.add(models.Lesson(
                    chapter_id=ch.id,
                    title=f"EP.{i} {c['title']}",
                    youtube_id="dQw4w9WgXcQ",     # placeholder — เปลี่ยนเป็นคลิปจริงทีหลัง
                    duration=20,
                    order=i,
                ))
        db.commit()

        print("🎟️  สร้างคูปอง...")
        db.add(models.Coupon(code="SAVE100", discount_type="amount",
                             discount_value=100.0, max_usage=10))
        db.commit()

        print("🎓 ให้ student ลงเรียนคอร์สแรก...")
        first = created[0][1]
        db.add(models.Enrollment(user_id=student.id, course_id=first.id))
        db.commit()

        by_subject = {}
        for c, _ in created:
            by_subject[c["subject"]] = by_subject.get(c["subject"], 0) + 1

        print("\n✅ เสร็จเรียบร้อย")
        print("------------------------------------------------")
        print("คอร์สต่อวิชา:", ", ".join(f"{k}={v}" for k, v in by_subject.items()))
        print("👉 Admin:   admin@test.com / password")
        print("👉 Student: student@test.com / password")
        print("------------------------------------------------")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--yes", action="store_true", help="ยืนยันว่าจะล้างฐานข้อมูลจริง")
    init_db(force=ap.parse_args().yes)
