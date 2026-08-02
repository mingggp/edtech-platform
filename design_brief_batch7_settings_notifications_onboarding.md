# 🔔 Mingsmileyface — Batch 7: Onboarding + Notifications + Settings

> **ส่งใน Claude Design แชทใหม่** หลังแปะ snapshot Batch 2 + delta Batch 3/4/5/6
> เนื้อหา: เก็บช่องโหว่ UX — ต้อนรับนักเรียนใหม่ให้ติด · แจ้งเตือนให้กลับมา · ตั้งค่าให้ครบ

---

## 🆕 บริบทแชทใหม่

นี่คือแชทใหม่สำหรับ **Batch 7** ของโปรเจกต์ **Mingsmileyface** (เว็บคอร์สเรียนออนไลน์สำหรับ ม.ปลายไทย โดยติวเตอร์เดี่ยว)

**6 batches ก่อนหน้า:**
- **Batch 1:** Brand + Landing + Dashboard
- **Batch 2:** Courses + Detail + Learn + Public Profile
- **Batch 3:** Exam System
- **Batch 4:** Auth + Checkout + Payments + Profile
- **Batch 5:** Admin / Tutor Studio
- **Batch 6:** Gamification & Engagement

**Batch 7 = เก็บช่องโหว่ UX 3 จุด** ที่ยังไม่มี: ต้อนรับนักเรียนใหม่ (onboarding), แจ้งเตือน (notifications), และตั้งค่าให้ครบ (settings) — 3 จุดนี้ต่อเนื่องกับ retention ของ Batch 6 โดยตรง

Design tokens + components อยู่ใน **snapshots ข้างบน** ↑ — **reuse ของเดิมเสมอ**

---

## 🎯 Recap Brand (สั้น)
- **Vibe:** Premium Pop — Apple / Linear / Duolingo (onboarding) / Notion (settings)
- **Device:** Desktop 1440 + iPad → Mobile 375 (onboarding + แจ้งเตือนเด็กเปิดมือถือเยอะ — mobile สำคัญ)
- **Mode:** Dark first + light toggle
- **Tone:** เพื่อนติวเตอร์ที่ฉลาด อบอุ่น ไม่กดดัน

---

## 📊 ของเดิม (ต่อยอด ไม่เริ่มศูนย์)

> ✅ = มีแล้ว | ⚠️ = ต้องเพิ่ม backend

- ✅ **/profile** มี 2 แท็บเบสิก: ข้อมูลทั่วไป (avatar/ชื่อ/ชื่อเล่น/ระดับชั้น) + ความปลอดภัย (เปลี่ยนรหัส)
- ✅ User model: full_name, nickname, grade_level, dek_code, avatar, total_minutes, showcase_badges
- ✅ Signup เป็น 2-step wizard (มี `<MultiStepForm>` reuse ได้) — แต่ **หลังสมัครเด้งเข้า dashboard เลย ไม่มี onboarding**
- ✅ Friend model มีอยู่ (ใช้กับ notification "เพื่อน" ได้)
- ⚠️ **ยังไม่มีเลย:** ระบบ notification (ทั้ง backend+frontend), onboarding flow, การตั้งค่านอกเหนือ profile/password, theme switcher แบบถาวร, privacy settings

---

## 📚 Batch 7: 3 cluster

---

## CLUSTER A — Onboarding (ต้อนรับนักเรียนใหม่)

**Goal:** นาทีแรกหลังสมัคร = ตัดสินว่านักเรียนจะอยู่หรือหาย ทำให้รู้สึก "เว็บนี้เข้าใจฉัน"

### A1. `<OnboardingWizard>` — flow หลังสมัครครั้งแรก ⚠️ (ต้องมี flag user.onboarded)

reuse `<MultiStepForm>` (step dots) จาก signup:

```
Step 1 — ทักทาย      "ยินดีต้อนรับ {ชื่อเล่น}! 👋 มาตั้งเป้ากัน 3 ข้อ"
Step 2 — เป้าหมาย     เลือกสอบอะไร: TPAT3 / TGAT2 / A-Level คณิต / ฟิสิกส์ (เลือกได้หลายอัน)
Step 3 — มหา'ลัยเป้า   พิมพ์/เลือกคณะ-มหา'ลัยที่อยากเข้า (optional, สร้างแรงจูงใจ)
Step 4 — เวลาเรียน    ตั้ง daily goal (15/30/60 นาที) + เปิดเตือน streak ไหม
Step 5 — คอร์สแรก     แนะนำคอร์สตามเป้าที่เลือก → "เริ่มเลย" / "ไว้ก่อน"
```

- **Skippable:** ข้ามได้ทุก step (ปุ่ม "ข้ามไปก่อน") — ไม่บังคับ
- **Progress dots** + transition แบบ signup
- **จบ flow:** confetti เบาๆ (reuse `<ConfettiBurst>`) + "พร้อมแล้ว! ไปเรียนกัน" → dashboard
- เชื่อมกับ Batch 6: daily goal ที่ตั้งใน step 4 ไปโผล่ที่ widget streak/goal

### A2. `<SetupChecklist>` + Dashboard empty state (นักเรียนใหม่) ⚠️

- **เช็คลิสต์เริ่มต้น (บน dashboard นักเรียนใหม่):** การ์ด "เริ่มต้นใช้งาน" 4 ข้อ + progress bar
  - ☐ กรอกโปรไฟล์ให้ครบ
  - ☐ ลงทะเบียนคอร์สแรก
  - ☐ เรียนบทเรียนแรก
  - ☐ ลองทำข้อสอบ 1 ชุด
- ทำครบ → การ์ดหุบ + ฉลองเบาๆ + เหรียญ "เริ่มต้นดี"
- **Empty states ทั่ว dashboard** สำหรับคนยังไม่มีข้อมูล (ยังไม่มีคอร์ส/ยังไม่เคยสอบ) — coaching ไม่ใช่จอว่าง

---

## CLUSTER B — Notifications (ดึงกลับมา)

**Goal:** เหตุผลให้เปิดเว็บซ้ำ — แต่ไม่สแปม

### B1. `<NotificationBell>` + `<NotificationPanel>` — กระดิ่งบน topbar ⚠️ (ต้องมีตาราง notification)

- **กระดิ่งบน topbar** (reuse จาก app shell) + badge เลข unread (จุดแดงถ้ามี)
- **Dropdown panel** กดแล้วเด้ง: รายการล่าสุด 5-8 อัน + "ดูทั้งหมด"
- **Notification item:** ไอคอนตามประเภท + ข้อความ + เวลา (timeAgo) + จุด unread + คลิกไปหน้าเป้าหมาย
- **ประเภทแจ้งเตือน (icon + สีต่างกัน):**
  - 💳 ชำระเงินอนุมัติแล้ว → ปลดล็อกคอร์ส
  - 📚 มีบทเรียน/คอร์สใหม่
  - 📝 ผลสอบออกแล้ว
  - 🏅 ปลดล็อกเหรียญ / level-up (เชื่อม Batch 6)
  - 🔥 เตือน streak กำลังจะหลุด (วันละครั้ง พอ)
  - 📢 ประกาศจากครูหมิง (admin ส่งได้ — เชื่อม Batch 5)
- **Mark all read** + แยก unread/read ด้วย bg

### B2. `/notifications` — หน้ารวมแจ้งเตือน ⚠️

- รายการเต็ม group ตามวัน (วันนี้ / เมื่อวาน / สัปดาห์นี้ / เก่ากว่า)
- Filter ตามประเภท (ทั้งหมด / การเรียน / รางวัล / ระบบ)
- Swipe/hover เพื่อ mark read หรือลบ
- **Empty:** "ยังไม่มีการแจ้งเตือน — เริ่มเรียนแล้วจะมีอัปเดตที่นี่"
- **Mobile:** เต็มจอ + pull to refresh feel

### B3. (เชื่อม Admin) `<AnnouncementComposer>` ⚠️
- ฝั่ง admin (Batch 5) เพิ่มที่ส่งประกาศถึงนักเรียนทุกคน/เฉพาะคอร์ส — โผล่เป็น notification 📢
- form สั้น: หัวข้อ + ข้อความ + กลุ่มผู้รับ + ลิงก์แนบ (optional)

---

## CLUSTER C — Settings (ตั้งค่าให้ครบ)

### C1. `/settings` — ยกเครื่องจาก /profile เดิม ✅⚠️

ขยาย profile เดิม (2 แท็บ) เป็น settings เต็ม ใช้ `<SettingsTabs>` (vertical desktop / horizontal mobile) จาก Batch 4:

- **บัญชี (Account):** ข้อมูลเดิม + เพิ่ม bio (textarea + counter), DEK code (pill chips), เป้าหมายสอบ/มหา'ลัย (จาก onboarding — แก้ได้) + auto-save indicator
- **ความปลอดภัย (Security):** เปลี่ยนรหัส (มีแล้ว + strength meter reuse) + อุปกรณ์ที่ล็อกอิน (sessions, optional) + **Danger Zone** (ลบบัญชี — reuse `<DangerZone>` พิมพ์ยืนยัน)
- **การแจ้งเตือน (Notifications):** toggle ต่อประเภท (อีเมล / ในเว็บ) — เรียน, รางวัล, streak, ประกาศ ⚠️
- **การแสดงผล (Appearance):** ธีม สว่าง/มืด/ตามระบบ (`<ThemeSelector>` 3 ตัวเลือกพร้อม preview) — client-side ✅
- **ความเป็นส่วนตัว (Privacy):** ซ่อนตัวเองจาก leaderboard (เชื่อม Batch 6), ซ่อนโปรไฟล์สาธารณะ ⚠️

### C2. `<ThemeSelector>` — ตัวเลือกธีม ✅
- 3 การ์ด preview: สว่าง / มืด / ตามระบบ — เลือกแล้วเปลี่ยนทันที (ทั้งเว็บมี dark/light อยู่แล้ว แค่ทำ UI เลือกถาวร)

---

## 🧩 Custom Components ใหม่

| Component | Where | Detail |
|---|---|---|
| `<OnboardingWizard>` | หลัง signup | reuse MultiStepForm + skippable |
| `<GoalPicker>` | Onboarding | เลือกวิชาสอบ (multi) + มหา'ลัยเป้า |
| `<SetupChecklist>` | Dashboard ใหม่ | 4 ข้อ + progress + ฉลองตอนครบ |
| `<NotificationBell>` | Topbar | badge unread + dropdown |
| `<NotificationPanel>` | Topbar dropdown | 5-8 รายการล่าสุด |
| `<NotificationItem>` | Panel + page | icon ตามประเภท + unread dot |
| `<NotificationCenter>` | /notifications | group ตามวัน + filter |
| `<NotificationPrefs>` | Settings | toggle ต่อประเภท (email/in-app) |
| `<AnnouncementComposer>` | Admin | ส่งประกาศ → notification |
| `<ThemeSelector>` | Settings | 3 การ์ด preview |
| `<SettingsNav>` | /settings | reuse SettingsTabs ขยาย |

**REUSE ของเดิม (สำคัญ):**
- `<MultiStepForm>`, `<ConfettiBurst>` (Batch 4/3) — onboarding wizard + จบ flow
- `<SettingsTabs>`, `<DangerZone>`, `<PasswordStrengthMeter>`, `<AvatarUploader>` (Batch 4) — settings
- `<AppShell>` topbar (Batch 5) — ที่วางกระดิ่ง
- celebration components (Batch 3/6) — เช็คลิสต์ครบ + เหรียญเริ่มต้น
- `timeAgo`, `<Card>`, `<Badge>`, `<Tabs>`, toast — base

---

## 🎨 Specific Polish
- **Onboarding ไม่บังคับ:** ข้ามได้ทุก step — เคารพคนรีบ
- **Notification ไม่สแปม:** streak reminder วันละครั้งพอ, group ให้ดี, mark read ลื่น
- **Settings auto-save:** indicator แบบ Google Docs (reuse) — ไม่ต้องกด save ทุกครั้ง
- **Mobile-first** สำหรับ onboarding + notification center
- **Copy เชิงบวก:** "พร้อมแล้ว!" "เริ่มต้นได้ดีมาก" — ไม่ดุ ไม่กดดัน
- **Mock data ไทยจริง:** ชื่อนักเรียน, ข้อความแจ้งเตือนสมจริง, มหา'ลัยไทย (จุฬา/มธ/มหิดล)

---

## 📦 Deliverable

ส่ง HTML+Tailwind ใน Artifact ทีละกลุ่ม:

1. ⭐ **OnboardingWizard + SetupChecklist** (Cluster A) — first impression
2. **NotificationBell + Panel + /notifications** (Cluster B)
3. **/settings ยกเครื่อง + ThemeSelector** (Cluster C)
4. (เสริม) **AnnouncementComposer** ฝั่ง admin

หยุดหลังแต่ละ artifact ให้หมิง feedback

ทุก artifact: Dark + Light · Desktop + Mobile · ทุก state (ว่าง/unread/read/loading/สำเร็จ) · Real Thai mock data

---

## ❓ ถามก่อนเริ่ม

1. **Onboarding** อยากได้แบบเต็ม 5 step (ตั้งเป้า + แนะนำคอร์ส) หรือสั้น 2-3 step พอ?
2. **Notification delivery** เอาแค่ในเว็บ (in-app) ก่อน หรืออยากได้อีเมลด้วย (ต้องต่อระบบส่งเมล)?
3. **Settings** แยกหน้าใหม่ `/settings` หรือขยายในหน้า `/profile` เดิม?
4. **ทั้ง 3 cluster ต้องแตะ backend** (notification table, onboarded flag, prefs) — รอบนี้ดีไซน์ mock ก่อน แล้วค่อยต่อ backend หรือให้ผมต่อ backend หลังเคาะดีไซน์?

---

> **หมายเหตุ backend:** profile/password/avatar + User fields (bio ยังไม่มี, ที่เหลือมี) + Friend model มีแล้ว ✅ — ส่วน **notification (ตารางใหม่), onboarded flag, notification prefs, privacy fields ต้องเพิ่ม backend** ⚠️ theme เป็น client-side ทำได้เลย ✅ งาน backend ไม่ใหญ่ ค่อยทำหลังเคาะดีไซน์
