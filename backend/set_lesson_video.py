"""ใส่ลิงก์คลิป YouTube ให้บทเรียน

ใช้ตอนที่ยังไม่มีหน้าหลังบ้าน — พี่หมิงอัดคลิปเสร็จแล้วเอามาใส่เองได้เลย

    python set_lesson_video.py                 ดูรายการบทเรียนทั้งหมด
    python set_lesson_video.py --course 1      ดูเฉพาะคอร์สนั้น
    python set_lesson_video.py 12 https://youtu.be/xxxxxxxxxxx
    python set_lesson_video.py 12 xxxxxxxxxxx --minutes 42

รับได้ทุกแบบที่ก๊อปมาจาก YouTube:
    https://www.youtube.com/watch?v=abc12345678
    https://youtu.be/abc12345678
    https://www.youtube.com/embed/abc12345678
    https://www.youtube.com/live/abc12345678
    abc12345678                                (ไอดีเปล่า ๆ)
"""
import argparse
import os
import re
import sys
from urllib.parse import parse_qs, urlparse

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import settings          # noqa: E402  (พา app/__init__ มาโหลด .env)
from app.database import SessionLocal    # noqa: E402
from app import models                   # noqa: E402

# ไอดีคลิป YouTube คือ 11 ตัวอักษร a-z A-Z 0-9 _ -
_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")


def extract_id(raw: str) -> str | None:
    """ดึงไอดีคลิปออกจากสิ่งที่ผู้ใช้วางมา

    ตรวจความยาว 11 ตัวเสมอ — กันเคสวางลิงก์ผิดแล้วได้ค่าที่ดูเหมือนไอดี
    แต่เล่นไม่ได้จริง ซึ่งจะไปโผล่เป็นจอดำให้นักเรียนเห็น
    """
    raw = (raw or "").strip()
    if not raw:
        return None
    if _ID_RE.match(raw):
        return raw

    try:
        u = urlparse(raw)
    except ValueError:
        return None

    if u.query:
        v = parse_qs(u.query).get("v", [None])[0]
        if v and _ID_RE.match(v):
            return v

    # /embed/ID, /live/ID, /shorts/ID หรือ youtu.be/ID
    parts = [p for p in (u.path or "").split("/") if p]
    for p in reversed(parts):
        if _ID_RE.match(p):
            return p
    return None


def show(db, course_id: int | None):
    q = db.query(models.Course).order_by(models.Course.id)
    if course_id:
        q = q.filter(models.Course.id == course_id)
    courses = q.all()
    if not courses:
        print("ไม่พบคอร์ส")
        return

    for c in courses:
        n_missing = 0
        print(f"\n[{c.id}] {c.title}")
        for ch in sorted(c.chapters, key=lambda x: x.order or 0):
            print(f"   บท: {ch.title}")
            for l in sorted(ch.lessons, key=lambda x: x.order or 0):
                vid = (l.youtube_id or "").strip()
                mark = vid if vid else "— ยังไม่มีคลิป —"
                if not vid:
                    n_missing += 1
                print(f"     id={l.id:<4} {l.title[:44]:<46} {mark}")
        if n_missing:
            print(f"   >> ยังไม่มีคลิป {n_missing} บทเรียน")


def main() -> int:
    ap = argparse.ArgumentParser(description="ใส่ลิงก์คลิปให้บทเรียน")
    ap.add_argument("lesson_id", nargs="?", type=int, help="id ของบทเรียน")
    ap.add_argument("video", nargs="?", help="ลิงก์ YouTube หรือไอดี 11 ตัว")
    ap.add_argument("--minutes", type=int, help="ความยาวคลิป (นาที)")
    ap.add_argument("--course", type=int, help="ดูเฉพาะคอร์สนี้")
    ap.add_argument("--clear", action="store_true", help="ล้างคลิปออกจากบทเรียน")
    args = ap.parse_args()

    print(f"ฐานข้อมูล: {settings.DATABASE_URL.split('@')[-1]}")
    try:
        db = SessionLocal()
    except Exception as e:
        print(f"❌ ต่อฐานข้อมูลไม่ได้: {e}")
        print("   ถ้าเป็น Connection refused พอร์ต 5432 ให้เปิด Docker Desktop ก่อน")
        return 1

    try:
        if args.lesson_id is None:
            show(db, args.course)
            print("\nวิธีใส่คลิป:  python set_lesson_video.py <id บทเรียน> <ลิงก์ YouTube>")
            return 0

        lesson = db.get(models.Lesson, args.lesson_id)
        if not lesson:
            print(f"❌ ไม่พบบทเรียน id={args.lesson_id}")
            return 1

        if args.clear:
            lesson.youtube_id = ""
            db.commit()
            print(f"✅ ล้างคลิปออกจาก '{lesson.title}' แล้ว")
            return 0

        if not args.video:
            print("❌ ต้องใส่ลิงก์ YouTube หรือไอดีมาด้วย")
            return 1

        vid = extract_id(args.video)
        if not vid:
            print(f"❌ อ่านไอดีคลิปจาก '{args.video}' ไม่ออก")
            print("   ไอดีต้องยาว 11 ตัวอักษร เช่น https://youtu.be/abc12345678")
            return 1

        lesson.youtube_id = vid
        if args.minutes is not None:
            lesson.duration = max(0, args.minutes)
        db.commit()

        print(f"✅ ใส่คลิปให้ '{lesson.title}' แล้ว")
        print(f"   ไอดี      : {vid}")
        print(f"   ความยาว   : {lesson.duration} นาที")
        print(f"   ลองเปิดดู : https://youtu.be/{vid}")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
