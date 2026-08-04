"""ดึงไอดีคลิปออกจากลิงก์ YouTube

สคริปต์ set_lesson_video.py ใช้ตอนพี่หมิงเอาคลิปที่อัดเสร็จมาใส่ในบทเรียน
ถ้าอ่านลิงก์ผิด จะได้ไอดีที่ดูเหมือนถูกแต่เล่นไม่ได้ แล้วไปโผล่เป็นจอดำ
ให้นักเรียนที่จ่ายเงินมาแล้วเห็น — เลยต้องตรวจให้ครบทุกรูปแบบลิงก์
"""
import pytest

from set_lesson_video import extract_id

VID = "dQw4w9WgXcQ"


@pytest.mark.parametrize("raw", [
    f"https://www.youtube.com/watch?v={VID}",
    f"https://youtube.com/watch?v={VID}",
    f"https://m.youtube.com/watch?v={VID}",
    f"https://youtu.be/{VID}",
    f"https://youtu.be/{VID}?t=42",
    f"https://www.youtube.com/embed/{VID}",
    f"https://www.youtube.com/live/{VID}",
    f"https://www.youtube.com/shorts/{VID}",
    f"https://www.youtube.com/watch?v={VID}&list=PLabc&index=2",
    f"https://www.youtube-nocookie.com/embed/{VID}",
    VID,
    f"  {VID}  ",
])
def test_accepts_every_youtube_link_shape(raw):
    assert extract_id(raw) == VID


@pytest.mark.parametrize("raw", [
    "", "   ", None,
    "abc",                       # สั้นไป
    "abcdefghijklmnop",          # ยาวไป
    "https://example.com/",
    "https://www.youtube.com/",
    "ลิงก์ภาษาไทย",
])
def test_rejects_garbage(raw):
    """ต้องคืน None ไม่ใช่เดามั่ว — ค่าที่เดามั่วจะกลายเป็นจอดำให้นักเรียนเห็น"""
    assert extract_id(raw) is None


def test_id_must_be_exactly_11_chars():
    """ไอดี YouTube ยาว 11 ตัวเสมอ — ใช้เป็นด่านสุดท้ายกันค่าที่หน้าตาคล้าย"""
    assert extract_id("A" * 11) == "A" * 11
    assert extract_id("A" * 10) is None
    assert extract_id("A" * 12) is None


def test_underscore_and_dash_are_valid():
    weird = "a_b-c_d-e_f"
    assert len(weird) == 11
    assert extract_id(f"https://youtu.be/{weird}") == weird
