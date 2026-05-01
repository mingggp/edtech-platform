import sys
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure the `app` module can be found
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.models import User

if len(sys.argv) < 2:
    print("Usage: python promote_admin.py <email>")
    sys.exit(1)

email = sys.argv[1]

# Load variables from .env
load_dotenv()
db_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/edtech_db")

try:
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    user = db.query(User).filter(User.email == email).first()
    if user:
        user.role = "admin"
        db.commit()
        print(f"✅ Success! User '{email}' has been successfully promoted to 'admin'.")
        print("Please log out and log back in to see the changes.")
    else:
        print(f"❌ Error: User with email '{email}' not found in the database.")
        
    db.close()
except Exception as e:
    print("❌ Failed to connect to the database or execute query.")
    print(str(e))
