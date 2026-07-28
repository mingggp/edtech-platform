# backend/init_data.py
import sys
import os
from sqlalchemy.orm import Session

# ตั้งค่า Path ให้ Python มองเห็นโฟลเดอร์ app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app import models
from app.auth import get_password_hash

def init_db():
    print("🗑️  ล้างข้อมูลเก่าและสร้างตารางใหม่...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. สร้าง Users (Admin & Student)
        print("👤 Creating Users...")
        admin = models.User(
            email="admin@test.com",
            hashed_password=get_password_hash("password"),
            full_name="Super Admin",
            role="admin",
            is_online=True
        )
        student = models.User(
            email="student@test.com",
            hashed_password=get_password_hash("password"),
            full_name="Nong Student",
            role="student",
            grade_level="M6",
            dek_code="69"
        )
        db.add(admin)
        db.add(student)
        db.commit()

        # 2. สร้าง Course ตัวอย่าง
        print("📚 Creating Sample Course...")
        course = models.Course(
            title="ตะลุยโจทย์ Python A-Level",
            description="คอร์สเรียนเขียนโปรแกรมพื้นฐานจนถึงระดับสูง พร้อมตะลุยโจทย์จริง",
            price=990.0,
            category="Computers",
            thumbnail="https://images.unsplash.com/photo-1587620962725-abab7fe55159?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
            highlights="✅ ปูพื้นฐานแน่น\n✅ โจทย์กว่า 100 ข้อ\n✅ มีใบเซอร์",
            target_audience="นักเรียน ม.ปลาย ที่อยากเข้าวิศวะคอม"
        )
        db.add(course)
        db.commit()

        # 3. สร้างบทเรียน (สำคัญมาก เพื่อให้หน้า Learning Room ไม่ค้าง)
        print("🎥 Adding Lessons...")
        chapter = models.Chapter(course_id=course.id, title="บทนำ: รู้จักกับ Python", order=1)
        db.add(chapter)
        db.commit()

        lesson1 = models.Lesson(
            chapter_id=chapter.id,
            title="EP.1 ติดตั้ง Python และ VS Code",
            youtube_id="x7X9w_GIm1s", # คลิปตัวอย่าง
            duration=15,
            order=1
        )
        lesson2 = models.Lesson(
            chapter_id=chapter.id,
            title="EP.2 ตัวแปรและชนิดข้อมูล",
            youtube_id="_uQrJ0TkZlc",
            duration=20,
            order=2
        )
        db.add(lesson1)
        db.add(lesson2)
        db.commit()

        # 4. สร้างคูปอง (เอาไว้เทสระบบคูปอง)
        print("🎟️  Creating Coupons...")
        coupon = models.Coupon(
            code="SAVE100",
            discount_type="amount",
            discount_value=100.0,
            max_usage=10
        )
        db.add(coupon)
        db.commit()

        # 5. ให้ Student ลงเรียนเลย (จะได้กดเข้าเรียนได้ทันที)
        print("🎓 Enrolling student...")
        enroll = models.Enrollment(user_id=student.id, course_id=course.id)
        db.add(enroll)
        db.commit()

        print("\n✅  เสร็จเรียบร้อย! พร้อมทดสอบ")
        print("------------------------------------------------")
        print("👉 Admin Login:   admin@test.com / password")
        print("👉 Student Login: student@test.com / password")
        print("------------------------------------------------")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()