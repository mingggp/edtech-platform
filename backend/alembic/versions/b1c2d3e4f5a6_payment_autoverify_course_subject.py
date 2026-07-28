"""payment auto-verify + course subject/level

เปลี่ยนระบบชำระเงินจาก "อัปโหลดสลิป + แอดมินอนุมัติ" เป็น
"PromptPay ยืนยันอัตโนมัติผ่าน webhook" ตามที่ระบุใน CLAUDE.md
และเพิ่มฟิลด์วิชา/ระดับให้ตาราง courses ให้ตรงกับ subjects.js ฝั่งหน้าเว็บ

Revision ID: b1c2d3e4f5a6
Revises: 29830fc93a69
Create Date: 2026-07-28
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b1c2d3e4f5a6'
down_revision: Union[str, Sequence[str], None] = '29830fc93a69'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---- courses: เพิ่มวิชา / ระดับ / ราคาก่อนลด ----
    op.add_column('courses', sa.Column('subject', sa.String(), nullable=True))
    op.add_column('courses', sa.Column('level', sa.String(), nullable=True))
    op.add_column('courses', sa.Column('price_old', sa.Float(), nullable=True))
    op.create_index(op.f('ix_courses_subject'), 'courses', ['subject'])
    op.create_index(op.f('ix_courses_level'), 'courses', ['level'])

    # ---- payments: เลิกใช้สลิป เปลี่ยนเป็น reference จากเกตเวย์ ----
    op.add_column('payments', sa.Column('provider', sa.String(), nullable=True))
    op.add_column('payments', sa.Column('provider_ref', sa.String(), nullable=True))
    op.add_column('payments', sa.Column('charge_id', sa.String(), nullable=True))
    op.add_column('payments', sa.Column('coupon_code', sa.String(), nullable=True))
    op.add_column('payments', sa.Column('expires_at', sa.DateTime(), nullable=True))
    op.add_column('payments', sa.Column('paid_at', sa.DateTime(), nullable=True))

    # ย้ายสถานะเดิมมาสู่ชุดใหม่ (awaiting | paid | expired)
    op.execute("UPDATE payments SET status = 'paid'    WHERE status = 'approved'")
    op.execute("UPDATE payments SET status = 'expired' WHERE status IN ('rejected', 'pending')")
    op.execute("UPDATE payments SET provider = 'promptpay' WHERE provider IS NULL")
    # รายการเก่าไม่มี ref — ใส่ค่าจาก id เพื่อให้ unique index ผ่าน
    op.execute("UPDATE payments SET provider_ref = 'LEGACY-' || id WHERE provider_ref IS NULL")
    op.execute("UPDATE payments SET paid_at = created_at WHERE status = 'paid' AND paid_at IS NULL")

    op.create_index(op.f('ix_payments_status'), 'payments', ['status'])
    op.create_index(op.f('ix_payments_provider_ref'), 'payments', ['provider_ref'], unique=True)

    op.drop_column('payments', 'slip_url')


def downgrade() -> None:
    op.add_column('payments', sa.Column('slip_url', sa.String(), nullable=True))
    op.drop_index(op.f('ix_payments_provider_ref'), table_name='payments')
    op.drop_index(op.f('ix_payments_status'), table_name='payments')
    op.execute("UPDATE payments SET status = 'approved' WHERE status = 'paid'")
    op.execute("UPDATE payments SET status = 'pending'  WHERE status IN ('awaiting', 'expired')")
    for col in ('paid_at', 'expires_at', 'coupon_code', 'charge_id', 'provider_ref', 'provider'):
        op.drop_column('payments', col)

    op.drop_index(op.f('ix_courses_level'), table_name='courses')
    op.drop_index(op.f('ix_courses_subject'), table_name='courses')
    for col in ('price_old', 'level', 'subject'):
        op.drop_column('courses', col)
