# web — เว็บ Mingsmileyface (Next.js)

เวอร์ชันนี้สร้างใหม่จากโฟลเดอร์ `Claude Design version 1.0/`
ของเก่าอยู่ใน git commit `a0c7eb4` ถ้าอยากย้อนไปดู

```bash
npm run dev        # เปิด dev server
npm run verify     # typecheck + ตรวจว่าข้อมูล 3 ที่ยังตรงกัน  ← รันก่อน commit
npm run build      # build production
```

---

## กติกาที่ตั้งไว้ (อ่านก่อนแก้)

ปัญหาเกือบทั้งหมดที่เจอในโปรเจกต์เดิมมาจากเรื่องเดียว —
**ข้อมูลชุดเดียวกันถูกเขียนไว้หลายที่ แล้วค่อย ๆ เพี้ยนกัน**
โครงนี้ออกแบบมาเพื่อกันเรื่องนั้นโดยเฉพาะ

| ของ | อยู่ที่เดียวคือ | ห้ามทำ |
|---|---|---|
| 4 วิชา | `config/subjects.ts` | ห้ามเขียน `'math'` ลอย ๆ หรือทำ list วิชาเอง |
| เมนูทุกชุด | `config/nav.ts` | ห้ามเขียน `<Link>` เมนูตรง ๆ ใน component |
| สี/ธีม | `styles/brand.css` | ห้ามฮาร์ดโค้ดสี ให้เพิ่ม token ก่อน |
| path ของ API | `lib/api/endpoints.ts` | ห้าม `fetch('/users/me')` เอง |
| เปลือกหน้าจอ | `components/layout/` | ห้าม copy โครง sidebar/topbar ไปไว้ในหน้า |

### key ≠ label

```ts
subjectLabel('tpat3')   // 'TPAT3'  ← ใช้ตัวนี้ตอน render
{subject.id}            // 'tpat3'  ← ห้ามเอาขึ้นจอ
```

เคยหลุดมาแล้วจนหน้าเว็บขึ้นคำว่า "tpat3" ให้นักเรียนเห็น
`npm run check` จะจับให้ถ้าคีย์เก่า (`tpat`, `tgat`, `amath`) กลับมา

---

## โครงโฟลเดอร์

```
src/
  app/
    (marketing)/      เว็บสาธารณะ — ยังไม่ล็อกอินก็เข้าได้
    (app)/            ฝั่งนักเรียน — layout เดียวครอบ ได้ sidebar+topbar อัตโนมัติ
    (auth)/           ล็อกอิน สมัคร ตั้งค่าเริ่มต้น (ยังไม่ทำ)
    (admin)/          หลังบ้าน (ยังไม่ทำ)
  config/
    subjects.ts       4 วิชา + ระดับ + สี  ← source of truth
    nav.ts            เมนูทุกชุด           ← source of truth
  lib/api/
    client.ts         fetch กลาง — แนบ token, refresh อัตโนมัติ, แปลง error
    endpoints.ts      รายการ endpoint จัดกลุ่มตามโดเมน
    types.ts          type ที่ตรงกับ backend/app/schemas.py
  components/
    layout/           AppShell · Sidebar · Topbar · icons
    theme-provider.tsx
    providers.tsx     รวม provider ทั้งหมด
  styles/
    brand.css         พอร์ตมาจากดีไซน์ทั้งไฟล์ (5 ธีม)
    page-shell.css
```

### ทำไมต้องใช้ route group

`(app)/layout.tsx` มี `<AppShell>` อยู่ตัวเดียว → หน้าใหม่ในกลุ่มนี้
**ไม่ต้องแตะ sidebar เลย** ได้มาเองครบ

โปรเจกต์เดิมไม่มีชั้นนี้ เลยต้อง copy โครงไป 15 หน้า แล้วต้องเขียน
`sidebar.js` มาไล่ลบ-สร้างใหม่ทุกครั้งที่โหลดหน้า (markup ตาย ~68 KB)

---

## เพิ่มหน้าใหม่ยังไง

1. สร้าง `src/app/(app)/ชื่อหน้า/page.tsx`
2. เพิ่ม `{ href: '/ชื่อหน้า', label: '...', icon: '...' }` ใน `config/nav.ts`
3. `npm run check` — จะเตือนถ้าเมนูชี้ไปหน้าที่ไม่มี

```tsx
import { PageHeader } from '@/components/layout/app-shell';

export const metadata = { title: 'ชื่อหน้า' };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="หมวด" title="หัวข้อ" />
      {/* เนื้อหา */}
    </>
  );
}
```

---

## ธีม

5 ธีม: `petronas` · `petronas-light` · `dark` · `light` · `f1`
สลับผ่าน `<html data-theme>` — `useTheme()` จัดการให้

แยก **preference** (สิ่งที่ผู้ใช้เลือก รวม `system`) ออกจาก **resolved**
(ธีมจริงที่ใส่ลง DOM) เพราะเวอร์ชันเดิม "ตามระบบ" resolve แค่ตอนโหลดหน้า
Settings หน้าอื่นเลยไม่ตามเมื่อผู้ใช้เปลี่ยนธีมเครื่อง

`themeInitScript` รันใน `<head>` ก่อนหน้าเว็บวาด เพื่อไม่ให้จอกะพริบขาว

---

## ต่อ backend

```bash
NEXT_PUBLIC_API_BASE=http://localhost:8000    # .env.local
```

`client.ts` จัดการให้แล้ว:

- แนบ `Authorization` อัตโนมัติ
- 401 → refresh token แล้วยิงซ้ำ 1 ครั้ง
- refresh หลาย request พร้อมกัน → ใช้ promise ตัวเดียวร่วมกัน (ไม่งั้น token ตีกัน)
- แปลง error ของ FastAPI เป็นข้อความไทย

---

## ยังไม่ได้ทำ

- หน้าอีก 28 หน้าจากดีไซน์ (`npm run check` ลิสต์ให้)
- `(auth)` และ `(admin)` route group
- component library ใน `components/ui/`
- ทดสอบ `npm run build` จริงบนเครื่อง — ตอนสร้างยังไม่ได้รันจนจบ
  (typecheck ผ่านแล้ว) ถ้า build ช้าผิดปกติ ดูที่ `@source` ใน `globals.css`
  Tailwind 4 ค่าเริ่มต้นจะไล่สแกนจาก git root ซึ่งกินโฟลเดอร์ดีไซน์ 16 MB ไปด้วย
