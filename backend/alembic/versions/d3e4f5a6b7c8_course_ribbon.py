"""course ribbon — ป้ายการตลาดบนการ์ดคอร์ส

hot | new | rec | free | NULL
แอดมินเลือกเอง ไม่ได้คำนวณจากอะไร (ต่างจาก total_minutes / student_count
ที่คำนวณจากข้อมูลที่มีอยู่แล้ว จึงไม่ต้องมีคอลัมน์)

Revision ID: d3e4f5a6b7c8
Revises: c7d8e9f0a1b2
Create Date: 2026-08-01
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd3e4f5a6b7c8'
down_revision: Union[str, Sequence[str], None] = 'c7d8e9f0a1b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('courses', sa.Column('ribbon', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('courses', 'ribbon')
