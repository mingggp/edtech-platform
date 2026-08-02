"""แปลง grade_level ของเดิมเป็น key มาตรฐาน + คำนวณรุ่น DEK ใหม่

ก่อนหน้านี้:
  grade_level เก็บได้หลายแบบปนกัน — "M6", "m6", "ม.6" แล้วแต่ว่าใครเขียนโค้ด
  ตรงไหน  ตัวที่กรองด้วย == (leaderboard, admin filter) จึงหาไม่เจอเงียบ ๆ

  dek_code คำนวณจากตารางตายตัว {"M6":69,...} ซึ่งเก่าไป 1 ปีแล้ว
  (ปีการศึกษา 2569 ม.6 ต้องเป็น DEK70 ไม่ใช่ 69)

migration นี้ทำ 2 อย่าง:
  1. แปลง grade_level ทุกแถวเป็น m4/m5/m6/other
  2. คำนวณ dek_code ใหม่จาก grade_level ด้วย app/grades.py

หมายเหตุเรื่องการย้อนกลับ:
downgrade แปลงกลับเป็นตัวพิมพ์ใหญ่ (M6) ให้เท่านั้น ส่วน dek_code ย้อนไม่ได้
เพราะค่าที่ถูกต้อง ณ วันนี้กับค่าที่ผิดของเดิมไม่ได้ต่างกันแบบตายตัว
ไม่เป็นไร เพราะค่าเดิมผิดอยู่แล้วและคำนวณใหม่ได้เสมอ

Revision ID: a1b2c3d4e5f6
Revises: f7a8b9c0d1e2
"""
import sqlalchemy as sa
from alembic import op

revision = "a1b2c3d4e5f6"
down_revision = "f7a8b9c0d1e2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    from app import grades

    conn = op.get_bind()
    users = sa.table(
        "users",
        sa.column("id", sa.Integer),
        sa.column("grade_level", sa.String),
        sa.column("dek_code", sa.String),
    )

    rows = conn.execute(sa.select(users.c.id, users.c.grade_level)).fetchall()
    for uid, raw in rows:
        key = grades.normalize(raw)
        conn.execute(
            users.update()
            .where(users.c.id == uid)
            .values(grade_level=key, dek_code=grades.dek_code(key))
        )


def downgrade() -> None:
    conn = op.get_bind()
    users = sa.table(
        "users",
        sa.column("id", sa.Integer),
        sa.column("grade_level", sa.String),
    )
    for key, old in (("m4", "M4"), ("m5", "M5"), ("m6", "M6")):
        conn.execute(
            users.update().where(users.c.grade_level == key).values(grade_level=old)
        )
