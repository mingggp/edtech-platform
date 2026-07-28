# วิเคราะห์ `Claude Design version 1.0` — โครงสร้าง ความเชื่อมโยง และช่องว่าง

วิเคราะห์วันที่ 27 ก.ค. 2026 · ขอบเขต: เฉพาะโฟลเดอร์ `Claude Design version 1.0/` (ไม่รวม `web/`, `backend/`)
ทุกข้อในเอกสารนี้ได้จากการอ่านไฟล์จริง ไม่ได้เดา ข้อไหนที่ยังไม่แน่ใจจะเขียนกำกับไว้

---

## 0. สรุปสั้น (TL;DR)

โครงสร้าง**ดีกว่าที่คิด** — ลิงก์ระหว่างหน้าไม่มีเสียเลยสักอัน แยกไฟล์ตามโดเมนเรียบร้อย และกฎใน `CLAUDE.md` เรื่อง payment ทำตามครบทุกหน้า

แต่มี **4 เรื่องใหญ่** ที่ควรแก้ก่อนย้ายเข้า Next.js:

| # | ปัญหา | ผลกระทบ |
|---|-------|---------|
| 1 | **Learn.html ไม่มี animation engine เลย** ทั้งที่นี่คือจุดขายของแบรนด์ — engine จริง (5 ฉาก physics/calculus) ไปอยู่ใน Landing Page แทน | 🔴 กระทบตัวสินค้าโดยตรง |
| 2 | **subject key มี 5 ชุดคำศัพท์** (`tgat`/`tgat2`, `tpat`/`tpat3`, `amath`, `MATH`) สำหรับ 4 วิชาเดียวกัน | 🔴 พังตอนต่อ backend |
| 3 | **catalog คอร์สซ้ำกัน 3 ที่** และ**เริ่ม drift แล้ว** (ชื่อคอร์ส TGAT2 ไม่ตรงกัน) | 🟠 ข้อมูลไม่ตรงกัน |
| 4 | **Onboarding.html เป็นหน้ากำพร้า** — ไม่มีหน้าไหนลิงก์ไปเลย flow สมัคร→ตั้งค่า→เรียน ขาด | 🟠 flow ขาด |

---

## 1. ภาพรวมไฟล์

| ประเภท | จำนวน | ขนาดรวม |
|--------|-------|---------|
| หน้า HTML | 47 | ~8.7 MB |
| CSS | 22 | ~423 KB |
| JS | 24 | ~420 KB |
| JSX (tweak panel) | 2 | ~30 KB |
| เอกสาร .md | 8 | ~139 KB |
| assets (โลโก้มหาลัย) | 6 png | — |
| screenshots | ~180 png | ส่วนใหญ่ของ 22 MB |

**ไฟล์ใหญ่ผิดปกติ:** `Mingsmileyface Dashboard (offline).html` = **6.34 MB** (73% ของทั้งโฟลเดอร์)
เปิดดูแล้วเป็น **bundler export** — เอาทั้งเว็บยัดเป็นไฟล์เดียวเพื่อดู offline ไม่ใช่ source
→ **ควรลบหรือย้ายออกจาก repo** เพราะมันจะ rot ทันทีที่แก้หน้าอื่น และตอนนี้มันก็ค้าง snapshot เก่าอยู่แล้ว

---

## 2. สถาปัตยกรรม — เว็บนี้จริง ๆ มี "5 เปลือก" ไม่ใช่อันเดียว

### 2.1 Marketing shell (10 หน้า)
`brand.css` + `marketing.css` + `marketing-common.js` + `site-config.js` + `tweaks-panel.jsx` + `marketing-tweaks.jsx`

About · Contact · Courses · FAQ · Location · Privacy · Referral · Results · Terms · Testimonials
(Privacy/Terms เพิ่ม `legal.css`, Location เพิ่ม maplibre-gl จาก CDN)

> ⚠️ **Landing Page.html ไม่ได้อยู่ใน shell นี้** — มัน stand-alone 100% (inline CSS 78 KB) และ **copy logic ของ `marketing-common.js` มาเขียนใหม่ในตัวเอง** (คอมเมนต์ยอมรับตรง ๆ ที่บรรทัด 2667: *"Ports the same logic as marketing-common.js since this page doesn't load…"*)
> → หน้าที่สำคัญที่สุดของเว็บ คือหน้าที่ไม่แชร์โค้ดกับใครเลย

### 2.2 App shell A — "sidebar อย่างเดียว" (10 หน้า)
`brand.css` + `sidebar.css` + `sidebar.js`
Browse Courses · Course Contents · Course Detail · Dashboard · Exams · Exam Detail · Exam Results · My Courses · Public Profile · TCAS

### 2.3 App shell B — "app-shell.css + sidebar" (5 หน้า)
`brand.css` + `app-shell.css` + `sidebar.css` + `sidebar.js`
Achievements · Leaderboard · Settings · Streak & Daily Goal · XP & Level

> ⚠️ **A กับ B คือพื้นที่เดียวกัน (นักเรียนล็อกอินแล้ว) แต่ใช้ layout system คนละตัว** — `app-shell.css` (10 KB) มีแค่ 5 หน้าที่ใช้ อีก 10 หน้าไม่ใช้
> เป็นเหตุผลว่าทำไมความรู้สึกตอนสลับหน้าถึงไม่ "เนียน" เท่าที่ควร

### 2.4 Admin shell (12 หน้า) — สะอาดที่สุดในโปรเจกต์
`brand.css` + `admin.css` + `admin-shell.js` + `admin-common.js` (+ `admin-content.css`, `admin-data.css`, `admin-system.css`, `admin-exams.css` ตามหน้า)

`admin-shell.js` generate sidebar จาก spec เดียวทุกหน้า — คอมเมนต์เขียนว่า *"prevents sidebar drift"* ✅
**นี่คือ pattern ที่ควรเอาไปใช้กับฝั่งนักเรียนด้วย**

> ⚠️ เล็กน้อย: Admin Overview / Admin Payments ไม่โหลด `admin-content.css` ขณะที่อีก 10 หน้าโหลด

### 2.5 หน้าเดี่ยว / focus mode (10 หน้า)
| หน้า | CSS | หมายเหตุ |
|------|-----|----------|
| Login Signup, Forgot Reset Password | `auth.css` | + Computer Modern font จาก CDN |
| Onboarding | `auth.css` + `onboarding.css` | **ไม่มี JS ไฟล์แยกเลย** |
| Checkout | `checkout.css` | |
| Learn | `brand.css` เท่านั้น + `learn.js` | inline CSS 43 KB (71% ของไฟล์) |
| Exam Take, Exam Result | `brand.css` เท่านั้น | **ไม่มี JS เลย** — logic inline ทั้งหมด |
| Brand Identity | **ไม่ลิงก์ CSS ใด ๆ** | เอกสารอ้างอิง inline 30 KB |

---

## 3. Link graph — ความเชื่อมโยงระหว่างหน้า

### ✅ ข่าวดี: ลิงก์ระหว่างหน้า **ไม่เสียเลยสักอัน** (0 broken links จาก 47 หน้า)
เจอแค่ 1 อันที่เป็น template literal ที่ยังไม่ render (`Admin Audit.html` → `${GOTO[l.objType]||…}`)

### 🔴 หน้าที่ถูกอ้างถึงแต่ **ไม่มีอยู่จริง**

| ไฟล์ที่หาย | ถูกอ้างจาก | ผลที่เกิด |
|-----------|-----------|----------|
| `Notifications.html` | `sidebar.js` (ป๊อปอัปกระดิ่ง ปุ่ม "อ่านทั้งหมด" + ทุกรายการแจ้งเตือน) | ทุกหน้าที่มี sidebar → คลิกกระดิ่งแล้ว 404 |
| `Payments.html` | `notifications.js` | Settings.html → 404 |

`Payments.html` น่าจะตั้งใจให้ย้ายไปอยู่ใน Settings แล้ว (คอมเมนต์ใน `sidebar.js` เขียนว่า *"Payments now lives in Settings"*) — แต่ `notifications.js` ยังลิงก์ของเก่า

### 🟠 หน้ากำพร้า (ไม่มีใครลิงก์เข้า)

| หน้า | สถานะจริง |
|------|-----------|
| **Onboarding.html** | 🔴 **ช่องว่างจริง** — Login Signup ลิงก์ตรงไป Dashboard ข้าม Onboarding ไปเลย Dashboard เองก็แค่*อ่าน* `localStorage['ming-onboard']` ที่ Onboarding เขียนไว้ (คอมเมนต์บรรทัด 3277) แต่ไม่มีเส้นทางไปถึง Onboarding |
| Brand Identity.html | ✅ ตั้งใจ — เป็นเอกสารอ้างอิง ไม่ต้องอยู่ใน nav |
| Mingsmileyface Dashboard (offline).html | ✅ ตั้งใจ — build artifact |
| Admin Coupons / Reports / Settings / Site / Users | ✅ **ไม่ใช่ปัญหา** — sidebar admin generate จาก `admin-shell.js` ตอน runtime |

### หน้าที่ถูกลิงก์เข้าเยอะสุด (hub)
Landing Page (20) · Dashboard (19) · Courses (16) · Exams (16) · Settings (15) · Browse Courses (14) · Public Profile (14)

### หน้าที่ปิดชั่วคราว (soon-gated)
`marketing-common.js` ปิดคลิก 4 หน้าทั่วทั้งเว็บ: **Referral · Testimonials · Results · FAQ**
(หน้าเหล่านี้มี `soon-banner` และลิงก์ทุกที่จะเป็นสีเทา คลิกไม่ได้ — Landing Page กับ Course Detail ก็มี banner ด้วย)

> ⚠️ Landing Page ปิด gating นี้ไม่ได้เพราะมันไม่โหลด `marketing-common.js` — มัน copy logic มาเอง ถ้าแก้รายชื่อหน้า soon ต้องแก้ 2 ที่

### Contact / Referral ไม่อยู่ใน nav หลัก
`site-config.js` กำหนด `NAV_ITEMS` = หน้าหลัก · คอร์ส · ผลงานนักเรียน · รีวิว · เกี่ยวกับ · สถานที่เรียน · FAQ
→ **Contact.html เข้าถึงได้ทาง footer เท่านั้น** สำหรับเว็บที่ต้องการให้คนทัก อาจเป็นจุดที่เสียโอกาส

---

## 4. 🔴 ปัญหาใหญ่ที่ 1 — subject key มี 5 ชุดคำศัพท์

4 วิชาเดียวกัน แต่โค้ดเรียกไม่เหมือนกันเลย:

| ชุด | คีย์ที่ใช้ | ไฟล์ |
|-----|-----------|------|
| **A** | `math` `phys` `tgat2` `tpat3` | About, Browse Courses, Courses, Testimonials |
| **B** | `math` `phys` `tgat` `tpat` | Dashboard, Exams, Exam Detail, Exam Result, Exam Results, Exam Take, Settings, TCAS, `tcas.js`, `site-config.js` |
| **C** (ผสม) | `math` `phys` `tgat` **`tpat3`** | Course Contents |
| **D** | `amath` `aphys` + `math` `phys` `tgat2` `tpat3` | Course Detail |
| **E** | `MATH` `PHYS` `TPAT3` `TGAT2` (ตัวใหญ่) | Onboarding (`SUBJ_ORDER`) |
| **F** | `'TGAT2'` `'TPAT3'` | `people.js` |

**ทำไมเรื่องนี้สำคัญมาก:** พอย้ายเข้า Next.js + ต่อ backend จริง `subject` จะกลายเป็น enum ใน DB ตอนนี้ยังไม่มี single source of truth ว่าอันไหนถูก
`site-config.js` มี `COURSE_LANES = [math, phys, tpat, tgat]` ซึ่ง**ตรงลำดับตาม CLAUDE.md** → ใช้ชุด B เป็นมาตรฐานได้เลย แล้วไล่แก้ที่เหลือ

**ข้อเสนอ:** สร้าง `subjects.js` ตัวเดียว export `{ id, label, levelFilter, colorToken }` แล้วทุกหน้า import จากที่นั่น

---

## 5. 🔴 ปัญหาใหญ่ที่ 2 — Learn.html ไม่มี animation engine

จุดขายที่เขียนไว้ในโปรเจกต์คือ **"animation การสอนที่เน้น Visualize Learning"**

**ของจริงอยู่ที่ไหน:** `Landing Page.html` มี animation engine เต็มรูปแบบ ~560 บรรทัด `requestAnimationFrame` — 5 ฉาก:

| ฉาก | เนื้อหา |
|-----|---------|
| Scene 0 | พาราโบลา y=x² + เส้นสัมผัสเลื่อน (f′(x)) |
| Scene 1 | วงกลมหนึ่งหน่วย → sine & cosine |
| Scene 2 | การเคลื่อนที่แบบโพรเจกไทล์ + เวกเตอร์ความเร็วจริง |
| Scene 3 | Riemann sum ซอยละเอียดเข้าหาปริพันธ์ |
| Scene 4 | ลูกตุ้มอย่างง่าย + free-body diagram + อัตราส่วนพลังงาน |

**Learn.html มีอะไร:** stage เป็น gradient เปล่า ๆ + จุด grid (บรรทัด 125–127)
`learn.js` = mock video player ล้วน ๆ — นาฬิกาปลอม, play/pause, scrub, นับจบที่ 90%
**ไม่มี `<canvas>` ไม่มี rAF ไม่มี animation host ไม่มี data contract ต่อบทเรียน** มีแค่ 7 `@keyframes` ที่เป็น UI transition

**สรุป:** สิ่งที่ทำให้เว็บนี้ต่างจากคนอื่น ตอนนี้เป็น**โฆษณาหน้าแรก** ไม่ใช่**ตัวสินค้า**

**ข้อเสนอ:** ยก engine จาก Landing Page ออกมาเป็น `viz-engine.js` แล้วทำ contract แบบ
```js
{ lessonId, scenes: [{ type:'projectile', params:{v0, angle}, syncAt: 45.2 }] }
```
ให้ scene เล่นตามเวลาใน player — ตรงนี้แหละคือ moat จริงของเว็บ

---

## 6. 🟠 ปัญหาใหญ่ที่ 3 — catalog ซ้ำและเริ่ม drift แล้ว

### Courses.html ↔ Browse Courses.html
- ทั้งคู่มี array คอร์ส **14 ตัว**
- **13 ตัว byte-identical** (copy-paste)
- **1 ตัว drift ไปแล้ว:**

| ไฟล์ | ชื่อคอร์ส `tgat2-logic` |
|------|------------------------|
| `Courses.html` | TGAT2 · **การคิดเชิงตรรกะ** |
| `Browse Courses.html` | TGAT2 · **การคิดอย่างมีเหตุผล** |

นี่คือหลักฐานว่า copy-paste กำลังพังจริง ไม่ใช่ความเสี่ยงทฤษฎี

### Course Detail.html มี catalog ของตัวเองอีกชุด
ใช้คีย์คนละแบบ (`amath-alevel1`, `tpat3-latest`, `subj:'amath'`) พร้อมราคาซ้ำ

### ราคา hardcode อยู่ 4 ไฟล์
`Courses.html` · `Browse Courses.html` · `Course Detail.html` · `Settings.html` (ประวัติการซื้อ)

**ข้อเสนอ:** `courses.js` ไฟล์เดียวเป็น source of truth ทุกหน้า import — ทำก่อนย้ายเข้า Next.js จะง่ายกว่ามาก

---

## 7. ตรวจตามกฎใน CLAUDE.md

### ✅ ผ่าน — Payment model
ไม่มี slip upload ไม่มีสถานะรอตรวจสอบ ทุกหน้าสอดคล้องกัน:
- `Admin Payments.html:181` — *"ยืนยันอัตโนมัติ — เกตเวย์ (Opn Payments) ตัดสินผลชำระเองทั้งหมด… ไม่มีสถานะรออนุมัติให้ตรวจ"*
- `Checkout.html:85,126` — *"ระบบจะยืนยันให้อัตโนมัติทันทีที่ชำระสำเร็จ ไม่ต้องส่งสลิป"*
- `FAQ.html:306,308` — ระบุ 2 สถานะชัดเจน

> 📌 แต่อย่าลืม: **ยังไม่ได้ต่อ payment gateway จริง** — เว็บยังรับเงินไม่ได้

### ✅ ผ่าน — 4 วิชา ไม่มีวิชาแปลกปลอม
คำว่า เคมี/ชีววิทยา โผล่แค่ 2 ที่ และทั้งคู่ถูกต้อง:
- `Course Detail.html:995` — ประวัติผู้สอน ("ติวคณิต ฟิสิกส์ เคมี ให้น้อง ม.ปลาย")
- `tcas.js` — เครื่องคำนวณ TCAS ต้องรับคะแนนวิชาอื่นเพื่อคำนวณ ✅

### ✅ ผ่าน — สีประจำวิชา
`brand.css:265–279` มี `--subj-math/phys/tpat/tgat` + `-fg` + `-grad` ครบ ใช้จริงทุกหน้าที่แยกวิชา

### 🟠 ต้องดู — ลำดับ คณิต → ฟิสิกส์ → TPAT3 → TGAT2
- **ที่เป็น array จริง ๆ ถูกหมด**: `site-config.js` `COURSE_LANES`, `Onboarding.html` `SUBJ_ORDER`, filter ใน Dashboard/Exams/Courses ✅
- ที่ลำดับต่างเป็น**ข้อความบรรยาย** ไม่ใช่ filter (About, FAQ, Contact, Testimonials, Referral, Terms) — ไม่ผิดกฎ แต่ถ้าอยากให้แบรนด์เป๊ะ ควรเรียงตามด้วย

### 🔴 ผิดเนื้อหา — TPAT3 ระบุผิดวิชา
`Settings.html:496`
```js
{ t:'TPAT3 ความถนัดแพทย์ ครบจบ', subj:'tpat', … }
```
**TPAT3 = ความถนัดวิทยาศาสตร์ เทคโนโลยี วิศวกรรมศาสตร์** ส่วน "ความถนัดแพทย์" คือ **TPAT1**
หน้าอื่นเขียนถูกหมด (`Course Contents.html:543` = "TPAT3 · ความถนัดวิทย์–เทคโนฯ", `sidebar.js:347` = "วิทย์ เทคโนโลยี วิศวกรรม")
→ เป็น mock data แต่ถ้าหลุดขึ้น production นักเรียนจะสับสน **แก้เลยดีกว่า**

### 🟠 Glassmorphism ไม่ทั่วถึง
นับ `backdrop-filter` / `--glass` / `.glass` รวม inline + CSS ที่ลิงก์ (ไม่นับ brand.css):

| ระดับ | หน้า |
|-------|------|
| น้อยสุด 5–8 | Exam Take (5) · **Checkout (6)** · Contact/Results/Testimonials (7) · About/FAQ (8) |
| กลาง 10–30 | Learn (11) · Courses (12) · Login (16) · My Courses (22) · Course Detail (28) |
| เยอะ 35–60 | Exams (35) · Landing (38) · Dashboard (39) · **Admin ทุกหน้า 40–60** |

> **Checkout ควรกลับด้าน** — หน้าจ่ายเงินคือช่วงที่ต้องรู้สึก premium ที่สุด แต่ตอนนี้ glassy น้อยกว่า Admin Coupons
> กลุ่ม marketing (Contact/Results/Testimonials/About/FAQ) ก็เบา — เป็นหน้าที่คนนอกเห็นก่อนใครเพื่อน

---

## 8. Responsive — จุดอ่อนอยู่ผิดที่

นับ `@media` รวม inline + CSS ที่ลิงก์:

| หน้า | breakpoints | ความเห็น |
|------|-------------|----------|
| Brand Identity | 1 | ไม่เป็นไร เป็นเอกสาร |
| **Checkout** | **2** | 🔴 หน้าจ่ายเงิน — นักเรียน ม.ปลายจ่ายบนมือถือแทบ 100% |
| Login / Forgot | 2 | 🟠 ประตูเข้าเว็บ |
| Contact, FAQ | 3 | |
| **Learn** | **4** | 🔴 หน้าเรียนจริง ใช้บนมือถือเยอะแน่ |
| Exam Take | 4 | 🟠 ทำข้อสอบจับเวลา |
| Onboarding | 4 | |
| Dashboard/Exams/Admin | 8–15 | ✅ ดี |

**สรุป: หน้าที่ responsive อ่อนที่สุด = หน้าที่สำคัญที่สุดพอดี** (จ่ายเงิน + เรียน + ล็อกอิน)

---

## 9. ไฟล์ตาย / ไฟล์ซ้ำ

| ไฟล์ | ปัญหา |
|------|-------|
| `payments.css` (11.9 KB) | 🔴 **ไม่มีหน้าไหนลิงก์เลย** — Checkout ใช้ `checkout.css` แทน (ยืนยันแล้วว่าไม่ถูกอ้างทั้ง html/js/css) |
| `Mingsmileyface Dashboard (offline).html` (6.34 MB) | build artifact ค้าง snapshot เก่า |
| `Landing Page.html` inline logic | copy จาก `marketing-common.js` |
| ~180 screenshots | ไฟล์งานระหว่างทาง (`01-f1.png`, `02-peel.png`, `03-obx.png`…) ควรย้ายไป `/docs` หรือ gitignore |

**JS ไม่มีไฟล์ตายเลย ✅** (24 ไฟล์ถูกโหลดครบ — ที่ก่อนหน้านี้ดูเหมือนตายเพราะ cache-buster `?v=12`)

---

## 10. State contract — localStorage (เอาไว้ใช้ตอนย้าย backend)

| key | ใช้กี่ที่ | ความหมาย |
|-----|----------|----------|
| `ming-theme` | 55 | ธีมที่ resolve แล้ว (petronas / petronas-light / f1 / classic-*) |
| `ming-sidebar` | 30 | สถานะพับ sidebar |
| `ming-site` / `ming-site-edit` | — | CMS config จาก Admin Site |
| `ming-theme-pref` | 2 | ธีมที่ผู้ใช้เลือก รวม `system` — **Settings.html เท่านั้น** |
| `ming-tcas-target`, `ming-tcas-rank` | 6 | เป้าคณะใน TCAS calculator |
| `ming-daily-goal` | 4 | เป้าหมายรายวัน |
| `ming-font`, `ming-var-font`, `ming-pop-hue`, `ming-pop`, `ming-grad`, `ming-accent` | 13 | tweak ทางสายตา |
| `ming-onboard` | 1 | Onboarding เขียน → Dashboard อ่าน (แต่ไปถึง Onboarding ไม่ได้) |
| `ming-pricelayout`, `ming-pinned-exam`, `adm-exams-view` | 4 | ตัวเลือก UI ระดับหน้า |

> 🟠 **ธีม "ตามระบบ" ทำงานแค่ใน Settings** — `Settings.html:530` resolve `system` → ค่าจริง ตอนโหลดหน้า แล้วเขียนลง `ming-theme` หน้าอื่นอ่านแค่ `ming-theme` เท่านั้น ⇒ ถ้าผู้ใช้เปลี่ยนธีมเครื่องระหว่างอยู่หน้าอื่น เว็บจะไม่ตาม
> ตอนย้าย Next.js ควรทำ theme provider ตัวเดียวคุมทั้งเว็บ

---

## 11. เอกสารในโฟลเดอร์ล้าสมัย

| ไฟล์ | สถานะ |
|------|-------|
| `DESIGN_SYSTEM.md` (41 KB) | 🟠 **ค้างอยู่ที่ Batch 2/3** — หัวข้อ 9 ลิสต์ไฟล์ในโปรเจกต์ไว้แค่ **8 ไฟล์** (ตอนนี้มี 47 หน้า) และปิดท้ายว่า *"Use as priming for Batch 3"* ทั้งที่ทำถึง Batch 8-9 แล้ว |
| `DELTA_BATCH3–8.md` | ✅ ครบ 6 ไฟล์ |
| DELTA ของ Batch 1, 2, 9 | ไม่มี (brief ของ batch 9 อยู่โฟลเดอร์แม่) |
| `CLAUDE.md` | ✅ ทันสมัย ใช้อ้างอิงได้ |

---

## 12. ลำดับงานที่แนะนำ

### ก่อนแตะ Next.js (ทำในโฟลเดอร์ดีไซน์เลย งานไม่หนัก)
1. **รวม subject key เป็นชุดเดียว** → สร้าง `subjects.js` (ใช้ชุด B: `math/phys/tpat/tgat` ตาม `site-config.js`)
2. **รวม catalog คอร์ส** → `courses.js` ไฟล์เดียว แล้วลบ array ซ้ำใน 3 หน้า พร้อมแก้ drift ของ `tgat2-logic`
3. **แก้ TPAT3 "ความถนัดแพทย์"** → "ความถนัดวิทย์–เทคโนฯ" (`Settings.html:496`)
4. **สร้าง Notifications.html** หรือแก้ `sidebar.js` ให้ชี้ที่อื่น + แก้ `notifications.js` ที่ยังชี้ `Payments.html`
5. **ต่อ flow Onboarding** → Login Signup ควรพาไป Onboarding ก่อน Dashboard
6. **ลบ `payments.css`** และย้ายไฟล์ offline 6.3 MB ออก

### ตอนย้ายเข้า Next.js
7. **รวม app shell A + B ให้เหลือ layout เดียว** — ใช้ pattern แบบ `admin-shell.js` (generate จาก spec เดียว) กับฝั่งนักเรียนด้วย
8. **ดึง Landing Page เข้า shell เดียวกับ marketing** — เลิก copy logic
9. **theme provider ตัวเดียว** รองรับ `system` ทั้งเว็บ

### งานหลัก (ตัวจริงของโปรเจกต์)
10. **สร้าง Visualize Engine** — ย้าย 5 ฉากจาก Landing Page ออกมาเป็นโมดูล + ทำ scene/timeline contract ให้ `Learn.html` เล่น sync กับ player
11. **ยก Checkout + Learn + Login ให้ responsive** และเพิ่ม glass ให้ Checkout รู้สึก premium

### ท้ายสุด
12. **ต่อ payment gateway จริง** (Opn / 2C2P / GB Prime Pay) — ตอนนี้ UI พร้อม 100% แล้วแต่ยังรับเงินไม่ได้
13. **อัปเดต `DESIGN_SYSTEM.md`** ให้ครอบคลุม 47 หน้า

---

## 13. สิ่งที่ยังไม่รู้ / ยังไม่ได้ตรวจ

พูดตรง ๆ ว่าข้อมูลพวกนี้ยังไม่ได้ยืนยัน:

- **ไม่ได้เปิดหน้าเว็บดูจริงในเบราว์เซอร์** — วิเคราะห์จากโค้ดล้วน อาจมีปัญหา visual/JS runtime ที่มองไม่เห็น
- **ไม่ได้เทียบกับ `web/` (Next.js) และ `backend/`** ตามที่ตกลงขอบเขตไว้ — ยังไม่รู้ว่าหน้าไหน port ไปแล้วบ้าง หรือ API รองรับแค่ไหน
- **ลำดับวิชาในบางหน้า** ตรวจด้วยตำแหน่งข้อความที่พบครั้งแรก ซึ่งไม่แม่น 100% — ที่เป็น array จริงตรวจแล้วถูกทั้งหมด ที่เหลือเป็นข้อความบรรยาย
- **ยังไม่ได้ตรวจ accessibility** (contrast ratio, keyboard nav, screen reader, ARIA) — โดยเฉพาะสี TGAT2 เหลืองที่ `CLAUDE.md` เตือนเรื่อง contrast ไว้เอง
- **ยังไม่ได้ตรวจ performance จริง** — วัดจากขนาดไฟล์อย่างเดียว
- **ไม่รู้ว่าไฟล์ใน `uploads/` และ `screenshots/` อันไหนยังใช้อยู่บ้าง**
