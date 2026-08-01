"""กัน endpoint ซ้ำ path เดียวกันข้ามไฟล์

ทำไมต้องมีเทสต์นี้:
    POST /users/me/courses เคยถูกประกาศไว้ 2 ที่ — users.py กับ payments.py
    users.router ถูก include ก่อน ตัวใน users.py จึงชนะเสมอ

    ตัวที่ชนะคือตัวเก่าที่ "ลงทะเบียนให้เลยโดยไม่เช็คราคา" = ได้คอร์สเสียเงินฟรี
    แถมตอนไปแก้ที่ payments.py ก็ไม่มีผลใด ๆ เพราะโดนบังอยู่
    ทั้ง FastAPI และ Python ไม่เตือนอะไรเลย เงียบสนิท

    เทสต์นี้จะตกทันทีถ้ามีใครประกาศ path ซ้ำอีก
"""
from collections import defaultdict

from app.main import app


def _walk(routes, seen=None):
    """ไล่ route ทั้งหมดรวมที่ซ้อนอยู่ใน router ย่อย

    FastAPI รุ่นนี้ include_router แล้วได้ _IncludedRouter ครอบไว้อีกชั้น
    route จริงอยู่ใน original_router.routes ไม่ได้แบนอยู่ใน app.routes
    """
    seen = seen if seen is not None else []
    for r in routes:
        inner = getattr(r, "original_router", None) or getattr(r, "router", None)
        if inner is not None and hasattr(inner, "routes"):
            _walk(inner.routes, seen)
            continue
        if hasattr(r, "routes") and getattr(r, "routes", None):
            _walk(r.routes, seen)
            continue
        if getattr(r, "methods", None) and getattr(r, "path", None):
            seen.append(r)
    return seen


def _routes():
    out = defaultdict(list)
    for r in _walk(app.routes):
        for m in r.methods - {"HEAD", "OPTIONS"}:
            out[(m, r.path)].append(getattr(r.endpoint, "__module__", "?"))
    return out


def test_route_walker_finds_routes():
    """กันเทสต์ด้านล่างผ่านเพราะหา route ไม่เจอ (ไม่ใช่เพราะไม่มีของซ้ำ)"""
    assert len(_routes()) > 40, "ไล่ route ไม่เจอ — วิธี walk ใช้ไม่ได้กับ FastAPI รุ่นนี้"


def test_no_duplicate_routes():
    dup = {k: v for k, v in _routes().items() if len(v) > 1}
    assert not dup, "มี endpoint ซ้ำ path เดียวกัน ตัวที่ประกาศทีหลังจะไม่ทำงาน:\n" + "\n".join(
        f"  {m} {p}  <- {', '.join(mods)}" for (m, p), mods in sorted(dup.items())
    )


def test_enroll_route_lives_in_payments():
    """endpoint ลงทะเบียนต้องอยู่ที่ payments.py ที่เดียว (ตัวที่เช็คราคา)"""
    mods = _routes().get(("POST", "/users/me/courses"), [])
    assert len(mods) == 1, f"POST /users/me/courses ควรมีที่เดียว แต่เจอ {mods}"
    assert mods[0].endswith("payments"), f"ควรอยู่ใน payments.py แต่อยู่ที่ {mods[0]}"
