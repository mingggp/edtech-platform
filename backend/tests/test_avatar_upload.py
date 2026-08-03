"""รูปโปรไฟล์ — อัปโหลด · แปลง · ลบ

เรื่องที่ต้องระวังเป็นพิเศษ เพราะผู้ใช้เว็บนี้เป็นเด็ก ม.ปลาย:

  EXIF ในรูปจากมือถือมีพิกัด GPS ที่ถ่ายติดมาด้วย ถ้าเก็บไฟล์เดิมแล้วเสิร์ฟ
  ออกไปตรง ๆ ใครโหลดรูปโปรไฟล์ไปเปิดดูก็รู้ว่าบ้านอยู่ไหน

  ทางแก้คือ "วาดรูปใหม่" จากพิกเซลล้วน ๆ ทุกครั้ง — EXIF หายไปเอง
"""
import io

import pytest
from PIL import Image

from app import crud
from app.auth import get_password_hash
from app.uploads import AVATAR_SIZE, make_avatar


def _photo(w=1200, h=600, *, exif=True) -> bytes:
    """รูปจำลองแบบที่ถ่ายจากมือถือ — มี EXIF พร้อมพิกัด GPS"""
    img = Image.new("RGB", (w, h), (200, 40, 90))
    buf = io.BytesIO()
    if exif:
        ex = Image.Exif()
        ex[0x010F] = "TestPhone"
        ex[0x0110] = "SuperCam 9"
        ex[0x9003] = "2026:08:03 14:22:10"
        gps = ex.get_ifd(0x8825)
        gps[1] = "N"; gps[2] = (13.0, 44.0, 0.0)
        gps[3] = "E"; gps[4] = (100.0, 30.0, 0.0)
        img.save(buf, format="JPEG", exif=ex)
    else:
        img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture(autouse=True)
def _clean_uploads():
    """เก็บกวาดไฟล์ที่เทสต์สร้างขึ้น

    เทสต์เขียนไฟล์จริงลง static/uploads/ ถ้าไม่ลบ รันเทสต์ทุกครั้งจะทิ้งขยะไว้
    จนโฟลเดอร์รก แล้วแยกไม่ออกว่าอันไหนของจริงอันไหนของเทสต์
    """
    from app.config import UPLOAD_DIR

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    before = set(UPLOAD_DIR.iterdir())
    yield
    for p in set(UPLOAD_DIR.iterdir()) - before:
        p.unlink(missing_ok=True)


@pytest.fixture
def token(client, db_session):
    email = "avatar@example.com"
    if not crud.get_user_by_email(db_session, email):
        crud.create_user(db_session, email, get_password_hash("password123"), "อวตาร")
    return client.post("/auth/login",
                       json={"email": email, "password": "password123"}).json()["access_token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


# ------------------------------------------------------------ การแปลงรูป

def test_exif_and_gps_are_stripped():
    """ข้อสำคัญที่สุดของไฟล์นี้"""
    raw = _photo()
    before = Image.open(io.BytesIO(raw)).getexif()
    assert before.get(0x010F) == "TestPhone", "รูปทดสอบต้องมี EXIF จริง ๆ ก่อน"
    assert before.get_ifd(0x8825), "รูปทดสอบต้องมี GPS จริง ๆ ก่อน"

    after = Image.open(io.BytesIO(make_avatar(raw))).getexif()
    assert not after.get(0x010F), "ยี่ห้อกล้องยังติดมา"
    assert not after.get(0x9003), "วันเวลาที่ถ่ายยังติดมา"
    assert not after.get_ifd(0x8825), "พิกัด GPS ยังติดมา — บ้านนักเรียนรั่ว"


def test_result_is_square_and_standard_size():
    img = Image.open(io.BytesIO(make_avatar(_photo(1200, 600))))
    assert img.size == (AVATAR_SIZE, AVATAR_SIZE)


def test_portrait_photo_is_not_squashed():
    """รูปแนวตั้งต้องถูกครอบ ไม่ใช่บีบจนหน้าแบน"""
    img = Image.open(io.BytesIO(make_avatar(_photo(600, 1600))))
    assert img.size == (AVATAR_SIZE, AVATAR_SIZE)


def test_transparent_png_becomes_opaque():
    """PNG โปร่งใสต้องแปลงเป็น JPEG ได้โดยไม่พัง"""
    img = Image.new("RGBA", (500, 500), (10, 200, 120, 0))
    buf = io.BytesIO(); img.save(buf, format="PNG")
    out = Image.open(io.BytesIO(make_avatar(buf.getvalue())))
    assert out.mode == "RGB"


def test_file_gets_much_smaller():
    raw = _photo(2400, 1600)
    assert len(make_avatar(raw)) < len(raw)


# --------------------------------------------------------------- endpoint

def test_upload_sets_avatar_url(client, token):
    r = client.post("/users/me/upload-image",
                    files={"file": ("selfie.jpg", _photo(), "image/jpeg")},
                    headers=_auth(token))
    assert r.status_code == 200, r.text
    url = r.json()["avatar_url"]
    assert url.startswith("/static/uploads/")
    assert client.get("/users/me", headers=_auth(token)).json()["avatar_url"] == url


def test_uploaded_file_on_disk_has_no_exif(client, token):
    """ตรวจไฟล์จริงบนดิสก์ ไม่ใช่แค่ผลจากฟังก์ชัน"""
    from app.config import UPLOAD_DIR

    r = client.post("/users/me/upload-image",
                    files={"file": ("selfie.jpg", _photo(), "image/jpeg")},
                    headers=_auth(token))
    name = r.json()["avatar_url"].rsplit("/", 1)[-1]
    saved = (UPLOAD_DIR / name).read_bytes()
    try:
        ex = Image.open(io.BytesIO(saved)).getexif()
        assert not ex.get_ifd(0x8825), "ไฟล์บนดิสก์ยังมีพิกัด GPS"
        assert Image.open(io.BytesIO(saved)).size == (AVATAR_SIZE, AVATAR_SIZE)
    finally:
        (UPLOAD_DIR / name).unlink(missing_ok=True)


def test_old_file_is_deleted_on_replace(client, token):
    """เปลี่ยนรูปแล้วไฟล์เก่าต้องถูกลบ ไม่งั้นดิสก์เต็มไปด้วยไฟล์ขยะ"""
    from app.config import UPLOAD_DIR

    first = client.post("/users/me/upload-image",
                        files={"file": ("a.jpg", _photo(), "image/jpeg")},
                        headers=_auth(token)).json()["avatar_url"]
    old = UPLOAD_DIR / first.rsplit("/", 1)[-1]
    assert old.is_file()

    second = client.post("/users/me/upload-image",
                         files={"file": ("b.jpg", _photo(800, 800), "image/jpeg")},
                         headers=_auth(token)).json()["avatar_url"]
    assert second != first
    assert not old.exists(), "ไฟล์เก่ายังอยู่"
    (UPLOAD_DIR / second.rsplit("/", 1)[-1]).unlink(missing_ok=True)


def test_remove_avatar(client, token):
    from app.config import UPLOAD_DIR

    url = client.post("/users/me/upload-image",
                      files={"file": ("a.jpg", _photo(), "image/jpeg")},
                      headers=_auth(token)).json()["avatar_url"]
    path = UPLOAD_DIR / url.rsplit("/", 1)[-1]

    assert client.delete("/users/me/upload-image", headers=_auth(token)).status_code == 204
    assert client.get("/users/me", headers=_auth(token)).json()["avatar_url"] is None
    assert not path.exists()


def test_upload_requires_login(client):
    r = client.post("/users/me/upload-image",
                    files={"file": ("a.jpg", _photo(), "image/jpeg")})
    assert r.status_code in (401, 403)


def test_non_image_rejected(client, token):
    r = client.post("/users/me/upload-image",
                    files={"file": ("virus.jpg", b"MZ\x90\x00 not an image", "image/jpeg")},
                    headers=_auth(token))
    assert r.status_code == 400


def test_wrong_mime_rejected(client, token):
    r = client.post("/users/me/upload-image",
                    files={"file": ("script.svg", b"<svg onload=alert(1)/>", "image/svg+xml")},
                    headers=_auth(token))
    assert r.status_code == 400


def test_decompression_bomb_rejected(client, token):
    """ไฟล์เล็กแต่ประกาศขนาดมหาศาล — เบราว์เซอร์ที่โหลดไปแสดงจะกินแรมจนค้าง"""
    bomb = Image.new("L", (20000, 20000), 0)      # PNG สีเดียว บีบอัดแล้วเล็กมาก
    buf = io.BytesIO(); bomb.save(buf, format="PNG")
    assert len(buf.getvalue()) < 1_000_000, "รูปทดสอบต้องเล็กจริง"

    r = client.post("/users/me/upload-image",
                    files={"file": ("bomb.png", buf.getvalue(), "image/png")},
                    headers=_auth(token))
    assert r.status_code == 400, f"ต้องปฏิเสธ แต่ได้ {r.status_code}"
