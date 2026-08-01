# วิเคราะห์ `Claude Design version 1.0` — สถานะและงานที่เหลือ

อัปเดตล่าสุด 28 ก.ค. 2026 · วิเคราะห์ครั้งแรก 27 ก.ค. 2026
ทุกข้อได้จากการอ่านไฟล์จริง ข้อไหนยังไม่ยืนยันจะเขียนกำกับไว้ในหัวข้อ 9

---

## 0. สรุปสถานะ

| | ตอนวิเคราะห์ครั้งแรก | ตอนนี้ |
|---|---|---|
| หน้า HTML | 47 | 46 (ลบไฟล์ offline) |
| CSS | 22 | 22 (ลบ `payments.css`, เพิ่ม `page-shell.css`) |
| JS | 24 | 26 (เพิ่ม `subjects.js`, `courses.js`) |
| ขนาดโฟลเดอร์ | 22 MB | 16 MB |
| อยู่ใน git | ❌ ไม่มีเลย | ✅ 6 commit |
| ชุดคำศัพท์ subject key | 5 ชุด | **1 ชุด** |
| ที่เก็บ catalog คอร์ส | 3 ที่ (drift แล้ว) | **1 ที่** |
| ลิงก์ไปหน้าที่ไม่มีจริง | 2 | 0 |

**งานที่เหลือหลักคือฝั่ง backend** — ดูหัวข้อ 7

---

## 1. สิ่งที่แก้ไปแล้ว

### 1.1 git safety net (`9dc2604`, `46417d0`)
โฟลเดอร์นี้เดิม **ไม่ได้อยู่ใน git เลย** — งานหลายเดือนไม่มี backup
ตอนนี้ commit แล้ว 110+ ไฟล์ พร้อม `.gitignore` ที่ตัด `screenshots/` (162 ไฟล์ 4.6 MB) ออก
`uploads/` (25 ไฟล์ — รูปอ้างอิงงานออกแบบ + มาสคอต + โลโก้มหาลัย) **เก็บไว้ใน git**

> 📌 `uploads/pasted-17837941*.png` 7 ไฟล์ ซ้ำกับ `assets/uni-*.png` ทุกประการ (checksum ตรงกัน)

### 1.2 subject key รวมเหลือชุดเดียว (`cbc0578`)
เดิมมี **5 ชุดคำศัพท์** สำหรับ 4 วิชาเดียวกัน: `tgat`/`tgat2`, `tpat`/`tpat3`, `amath`/`aphys`, `MATH` ตัวใหญ่, `'TGAT2'` ใน `people.js`

ตอนนี้เหลือชุดเดียว มี **`subjects.js`** เป็น source of truth:

| key (โค้ด / DB / URL / `data-subj`) | label (ที่นักเรียนเห็น) |
|---|---|
| `math` | คณิต |
| `phys` | ฟิสิกส์ |
| `tpat3` | TPAT3 |
| `tgat2` | TGAT2 |

- CSS token ตามคีย์: `--subj-math` `--subj-phys` `--subj-tpat3` `--subj-tgat2` (+ `-fg`, `-grad`)
- คลาสตามคีย์: `.s-math` `.s-phys` `.s-tpat3` `.s-tgat2` และ `.subj-*`
- หน้า Admin เลิกใช้ชื่อไทยเป็นคีย์กรองแล้ว (`subject:'คณิต'` → `'math'`) แปลงเป็น label ตอนแสดงผลด้วย `Subjects.label()`
- **ไม่ใช่ subject key** (อย่าไปแตะ): `tcas.js` ใช้ `group:'tgat'`/`'tpat'` หมายถึง *กลุ่มสอบ* (TGAT1–3, TPAT1–5) และ `id:'tgat-tpat'` เป็น widget นับถอยหลัง

กติกาเต็มเขียนไว้ใน `CLAUDE.md` แล้ว

### 1.3 catalog คอร์สรวมเหลือที่เดียว (`ccc00ba`)
เดิมพิมพ์ซ้ำ 3 ไฟล์และ **drift แล้วจริง** (คอร์ส `tgat2-logic` ชื่อไม่ตรงกัน 2 ไฟล์)

ตอนนี้มี **`courses.js`** — 14 คอร์ส 1 record ครอบคลุมทั้งข้อมูลการ์ดและหน้ารายละเอียด
`Courses.html` / `Browse Courses.html` / `Course Detail.html` อ่านจากที่นี่ทั้งหมด

โครงสร้าง 1 record (แปลงเป็นตาราง `Course` ใน DB ได้ตรงๆ):

```
id · subj · level · name · meta · glyph · ribbon · free
rating · reviews · students · hours · lessons
priceNow · priceOld
detail { subject · badge · title · tagline · lessonsLong · levelText · statLevel }
```

### 1.4 เปลือกหน้าจอร่วม (`e977038`)
เพิ่ม **`page-shell.css`** — `.main-col` `.topbar` `.top-actions` `.icon-btn` `.crumb` `.scroll`
ตัดประกาศที่ซ้ำออกจาก `<style>` ของ 10 หน้า รวม **500 บรรทัด**

เกณฑ์: เอาเฉพาะ property ที่ **ทั้ง 10 หน้าเขียนค่าเดียวกันเป๊ะ** — ไม่มีหน้าไหนได้ property เพิ่มหรือหาย
ค่าที่แต่ละหน้าปรับเอง (`.page max-width` 1480/1380/1280…, `.topbar padding`) ยังอยู่ในหน้าเดิม

### 1.5 flow สมัคร → Onboarding → Dashboard (`4a92565`)
เดิม `Onboarding.html` เป็นหน้ากำพร้า ไม่มีทางเข้าถึงเลย

| เส้นทาง | ผลลัพธ์ |
|---|---|
| สมัครใหม่ | → Onboarding |
| ล็อกอิน (เคยตั้งค่าแล้ว) | → Dashboard |
| ล็อกอิน (ยังไม่เคยตั้งค่า) | → Onboarding |
| กด "ข้ามไปก่อน" | → Dashboard + บันทึก `ming-onboard {skipped:true}` ไม่ถามซ้ำ |

### 1.6 บั๊กข้อมูลและลิงก์
| ปัญหา | สถานะ |
|---|---|
| `Settings.html` เขียน "TPAT3 ความถนัดแพทย์" (ที่ถูกคือ TPAT1) | ✅ แก้เป็น "ความถนัดวิทย์–เทคโนฯ" |
| TGAT2 ชื่อไม่ตรงกัน 3 ไฟล์ | ✅ รวมเป็น "การคิดอย่างมีเหตุผล" |
| `sidebar.js` ลิงก์ `Notifications.html` (ไม่มีไฟล์) | ✅ → `Settings.html#notif` |
| `notifications.js` ลิงก์ `Payments.html` (ไม่มีไฟล์) | ✅ → `Settings.html#billing` |
| `Course Detail` ขาดข้อมูล 2 คอร์ส กดแล้วขึ้นหน้าแคลคูลัสผิดคอร์ส | ✅ ครบ 14 คอร์ส |
| คอร์สฟรีหน้ารายละเอียดขึ้นราคา `฿NaN` | ✅ เป็น 0 |
| `payments.css` 12 KB ไม่มีหน้าไหนใช้ | ✅ ลบ |
| ไฟล์ offline 6.3 MB (build artifact ค้าง snapshot เก่า) | ✅ ลบ |

---

## 2. สถาปัตยกรรมปัจจุบัน

### 2.1 Marketing shell (10 หน้า)
`brand.css` + `marketing.css` + `marketing-common.js` + `site-config.js` + `tweaks-panel.jsx` + `marketing-tweaks.jsx`
About · Contact · Courses · FAQ · Location · Privacy · Referral · Results · Terms · Testimonials
(Privacy/Terms เพิ่ม `legal.css` · Location เพิ่ม maplibre-gl จาก CDN)

> ⚠️ **`Landing Page.html` ยังไม่อยู่ใน shell นี้** — stand-alone 100% (inline CSS 78 KB) และ **copy logic ของ `marketing-common.js` มาเขียนใหม่ในตัวเอง** (คอมเมนต์ยอมรับเองที่บรรทัด 2667)
> ผลคือถ้าแก้รายชื่อหน้า soon-gated ต้องแก้ 2 ที่

### 2.2 App shell ฝั่งนักเรียน (15 หน้า)
| กลุ่ม | CSS |
|---|---|
| 10 หน้า | `brand.css` + **`page-shell.css`** + `sidebar.css` |
| 5 หน้า | `brand.css` + `app-shell.css` + `sidebar.css` (+ css เฉพาะหน้า) |

Browse Courses · Course Contents · Course Detail · Dashboard · Exams · Exam Detail · Exam Results · My Courses · Public Profile · TCAS
Achievements · Leaderboard · Settings · Streak & Daily Goal · XP & Level

### 2.3 Admin shell (12 หน้า) — สะอาดที่สุดในโปรเจกต์
`admin-shell.js` generate sidebar จาก spec เดียวทุกหน้า คอมเมนต์เขียนว่า *"prevents sidebar drift"*
**นี่คือ pattern ที่ควรใช้ตอนทำ `<Sidebar>` component ใน Next.js**

### 2.4 หน้าเดี่ยว / focus mode
Login Signup · Forgot Reset Password (`auth.css`) · Onboarding (`auth` + `onboarding.css`) · Checkout (`checkout.css`) · Learn · Exam Take · Exam Result · Brand Identity

---

## 3. 🔴 ปัญหาที่ยังเหลือ — sidebar รุ่นเก่าที่ตายแล้ว

**`sidebar.js` ลบ sidebar เดิมทิ้งแล้วสร้างใหม่ทุกครั้งที่เปิดหน้า** แต่ markup เก่ายังฝังอยู่ใน HTML

ทดสอบด้วย jsdom (รันหน้าจริง แล้วเช็คว่า selector ยังจับของได้ไหม) ทั้ง 15 หน้า:

| selector | ในไฟล์ HTML | หลัง JS ทำงาน |
|---|---|---|
| `.sb-item` `.sb-user` `.sb-section` `.search-trigger` | มี | **ไม่มี** |
| `.sb-big` `.sb-mini` (ของใหม่) | ไม่มี | มี |

**ขนาดของปัญหา:**

- markup ตายใน HTML **14 หน้า ~68 KB** (Dashboard 88 บรรทัด, Achievements 84, TCAS 81 …)
- `app-shell.css` **41 จาก 94 กฎ (43%)** เป็น CSS ของ markup ชุดนี้

**ทำไมยังไม่แก้:** ลบ markup ต้องระวังจังหวะก่อน JS ทำงาน (บางหน้าโหลด `sidebar.js` แบบ `defer` = markup เก่าถูกวาดก่อน) และตอนย้ายเข้า Next.js จะเขียน `<Sidebar>` component ใหม่อยู่แล้ว ไม่ต้องไล่ลบทีละหน้า
→ **เก็บไว้จัดการตอน port**

---

## 4. 🔴 `web/` (Next.js) ใช้ design system คนละชุด

| | โฟลเดอร์ดีไซน์ | `web/src/app/globals.css` |
|---|---|---|
| สีแบรนด์ | violet/magenta + aurora | **Indigo + Amber** |
| สีประจำวิชา | `--subj-*` ครบ 4 | **ไม่มีเลย** |
| glassmorphism | ใช้ทั้งเว็บ | **ไม่มี** |
| ขนาด | `brand.css` 23 KB | 5.5 KB |

หน้าใน `web/` เป็นโครงเปล่า — `dashboard/page.tsx` 145 บรรทัด เทียบกับดีไซน์ 3,450 บรรทัด

**ตัดสินใจแล้ว: ทิ้ง `web/` เก่า สร้างใหม่จากโฟลเดอร์ดีไซน์**
สิ่งที่พอเก็บไว้อ้างอิงได้คือโครง routing (`(auth)/`, `admin/`, `learn/[id]/`) และ `route-guard.tsx`

> `web/` 76 ไฟล์ ยังไม่ได้อยู่ใน git

---

## 5. 🔴 backend ขัดกับดีไซน์

### 5.1 Payment ยังเป็นระบบส่งสลิป
```python
class Payment(Base):
    slip_url = Column(String)                      # ← CLAUDE.md ห้ามชัดเจน
    status   = Column(String, default="pending")   # ← ห้ามเหมือนกัน
```
มี endpoint `POST /payments/upload` รับไฟล์สลิปอยู่

ขณะที่ฝั่งดีไซน์บอกนักเรียนตรงกันทุกหน้าว่า **ไม่ต้องส่งสลิป ระบบยืนยันอัตโนมัติ**
(`Admin Payments.html:181`, `Checkout.html:85,126`, `FAQ.html:306,308`)

**ตัดสินใจแล้ว: แก้ backend ตามดีไซน์ — auto-verify อย่างเดียว**

### 5.2 Course ไม่มีวิชา
```python
class Course(Base):
    category = Column(String, default="General")   # ← ไม่มี 4 วิชาเลย
```
ต้องเพิ่ม `subject` (`math`/`phys`/`tpat3`/`tgat2`) และ `level` (`m4`/`m5`/`m6`/`alevel`/null)

### 5.3 model ที่ยังไม่มีเลย ทั้งที่ดีไซน์มีหน้าครบ
XP/Level · Streak/DailyGoal · Achievement/Badge · Notification · Referral · TCAS target

### 5.4 ส่วนที่ใช้ได้เลย
- `Lesson.youtube_id` — วิดีโอโฮสต์บน YouTube **ตรงกับแผนที่จะทำ animation ในคลิป**
- auth/JWT + `test_password.py` 128 บรรทัด + alembic 2 migration
- `promptpay.py` — สร้าง QR ตาม EMVCo พร้อม CRC16 ใช้ต่อได้

19 model ปัจจุบัน: User · Friend · StudyLog · Course · Chapter · Lesson · Enrollment · Progress · Payment · Coupon · Exam · Question · Choice · ExamResult · Comment · Rating · Report · Setting · AuditLog

---

## 6. เรื่องที่ยังไม่ได้แตะ (จากรายงานเดิม)

| เรื่อง | สถานะ |
|---|---|
| **Learn.html ไม่มี animation engine** | ✅ ไม่ใช่ปัญหา — ยืนยันแล้วว่าจะทำ animation ในคลิปวิดีโอ ไม่ทำในเว็บ |
| Landing Page copy logic จาก `marketing-common.js` | ยังไม่แก้ |
| Responsive อ่อนที่ Checkout (2 breakpoints) · Learn (4) · Login (2) | ยังไม่แก้ |
| glassmorphism บาง: Checkout (6 hits) · marketing pages (7–8) vs Admin (40–60) | ยังไม่แก้ |
| `DESIGN_SYSTEM.md` ค้างที่ Batch 2/3 (ลิสต์ไว้ 8 ไฟล์ ตอนนี้ 46 หน้า) | ยังไม่แก้ |
| Contact.html เข้าถึงได้ทาง footer เท่านั้น (ไม่อยู่ใน `NAV_ITEMS`) | ยังไม่แก้ |
| หน้าปิดชั่วคราว: Referral · Testimonials · Results · FAQ (`marketing-common.js` ปิดคลิก) | ตั้งใจ |

---

## 7. ลำดับงานถัดไป

### กำลังทำ — backend
1. **แก้ `Payment`** — ตัด `slip_url`, สถานะเหลือ `paid`/`expired`, เพิ่ม webhook endpoint, ลบ `/payments/upload`
2. **เพิ่ม `subject` + `level` ลง `Course`** ให้ตรงกับ `subjects.js` / `courses.js`
3. **เพิ่ม model กีม** — XP/Level · Streak · Achievement · Notification

### หลังจากนั้น
4. สร้าง `web/` ใหม่จากดีไซน์ — เขียน `<Sidebar>` แบบ `admin-shell.js` (spec เดียว ทุกหน้า) แล้วปัญหาหัวข้อ 3 หายไปเอง
5. ต่อ payment gateway จริง (Opn / 2C2P / GB Prime Pay) — **ตอนนี้ UI พร้อม 100% แต่ยังรับเงินไม่ได้**
6. ยก Checkout · Learn · Login ให้ responsive และเพิ่ม glass ให้ Checkout
7. อัปเดต `DESIGN_SYSTEM.md` ให้ครอบคลุม 46 หน้า

---

## 8. State contract — localStorage (ใช้ตอนย้ายไป backend)

| key | ใช้กี่ที่ | ความหมาย |
|---|---|---|
| `ming-theme` | 55 | ธีมที่ resolve แล้ว |
| `ming-sidebar` | 30 | สถานะพับ sidebar |
| `ming-site` / `ming-site-edit` | — | CMS config จาก Admin Site |
| `ming-onboard` | 3 | สถานะผ่านหน้าตั้งค่าแล้วหรือยัง (Onboarding เขียน · Login/Dashboard อ่าน) |
| `ming-theme-pref` | 2 | ธีมที่ผู้ใช้เลือก รวม `system` — Settings.html เท่านั้น |
| `ming-tcas-target`, `ming-tcas-rank` | 6 | เป้าคณะใน TCAS calculator |
| `ming-daily-goal` | 4 | เป้าหมายรายวัน |
| `ming-font` `ming-var-font` `ming-pop-hue` `ming-pop` `ming-grad` `ming-accent` | 13 | tweak ทางสายตา |
| `ming-pricelayout` `ming-pinned-exam` `adm-exams-view` `ming-setup-steps` `ming-setup-dismissed` | — | ตัวเลือก UI ระดับหน้า |

> 🟠 ธีม "ตามระบบ" ทำงานแค่ใน Settings — หน้าอื่นอ่านแค่ `ming-theme` ที่ resolve ไว้แล้ว
> ตอนย้าย Next.js ควรทำ theme provider ตัวเดียวคุมทั้งเว็บ

---

## 9. สิ่งที่ยังไม่ได้ยืนยัน

- **ยังไม่ได้เปิดดูในเบราว์เซอร์จริง** — ตรวจด้วยการอ่านโค้ด + รัน jsdom + เทียบ CSS cascade แบบ property ต่อ property เท่านั้น ยังไม่เห็นภาพจริงว่าสวยไหม
- **ยังไม่ได้ตรวจ accessibility** — contrast ratio, keyboard nav, screen reader, ARIA โดยเฉพาะสี TGAT2 เหลืองที่ `CLAUDE.md` เตือนเรื่อง contrast ไว้เอง
- **ยังไม่ได้วัด performance จริง** — วัดจากขนาดไฟล์อย่างเดียว (inline CSS รวมทั้งโปรเจกต์ยัง 709 KB)
- **ยังไม่ได้รันเทสต์ backend** — ยังไม่รู้ว่า 4 ไฟล์เทสต์ผ่านหรือไม่
- **ไม่รู้ว่าไฟล์ใน `screenshots/` อันไหนยังมีประโยชน์** — ตัดออกจาก git แล้ว แต่ไฟล์ยังอยู่บนเครื่อง
