"""กันบั๊กสายพันธุ์ "ค่าเดียวกันเขียนไว้หลายที่แล้วหลุดกัน"

เคสจริงที่เคยเจอในโปรเจกต์นี้:

  1. init_data.py อ่าน DATABASE_URL เองแล้วตกไปใช้ sqlite ขณะที่ uvicorn ใช้
     PostgreSQL -> seed คอร์ส 14 ตัวลงคนละฐาน ใช้เวลาไล่หาสาเหตุ 3 รอบ
  2. .env เขียน CORS_ALLOW_ORIGINS แต่โค้ดอ่าน CORS_ORIGINS -> ค่าที่ตั้งไม่เคยถูกใช้
  3. promote_admin.py ตั้ง default เป็น postgres ขณะที่ไฟล์อื่นตั้งเป็น sqlite
  4. migrate.py / manage.py ยิง ALTER TABLE เองแข่งกับ Alembic -> DuplicateTable

เทสต์ในไฟล์นี้ไม่ได้เช็คว่าโปรแกรมทำงานถูก แต่เช็คว่า "กฎที่เราตั้งไว้ยังถูกรักษาอยู่"
ถ้าวันหน้ามีใคร (รวมถึงผมเอง) เผลอทำซ้ำ จะรู้ทันทีตอนรันเทสต์ ไม่ใช่ตอนขึ้น production
"""
import ast
import pathlib

import pytest

BACKEND = pathlib.Path(__file__).resolve().parent.parent
APP = BACKEND / "app"

# ไฟล์ที่ได้รับอนุญาตให้แตะ os.getenv โดยตรง
_ENV_READERS_OK = {"config.py", "__init__.py"}


def _py_files(root: pathlib.Path):
    for p in sorted(root.rglob("*.py")):
        if any(part in {".venv", "__pycache__", "alembic"} for part in p.parts):
            continue
        yield p


def _env_reads(path: pathlib.Path) -> list[tuple[int, str]]:
    """หา os.getenv(...) / os.environ[...] ในไฟล์ คืน (บรรทัด, ชื่อตัวแปร)"""
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    found: list[tuple[int, str]] = []
    for node in ast.walk(tree):
        # os.getenv("X")
        if (
            isinstance(node, ast.Call)
            and isinstance(node.func, ast.Attribute)
            and node.func.attr == "getenv"
        ):
            key = node.args[0].value if node.args and isinstance(node.args[0], ast.Constant) else "?"
            found.append((node.lineno, str(key)))
        # os.environ["X"] / os.environ.get("X")
        elif isinstance(node, ast.Attribute) and node.attr == "environ":
            found.append((node.lineno, "os.environ"))
    return found


def test_only_config_reads_env_inside_app():
    """โค้ดใน app/ ต้องอ่าน env ผ่าน settings เท่านั้น

    ถ้าเทสต์นี้ตก: ย้ายค่าไปประกาศเป็น field ใน Settings แล้วเรียก settings.X แทน
    """
    offenders = [
        f"{p.relative_to(BACKEND)}:{line} -> {key}"
        for p in _py_files(APP)
        if p.name not in _ENV_READERS_OK
        for line, key in _env_reads(p)
    ]
    assert not offenders, (
        "มีไฟล์อ่าน env เองแทนที่จะใช้ settings:\n  " + "\n  ".join(offenders)
    )


def _getenv_with_default(path: pathlib.Path) -> list[tuple[int, str]]:
    """หา os.getenv("KEY", "ค่า default") — คืนเฉพาะตัวที่ "ตั้งค่าสำรองเอง"

    การอ่าน os.getenv("X") เฉย ๆ ไม่นับเป็นปัญหา (check_db.py ใช้เทียบค่าเพื่อรายงาน)
    ที่อันตรายคือการ "ตั้ง default เอง" เพราะจะกลายเป็นความจริงคนละชุดกับ config.py
    """
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    out: list[tuple[int, str]] = []
    for node in ast.walk(tree):
        if (
            isinstance(node, ast.Call)
            and isinstance(node.func, ast.Attribute)
            and node.func.attr == "getenv"
            and len(node.args) >= 2
            and isinstance(node.args[0], ast.Constant)
        ):
            out.append((node.lineno, str(node.args[0].value)))
    return out


def test_only_config_sets_env_defaults():
    """ค่า default ของ env ต้องประกาศที่ config.py ที่เดียว

    เคสจริง: promote_admin.py ตั้ง default เป็น postgres, init_data.py ตั้งเป็น
    sqlite, config.py ก็ตั้งเป็น sqlite -> พอ .env ไม่ถูกโหลด แต่ละไฟล์วิ่งไป
    คนละฐานข้อมูลโดยไม่มีใครฟ้อง

    ข้อยกเว้น: ALLOW_DB_RESET ใน init_data.py เป็นสวิตช์เฉพาะกิจของสคริปต์นั้น
    ไม่ใช่ค่าตั้งค่าของแอป
    """
    allowed_keys = {"ALLOW_DB_RESET"}
    offenders = []
    for p in _py_files(BACKEND):
        if "tests" in p.parts or p.name in _ENV_READERS_OK:
            continue
        for line, key in _getenv_with_default(p):
            if key not in allowed_keys:
                offenders.append(f"{p.relative_to(BACKEND)}:{line} -> {key}")
    assert not offenders, (
        "มีไฟล์ตั้งค่า default ของ env เอง (ต้องย้ายไป config.py):\n  "
        + "\n  ".join(offenders)
    )


def test_no_handrolled_schema_scripts():
    """ห้ามมีสคริปต์ ALTER TABLE / CREATE TABLE เขียนมือนอก Alembic

    schema เป็นหน้าที่ของ alembic/versions/ ที่เดียว สคริปต์แบบเดิม (migrate.py,
    manage.py upgrade) ทำให้ฐานข้อมูลกับ alembic_version ไม่ตรงกัน แล้วไปพัง
    ตอนรัน `alembic upgrade head` ครั้งถัดไป
    """
    bad = []
    for p in _py_files(BACKEND):
        if "alembic" in p.parts or "tests" in p.parts:
            continue
        text = p.read_text(encoding="utf-8").upper()
        for stmt in ("ALTER TABLE", "DROP TABLE ", "CREATE TABLE "):
            # สนใจเฉพาะที่เป็น SQL จริง ไม่ใช่ข้อความในคอมเมนต์อธิบาย
            if f'"{stmt}' in text or f"'{stmt}" in text:
                bad.append(f"{p.relative_to(BACKEND)} -> {stmt.strip()}")
    assert not bad, (
        "เจอ SQL แก้ schema เขียนมือนอก Alembic:\n  " + "\n  ".join(bad)
    )


@pytest.mark.parametrize(
    "name",
    ["migrate.py", "manage.py", "tools/migrate_fix_users_pk.py"],
)
def test_dead_migration_helpers_stay_deleted(name):
    """สคริปต์ 3 ตัวนี้ถูกลบไปแล้ว อย่าให้กลับมา

    migrate.py                  ALTER TABLE courses ADD COLUMN is_active
                                ซึ่ง Alembic ทำให้อยู่แล้ว
    manage.py                   upgrade() เพิ่มคอลัมน์เองแบบ SQLite เท่านั้น
                                ส่วน promote-admin ก็ซ้ำกับ promote_admin.py
    tools/migrate_fix_users_pk  DROP TABLE users แล้วสร้างใหม่ ตามสคีมาเดือน ต.ค. 68
                                ซึ่งตอนนี้เก่าไปแล้ว (ไม่มี nickname/ฟิลด์กีม)
                                ถ้ามีใครเผลอรัน ข้อมูลนักเรียนหายทั้งคอลัมน์
    """
    assert not (BACKEND / name).exists(), f"{name} กลับมาแล้ว — ใช้ alembic แทน"


def test_cors_config_reads_both_env_names():
    """.env ที่ใช้อยู่เคยเขียนชื่อ CORS_ALLOW_ORIGINS ต้องยังอ่านได้"""
    from app.config import _cors_origins

    import os
    old = {k: os.environ.get(k) for k in ("CORS_ORIGINS", "CORS_ALLOW_ORIGINS")}
    try:
        os.environ.pop("CORS_ORIGINS", None)
        os.environ["CORS_ALLOW_ORIGINS"] = "http://example.com"
        assert _cors_origins() == ("http://example.com",)

        os.environ["CORS_ORIGINS"] = "http://a.com, http://b.com"
        assert _cors_origins() == ("http://a.com", "http://b.com")
    finally:
        for k, v in old.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v


def test_cors_default_includes_nextjs_port():
    """ค่า default ต้องมีพอร์ต 3000 ของ Next.js ไม่งั้นเว็บเรียก API ไม่ได้"""
    import os
    from app.config import _cors_origins

    old = {k: os.environ.get(k) for k in ("CORS_ORIGINS", "CORS_ALLOW_ORIGINS")}
    try:
        os.environ.pop("CORS_ORIGINS", None)
        os.environ.pop("CORS_ALLOW_ORIGINS", None)
        assert "http://localhost:3000" in _cors_origins()
    finally:
        for k, v in old.items():
            if v is not None:
                os.environ[k] = v
