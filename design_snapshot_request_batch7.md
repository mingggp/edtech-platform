# 📦 Design System Snapshot — Delta Update (Batch 7 → Batch 8)

> **ส่งใน Claude Design แชท Batch 7 (ก่อนปิด)**
> เป็น **delta update** เท่านั้น — มี snapshot Batch 2 + delta Batch 3/4/5/6 อยู่แล้ว
> เน้นเฉพาะ **สิ่งที่เพิ่ม / เปลี่ยน / refined ใน Batch 7 (Onboarding + Notifications + Settings)**

---

## ⚠️ สำคัญ — สร้างเป็น Document/Artifact ด้วย (อย่าลืม!)

**ขอให้ตอบกลับเป็น Document (Artifact) จริงๆ ไม่ใช่แค่พิมพ์ในแชท** — จะได้ copy เก็บเป็นไฟล์ไปใช้ใน Batch 8 ได้สะดวก ที่ผ่านมาชอบลืมสร้าง Document ขอย้ำว่า **รอบนี้สร้าง Artifact ชนิด Markdown ให้ด้วยนะ** 🙏

---

ก่อนปิด session นี้ ขอ **delta snapshot** สำหรับ Batch 7 — จะเอาไปต่อกับ snapshot Batch 2 + delta Batch 3/4/5/6 ในแชทใหม่ Batch 8 ขอครอบคลุม:

## 1. New Components (Code)
ขอ HTML + Tailwind code ของ components ที่สร้างใน Batch 7 ทั้งหมด:
- `<OnboardingWizard>` — step flow (reuse MultiStepForm) + skippable + progress dots
- `<GoalPicker>` — เลือกวิชาสอบ (multi-select) + มหา'ลัยเป้า
- `<SetupChecklist>` — เช็คลิสต์เริ่มต้น + progress bar + ฉลองตอนครบ
- `<NotificationBell>` — กระดิ่ง topbar + badge unread + จุดแดง
- `<NotificationPanel>` — dropdown 5-8 รายการ
- `<NotificationItem>` — icon ตามประเภท + unread dot + timeAgo (states: unread/read)
- `<NotificationCenter>` — หน้า /notifications group ตามวัน + filter
- `<NotificationPrefs>` — toggle ต่อประเภท (in-app/email)
- `<ThemeSelector>` — 3 การ์ด preview (สว่าง/มืด/ตามระบบ)
- `<SettingsNav>` — settings tabs ขยาย (reuse SettingsTabs)
- `<AnnouncementComposer>` — ฝั่ง admin ส่งประกาศ

## 2. Animation / Interaction Patterns (NEW)
- **Onboarding step transition** — slide/fade + dots (ต่างจาก signup ยังไง)
- **SetupChecklist** — tick + การ์ดหุบตอนครบ + celebration
- **Notification bell** — badge pulse ตอนมีใหม่ + panel open/close
- **Mark read** — transition unread→read
- **Theme switch** — เปลี่ยนทันที smooth
- **Settings auto-save** — indicator (Google Docs style)

## 3. Design Decisions (NEW)
- **Onboarding skippable** — ข้ามได้ทุก step, สรุปจำนวน step สุดท้ายที่เคาะ (3 vs 5)
- **course-pick ย้ายไป SetupChecklist** — เหตุผล (ลด wizard friction)
- **Notification ไม่สแปม** — streak reminder วันละครั้ง, group, queue
- **In-app only ก่อน** (อีเมลทีหลัง) — สรุปที่เคาะ
- **/settings เป็นหน้าใหม่** + redirect /profile เดิม — โครง tab ที่เคาะ
- **Notification type → icon/สี mapping**

## 4. Tokens ที่ refine / เพิ่ม
- OKLCH values ใหม่ (notification type colors, unread highlight, theme preview)
- Shadow ของ notification panel + dropdown elevation
- Animation timing (badge pulse, step transition, checklist tick)

## 5. Lessons Learned
- pattern ไหนจาก Batch 1-6 ที่ปรับใน Batch 7
- anti-pattern ที่เจอ
- component ไหน reusable ไป Batch 8 (เช่น FaqAccordion, card patterns, checklist → pricing)

---

**Format:** **Artifact ชนิด Markdown** (ขอเป็น Document จริงๆ อย่าลืม) — สั้นได้ เน้นใช้งานต่อได้

**ใช้ทำอะไร:** เอาไปแปะใน Claude Design แชทใหม่ Batch 8 (Growth & Marketing) — รวมกับ snapshot Batch 2 + delta Batch 3/4/5/6 เดิม

ขอบคุณครับ 🙏
