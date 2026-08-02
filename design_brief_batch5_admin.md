# 🎛️ Mingsmileyface — Batch 5: Admin / Tutor Studio (หลังบ้าน)

> **ส่งใน Claude Design แชทใหม่** หลังแปะ:
> 1. Snapshot Batch 2 (เดิม)
> 2. Delta Snapshot Batch 3 (ใหม่)
> 3. Delta Snapshot Batch 4 (Auth + Commerce components)
>
> เนื้อหา: ห้องควบคุมของหมิงเอง — สร้างคอร์ส → ตรวจสลิป → ดูรายได้ → จัดการนักเรียน

---

## 🆕 บริบทแชทใหม่

นี่คือแชทใหม่สำหรับ **Batch 5** ของโปรเจกต์ **Mingsmileyface** (เว็บคอร์สเรียนออนไลน์สำหรับ ม.ปลายไทย โดยติวเตอร์เดี่ยว)

**4 batches ก่อนหน้า — ฝั่งนักเรียนครบลูปแล้ว:**
- **Batch 1:** Brand + Landing + Dashboard
- **Batch 2:** Courses Discovery + Course Detail + Learn + Public Profile
- **Batch 3:** Exam List + Take + Result Reveal + History
- **Batch 4:** Auth (login/signup/forgot/reset) + Checkout + Payments + Profile

**Batch 5 = ฝั่งติวเตอร์ (หมิงเอง)** — เปลี่ยนจาก "ของที่นักเรียนเห็น" เป็น "ของที่เจ้าของเว็บใช้ทำงานทุกวัน" ตอนนี้หน้า `/admin/*` มีอยู่แล้วแต่ยัง **ใช้งานได้แต่ไม่สวย** (ตารางเปล่าๆ การ์ดธรรมดา) — งานคือ **ยกระดับให้พรีเมียมเท่าฝั่งนักเรียน** และเติมหน้าที่ยังขาด

Design tokens + components ทั้งหมดอยู่ใน **3 snapshots ข้างบน** ↑ — **reuse ของเดิมเสมอ ห้ามทำใหม่**

---

## 🎯 Recap Brand (สั้น)
- **Vibe:** Premium Pop — Apple Music / Linear / Stripe Dashboard / Vercel
- **Device:** Desktop 1440 เป็นหลัก (admin ใช้บนคอม) → iPad 1024 รอง → Mobile 375 เอาแค่ดูได้พอ
- **Mode:** Dark first + light toggle
- **Operator:** หมิง (ติวเตอร์เดี่ยว) ไม่ใช่ทีมใหญ่ — UI ต้องเรียบ เร็ว ไม่ต้องมีระบบ role ซับซ้อน

---

## 🧭 Design Decision สำคัญ — Admin คนละ "อารมณ์" กับฝั่งนักเรียน

ฝั่งนักเรียน = สนุก มีลูกเล่น confetti/score reveal
ฝั่ง admin = **ห้องควบคุม (control room)** — ใช้ token สีเดิม แต่:
- **หนาแน่นขึ้น (denser):** ระยะห่างน้อยลง ตารางจริงจัง ดูข้อมูลเยอะได้ในจอเดียว
- **สงบขึ้น (calmer):** ลด animation หวือหวา เน้น clarity + speed
- **ใช้คีย์บอร์ดได้:** search/filter เร็ว, action เด่น
- **ยังพรีเมียม:** ไม่ใช่ Bootstrap admin โบราณ — คิด Linear / Stripe Dashboard เป็นเกณฑ์

> สรุป: token เดิม, mindset ใหม่ — "เครื่องมือทำงาน" ไม่ใช่ "หน้าโชว์"

---

## 📚 Batch 5: 9 หน้า แบ่ง 4 cluster

> ✅ = backend มี endpoint รองรับอยู่แล้ว (ต่อจริงได้เลย ไม่ใช่ของปลอม)

---

## CLUSTER A — Shell + Overview (ฐานราก)

### A1. `<AdminShell>` — โครงหลังบ้าน (redesign)

ตอนนี้ใช้ sidebar 220px ธรรมดา — ยกระดับเป็น operator shell:

```
┌─────────────┬──────────────────────────────────────┐
│  ◆ Ming     │  [Breadcrumb]          [🔍 ⌘K] [☀/🌙] │  ← topbar บาง
│  Studio     ├──────────────────────────────────────┤
│             │                                      │
│ ▸ ภาพรวม    │   {page content}                     │
│ ▸ การเงิน 🔴3│                                      │  ← badge เลขรอตรวจ
│ ▸ คอร์ส      │                                      │
│ ▸ ข้อสอบ     │                                      │
│ ▸ นักเรียน   │                                      │
│ ▸ คูปอง      │                                      │
│ ▸ ตั้งค่า     │                                      │
│ ─────       │                                      │
│ ▸ รายงาน     │                                      │
│ ▸ Audit log │                                      │
│             │                                      │
│ [← ออกจาก   │                                      │
│  หลังบ้าน]   │                                      │
└─────────────┴──────────────────────────────────────┘
```

- **Sidebar:** group เป็น 2 ส่วน — "ดำเนินงาน" (ภาพรวม/การเงิน/คอร์ส/ข้อสอบ/นักเรียน/คูปอง) + "ระบบ" (ตั้งค่า/รายงาน/audit)
- **Live badge:** เมนู "การเงิน" โชว์เลขสลิป **รออนุมัติ** เป็น dot สีเหลือง (pull จาก pending count)
- **ปุ่มออก:** "← กลับหน้านักเรียน" ชัดเจน (admin มักสลับไปดูฝั่ง student)
- **Topbar:** breadcrumb ซ้าย + command palette (⌘K reuse จาก Batch 2) + theme toggle
- **Mobile:** sidebar ยุบเป็น drawer (hamburger)

---

### A2. `/admin` — Overview / Command Center ✅

ตอนนี้มีแค่ 4 stat + bar chart 7 วัน — ทำให้เป็น **แดชบอร์ดรายได้จริง**:

```
┌────────────────────────────────────────────────────┐
│  สวัสดีตอนเช้า หมิง 👋   มี 3 สลิปรอตรวจ  [ตรวจเลย →]│  ← action banner
├──────────┬──────────┬──────────┬────────────────────┤
│ รายได้    │ นักเรียน  │ คอร์ส     │ รอตรวจสลิป          │  ← 4 KPI cards
│ เดือนนี้   │ ทั้งหมด   │ เผยแพร่   │ (เด่น สีเหลือง)      │
│ ฿X ↑12%  │ X คน ↑   │ X คอร์ส   │ 3 รายการ            │
├──────────┴──────────┴──────────┴────────────────────┤
│  กราฟรายได้ (toggle 7วัน / 30วัน / ปีนี้)             │  ← area/bar
│  [▁▃▅▇▆▇█ ...]                                       │
├─────────────────────────┬──────────────────────────┤
│  คอร์สขายดี (top 5 list) │  กิจกรรมล่าสุด (feed)      │
│  1. ฟิสิกส์ ม.6  ฿X · N  │  • สมชาย ซื้อคอร์ส...      │
│  2. ...                  │  • สลิปใหม่รออนุมัติ...    │
└─────────────────────────┴──────────────────────────┘
```

- **KPI cards:** ตัวเลขใหญ่ display font + trend arrow (↑↓ + %) + sparkline จิ๋ว (reuse `<SparklineChart>`)
- **การ์ด "รอตรวจสลิป"** เด่นกว่าเพื่อน (amber ring) + คลิกไป `/admin/payments` ตรงๆ
- **กราฟรายได้:** toggle ช่วงเวลา (ตอนนี้ backend ให้ 7 วัน — ออกแบบเผื่อ 30วัน/ปี)
- **Top courses + Activity feed** 2 คอลัมน์ล่าง (activity reuse audit data ได้)
- **Empty/first-run:** ถ้ายังไม่มีข้อมูล → "ยังไม่มียอดขาย — แชร์คอร์สแรกของคุณ"

---

## CLUSTER B — Money Desk (หัวใจการดำเนินงาน) ⭐

### B1. `/admin/payments` — กระทบยอดการชำระเงิน (read-only ledger) ✅

> ⚠️ **ค้างไว้ — ห้ามลืม (decision 30/05/2026):** เลือกทำหน้านี้เป็น **read-only ledger** (สมมติว่า payment ยืนยันอัตโนมัติผ่าน gateway+webhook) **แต่ยังไม่มี gateway จริงต่อ** โค้ด backend ปัจจุบันยังเป็นระบบอัปสลิป+อนุมัติเอง → **จนกว่าจะต่อ gateway เสร็จ เว็บเก็บเงินจริงไม่ได้** ก่อน launch ต้อง: (1) สมัคร+ต่อ gateway, (2) wire webhook, (3) ถ้ายังไม่ทันให้กลับไปใช้ระบบอัปสลิป+อนุมัติเอง (master–detail + ปุ่มอนุมัติ/ปฏิเสธ) ชั่วคราว

เป็น **ห้องกระทบยอด** — ดูธุรกรรมที่เข้ามาแล้วยืนยันแล้ว ไม่มีปุ่มอนุมัติ/ปฏิเสธ (ปุ่มพวกนั้นออกแบบเก็บไว้ใช้ตอน fallback ได้ แต่ default ซ่อน):

```
┌──────────────────────────────────────────────────────┐
│ การเงิน   [รออนุมัติ 3] [อนุมัติแล้ว] [ปฏิเสธ]  [🔍]   │
├────────────────────────────┬─────────────────────────┤
│  รายการ (list ซ้าย)         │   รายละเอียด (ขวา)        │
│  ┌────────────────────┐    │   ┌───────────────────┐ │
│  │▌สมชาย ใจดี          │◀── │   │  [สลิปใหญ่ zoomable]│ │
│  │ ฟิสิกส์ ม.6 · ฿2,500│sel │   │                   │ │
│  │ 🟡 5 นาทีที่แล้ว     │    │   │  (คลิกเพื่อซูม)     │ │
│  ├────────────────────┤    │   └───────────────────┘ │
│  │ สมหญิง...           │    │   ผู้ซื้อ: สมชาย ใจดี     │
│  │ คณิต ม.5 · ฿1,900   │    │   อีเมล · เบอร์          │
│  └────────────────────┘    │   คอร์ส: ฟิสิกส์ ม.6      │
│                            │   ยอด: ฿2,500           │
│                            │   เวลา: 14:32 30/05      │
│                            │   ┌─────────┬─────────┐ │
│                            │   │✓ อนุมัติ │✗ ปฏิเสธ │ │
│                            │   └─────────┴─────────┘ │
└────────────────────────────┴─────────────────────────┘
```

- **Master–detail layout:** รายการธุรกรรมซ้าย + รายละเอียด/ใบเสร็จขวา (Q2 = master–detail) — ไถดูเร็วทีละรายการ
- **รายละเอียดขวา:** ผู้ซื้อ + คอร์ส + ยอด + เวลา + transaction/ref id + สถานะยืนยัน (ใบเสร็จ ไม่ใช่สลิป)
- **Filter/search:** ตามคอร์ส / ช่วงเวลา / ยอด — เน้นกระทบยอดรายได้
- **Status badge:** reuse `<PaymentStatusBadge>` จาก Batch 4 (สำเร็จ/รอ/ล้มเหลว ตามที่ gateway คืนมา)
- **Keyboard:** ↑↓ เลื่อนรายการดู
- **(เก็บไว้ใช้ตอน fallback):** ปุ่มอนุมัติ/ปฏิเสธ + reason chips + lightbox ดูสลิป — ออกแบบเป็น variant ที่ default ซ่อน เปิดได้ถ้าต้องกลับมา manual
- **Empty:** "ยังไม่มีธุรกรรม"
- **Mobile:** ยุบเป็น list → tap เปิด detail เต็มจอ

---

### B2. `/admin/coupons` — จัดการคูปอง ✅

ตอนนี้มี CRUD พื้นฐาน — จัดระเบียบให้อ่านง่าย:

- **Header:** "คูปอง" + ปุ่ม "สร้างคูปอง" (เปิด modal/sheet)
- **Form สร้าง:** code (auto-uppercase) · ชนิด (% หรือ บาท, segmented) · มูลค่า · จำกัดสิทธิ์ (max usage) · วันหมดอายุ (date picker)
- **ตาราง:** code (mono font + copy) · ส่วนลด · ใช้ไป X/Y (progress bar จิ๋ว) · หมดอายุ · สถานะ (ใช้งานได้/เต็ม/หมดอายุ) · ลบ
- **State per row:** เต็มสิทธิ์ → เทา, หมดอายุ → ขีดฆ่า
- **Empty:** "ยังไม่มีคูปอง — สร้างโค้ดส่วนลดแรก"

---

## CLUSTER C — Content Studio (สร้างของขาย)

### C1. `/admin/courses` + `/admin/courses/new` + `/admin/courses/[id]` ✅

จัดการคอร์ส — ตอนนี้มีตาราง + form + curriculum editor อยู่แล้ว ขอ **ยกหน้าตา**:

- **List:** card grid แทนตารางล้วน (thumbnail + title + หมวด + ราคา + สถานะ + จำนวนนักเรียน) — ใกล้กับที่นักเรียนเห็น หมิงจะ preview ง่าย
- **Toggle เผยแพร่/ร่าง** ตรงการ์ดเลย (ไม่ต้องเข้าไปแก้)
- **หน้าแก้ไข `[id]`:** tabs — "ข้อมูลคอร์ส" / "เนื้อหา (curriculum)" / "นักเรียนในคอร์ส"
  - **ข้อมูล:** `<CourseForm>` (title, หมวด, ราคา, ราคาลด, cover upload, คำอธิบาย)
  - **Curriculum editor:** reuse `<CurriculumEditor>` — section → lessons (วิดีโอ/เอกสาร) reorder ได้ (drag handle) + เพิ่ม/ลบ
  - **Danger zone:** ลบคอร์ส (confirm พิมพ์ชื่อยืนยัน — reuse `<DangerZone>` จาก Batch 4)
- **Cover/video:** drag-drop upload (reuse `<SlipDropzone>` pattern), วิดีโอใส่ลิงก์ (YouTube/embed)

---

### C2. `/admin/exams` + `/admin/exams/[id]` — แต่งข้อสอบ ✅

ตอนนี้มี question authoring อยู่แล้ว — ยกระดับ authoring UX:

- **List:** ตาราง/การ์ด exam (ชื่อ · วิชา · จำนวนข้อ · ผูกกับคอร์ส · จำนวนคนทำ) + ปุ่มสร้าง
- **หน้าแต่ง `[id]`:** ซ้าย = รายการคำถาม (reorder, drag handle) / ขวา = editor คำถามที่เลือก
  - คำถาม (rich text + แนบรูปได้ ✅ มี `/upload/image`)
  - choices A-D + เลือกข้อถูก (radio) + คำเฉลย/อธิบาย
  - **Preview mode:** สลับดูแบบที่นักเรียนเห็น (reuse `<CustomRadio>` จาก Batch 3)
- **Empty:** "ยังไม่มีคำถาม — เพิ่มข้อแรก"
- เน้น authoring เร็ว: เพิ่มข้อถัดไปโดยไม่ต้อง reload, autosave indicator (Google Docs style)

---

## CLUSTER D — People & System

### D1. `/admin/users` — นักเรียน ✅ (backend มี filter/sort/pagination ครบแล้ว!)

ตอนนี้ frontend ดึง list แล้ว filter ฝั่ง client — **ใช้พลัง backend ที่มีอยู่:**

- **Filter bar:** ค้นหา (ชื่อ/อีเมล) · role · ระดับชั้น (grade) · สถานะออนไลน์ · active — ทั้งหมด backend รองรับ
- **ตาราง:** avatar + ชื่อ + อีเมล · role badge · ระดับชั้น · สมัครเมื่อ · ออนไลน์ล่าสุด · จัดการ
- **Pagination:** ใช้ของ backend (page/page_size/sort) — ไม่ใช่โหลดหมดทีเดียว
- **Row action:** ดูโปรไฟล์ · เลื่อน/ลดสิทธิ์ admin · (ดูคอร์สที่ลงทะเบียน)
- **Sort:** คลิกหัวคอลัมน์เรียงได้
- **Empty/no-result:** "ไม่พบนักเรียนตามเงื่อนไข"

---

### D2. `/admin/settings` — ตั้งค่าเว็บ ✅ (ยังไม่มีหน้านี้ — backend พร้อม)

backend มี settings + banner images แล้วแต่ยังไม่มี UI — **หน้าใหม่:**

- **Section "หน้าร้าน":** แบนเนอร์ landing (อัป/ลบหลายรูป — reuse dropzone), ข้อความ hero
- **Section "การชำระเงิน":** เลข PromptPay, ชื่อบัญชี, คำแนะนำการโอน (โชว์ตอน checkout)
- **Section "ติดต่อ":** Line OA, อีเมล, เบอร์ (โชว์ใน trust signals)
- Layout: vertical section + autosave หรือปุ่มบันทึกต่อ section (reuse `<SettingsTabs>` pattern จาก Batch 4)

---

### D3. `/admin/reports` + `/admin/audit` — รายงานปัญหา + ประวัติการกระทำ ✅ (ยังไม่มีหน้า — backend พร้อม)

2 หน้านี้ backend มี endpoint แล้วแต่ยังไม่มี UI:

- **`/admin/reports`:** รายการปัญหาที่นักเรียนแจ้ง (เนื้อหาผิด/บั๊ก) — list + สถานะ (ใหม่/กำลังแก้/ปิด) + filter
- **`/admin/audit`:** timeline การกระทำของ admin (ใครทำอะไรเมื่อไหร่ + diff ก่อน/หลัง) — สำคัญตอนมีหลายคนช่วยดูแล หรือย้อนตรวจ
  - Layout: timeline/feed + filter (action, ช่วงเวลา) + แสดง diff แบบ before→after
- ทั้งคู่: ดู (read-heavy) เป็นหลัก ไม่ต้องหวือหวา

---

## 🧩 Custom Components ใหม่

| Component | Where | Detail |
|---|---|---|
| `<AdminShell>` | ทุกหน้า admin | sidebar grouped + topbar + live badge |
| `<KpiCard>` | Overview | ตัวเลขใหญ่ + trend + sparkline |
| `<RevenueChart>` | Overview | toggle 7/30/ปี — area/bar |
| `<ActivityFeed>` | Overview, audit | timeline item + actor + time |
| `<SlipReviewPane>` | Payments | master–detail + lightbox zoom |
| `<RejectReasonPicker>` | Payments | reason chips + note |
| `<DataTable>` | Users, coupons | sort header + pagination + filter bar |
| `<FilterBar>` | Users | search + dropdown filters (chips) |
| `<CouponForm>` | Coupons | code + type segmented + date picker |
| `<QuestionEditor>` | Exams | question + choices + correct picker + preview |
| `<SettingsSection>` | Settings | titled section + save state |
| `<AuditDiff>` | Audit | before→after highlight |
| `<StatusToggle>` | Courses | เผยแพร่/ร่าง inline switch |

**REUSE ของเดิม (สำคัญ):**
- `<Card>`, `<Button>`, `<Badge>`, `<Dialog>`, `<Tabs>`, `<Avatar>` — base ทั้งหมด
- `<PaymentStatusBadge>`, `<SlipDropzone>`, `<DangerZone>`, `<SettingsTabs>` — จาก Batch 4
- `<CurriculumEditor>`, `<CourseForm>` — มีอยู่แล้ว ขอแค่ restyle ให้เข้าธีม
- `<CustomRadio>` (Batch 3) — exam preview
- `<SparklineChart>` (Batch 3) — KPI cards
- `<CommandPalette>` ⌘K (Batch 2) — topbar search

---

## 🎨 Specific Polish

- **Density:** admin ใช้ spacing แน่นกว่าฝั่งนักเรียน ~20% — ดูข้อมูลได้เยอะในจอเดียว แต่ยังหายใจออก
- **ตาราง:** zebra เบาๆ, hover row, sticky header, sort indicator ชัด — ไม่ใช่ตาราง HTML ดิบ
- **Empty states:** ทุกหน้าต้องมี — admin เปิดมาวันแรกต้องไม่เจอจอว่างเปล่าน่ากลัว
- **Money safety:** action ที่ย้อนไม่ได้ (อนุมัติเงิน/ลบคอร์ส) ต้องมี confirm + สีเตือน
- **Mock data ไทยจริง:** ชื่อ-นามสกุลไทย, course title สมจริง (ฟิสิกส์ ม.6 พิชิต A-Level), ยอดเงิน ฿1,900–฿3,500, สลิปธนาคารไทย mock
- **ห้าม:** Bootstrap-admin vibe, ตารางสีฉูดฉาด, icon เยอะเกิน — คิด Linear/Stripe เสมอ

---

## 📦 Deliverable

ส่ง HTML+Tailwind ใน Artifact ทีละกลุ่ม ตามลำดับความสำคัญ:

1. ⭐ **`<AdminShell>` + `/admin` Overview** — รวม artifact เดียว (ตั้งฐาน shell + แดชบอร์ด)
2. ⭐ **`/admin/payments`** — slip review workspace (สำคัญสุด ทำทุกวัน)
3. **`/admin/courses` + course editor + curriculum** — content studio
4. **`/admin/exams` + question editor**
5. **`/admin/users` + `/admin/coupons`** — รวม artifact เดียว (ตารางคล้ายกัน)
6. **`/admin/settings` + `/admin/reports` + `/admin/audit`** — รวม system cluster

หยุดหลังแต่ละ artifact ให้หมิง feedback

ทุก artifact ต้องมี:
- Dark + Light mode toggle
- Desktop 1440 เป็นหลัก + iPad preview
- ทุก state: empty / loading / hover / success / error
- Real Thai mock data

---

## ❓ ถามก่อนเริ่ม

1. **Admin density:** อยากให้แน่น "Stripe Dashboard" (ข้อมูลเยอะ จอเดียวจบ) หรือโปร่งกว่านั้นใกล้ฝั่งนักเรียน?
2. **Payments review:** เอา **master–detail** (list ซ้าย + สลิปขวา ตรวจรัว) หรือคงแบบ card stack + modal เดิม?
3. **Overview:** อยากได้กราฟรายได้แบบ area chart (สวย) หรือ bar (อ่านค่าง่าย)? และอยาก toggle 7/30/ปี ไหม?
4. **Settings/Reports/Audit:** ทำครบทั้ง 3 เลย หรือโฟกัส 6 หน้าหลักก่อน (overview/payments/courses/exams/users/coupons) แล้วค่อยต่อ system cluster ทีหลัง?
5. **Mobile admin:** ต้องใช้บนมือถือจริงจังไหม หรือเอาแค่ "ดูได้/อนุมัติสลิปฉุกเฉินได้" พอ?

---

> **หมายเหตุ backend (จาก codebase จริง):** endpoint ที่ติ๊ก ✅ มีอยู่แล้ว — metrics, payment-stats, payments approve/reject, users (มี filter/sort/pagination ครบ), coupons CRUD, exam/question authoring + upload รูป, course CRUD + curriculum, settings + banner, reports, audit log ทั้งหมดต่อจริงได้ ไม่ต้องเขียน backend ใหม่สำหรับ Batch นี้ (ยกเว้นอยากเพิ่มกราฟ 30วัน/ปี ต้องขยาย payment-stats นิดหน่อย)
