"""กีม — XP · สตรีค · เหรียญ · แจ้งเตือน

เพิ่ม 5 ตาราง + คอลัมน์สรุปใน users
"วัน" ทุกที่ในตารางพวกนี้คือวันตามเวลาไทย (UTC+7) ไม่ใช่ UTC

Revision ID: c7d8e9f0a1b2
Revises: b1c2d3e4f5a6
Create Date: 2026-07-28
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c7d8e9f0a1b2'
down_revision: Union[str, Sequence[str], None] = 'b1c2d3e4f5a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---- ยอดสรุปใน users (ความจริงอยู่ที่ xp_events / daily_activity) ----
    op.add_column('users', sa.Column('xp_total', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('level', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('users', sa.Column('streak_current', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('streak_best', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('streak_freezes', sa.Integer(), nullable=False, server_default='2'))
    op.add_column('users', sa.Column('daily_goal_minutes', sa.Integer(), nullable=False, server_default='30'))
    op.add_column('users', sa.Column('last_active_day', sa.Date(), nullable=True))

    # ---- XP ledger ----
    op.create_table(
        'xp_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('source', sa.String(), nullable=False),
        sa.Column('source_key', sa.String(), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('note', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        # กัน XP เด้งซ้ำจาก client ที่ยิงซ้ำ — ให้ DB เป็นคนกัน ไม่ใช่โค้ด
        sa.UniqueConstraint('user_id', 'source', 'source_key', name='uq_xp_once'),
    )
    op.create_index(op.f('ix_xp_events_id'), 'xp_events', ['id'])
    op.create_index(op.f('ix_xp_events_user_id'), 'xp_events', ['user_id'])
    op.create_index('ix_xp_user_created', 'xp_events', ['user_id', 'created_at'])

    # ---- กิจกรรมรายวัน (ฐานของสตรีค + leaderboard) ----
    op.create_table(
        'daily_activity',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('day', sa.Date(), nullable=False),
        sa.Column('minutes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('xp', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('goal_minutes', sa.Integer(), nullable=False, server_default='30'),
        sa.Column('met_goal', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('freeze_used', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'day', name='uq_daily_once'),
    )
    op.create_index(op.f('ix_daily_activity_id'), 'daily_activity', ['id'])
    op.create_index(op.f('ix_daily_activity_user_id'), 'daily_activity', ['user_id'])
    # (day, user_id) — ใช้ตอนทำ leaderboard ราย วัน/สัปดาห์/เดือน
    op.create_index('ix_daily_day_user', 'daily_activity', ['day', 'user_id'])

    # ---- เหรียญ ----
    op.create_table(
        'achievements',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('tier', sa.String(), nullable=True, server_default='common'),
        sa.Column('icon', sa.String(), nullable=True),
        sa.Column('category', sa.String(), nullable=True, server_default='General'),
        sa.Column('sort_order', sa.Integer(), nullable=True, server_default='0'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table(
        'user_achievements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('achievement_id', sa.String(), nullable=True),
        sa.Column('unlocked_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['achievement_id'], ['achievements.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'achievement_id', name='uq_badge_once'),
    )
    op.create_index(op.f('ix_user_achievements_id'), 'user_achievements', ['id'])
    op.create_index(op.f('ix_user_achievements_user_id'), 'user_achievements', ['user_id'])
    op.create_index(op.f('ix_user_achievements_achievement_id'), 'user_achievements', ['achievement_id'])

    # ---- แจ้งเตือน ----
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('body', sa.String(), nullable=True),
        sa.Column('href', sa.String(), nullable=True),
        sa.Column('dedupe_key', sa.String(), nullable=True),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'dedupe_key', name='uq_notif_dedupe'),
    )
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'])
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'])
    op.create_index('ix_notif_user_created', 'notifications', ['user_id', 'created_at'])


def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('user_achievements')
    op.drop_table('achievements')
    op.drop_table('daily_activity')
    op.drop_table('xp_events')
    for col in ('last_active_day', 'daily_goal_minutes', 'streak_freezes',
                'streak_best', 'streak_current', 'level', 'xp_total'):
        op.drop_column('users', col)
