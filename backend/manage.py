\
"""
Simple dev helper:
  python manage.py upgrade
  python manage.py promote-admin <email>
"""
import os, sys, sqlite3

DB_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
if DB_URL.startswith("sqlite:///"):
    DB_PATH = DB_URL.replace("sqlite:///", "", 1)
else:
    print("This helper supports only SQLite in dev.", file=sys.stderr)
    sys.exit(1)

NEW_COLUMNS = [
    ("role", "TEXT NOT NULL DEFAULT 'student'"),
    ("avatar_url", "TEXT"),
    ("bio", "TEXT"),
    ("grade_level", "TEXT"),
    ("dek_code", "INTEGER"),
]

def upgrade():
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        cur.execute("PRAGMA table_info(users)")
        cols = [row[1] for row in cur.fetchall()]
        for name, ddl in NEW_COLUMNS:
            if name not in cols:
                print(f"Adding column: {name}")
                cur.execute(f"ALTER TABLE users ADD COLUMN {name} {ddl}")
        conn.commit()
        print("Upgrade complete.")
    finally:
        conn.close()

def promote_admin(email: str):
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        cur.execute("UPDATE users SET role='admin' WHERE email=?", (email,))
        conn.commit()
        if cur.rowcount:
            print(f"Promoted {email} to admin.")
        else:
            print(f"No user found with email: {email}")
    finally:
        conn.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)
    cmd = sys.argv[1]
    if cmd == "upgrade":
        upgrade()
    elif cmd == "promote-admin" and len(sys.argv) == 3:
        promote_admin(sys.argv[2])
    else:
        print(__doc__)
