"""exam_results — ตารางที่หายไปจาก migration

ทำไมถึงเพิ่งมามี:
ตาราง exam_results มีอยู่ใน models.py มานานแล้ว แต่ไม่เคยมี migration
มันเคยถูกสร้างขึ้นมาได้เพราะ main.py เรียก Base.metadata.create_all() ตอนเปิดแอป
ซึ่งสร้างตารางตาม models.py ตรง ๆ โดยไม่ผ่าน alembic

พอเอา create_all ออก (เพราะมันไปแย่งงาน alembic จนเกิด DuplicateTable) ปัญหานี้
ก็โผล่ออกมา — ฐานข้อมูลที่สร้างใหม่จาก `alembic upgrade head` จะไม่มีตารางนี้
แล้วหน้าที่เกี่ยวกับผลสอบจะพังด้วย "relation exam_results does not exist"

ฐานข้อมูลเครื่องที่ใช้อยู่ตอนนี้มีตารางนี้แล้ว (create_all สร้างไว้) migration นี้
จึงเช็คก่อนว่ามีหรือยัง ถ้ามีแล้วก็ข้าม — รันซ้ำได้ไม่พัง

Revision ID: f7a8b9c0d1e2
Revises: e5f6a7b8c9d0
"""
from alembic import op
import sqlalchemy as sa

revision = "f7a8b9c0d1e2"
down_revision = "e5f6a7b8c9d0"
branch_labels = None
depends_on = None

TABLE = "exam_results"


def _exists() -> bool:
    insp = sa.inspect(op.get_bind())
    return TABLE in insp.get_table_names()


def upgrade() -> None:
    if _exists():
        return  # ฐานข้อมูลเดิมที่ create_all เคยสร้างไว้ให้ — ไม่ต้องทำอะไร

    op.create_table(
        TABLE,
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("exam_id", sa.Integer(), nullable=True),
        sa.Column("score", sa.Integer(), nullable=True),
        sa.Column("total_score", sa.Integer(), nullable=True),
        sa.Column("answers", sa.String(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["exam_id"], ["exams.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_exam_results_id"), TABLE, ["id"])
    op.create_index(op.f("ix_exam_results_user_id"), TABLE, ["user_id"])
    op.create_index(op.f("ix_exam_results_exam_id"), TABLE, ["exam_id"])


def downgrade() -> None:
    if not _exists():
        return
    op.drop_index(op.f("ix_exam_results_exam_id"), table_name=TABLE)
    op.drop_index(op.f("ix_exam_results_user_id"), table_name=TABLE)
    op.drop_index(op.f("ix_exam_results_id"), table_name=TABLE)
    op.drop_table(TABLE)
