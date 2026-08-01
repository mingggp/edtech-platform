"""lesson kind — แยกคลิปวิดีโอ / แบบฝึกหัด / เอกสาร

ใช้นับ "จำนวนคลิป" กับ "จำนวนแบบฝึกหัด" แยกจากกันบนหน้ารายละเอียดคอร์ส
บทเรียนเดิมทั้งหมดถือเป็น video

Revision ID: e5f6a7b8c9d0
Revises: d3e4f5a6b7c8
Create Date: 2026-08-01
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = 'd3e4f5a6b7c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('lessons', sa.Column('kind', sa.String(), nullable=False,
                                       server_default='video'))
    # บทเรียนเดิมที่ไม่มี youtube_id น่าจะเป็นเอกสาร ไม่ใช่คลิป
    op.execute("UPDATE lessons SET kind = 'doc' "
               "WHERE (youtube_id IS NULL OR youtube_id = '') AND doc_url IS NOT NULL")


def downgrade() -> None:
    op.drop_column('lessons', 'kind')
