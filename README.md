# EdTech Login Starter (FastAPI + JWT)

A tiny, batteries‑included starter to add **Sign up / Login / Protected APIs** to your EdTech project.

## Stack
- **Backend:** FastAPI, SQLAlchemy (SQLite), JWT (python‑jose), passlib[bcrypt]
- **Frontend demo:** Plain HTML + Tailwind CDN + fetch() (you can swap to React/Next later)
- **Dev server:** Uvicorn

---
cd backend
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

python init_data.py

## 1) Setup (Python 3.10+)
```bash
cd backend
py -m venv .venv
.venv\Scripts\activate
    #macOS/Linux:
    #source .venv/bin/activate

pip install -r requirements.txt
#cp .env.example .env
# edit .env and set a long random SECRET_KEY
```

## 2) Run
```bash
uvicorn app.main:app --reload
# API docs at: https://edtech-api-zigm.onrender.com/docs


67) Promote to Admin
python manage.py promote-admin admin@gmail.com

MAIL_PASSWORD = "vu"

```

ุึุึุ

## 3) Test quickly (HTTPie or curl)
```bash
# ping
http :8000/ping

# sign up
http POST :8000/auth/signup email=test@example.com password=pass123 full_name=Tester

# login -> copy access_token from response
http POST :8000/auth/login email=test@example.com password=pass123

# me (replace TOKEN)
http :8000/users/me "Authorization: Bearer TOKEN"
```

## 4) Frontend demo
Open `frontend/login.html` and `frontend/signup.html` with **Live Server** (VS Code extension) or any static server.
If you use Live Server (usually `http://127.0.0.1:5500`), CORS is already permissive in dev (CORS_ALLOW_ORIGINS=*).

- `login.html` → logs in and stores token in `localStorage`
- `me.html` → reads `/users/me` with the stored token
- `signup.html` → creates an account

## 5) Common pitfalls
- **CORS blocked:** In dev we allow `*`. If you tighten it, add your front‑end origin to `CORS_ALLOW_ORIGINS` in `.env` (comma‑separated).
- **"Could not validate credentials":** Your Authorization header might be missing or you used an expired/invalid token.
- **bcrypt import error:** If you see `AttributeError: module 'bcrypt' has no attribute '__about__'`, try `pip install --upgrade bcrypt passlib`.
- **"Error loading ASGI app":** Make sure you run inside the `backend` folder: `uvicorn app.main:app --reload`.
- **Email validation error:** Install `email-validator` (included in `requirements.txt`) and ensure the email format is valid when signing up.

## 6) Next steps
- Replace SQLite with PostgreSQL (change `DATABASE_URL` in `.env`), then add Alembic migrations.
- Add refresh tokens and revoke lists.
- Add email verification & password reset (send a link with a short‑lived token).
- Move front‑end to React/Next and keep using the same APIs.
- Deploy: Render/Fly.io/Railway for API, Vercel/Netlify for front‑end.


Get-Process python* -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item .venv -Recurse -Force -ErrorAction SilentlyContinue