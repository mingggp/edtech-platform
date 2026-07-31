"""เทสต์ระบบกีม — เน้นเคสที่ระบบแบบนี้พังบ่อย

รายการที่จงใจไล่ปิด:
  1. เขตเวลา — "วัน" ต้องเป็นวันไทย ไม่ใช่ UTC (เรียนตี 1 ต้องนับเป็นวันนั้น)
  2. XP เด้งซ้ำเมื่อ client ยิงซ้ำ
  3. สตรีคเพิ่มรัวเมื่อเรียนหลายรอบในวันเดียว
  4. ตัวกันสตรีคหลุดถูกกินหลายใบตอนหายไปหลายวัน
  5. เปลี่ยนเป้าหมายรายวันแล้วประวัติย้อนหลังเปลี่ยนตาม
  6. ปลดเหรียญซ้ำ
  7. แจ้งเตือนซ้ำ
  8. ยอดสรุปเพี้ยนจาก ledger
"""
from datetime import datetime, date, timedelta

import pytest

from app import models, gamification as gm, achievements_seed
from app.auth import get_password_hash


@pytest.fixture
def user(db_session):
    from app import crud
    u = crud.get_user_by_email(db_session, "test@example.com")
    achievements_seed.seed(db_session)
    return u


# ---------------------------------------------------------------------------
# 1) เขตเวลาไทย
# ---------------------------------------------------------------------------

def test_th_date_shifts_by_seven_hours():
    """ตี 1 เวลาไทย = 18:00 UTC ของเมื่อวาน — ต้องนับเป็นวันไทยวันใหม่"""
    utc_evening = datetime(2026, 7, 27, 18, 0)      # = 01:00 ของ 28 ก.ค. ที่ไทย
    assert gm.th_date(utc_evening) == date(2026, 7, 28)


def test_th_date_before_midnight_thai():
    utc = datetime(2026, 7, 27, 16, 59)             # = 23:59 ของ 27 ก.ค. ที่ไทย
    assert gm.th_date(utc) == date(2026, 7, 27)


def test_day_boundary_is_midnight_not_seven_am():
    """กันบั๊กคลาสสิก: ใช้ utcnow().date() แล้ววันใหม่เริ่ม 7 โมงเช้า"""
    utc = datetime(2026, 7, 28, 3, 0)               # = 10:00 ไทย
    assert gm.th_date(utc) == date(2026, 7, 28)
    assert gm.th_date(utc) != utc.date() - timedelta(days=1)


# ---------------------------------------------------------------------------
# 2) XP ให้ครั้งเดียว
# ---------------------------------------------------------------------------

def test_xp_awarded_once_per_source_key(db_session, user):
    assert gm.award_xp(db_session, user, "lesson", "42") is not None
    assert gm.award_xp(db_session, user, "lesson", "42") is None, "ยิงซ้ำต้องไม่ได้ XP เพิ่ม"
    assert user.xp_total == gm.XP_RULES["lesson"]


def test_different_lessons_award_separately(db_session, user):
    gm.award_xp(db_session, user, "lesson", "1")
    gm.award_xp(db_session, user, "lesson", "2")
    assert user.xp_total == gm.XP_RULES["lesson"] * 2


def test_level_up_notification_created(db_session, user):
    gm.award_xp(db_session, user, "exam", "big", amount=1000)
    assert user.level > 1
    notes = gm.list_notifications(db_session, user.id)
    assert any(n.type == "achievement" and "LV" in n.title for n in notes)


# ---------------------------------------------------------------------------
# เลเวล
# ---------------------------------------------------------------------------

def test_level_one_starts_at_zero_xp():
    assert gm.level_for_xp(0) == (1, 0, 100)


def test_level_matches_design_numbers():
    """ดีไซน์หน้า XP & Level โชว์ LV 14 ที่ 2,840 / 4,000 XP"""
    assert gm.xp_to_next(14) == 4000
    total_to_lv14 = sum(gm.xp_to_next(n) for n in range(1, 14))
    lv, into, need = gm.level_for_xp(total_to_lv14 + 2840)
    assert (lv, into, need) == (14, 2840, 4000)


def test_level_never_goes_backwards_with_more_xp():
    prev = 0
    for xp in range(0, 60000, 977):
        lv = gm.level_for_xp(xp)[0]
        assert lv >= prev
        prev = lv


# ---------------------------------------------------------------------------
# 3) สตรีค
# ---------------------------------------------------------------------------

def test_first_study_starts_streak_at_one(db_session, user):
    gm.record_study(db_session, user, 10)
    assert user.streak_current == 1


def test_multiple_sessions_same_day_dont_bump_streak(db_session, user):
    gm.record_study(db_session, user, 10)
    gm.record_study(db_session, user, 10)
    gm.record_study(db_session, user, 10)
    assert user.streak_current == 1, "เรียนหลายรอบในวันเดียวต้องนับวันเดียว"
    row = db_session.query(models.DailyActivity).filter_by(user_id=user.id).one()
    assert row.minutes == 30


def test_consecutive_days_increase_streak(db_session, user):
    today = gm.th_today()
    user.last_active_day = today - timedelta(days=1)
    user.streak_current = 5
    db_session.commit()
    gm.record_study(db_session, user, 10)
    assert user.streak_current == 6


def test_gap_of_two_days_resets_when_no_freeze(db_session, user):
    today = gm.th_today()
    user.last_active_day = today - timedelta(days=3)
    user.streak_current = 20
    user.streak_freezes = 0
    db_session.commit()
    gm.record_study(db_session, user, 10)
    assert user.streak_current == 1


# ---------------------------------------------------------------------------
# 4) ตัวกันสตรีคหลุด
# ---------------------------------------------------------------------------

def test_freeze_bridges_a_single_missed_day(db_session, user):
    today = gm.th_today()
    user.last_active_day = today - timedelta(days=2)      # ขาดไป 1 วัน
    user.streak_current = 12
    user.streak_freezes = 2
    db_session.commit()
    gm.record_study(db_session, user, 10)
    assert user.streak_current == 13
    assert user.streak_freezes == 1, "ต้องใช้ freeze แค่ 1 ใบ"
    missed = db_session.query(models.DailyActivity).filter_by(
        user_id=user.id, day=today - timedelta(days=1)).one()
    assert missed.freeze_used is True


def test_freeze_does_not_cover_long_absence(db_session, user):
    """หายไป 5 วันแล้วกลับมา ต้องไม่กิน freeze รวดเดียวหลายใบ"""
    today = gm.th_today()
    user.last_active_day = today - timedelta(days=6)
    user.streak_current = 30
    user.streak_freezes = 5
    db_session.commit()
    gm.record_study(db_session, user, 10)
    assert user.streak_current == 1
    assert user.streak_freezes == 5, "freeze ต้องไม่ถูกใช้เลย"


def test_streak_status_reports_broken_streak_without_new_activity(db_session, user):
    """เปิดหน้าเฉย ๆ หลังหายไปนาน ต้องเห็นว่าสตรีคหลุดแล้ว"""
    user.last_active_day = gm.th_today() - timedelta(days=10)
    user.streak_current = 30
    user.streak_freezes = 0
    db_session.commit()
    assert gm.streak_status(db_session, user)["current"] == 0


# ---------------------------------------------------------------------------
# 5) เป้าหมายรายวัน
# ---------------------------------------------------------------------------

def test_meeting_goal_marks_day_and_awards_xp(db_session, user):
    user.daily_goal_minutes = 30
    db_session.commit()
    gm.record_study(db_session, user, 30)
    row = db_session.query(models.DailyActivity).filter_by(user_id=user.id).one()
    assert row.met_goal is True
    assert any(e.source == "goal" for e in
               db_session.query(models.XpEvent).filter_by(user_id=user.id).all())


def test_goal_xp_given_once_per_day(db_session, user):
    gm.record_study(db_session, user, 40)
    gm.record_study(db_session, user, 40)
    goals = db_session.query(models.XpEvent).filter_by(user_id=user.id, source="goal").count()
    assert goals == 1


def test_changing_goal_does_not_rewrite_history(db_session, user):
    """ประวัติเมื่อวานต้องคงเป้าหมายเดิมไว้ ไม่เปลี่ยนตามค่าที่เพิ่งตั้ง"""
    yesterday = gm.th_today() - timedelta(days=1)
    db_session.add(models.DailyActivity(user_id=user.id, day=yesterday, minutes=20,
                                        goal_minutes=20, met_goal=True))
    db_session.commit()
    gm.set_daily_goal(db_session, user, 120)
    old = db_session.query(models.DailyActivity).filter_by(user_id=user.id, day=yesterday).one()
    assert old.goal_minutes == 20 and old.met_goal is True


def test_goal_is_clamped(db_session, user):
    assert gm.set_daily_goal(db_session, user, 0) == 5
    assert gm.set_daily_goal(db_session, user, 99999) == 600


# ---------------------------------------------------------------------------
# 6) เหรียญ
# ---------------------------------------------------------------------------

def test_badge_unlocked_only_once(db_session, user):
    assert gm.unlock(db_session, user, "newbie") is not None
    assert gm.unlock(db_session, user, "newbie") is None
    n = db_session.query(models.UserAchievement).filter_by(user_id=user.id).count()
    assert n == 1


def test_check_all_is_safe_to_call_repeatedly(db_session, user):
    first = achievements_seed.check_all(db_session, user)
    second = achievements_seed.check_all(db_session, user)
    assert "newbie" in first
    assert second == [], "เรียกซ้ำต้องไม่ปลดอะไรใหม่"


def test_hotstreak_unlocks_at_seven_days(db_session, user):
    user.streak_current = 7
    db_session.commit()
    assert "hotstreak" in achievements_seed.check_all(db_session, user)


def test_catalog_ids_match_design(db_session, user):
    """id ต้องตรงกับ data-badge ใน Achievements.html"""
    design = {"newbie", "payer", "collector", "firststep", "hotstreak",
              "nightowl", "marathon", "weekend", "zombie"}
    assert {b[0] for b in achievements_seed.CATALOG} == design


# ---------------------------------------------------------------------------
# 7) แจ้งเตือน
# ---------------------------------------------------------------------------

def test_dedupe_key_prevents_duplicate_notifications(db_session, user):
    gm.notify(db_session, user, "streak", "เตือน", dedupe_key="streak:2026-07-28")
    db_session.commit()
    assert gm.notify(db_session, user, "streak", "เตือน", dedupe_key="streak:2026-07-28") is None
    assert len(gm.list_notifications(db_session, user.id)) == 1


def test_notifications_without_dedupe_key_can_repeat(db_session, user):
    gm.notify(db_session, user, "system", "ประกาศ")
    gm.notify(db_session, user, "system", "ประกาศ")
    db_session.commit()
    assert len(gm.list_notifications(db_session, user.id)) == 2


def test_mark_all_read(db_session, user):
    gm.notify(db_session, user, "system", "a")
    gm.notify(db_session, user, "system", "b")
    db_session.commit()
    assert gm.mark_all_read(db_session, user.id) == 2
    assert gm.list_notifications(db_session, user.id, unread_only=True) == []


# ---------------------------------------------------------------------------
# 8) Leaderboard + ซ่อมข้อมูล
# ---------------------------------------------------------------------------

def test_leaderboard_ranks_by_minutes(db_session, user):
    from app import crud
    other = crud.create_user(db=db_session, email="b@example.com",
                             hashed_password=get_password_hash("x"),
                             full_name="B", nickname="B", grade_level="M6")
    gm.record_study(db_session, user, 10)
    gm.record_study(db_session, other, 90)
    rows = gm.leaderboard(db_session, period="week")
    assert rows[0]["user_id"] == other.id and rows[0]["rank"] == 1
    assert rows[1]["user_id"] == user.id


def test_leaderboard_period_day_excludes_older_days(db_session, user):
    db_session.add(models.DailyActivity(user_id=user.id,
                                        day=gm.th_today() - timedelta(days=3),
                                        minutes=500, goal_minutes=30))
    db_session.commit()
    gm.record_study(db_session, user, 7)
    assert gm.leaderboard(db_session, period="day")[0]["minutes"] == 7


def test_leaderboard_bad_period_falls_back_to_week(db_session, user):
    gm.record_study(db_session, user, 5)
    assert gm.leaderboard(db_session, period="ไม่มีจริง") == gm.leaderboard(db_session, period="week")


def test_recalc_rebuilds_totals_from_ledger(db_session, user):
    gm.record_study(db_session, user, 25)
    gm.award_xp(db_session, user, "lesson", "9")
    user.xp_total = 999999          # ทำให้เพี้ยนเอง
    user.total_minutes = 0
    db_session.commit()
    gm.recalc_user_totals(db_session, user)
    assert user.total_minutes == 25
    assert user.xp_total == sum(e.amount for e in
                                db_session.query(models.XpEvent).filter_by(user_id=user.id))
