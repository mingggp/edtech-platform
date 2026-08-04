"""คอมเมนต์ใต้บทเรียน

ช่องโหว่ที่เจอตอนตรวจโค้ดเดิม ก่อนจะเขียนหน้าเว็บ:

  1. **อีเมลนักเรียนหลุด** — CommentRead ส่ง UserRead ทั้งก้อน
     GET /lessons/{id}/comments จึงส่งอีเมล ระดับชั้น และรุ่น DEK
     ของนักเรียนทุกคนที่คอมเมนต์ ไปให้เพื่อนร่วมคอร์สเห็นหมด
     เว็บนี้ผู้ใช้เป็นเด็ก ม.ปลาย เรื่องนี้ยอมไม่ได้

  2. **ไม่เช็คว่าซื้อคอร์สหรือยัง** — ใครล็อกอินก็อ่าน/เขียนคอมเมนต์
     ของบทเรียนไหนก็ได้ ทั้งที่คอมเมนต์มีคำถาม-คำตอบ-เฉลยอยู่ข้างใน

  3. **ไม่จำกัดความยาว** — โพสต์ข้อความยาวเท่าไหร่ก็ได้

  4. **ลบไม่ได้เลย** — พิมพ์ผิดหรือโดนสแปมก็ทำอะไรไม่ได้
"""
import pytest

from app import crud, models
from app.auth import get_password_hash


@pytest.fixture
def lesson(db_session):
    c = models.Course(title="A-Level คณิต", description="x", price=2490.0,
                      category="General", subject="math", is_active=True)
    db_session.add(c); db_session.commit(); db_session.refresh(c)
    ch = models.Chapter(course_id=c.id, title="บท 1", order=1)
    db_session.add(ch); db_session.commit(); db_session.refresh(ch)
    l = models.Lesson(chapter_id=ch.id, title="EP.1", youtube_id="v1", duration=20, order=1)
    db_session.add(l); db_session.commit(); db_session.refresh(l)
    return l


def _user(client, db_session, email, *, role="student", course_id=None):
    u = crud.get_user_by_email(db_session, email)
    if not u:
        u = crud.create_user(db_session, email, get_password_hash("password123"),
                             email.split("@")[0], nickname="เล่น" + email[:2])
    if u.role != role:
        u.role = role
        db_session.commit()
    if course_id and not crud.get_enrollment(db_session, u.id, course_id):
        crud.create_enrollment(db_session, u.id, course_id)
    tok = client.post("/auth/login",
                      json={"email": email, "password": "password123"}).json()["access_token"]
    return u, {"Authorization": f"Bearer {tok}"}


def _course_id(db_session, lesson):
    return crud.get_course_id_for_lesson(db_session, lesson.id)


# ------------------------------------------------------- ข้อมูลส่วนตัวต้องไม่หลุด

def test_email_is_never_exposed(client, db_session, lesson):
    """เคสที่สำคัญที่สุดของไฟล์นี้"""
    cid = _course_id(db_session, lesson)
    _, h = _user(client, db_session, "buyer1@example.com", course_id=cid)
    client.post(f"/lessons/{lesson.id}/comments", json={"text": "สวัสดีครับ"}, headers=h)

    _, h2 = _user(client, db_session, "buyer2@example.com", course_id=cid)
    r = client.get(f"/lessons/{lesson.id}/comments", headers=h2)
    assert r.status_code == 200
    assert "buyer1@example.com" not in r.text, "อีเมลนักเรียนหลุดให้เพื่อนร่วมคอร์สเห็น"

    author = r.json()[0]["user"]
    for leaked in ("email", "grade_level", "dek_code", "total_minutes"):
        assert leaked not in author, f"ยังส่ง {leaked} ออกไป"
    # แต่ต้องมีข้อมูลพอให้แสดงผลได้
    assert "nickname" in author and "avatar_url" in author and "role" in author


# ------------------------------------------------------------- ต้องซื้อก่อน

def test_outsider_cannot_read(client, db_session, lesson):
    _, h = _user(client, db_session, "outsider@example.com")
    assert client.get(f"/lessons/{lesson.id}/comments", headers=h).status_code == 403


def test_outsider_cannot_write(client, db_session, lesson):
    _, h = _user(client, db_session, "outsider2@example.com")
    r = client.post(f"/lessons/{lesson.id}/comments", json={"text": "สแปม"}, headers=h)
    assert r.status_code == 403


def test_anonymous_cannot_read(client, lesson):
    assert client.get(f"/lessons/{lesson.id}/comments").status_code in (401, 403)


def test_admin_can_read_without_buying(client, db_session, lesson):
    _, h = _user(client, db_session, "adm@example.com", role="admin")
    assert client.get(f"/lessons/{lesson.id}/comments", headers=h).status_code == 200


def test_missing_lesson_returns_404(client, db_session):
    _, h = _user(client, db_session, "x404@example.com")
    assert client.get("/lessons/999999/comments", headers=h).status_code == 404


# ----------------------------------------------------------------- เขียน/อ่าน

def test_post_and_read_back(client, db_session, lesson):
    cid = _course_id(db_session, lesson)
    _, h = _user(client, db_session, "w1@example.com", course_id=cid)
    r = client.post(f"/lessons/{lesson.id}/comments",
                    json={"text": "ข้อ 3 ทำไมได้ 15x⁴ ครับ"}, headers=h)
    assert r.status_code == 201, r.text
    assert r.json()["text"] == "ข้อ 3 ทำไมได้ 15x⁴ ครับ"

    body = client.get(f"/lessons/{lesson.id}/comments", headers=h).json()
    assert len(body) == 1
    assert body[0]["created_at"].endswith("Z")     # ต้องมี timezone (ดู test_datetime_timezone)


def test_newest_first(client, db_session, lesson):
    cid = _course_id(db_session, lesson)
    _, h = _user(client, db_session, "w2@example.com", course_id=cid)
    for t in ("อันแรก", "อันสอง", "อันสาม"):
        client.post(f"/lessons/{lesson.id}/comments", json={"text": t}, headers=h)
    body = client.get(f"/lessons/{lesson.id}/comments", headers=h).json()
    assert [c["text"] for c in body][0] == "อันสาม"


@pytest.mark.parametrize("text", ["", "   ", "\n\n"])
def test_empty_comment_rejected(client, db_session, lesson, text):
    cid = _course_id(db_session, lesson)
    _, h = _user(client, db_session, "w3@example.com", course_id=cid)
    r = client.post(f"/lessons/{lesson.id}/comments", json={"text": text}, headers=h)
    assert r.status_code == 422


def test_too_long_comment_rejected(client, db_session, lesson):
    cid = _course_id(db_session, lesson)
    _, h = _user(client, db_session, "w4@example.com", course_id=cid)
    r = client.post(f"/lessons/{lesson.id}/comments", json={"text": "ก" * 1001}, headers=h)
    assert r.status_code == 422


def test_whitespace_is_trimmed(client, db_session, lesson):
    cid = _course_id(db_session, lesson)
    _, h = _user(client, db_session, "w5@example.com", course_id=cid)
    r = client.post(f"/lessons/{lesson.id}/comments",
                    json={"text": "   มีช่องว่างหัวท้าย   "}, headers=h)
    assert r.json()["text"] == "มีช่องว่างหัวท้าย"


# ------------------------------------------------------------------ ตอบกลับ

def test_reply_appears_under_parent(client, db_session, lesson):
    cid = _course_id(db_session, lesson)
    _, hs = _user(client, db_session, "student@example.com", course_id=cid)
    _, ha = _user(client, db_session, "teacher@example.com", role="admin")

    q = client.post(f"/lessons/{lesson.id}/comments",
                    json={"text": "ข้อ 3 ทำยังไงครับ"}, headers=hs).json()
    client.post(f"/lessons/{lesson.id}/comments",
                json={"text": "ดึงเลขชี้กำลังลงมาคูณนะ", "parent_id": q["id"]}, headers=ha)

    body = client.get(f"/lessons/{lesson.id}/comments", headers=hs).json()
    assert len(body) == 1, "คำตอบต้องไม่โผล่เป็นคอมเมนต์หลักอีกอัน"
    assert len(body[0]["replies"]) == 1
    assert body[0]["replies"][0]["text"] == "ดึงเลขชี้กำลังลงมาคูณนะ"


def test_reply_to_reply_stays_one_level(client, db_session, lesson):
    """ตอบใต้คำตอบ ต้องไปอยู่ใต้คอมเมนต์หลักเดิม ไม่ซ้อนลึกลงไปอีก"""
    cid = _course_id(db_session, lesson)
    _, h = _user(client, db_session, "deep@example.com", course_id=cid)
    root = client.post(f"/lessons/{lesson.id}/comments", json={"text": "หลัก"}, headers=h).json()
    rep = client.post(f"/lessons/{lesson.id}/comments",
                      json={"text": "ตอบ 1", "parent_id": root["id"]}, headers=h).json()
    rep2 = client.post(f"/lessons/{lesson.id}/comments",
                       json={"text": "ตอบซ้อน", "parent_id": rep["id"]}, headers=h).json()
    assert rep2["parent_id"] == root["id"]

    body = client.get(f"/lessons/{lesson.id}/comments", headers=h).json()
    assert len(body) == 1
    assert len(body[0]["replies"]) == 2


def test_reply_to_other_lesson_rejected(client, db_session, lesson):
    cid = _course_id(db_session, lesson)
    _, h = _user(client, db_session, "xlesson@example.com", course_id=cid)
    root = client.post(f"/lessons/{lesson.id}/comments", json={"text": "หลัก"}, headers=h).json()

    other = models.Lesson(chapter_id=lesson.chapter_id, title="EP.2",
                          youtube_id="v2", duration=20, order=2)
    db_session.add(other); db_session.commit(); db_session.refresh(other)

    r = client.post(f"/lessons/{other.id}/comments",
                    json={"text": "ข้ามบท", "parent_id": root["id"]}, headers=h)
    assert r.status_code == 404


def test_replies_sorted_oldest_first(client, db_session, lesson):
    """บทสนทนาต้องอ่านไล่ตามเวลา ไม่งั้นงงว่าใครตอบใคร"""
    cid = _course_id(db_session, lesson)
    _, h = _user(client, db_session, "conv@example.com", course_id=cid)
    root = client.post(f"/lessons/{lesson.id}/comments", json={"text": "หลัก"}, headers=h).json()
    for t in ("ตอบ 1", "ตอบ 2", "ตอบ 3"):
        client.post(f"/lessons/{lesson.id}/comments",
                    json={"text": t, "parent_id": root["id"]}, headers=h)
    body = client.get(f"/lessons/{lesson.id}/comments", headers=h).json()
    assert [r["text"] for r in body[0]["replies"]] == ["ตอบ 1", "ตอบ 2", "ตอบ 3"]


# --------------------------------------------------------------------- ลบ

def test_owner_can_delete(client, db_session, lesson):
    cid = _course_id(db_session, lesson)
    _, h = _user(client, db_session, "own@example.com", course_id=cid)
    c = client.post(f"/lessons/{lesson.id}/comments", json={"text": "ลบฉันที"}, headers=h).json()
    assert c["can_delete"] is True
    assert client.delete(f"/lessons/comments/{c['id']}", headers=h).status_code == 204
    assert client.get(f"/lessons/{lesson.id}/comments", headers=h).json() == []


def test_other_student_cannot_delete(client, db_session, lesson):
    cid = _course_id(db_session, lesson)
    _, h1 = _user(client, db_session, "a1@example.com", course_id=cid)
    _, h2 = _user(client, db_session, "a2@example.com", course_id=cid)
    c = client.post(f"/lessons/{lesson.id}/comments", json={"text": "ของฉัน"}, headers=h1).json()

    assert client.delete(f"/lessons/comments/{c['id']}", headers=h2).status_code == 404
    body = client.get(f"/lessons/{lesson.id}/comments", headers=h2).json()
    assert body[0]["can_delete"] is False, "ปุ่มลบต้องไม่ขึ้นให้คนอื่น"
    assert len(body) == 1, "คอมเมนต์ต้องยังอยู่"


def test_admin_can_delete_anything(client, db_session, lesson):
    cid = _course_id(db_session, lesson)
    _, hs = _user(client, db_session, "s9@example.com", course_id=cid)
    _, ha = _user(client, db_session, "adm9@example.com", role="admin")
    c = client.post(f"/lessons/{lesson.id}/comments", json={"text": "สแปม"}, headers=hs).json()
    assert client.delete(f"/lessons/comments/{c['id']}", headers=ha).status_code == 204


def test_deleting_parent_removes_replies(client, db_session, lesson):
    """ไม่ทิ้งคำตอบลอยไว้ เพราะอ่านแล้วไม่รู้ว่าตอบอะไร"""
    cid = _course_id(db_session, lesson)
    _, h = _user(client, db_session, "casc@example.com", course_id=cid)
    root = client.post(f"/lessons/{lesson.id}/comments", json={"text": "หลัก"}, headers=h).json()
    client.post(f"/lessons/{lesson.id}/comments",
                json={"text": "ตอบ", "parent_id": root["id"]}, headers=h)

    client.delete(f"/lessons/comments/{root['id']}", headers=h)
    assert client.get(f"/lessons/{lesson.id}/comments", headers=h).json() == []
    assert db_session.query(models.Comment).count() == 0, "คำตอบยังค้างอยู่ในฐานข้อมูล"


# ------------------------------------------------------------------ ให้ดาว

def test_rating_requires_enrollment(client, db_session, lesson):
    """ไม่งั้นใครก็เข้ามาปั่นคะแนนคอร์สได้"""
    _, h = _user(client, db_session, "rater@example.com")
    assert client.post(f"/lessons/{lesson.id}/rate", json={"score": 1}, headers=h).status_code == 403


@pytest.mark.parametrize("score", [0, 6, -1, 99])
def test_rating_out_of_range_rejected(client, db_session, lesson, score):
    cid = _course_id(db_session, lesson)
    _, h = _user(client, db_session, "r2@example.com", course_id=cid)
    r = client.post(f"/lessons/{lesson.id}/rate", json={"score": score}, headers=h)
    assert r.status_code == 422
