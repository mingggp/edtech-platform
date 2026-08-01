"""แพ็กเกจหลักของ backend

โหลด .env ที่นี่ — จุดเดียวที่ทุกทางเข้าโปรแกรมต้องผ่าน

ทำไมต้องอยู่ตรงนี้ (บั๊กจริงที่เคยเกิด):
    เดิม load_dotenv() อยู่ใน main.py เท่านั้น แปลว่า
      uvicorn app.main:app  -> ผ่าน main.py -> อ่าน .env ได้ -> ใช้ PostgreSQL ✓
      python init_data.py   -> import app.database ตรง ๆ ไม่ผ่าน main.py
                               -> ไม่เคยอ่าน .env
                               -> ตกไปใช้ค่า default sqlite:///./app.db ✗

    ผลคือสคริปต์ seed สร้างคอร์ส 14 ตัวลง SQLite อย่างสวยงาม
    ส่วน API อ่าน PostgreSQL ที่ยังไม่มีคอลัมน์ใหม่ แล้วฟ้อง
    "column courses.price_old does not exist" วนอยู่หลายรอบ
    แถมสคริปต์ตรวจ (check_db.py) ก็ตรวจผิดฐานข้อมูลตามไปด้วย

    ย้ายมาไว้ที่ __init__.py ทำให้ทุกทางเข้า (uvicorn / init_data / check_db /
    alembic / pytest) อ่าน .env ตัวเดียวกันเสมอ

หมายเหตุ: load_dotenv() จะไม่ทับค่าที่ตั้งไว้ใน environment อยู่ก่อนแล้ว
ดังนั้นตอนเทสต์ที่สั่ง DATABASE_URL=sqlite:///... ยังทำงานได้ตามปกติ
"""
from pathlib import Path

from dotenv import load_dotenv

# backend/.env  (ขึ้นจาก app/ ไป 1 ชั้น)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
