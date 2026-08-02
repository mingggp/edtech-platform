# 🗺️ Mingsmileyface — Roadmap: จากดีไซน์ → เปิดจริง

> จบเฟสออกแบบ (9 batches + หน้า location) แล้ว ต่อไปคือเอาดีไซน์ลงโค้ด Next.js จริง + ต่อ backend ที่ขาด + เปิดเก็บเงินได้

---

## ⚠️ อ่านก่อน — Roadmap นี้ยืดหยุ่น ไม่ใช่กฎตายตัว
Roadmap นี้เป็น **แนวทางคร่าวๆ** ไม่ต้องทำตามเป๊ะทุกข้อ ระหว่างทางเว็บถูกเปลี่ยนไปเยอะแล้ว — **เพิ่มหน้า / ลดหน้า / มีฟีเจอร์ใหม่ๆ** ที่ไม่ตรงกับลิสต์ข้างล่างนี้ก็เป็นเรื่องปกติ

**ให้ยึด "ของจริงจาก Claude Design เป็นหลัก"** — หน้าไหน/ฟีเจอร์ไหนที่ออกแบบล่าสุดใน Claude Design ถือว่าอันนั้นคือความจริง ส่วนลิสต์หน้าใน Phase 2 ด้านล่างเป็นแค่ตัวช่วยไล่เช็ก ถ้าไม่ตรงให้ปรับตาม Claude Design ได้เลย ข้าม/เพิ่ม/สลับลำดับได้ตามสถานการณ์

> สรุป: Claude Design = แหล่งความจริงของ "หน้าตา & ฟีเจอร์" · Roadmap = เช็กลิสต์หลวมๆ ของ "ลำดับงานสู่ launch"

---

## ✅ ทำเสร็จแล้ว
- ดีไซน์ครบทั้ง surface: Batch 1-9 (นักเรียน / admin / gamification / settings-notif-onboarding / growth / polish) + หน้า `/location` (แผนที่ 3D prototype ทำเป็นโค้ดจริงแล้ว)
- snapshot request Batch 4-8 (delta) เก็บครบ
- โค้ดฐาน Next.js 15 + Tailwind + shadcn + FastAPI backend มีอยู่แล้ว (หลายหน้า functional แต่หน้าตายังเป็นเวอร์ชันเก่า)

---

## 📌 หลักการเปลี่ยนผ่าน (อ่านก่อน)
ดีไซน์จาก Claude Design = **HTML/Tailwind static** ส่วนแอปจริง = **React component + ข้อมูลจริง** (react-query, auth store, API)
→ ไม่ใช่ copy-paste แต่เป็น "เอาหน้าตาจาก mockup มาครอบ component ที่ต่อข้อมูลอยู่แล้ว" ทำ **ทีละหน้า + เทสต์**

---

## 🧭 ขั้นตอน (เป็นเฟส)

### PHASE 0 — รวบรวม export (ทำก่อนเลย)
- [ ] เซฟทุกหน้าจาก Claude Design เป็นไฟล์ HTML ลงโฟลเดอร์ `design-exports/` ในโปรเจกต์นี้ (ตั้งชื่อตามหน้า: `landing.html`, `checkout.html`, `admin-payments.html`, ...)
- [ ] บอกผมว่าเซฟครบแล้ว — ผมจะไล่อ่านเทียบกับหน้าจริง

### PHASE 1 — วางฐาน design system (ทำครั้งเดียว ได้ผลทั้งเว็บ)
- [ ] เทียบ tokens (สี/ฟอนต์/spacing/radius) จาก mockup กับ `globals.css` + Tailwind config → sync ให้ตรง
- [ ] แก้แบรนด์ **EdTech → Mingsmileyface** ทั่วเว็บ (logo/footer/title/meta)
- [ ] ตัด **เคมี/ชีวะ** ออกจาก filter/footer/landing (เหลือ 6 วิชาตาม CLAUDE.md)
- [ ] เก็บ component กลาง: EmptyState / ErrorState / Skeleton / 404 / 500 ให้เป็นตัวเดียวใช้ทั้งเว็บ

### PHASE 2 — พอร์ตหน้า (ทีละหน้า ตามลำดับความสำคัญ)
> เรียงจาก "หน้าทำเงิน/คนเห็นเยอะ" ก่อน
> ⚠️ ลิสต์ข้างล่างเป็น **ตัวอย่าง** — ยึดตามหน้าจริงที่มีใน Claude Design เป็นหลัก (บางหน้าอาจถูกเพิ่ม/ตัด/รวมไปแล้ว)

**กลุ่มขาย (ก่อน):**
- [ ] `/` Landing — `app/page.tsx`
- [ ] `/courses` + `/courses/[id]` — discovery + detail
- [ ] `/checkout/[courseId]` ⭐ (money moment)
- [ ] `/pricing`, `/about` (หน้าใหม่จาก Batch 8)

**กลุ่มเรียน:**
- [ ] `/dashboard`, `/learn/[id]`, `/exams` + take + results

**กลุ่มบัญชี/แอดมิน:**
- [ ] auth (login/signup/forgot/reset), `/payments`, `/settings` (จาก /profile)
- [ ] `/admin/*` ทั้งหมด (Batch 5)

**กลุ่มเสริม:**
- [ ] gamification (achievements/leaderboard + streak/XP ใหม่), notifications, onboarding
- [ ] `/referral`, `/contact`, `/terms`, `/privacy`
- [ ] `/location` (เอา live 3D map เสียบในกรอบที่ Claude Design ออกแบบ)

### PHASE 3 — ต่อ backend ที่ขาด (บางอันทำคู่กับ Phase 2 ได้)
- [ ] ⭐ **Payment SlipOK** — blocker ก่อน launch (config + slip_verify.py + ฟิลด์ Payment + migration + endpoint) *[ดู memory: payment-auto-verify-deferred]*
- [ ] Notifications (ตารางใหม่ + bell + prefs)
- [ ] Onboarding flag + goal fields
- [ ] Gamification: XP/level, streak (คำนวณจาก StudyLog), daily goal, badge progress
- [ ] Referral (code/tracking/reward — มี Friend model เป็นฐาน)
- [ ] Testimonials + Announcement (ผ่าน admin)
- [ ] Settings ขยาย (bio, notification prefs, privacy)

### PHASE 4 — Polish & QA (Batch 9 ในโค้ดจริง)
- [ ] responsive mobile 375 ทุกหน้า
- [ ] states ครบ (loading/empty/error) + 404/500
- [ ] ⌘K command palette
- [ ] accessibility (focus/contrast/keyboard) + page transitions

### PHASE 5 — ก่อนเปิดจริง (pre-launch)
- [ ] ใส่ของจริง: รูปครูหมิง/หน้าร้าน, รีวิว/ผลสอบจริง (ห้ามใช้ของปลอม), เวลาเปิดร้าน
- [ ] เนื้อหา terms/privacy จริง (โดยเฉพาะนโยบายคืนเงิน)
- [ ] สมัคร SlipOK จริง → ใส่ API key + branch id → เทสต์จ่ายเงิน end-to-end
- [ ] ตั้งค่า env/secrets production, deploy, ตรวจ CORS/โดเมน
- [ ] เทสต์ flow เต็ม: สมัคร → ซื้อ → จ่าย → เข้าเรียน

### PHASE 6 — เปิด + วนปรับ
- [ ] เปิดรับนักเรียนจริง
- [ ] ตั้ง scheduled task ดูยอด/สลิป/สรุปรายวัน (ถ้าต้องการ)

---

## 🚧 Blocker เดียวที่กั้นการเก็บเงินจริง
**Payment SlipOK ยังไม่ได้ต่อ** — จนกว่าจะเสร็จ เว็บรับเงินจริงไม่ได้ (ดูรายละเอียดใน memory)

---

## ▶️ ก้าวถัดไปทันที
1. เซฟ export จาก Claude Design ลง `design-exports/`
2. บอกผมว่าจะเริ่มพอร์ตหน้าไหนก่อน (แนะนำเริ่ม Phase 1 tokens/แบรนด์ แล้วตามด้วย Landing)
3. หรือถ้าอยากปลด blocker ก่อน — เริ่ม Payment SlipOK ได้เลย (ผมทำ mock mode ให้เทสต์ได้โดยไม่ต้องมี key จริง)
