from sqlalchemy import text
from app.database import engine

def run_migration():
    with engine.begin() as conn:
        conn.execute(text('ALTER TABLE courses ADD COLUMN is_active BOOLEAN DEFAULT false;'))
    print("Migration successful")

if __name__ == "__main__":
    run_migration()
