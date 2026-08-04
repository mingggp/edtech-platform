"""คอมเมนต์ — เพิ่มการตอบกลับ + ดัชนีที่จำเป็น

ทำไมต้องมี parent_id:
เว็บนี้เป็นคอร์สติว คำถามใต้คลิปต้องมีคนตอบได้ ไม่งั้นนักเรียนถามแล้วเงียบ
โครงเดิมเป็นรายการแบน ๆ ตอบกลับไม่ได้เลย

ทำไมต้องมีดัชนี:
ดึงคอมเมนต์ของบทเรียนหนึ่งคือ WHERE lesson_id = ? ซึ่งเดิมไม่มีดัชนี
ตอนมีคอมเมนต์ไม่กี่อันไม่รู้สึก แต่พอนักเรียนเยอะจะช้าขึ้นเรื่อย ๆ

Revision ID: b8c9d0e1f2a3
Revises: a1b2c3d4e5f6
"""
import sqlalchemy as sa
from alembic import op

revision = "b8c9d0e1f2a3"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def _cols(table: str) -> set[str]:
    insp = sa.inspect(op.get_bind())
    return {c["name"] for c in insp.get_columns(table)}


def _indexes(table: str) -> set[str]:
    insp = sa.inspect(op.get_bind())
    return {i["name"] for i in insp.get_indexes(table)}


def upgrade() -> None:
    cols = _cols("comments")
    idx = _indexes("comments")

    with op.batch_alter_table("comments") as b:
        if "parent_id" not in cols:
            b.add_column(sa.Column("parent_id", sa.Integer(), nullable=True))
            b.create_foreign_key(
                "fk_comments_parent", "comments", ["parent_id"], ["id"], ondelete="CASCADE"
            )

    if "ix_comments_lesson_id" not in idx:
        op.create_index("ix_comments_lesson_id", "comments", ["lesson_id"])
    if "ix_comments_parent_id" not in idx:
        op.create_index("ix_comments_parent_id", "comments", ["parent_id"])


def downgrade() -> None:
    idx = _indexes("comments")
    if "ix_comments_parent_id" in idx:
        op.drop_index("ix_comments_parent_id", table_name="comments")
    if "ix_comments_lesson_id" in idx:
        op.drop_index("ix_comments_lesson_id", table_name="comments")
    if "parent_id" in _cols("comments"):
        with op.batch_alter_table("comments") as b:
            b.drop_column("parent_id")
