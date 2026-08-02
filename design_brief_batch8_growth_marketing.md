# 📣 Mingsmileyface — Batch 8: Growth & Marketing

> **ส่งใน Claude Design แชทใหม่** หลังแปะ snapshot Batch 2 + delta Batch 3/4/5/6/7
> เนื้อหา: หน้าที่ทำให้ "คนแปลกหน้า" กลายเป็น "นักเรียน" — เล่าเรื่อง · สร้างความเชื่อ · ปิดการขาย · ชวนเพื่อน

---

## 🆕 บริบทแชทใหม่

นี่คือแชทใหม่สำหรับ **Batch 8** ของโปรเจกต์ **Mingsmileyface** (เว็บคอร์สเรียนออนไลน์สำหรับ ม.ปลายไทย โดยติวเตอร์เดี่ยว)

**7 batches ก่อนหน้า:** Brand+Landing+Dashboard (1) · Courses+Learn+Profile (2) · Exams (3) · Auth+Commerce (4) · Admin Studio (5) · Gamification (6) · Onboarding+Notifications+Settings (7)

**Batch 8 = ชั้นการตลาด (acquisition layer)** — ที่ผ่านมาทำของสำหรับ "คนที่เป็นนักเรียนแล้ว" เกือบหมด Batch นี้ทำของสำหรับ **คนที่ยังไม่ตัดสินใจ** ให้เชื่อใจครูหมิงแล้วสมัคร

Design tokens + components อยู่ใน **snapshots ข้างบน** ↑ — **reuse ของเดิมเสมอ**

---

## 🎯 Recap Brand (สั้น)
- **Vibe:** Premium Pop — Apple (product page) / Linear (landing) / Stripe (pricing) / เว็บติวเตอร์พรีเมียม
- **Device:** Desktop 1440 + Mobile 375 (หน้าการตลาดคนเข้าจากมือถือ/โซเชียลเยอะ — mobile สำคัญมาก)
- **Mode:** Dark first + light toggle
- **Tone:** ครูหมิง — เพื่อนติวเตอร์ที่ฉลาด อบอุ่น น่าเชื่อถือ ไม่โอ้อวดเกินจริง

---

## ⚠️ ปัญหาที่เจอในโค้ดจริง (Batch นี้ต้องเก็บ)

- **nav/footer ลิงก์ไปหน้าที่ยังไม่มี → คลิกแล้ว 404:** `/about` (อยู่บน nav หลักเลย), `/contact`, `/terms`, `/privacy`, `/blog`
- **ยังไม่มี `/pricing`** — คอร์สมีราคาต่อคอร์ส แต่ไม่มีหน้ารวม/แพ็กเกจให้เทียบ
- **ยังไม่มีระบบ referral** (ทั้งที่มี Friend model ในโค้ด)
- **แบรนด์ไม่ตรง:** footer + logo ยังเขียน "EdTech" ต้องเปลี่ยนเป็น **Mingsmileyface** ให้ทั่วทั้งเว็บ
- landing page เดิมมี Hero/Stats/Features/CTA แล้ว แต่ stats เป็นเลขลอย ("1,200+ นักเรียน") ไม่มี social proof จริง (รีวิว/ผลสอบติด)

---

## 📚 Batch 8: 3 cluster

> ✅ = static/มีข้อมูล | ⚠️ = ต้องเพิ่ม backend

---

## CLUSTER A — Trust & Story (ทำให้เชื่อ)

### A1. `/about` — เกี่ยวกับครูหมิง ⭐ (ลิงก์อยู่บน nav แล้ว — ขาดหายอยู่)

หน้านี้สำคัญสุด เพราะติวเตอร์เดี่ยว = คนซื้อ "ตัวครู" ไม่ใช่แบรนด์องค์กร

- **Hero ครูหมิง:** รูป + ชื่อ + tagline ("ติวเตอร์คณิต-ฟิสิกส์ ม.ปลาย") + วิชาที่สอน (TPAT3/TGAT2/A-Level คณิต/ฟิสิกส์)
- **เรื่องราว/ปรัชญาการสอน:** ทำไมสอน, สอนแบบไหน ("เข้าใจจริง ไม่ท่องจำ") — เล่าเป็น human ไม่ใช่ list
- **ผลงาน/ความน่าเชื่อ:** ประสบการณ์, จำนวนนักเรียน, รีวิว, ผลสอบติด (ถ้ามี)
- **Timeline/จุดเด่น** + รูปบรรยากาศสอน
- **CTA:** "ดูคอร์สของครูหมิง" / "สมัครเรียน"
- ข้อมูลดึงจาก settings (Batch 5) ได้บางส่วน — ✅ ส่วนใหญ่ static/แก้ผ่าน admin

### A2. `<Testimonials>` + `<ResultsShowcase>` — เสียงนักเรียน + ผลสอบ ⚠️

- **Testimonial cards:** รูป/ชื่อย่อ + ระดับชั้น + คำรีวิว + ดาว — carousel หรือ grid
- **Results showcase:** "นักเรียนสอบติด" — โลโก้มหา'ลัย/คณะ + ชื่อย่อนักเรียน (ขออนุญาตแล้ว)
- ใช้ได้ทั้งใน /about, landing, /pricing
- เริ่มเป็น static ก่อน ✅ (ภายหลังทำ admin จัดการได้ ⚠️)

### A3. Landing refresh (ต่อยอดของเดิม) ✅
- เสริม section ใหม่เข้า landing เดิม (Hero/Stats/Features/CTA มีแล้ว): testimonials, ผลสอบ, FAQ, "วิชาที่สอน" (ใช้ subject gradient Batch 2)
- เปลี่ยนแบรนด์ EdTech → Mingsmileyface + แก้ stats ลอยให้มี context

---

## CLUSTER B — Conversion (ปิดการขาย)

### B1. `/pricing` — ราคา & แพ็กเกจ ⚠️ (เชื่อม course price จริง)

- **Pricing model:** ตอนนี้ขายต่อคอร์ส — ออกแบบให้โชว์ได้ทั้ง "ต่อคอร์ส" และ "แพ็กเกจ/บันเดิล" (เช่น คณิต+ฟิสิกส์ ม.6 รวมลด)
- **Pricing cards (2-3 tier):** ชื่อแพ็ก + ราคา + สิ่งที่ได้ (checklist) + ปุ่ม CTA + ป้าย "คุ้มสุด" บนตัวกลาง
- **เทียบฟีเจอร์ (comparison table):** แพ็กไหนได้อะไร
- **ราคาขีดฆ่า/ส่วนลด** (เชื่อม coupon Batch 4) + "จ่ายครั้งเดียว เรียนตลอดชีพ"
- **Trust signals:** 🔒 ปลอดภัย · การันตี · ติดต่อก่อนซื้อ
- **FAQ ปิดท้าย** (accordion — reuse pattern จาก Batch 3 review accordion)

### B2. `/contact` — ติดต่อ ✅ (ลิงก์ footer — ขาดหาย)

- ช่องทาง: Line OA (เด่นสุด — เด็กไทยใช้ Line), อีเมล, โซเชียล + เวลาตอบกลับ
- ฟอร์มติดต่อสั้นๆ (ชื่อ/ช่องทาง/ข้อความ) ⚠️ ส่งเข้า admin reports ได้ (Batch 5)
- FAQ สั้นๆ ก่อนติดต่อ (ลดคำถามซ้ำ)

---

## CLUSTER C — Referral & Legal (ขยาย + เปิดจริงได้)

### C1. `/referral` (ชวนเพื่อน) ⚠️ (มี Friend model อยู่แล้ว)

- **Referral code/link ส่วนตัว:** copy/share (Line) ได้
- **Reward 2 ทาง:** ผู้ชวน + เพื่อนที่ถูกชวน ได้อะไร (ส่วนลด/วันเรียนเพิ่ม) — โปร่งใส
- **Progress:** ชวนไปกี่คน · ได้ reward อะไรแล้ว
- **How it works:** 3 step (แชร์ → เพื่อนสมัคร+ซื้อ → ทั้งคู่ได้ reward)
- เชื่อม gamification (Batch 6): ชวนเพื่อน = เหรียญ/XP

### C2. `/terms` + `/privacy` — หน้ากฎหมาย ✅ (จำเป็นก่อนเปิดเก็บเงิน)

- Layout อ่านง่าย: sticky table of contents ด้านข้าง + เนื้อหา + วันที่อัปเดต
- ภาษาไทยกระชับ + heading ชัด (ไม่ต้องสวยมาก เน้นอ่านง่าย/ครบ)
- **สำคัญ:** มีนโยบายคืนเงิน/เงื่อนไขการชำระเงิน (เชื่อมกับระบบจ่ายเงิน)

### C3. `/blog` (optional — shell ก่อน) ✅
- หน้า list บทความ (card grid + หมวด) + หน้า article — ทำเป็นโครงไว้ก่อนเพื่อ SEO ยังไม่ต้องมีเนื้อหาจริง
- ถ้าเวลาไม่พอ ข้ามได้ — ไม่ critical

---

## 🧩 Custom Components ใหม่

| Component | Where | Detail |
|---|---|---|
| `<TutorHero>` | /about | รูปครู + bio + วิชา |
| `<TestimonialCard>` | about, landing, pricing | รีวิว + ดาว + carousel |
| `<ResultsShowcase>` | about, landing | มหา'ลัยที่สอบติด |
| `<PricingCard>` | /pricing | tier + checklist + CTA + ป้ายคุ้มสุด |
| `<FeatureCompareTable>` | /pricing | เทียบแพ็ก |
| `<FaqAccordion>` | pricing, contact | reuse accordion Batch 3 |
| `<ContactChannels>` | /contact | Line/email/social + ฟอร์ม |
| `<ReferralCard>` | /referral | code + share + reward |
| `<ReferralProgress>` | /referral | ชวนกี่คน + reward |
| `<LegalLayout>` | terms, privacy | TOC + เนื้อหา |
| `<BlogCard>` | /blog | card บทความ |

**REUSE ของเดิม (สำคัญ):**
- `<SiteHeader>`, `<SiteFooter>` (แก้แบรนด์ + เติมลิงก์), `gradient-hero`, `gradient-brand`
- Subject gradient colors (Batch 2) — section วิชาที่สอน
- `<Card>`, `<Button>`, `<Badge>`, accordion (Batch 3), `<ConfettiBurst>` (referral success)
- `<CouponInput>` / price display (Batch 4) — pricing
- Course card (Batch 2) — โชว์คอร์สใน pricing/about

---

## 🎨 Specific Polish
- **แบรนด์ให้ตรง:** Mingsmileyface ทั้งเว็บ (เลิกใช้ EdTech) — logo, footer, title
- **Mobile-first จริงจัง:** หน้าการตลาดคนมาจากมือถือ/Line/IG เป็นหลัก
- **Social proof จริง > เลขลอย:** แทน "1,200+ นักเรียน" ลอยๆ ด้วยรีวิว/ผลสอบที่จับต้องได้
- **ไม่ over-claim:** ครูหมิงน่าเชื่อเพราะจริงใจ ไม่ใช่เพราะโม้ — copy ตรงไปตรงมา
- **Line เป็นพระเอกของ contact** (ไม่ใช่อีเมลแบบฝรั่ง)
- **Mock data ไทยจริง:** ชื่อนักเรียน, มหา'ลัย (จุฬา/มธ/มหิดล/เกษตร), รีวิวสมจริง, ราคา ฿1,900–฿5,900

---

## 📦 Deliverable

ส่ง HTML+Tailwind ใน Artifact ทีละกลุ่ม ตามลำดับความสำคัญ:

1. ⭐ **`/about` + Testimonials + Results** (Cluster A) — หัวใจความน่าเชื่อ
2. **`/pricing` + FAQ** (B1) — ปิดการขาย
3. **`/referral`** (C1) — ขยายฐาน
4. **`/contact` + `/terms` + `/privacy`** (B2+C2) — เก็บลิงก์เสีย + เปิดจริงได้
5. (optional) **`/blog` shell**

หยุดหลังแต่ละ artifact ให้หมิง feedback

ทุก artifact: Dark + Light · Desktop + Mobile · ทุก state · Real Thai mock data

---

## ❓ ถามก่อนเริ่ม

1. **Pricing model** ขายต่อคอร์สอย่างเดียว หรืออยากมี "แพ็กเกจรวม" (บันเดิลหลายคอร์สลดราคา) ด้วย?
2. **/about** มีรูป/ประวัติ/ผลงานครูหมิงจริงให้ใช้ไหม หรือใส่ placeholder ไว้ก่อนแล้วเติมทีหลัง?
3. **Referral reward** อยากให้รางวัลเป็นอะไร — ส่วนลดคอร์ส / วันเรียนเพิ่ม / เหรียญ-XP (Batch 6)?
4. **Testimonials/ผลสอบ** มีของจริง (ขออนุญาตนักเรียนแล้ว) หรือใช้ตัวอย่างไปก่อน?
5. รอบนี้ดีไซน์ mock ก่อน แล้วผมต่อ backend (referral, contact form, testimonials admin) ทีหลัง — โอเคไหม?

---

> **หมายเหตุ backend:** about/terms/privacy/blog ส่วนใหญ่ static ✅ · pricing เชื่อม course price ที่มีอยู่ ✅ · contact form → admin reports (Batch 5) ทำได้ · **referral system (code/tracking/reward) + testimonials จัดการผ่าน admin = ต้องเพิ่ม backend** ⚠️ (Friend model มีฐานอยู่แล้ว) · เปลี่ยนแบรนด์ EdTech→Mingsmileyface เป็นงาน frontend ล้วน
