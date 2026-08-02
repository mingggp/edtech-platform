# EdTech — Online Course Platform

แพลตฟอร์มคอร์สเรียนออนไลน์สำหรับนักเรียน ม.ปลาย — Backend FastAPI + Frontend Next.js 15

## โครงสร้าง

```
.
├── backend/        # FastAPI + SQLAlchemy + JWT
└── web/            # Next.js 15 + shadcn/ui + TanStack Query
```

## เริ่มต้นใช้งาน

### 1. Backend (FastAPI)

```bash
cd backend

# สร้าง virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Mac/Linux

pip install -r requirements.txt

# คัดลอก env แล้วแก้ค่า SECRET_KEY (สำคัญ!)
copy .env.example .env          # Windows
# cp .env.example .env          # Mac/Linux

# สร้าง SECRET_KEY ใหม่
python -c "import secrets; print(secrets.token_urlsafe(32))"
# เอาค่าที่ได้ไปใส่ใน .env แทน "change-me-..."

# รัน migration (Postgres) หรือข้ามไป (SQLite จะ create_all เอง)
alembic upgrade head

# รัน dev server
uvicorn app.main:app --reload
```

Backend รันที่ http://localhost:8000  
API docs (Swagger): http://localhost:8000/docs

### 2. Frontend (Next.js)

```bash
cd web

npm install

# คัดลอก env
copy .env.local.example .env.local   # Windows
# cp .env.local.example .env.local   # Mac/Linux

npm run dev
```

Frontend รันที่ http://localhost:3000

## คำสั่งที่ใช้บ่อย

### Backend
```bash
pytest                                    # รัน test
alembic revision --autogenerate -m "..."  # สร้าง migration ใหม่
alembic upgrade head                      # apply migration
python promote_admin.py <email>           # set role เป็น admin
```

### Frontend
```bash
npm run dev        # dev server (Turbopack)
npm run build      # production build
npm run typecheck  # ตรวจ TypeScript
npm run lint       # ESLint
```

## Stack

**Backend:** FastAPI, SQLAlchemy, Alembic, JWT (python-jose), passlib, slowapi (rate limit), fastapi-cache2

**Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui primitives, TanStack Query, Zustand, react-hook-form + zod

## Security Notes

- `SECRET_KEY` ต้องเป็นค่าสุ่ม 32+ ไบต์ใน production — ห้าม commit เข้า git
- `backend/.env` และ `web/.env.local` อยู่ใน `.gitignore` แล้ว
- Admin endpoints ใช้ `Depends(require_admin)` — เช็ค role ที่ฝั่ง backend
- Frontend ใช้ `<RouteGuard>` เป็นแค่ UX guard เท่านั้น (ของจริงเช็คที่ backend)

## ที่ยังเหลือทำ (Roadmap)

- [ ] แยก `backend/app/crud.py` (679 บรรทัด) ตาม domain — users/courses/payments/learning
- [ ] พอร์ต admin pages (Users, Payments, Coupons, Exams, Reports) ไป Next.js
- [ ] หน้า course detail + course viewer (video player)
- [ ] Payment flow (PromptPay QR + slip upload)
- [ ] Email verification + change password หลัง login
- [ ] Unit tests ฝั่ง frontend
