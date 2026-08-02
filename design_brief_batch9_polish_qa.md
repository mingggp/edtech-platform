# ✨ Mingsmileyface — Batch 9: Polish & QA Pass

> **ส่งใน Claude Design แชทใหม่** หลังแปะ snapshot Batch 2 + delta Batch 3/4/5/6/7/8
> เนื้อหา: **ไม่ใช่หน้าใหม่** — ไล่ตรวจ + ขัดเงาทุกหน้าที่มี ให้พร้อมขายจริง (production-ready)

---

## 🆕 บริบทแชทใหม่

นี่คือ **Batch 9** ของโปรเจกต์ **Mingsmileyface** (เว็บคอร์สเรียนออนไลน์ ม.ปลายไทย โดยติวเตอร์เดี่ยว)

**8 batches ก่อนหน้า ออกแบบครบทั้ง surface แล้ว:** Landing+Dashboard (1) · Courses+Learn+Profile (2) · Exams (3) · Auth+Commerce (4) · Admin (5) · Gamification (6) · Onboarding+Notif+Settings (7) · Growth+Marketing (8)

**Batch 9 = เก็บงานให้ครบวงจร** — ไม่เพิ่มหน้าใหม่ แต่ไล่ **audit + fix** ทุกหน้าให้สม่ำเสมอ, ครบทุก state, responsive จริง, และเก็บ global pages ที่ยังขาด เป้าหมาย: **พร้อมเปิดจริง**

Design tokens + components อยู่ใน **snapshots** ↑ — **reuse ของเดิมเสมอ ห้ามสร้าง pattern ใหม่** (นี่คือ batch ที่ทำให้ทุกอย่าง "เหมือนกัน" ไม่ใช่เพิ่มของ)

---

## 🐞 ปัญหาจริงที่เจอในโค้ด (ต้องเก็บใน batch นี้)

1. **แบรนด์ไม่ตรง:** หลายที่ยังเป็น "EdTech" (logo + footer + title) ต้องเป็น **Mingsmileyface** ทั่วทั้งเว็บ
2. **วิชาเกิน scope:** CLAUDE.md บอกสอนแค่ 6 วิชา (TGAT2 · TPAT3 · A-Level คณิต · A-Level ฟิสิกส์ + คณิต/ฟิสิกส์ ม.ปลาย) แต่ในโค้ดมี **เคมี/ชีวะ** ค้างใน filter `/courses` + footer + landing → ตัดออกให้หมด
3. **ลิงก์เสีย → 404:** nav/footer ลิงก์ `/about /contact /terms /privacy /blog` (Batch 8 สร้างแล้ว — ตรวจว่าครบ + ไม่มีลิงก์ตายเหลือ)
4. **States ไม่สม่ำเสมอ:** บางหน้ามี empty/loading บางหน้าไม่มี, error handling ไม่เท่ากัน, ไม่มีหน้า 404/500
5. **Desktop-first:** batch ต้นๆ เน้น desktop — หลายหน้ายังไม่ได้ตรวจ mobile 375 จริงจัง
6. **stats ลอย:** landing "1,200+ นักเรียน" ฯลฯ ยังเป็นเลขลอย (Batch 8 เริ่มแก้ — ตรวจให้จบ)

---

## 📚 Batch 9: 5 cluster (audit + fix)

---

## CLUSTER A — Design System Consistency Audit

ไล่ทั้งเว็บให้ "พูดภาษาเดียวกัน":

- **แบรนด์:** Mingsmileyface ทุกที่ (logo, footer, page title, meta) — เลิก EdTech
- **วิชา = 6 เท่านั้น:** ตัดเคมี/ชีวะออกจาก filter, footer, landing, subject tiles — subject gradient เหลือเท่าที่สอนจริง
- **Token sweep:** สี/spacing/radius/shadow/ฟอนต์ ใช้ token เดียวกันหมด — หา hardcoded value ที่หลุด
- **Component unify:** ปุ่ม/การ์ด/badge/input variant เดียวกันทุกหน้า (ไม่มีตัวแปลกปลอม)
- **Dark/Light parity:** ทุกหน้าต้องสวยทั้ง 2 โหมด — หาจุดที่ contrast พัง/สีหาย
- **Copy tone:** โทนครูหมิงสม่ำเสมอ (ฉลาด อบอุ่น ไม่ slang) — ไล่แก้คำที่หลุดโทน
- **Deliverable:** "Consistency checklist" + ตัวอย่าง before/after จุดที่แก้

## CLUSTER B — States ครบทุกหน้า (เมทริกซ์)

ทำให้ทุกหน้ามีครบ: **loading / empty / error / success / validation**

- **Loading:** skeleton แทน spinner ทุกที่ (มี `<Skeleton>` แล้ว — ใช้ให้ทั่ว) + transition skeleton→content
- **Empty:** ทุก list/grid มี empty state ที่ coaching ไม่ใช่จอว่าง (courses, exams, payments, notifications, achievements, leaderboard, referral...)
- **Error:** network error / โหลดไม่ขึ้น → มีปุ่ม "ลองใหม่" + ข้อความเป็นมิตร
- **Form validation:** inline error + helper text สม่ำเสมอทุกฟอร์ม
- **Global pages (ขาดอยู่ — สร้างใหม่):** `404` (หลงทาง + ปุ่มกลับ + search), `500` (ระบบขัดข้อง), error boundary, offline state
- **Deliverable:** states matrix (หน้า × state) + หน้า 404/500 จริง

## CLUSTER C — Responsive Pass (mobile 375)

ไล่ทุกหน้าบนมือถือจริง (batch ต้นๆ ทำ desktop ก่อน):

- **ตาราง → การ์ด บนมือถือ:** admin tables, payments, leaderboard ฯลฯ
- **Sticky bottom bar:** CTA สำคัญ (checkout, course detail) ปักล่างบนมือถือ
- **Nav drawer:** hamburger + drawer ลื่น (header + admin sidebar)
- **Tap target ≥ 44px** + ระยะนิ้วโป้งเอื้อม
- **จุดเสี่ยง:** exam take (ตอบบนมือถือ), learn page (วิดีโอ + เนื้อหา), dashboard widgets, onboarding wizard
- **Deliverable:** ทุก artifact โชว์ mobile 375 + desktop 1440 คู่กัน

## CLUSTER D — Cross-cutting UX

- **⌘K Command Palette:** ค้นทั้งเว็บ (คอร์ส/ข้อสอบ/หน้า/ตั้งค่า) — Linear/Raycast style (เคยวางไว้ตั้งแต่ Batch 2 — ทำให้จบ)
- **Accessibility:** focus ring ชัดทุก interactive, contrast ผ่าน WCAG AA, aria labels, `prefers-reduced-motion` (ปิด animation ให้คนที่ตั้งค่า), keyboard navigation
- **Page transitions:** loading bar บนสุด (route change) + transition ลื่น ไม่กระตุก
- **Toast/feedback:** ตำแหน่ง + ระยะเวลา + variant สม่ำเสมอทุกที่
- **Scroll behavior:** scroll restoration, anchor smooth, sticky header ไม่บัง

## CLUSTER E — Micro-polish

- **Hover/active/focus** micro-interaction สม่ำเสมอ (การ์ดยก, ปุ่มกด)
- **Image loading:** blur-up/placeholder, aspect ratio ไม่กระโดด (layout shift)
- **Number/date format:** เงิน ฿, วันที่ไทย, timeAgo สม่ำเสมอ
- **Favicon + meta/OG tags** (เวลาแชร์ Line/FB ขึ้นรูป Mingsmileyface)
- **Loading→empty→content** transition ไม่กระพริบ

---

## 🧩 Components (ส่วนใหญ่ reuse — สร้างใหม่น้อย)

| Component | สถานะ | Detail |
|---|---|---|
| `<CommandPalette>` | ใหม่ (เคยวางไว้) | ⌘K ค้นทั้งเว็บ |
| `<NotFoundPage>` (404) | ใหม่ | หลงทาง + กลับ + search |
| `<ErrorPage>` (500) | ใหม่ | ระบบขัดข้อง + ลองใหม่ |
| `<ErrorBoundary>` | ใหม่ | fallback UI |
| `<EmptyState>` | unify | template เดียวใช้ทุกหน้า |
| `<ErrorState>` | unify | network error + retry |
| `<RouteProgress>` | ใหม่ | loading bar route change |
| `<Skeleton>` | reuse | ใช้ให้ทั่ว |

**REUSE:** ทุกอย่างจาก snapshot — batch นี้คือ "ทำให้ของเดิมเหมือนกันทั้งเว็บ" ไม่ใช่เพิ่มของใหม่

---

## 🎨 Specific Polish
- **เป้าหมาย = ความสม่ำเสมอ** ไม่ใช่ความหวือหวา — ถ้าเจอ 2 หน้าทำคนละแบบ เลือกอันที่ดีกว่าแล้วใช้ให้เหมือนกัน
- **อย่าออกแบบใหม่** — ถ้าอยากเปลี่ยน pattern ใหญ่ ให้ทักก่อน (batch นี้ห้ามแตกแถม)
- **ทุกอย่างต้องผ่าน mobile 375**
- **Copy ภาษาไทยเป็นมิตรทุก error/empty** — ไม่ใช่ "Error 404" ดิบๆ

---

## 📦 Deliverable

ส่ง Artifact ตามลำดับ:

1. ⭐ **Consistency audit + fix-list** (Cluster A) — checklist + before/after (แบรนด์/วิชา/token)
2. **States system: EmptyState/ErrorState unify + หน้า 404/500** (Cluster B)
3. **Responsive pass** — โชว์หน้าเสี่ยงบน mobile 375 (Cluster C)
4. **⌘K Command Palette + RouteProgress + a11y notes** (Cluster D)
5. **Micro-polish checklist** (Cluster E)

หยุดหลังแต่ละ artifact ให้หมิง feedback

---

## ❓ ถามก่อนเริ่ม

1. **อยากให้ผมไล่ทุกหน้า (เต็ม audit)** หรือ **โฟกัสเฉพาะหน้าที่ขายของ** (landing, courses, course detail, checkout, pricing) ก่อน?
2. **⌘K Command Palette** เอาจริงรอบนี้ไหม หรือเลื่อนไป (เป็น nice-to-have)?
3. **Accessibility** เอาระดับ "ครบ WCAG AA" หรือ "เก็บ basic ก่อน" (focus ring + contrast + keyboard)?
4. มี breakpoint อื่นที่ต้องเป๊ะไหม (เช่น iPad 1024) หรือเอาแค่ desktop 1440 + mobile 375?
5. รอบนี้เป็น **design audit/mock** — fix จริงในโค้ด Next.js ผมทำตอน integration ทีหลัง โอเคไหม?

---

> **หมายเหตุ:** Batch นี้เน้น "เก็บ + ทำให้เหมือนกัน" ของที่ออกแบบมา 8 batch ส่วนใหญ่เป็นการ audit + unify ไม่ใช่สร้างใหม่ · หน้า 404/500 + ⌘K + EmptyState/ErrorState template เป็นของใหม่ไม่กี่ชิ้น · งานแก้แบรนด์/ตัดเคมี/responsive ส่วนใหญ่เกิดตอนลงโค้ดจริง (integration) — batch นี้วาง spec ให้ชัดก่อน
