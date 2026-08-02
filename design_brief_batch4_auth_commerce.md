# 🎨 Mingsmileyface — Batch 4: Auth + Commerce

> **ส่งใน Claude Design แชทใหม่** หลังแปะ:
> 1. Snapshot Batch 2 (เดิม)
> 2. Delta Snapshot Batch 3 (ใหม่)
>
> เนื้อหา: User journey ครบ — สมัคร → ซื้อ → จ่าย → ตั้งค่าโปรไฟล์

---

## 🆕 บริบทแชทใหม่

นี่คือแชทใหม่สำหรับ **Batch 4** ของโปรเจกต์ **Mingsmileyface** (เว็บคอร์สเรียนออนไลน์สำหรับ ม.ปลายไทย)

**3 batches ก่อนหน้า:**
- **Batch 1:** Brand + Landing + Dashboard
- **Batch 2:** Courses Discovery + Course Detail + Learn + Public Profile
- **Batch 3:** Exam List + Take + Result Reveal + History

Design tokens + components ทั้งหมดอยู่ใน **2 snapshots ข้างบน** ↑ — **reuse ของเดิมเสมอ ห้ามทำใหม่**

---

## 🎯 Recap Brand (สั้น)
- **Vibe:** Premium Pop — Apple Music / Linear / Stripe Checkout / Spotify
- **Device:** Desktop 1440 + iPad 1024 → Mobile 375 (รอง)
- **Mode:** Dark first + light toggle
- **Audience:** นักเรียน ม.4–ม.6 ไทย

---

## 📚 Batch 4: 7 หน้า แบ่ง 3 cluster

---

## CLUSTER A — AUTH (4 หน้า)

**Goal ของ Cluster:** First impression แบบ premium product — ให้รู้สึก "เว็บนี้จริงจัง" ตั้งแต่ก่อน login

### A1. `/login`

**Layout (Desktop 2-column split):**

```
┌──────────────────────┬─────────────────────────┐
│                      │                         │
│  Brand-art panel     │   Form card             │
│  (60% width)         │   (40% width, centered) │
│                      │                         │
│  • Logo บนซ้าย       │   Welcome back          │
│  • Gradient mesh bg  │   เข้าสู่ระบบเพื่อ...     │
│  • Floating SVG      │                         │
│    illustration      │   [Email floating label]│
│    (เด็กนั่งเรียน +    │   [Password + 👁]      │
│     graph + book)    │   [ ] จดจำฉันไว้         │
│  • Tagline           │                         │
│    "พิชิตม.ปลาย       │   [ เข้าสู่ระบบ →   ]  │
│     ด้วยติวเตอร์เดียว"  │                         │
│  • Mini testimonial  │   ─── หรือ ───           │
│    pill (ผู้ใช้จริง)    │                         │
│                      │   [ G  Continue Google] │
│                      │                         │
│                      │   ลืมรหัสผ่าน? · สมัคร   │
└──────────────────────┴─────────────────────────┘
```

**Details:**
- **Brand-art panel:** dark + gradient mesh + subtle dot grid + floating SVG illustration (เด็ก ม.ปลายไทยกำลังเรียนกับ floating element: graph cap, book, math symbols)
- **Form card:** glass card (semi-transparent on bg) หรือ solid card ตามที่เลือกใน batch ก่อน
- **Floating label inputs:** label เลื่อนขึ้นเมื่อ focus หรือมีค่า (Material/Stripe style)
- **Password field:** มี eye toggle + caps lock warning
- **OAuth button:** สีกลาง border + Google "G" logo (multi-color)
- **Loading state ของปุ่ม login:** spinner + disabled + "กำลังเข้าสู่ระบบ..."
- **Error state:** inline ใต้ input + shake animation + helpful copy

**iPad/Mobile:** brand-art panel ย่อเป็น hero strip ด้านบน 30% + form ด้านล่าง (ห้ามซ่อนทั้งหมด — ต้องเห็น brand)

---

### A2. `/signup`

**Layout:** same split layout, brand-art ฝั่งซ้าย, form ฝั่งขวา

**Form (multi-step, 2-step wizard ดีกว่า single long form):**

**Step 1 — Account:**
- Email
- Password + Confirm password + strength meter
- ☑ ยอมรับ Terms + Privacy (link)
- ปุ่ม "ถัดไป →"

**Step 2 — Profile:**
- ชื่อจริง (full_name)
- ชื่อเล่น (nickname)
- ระดับชั้น (segmented control: ม.4 / ม.5 / ม.6 / Other)
- เด็ก'พ.ศ. (DEK code: DEK67 / DEK68 / DEK69 — pill chips)
- ปุ่ม "สร้างบัญชี" (primary)

**Progress indicator:** dot indicator ที่บอก step 1/2

**Success state:**
- ✓ animation tick
- "ยินดีต้อนรับสู่ Mingsmileyface!"
- auto-redirect 2s → dashboard
- มี confetti light burst (reuse component)

---

### A3. `/forgot-password`

**Layout:** เหมือน login แต่ form สั้นกว่า

**Form:**
- Title: "ลืมรหัสผ่าน?"
- Subtitle: "กรอกอีเมลที่ใช้สมัคร เราจะส่งลิงก์รีเซ็ตให้"
- Email input
- ปุ่ม "ส่งลิงก์รีเซ็ต"
- Back to login link

**After submit (always show this regardless of email exists or not — security):**
- ✓ "ส่งลิงก์แล้ว — เช็คอีเมล"
- "ถ้าไม่เจอ ลองดูใน Spam / Junk"
- Resend after 60s countdown

---

### A4. `/reset-password`

**Layout:** เหมือน forgot-password

**Form:**
- Title: "ตั้งรหัสผ่านใหม่"
- Password + Confirm + strength meter
- Rules ที่ต้องทำ (checklist live update):
  - ☐ อย่างน้อย 8 ตัวอักษร
  - ☐ มีตัวเลข
  - ☐ มีตัวพิมพ์ใหญ่
- ปุ่ม "บันทึก"

**Error state:** link หมดอายุ → "ลิงก์นี้หมดอายุแล้ว — ขอลิงก์ใหม่"

---

## CLUSTER B — COMMERCE (2 หน้า + Profile)

### B1. `/checkout/[courseId]` — **The Money Moment**

**Goal:** ลด anxiety ของการจ่ายเงินออนไลน์ + duration เร็วที่สุด

**Layout (Desktop 2-column):**

```
┌──────────────────────────────┬────────────────┐
│                              │                │
│  ลำดับขั้นตอน                  │   Order        │
│  ●━━○━━○                     │   summary      │
│  ชำระ  ตรวจ  เรียน             │                │
│                              │   [Course      │
│  ┌─ STEP 1: PromptPay QR ─┐ │    thumbnail]  │
│  │                        │ │   Course title │
│  │   [QR Code 240×240]   │ │   ฿2,500       │
│  │                        │ │   ────         │
│  │   ฿2,500.00            │ │                │
│  │   ⏱️ หมดอายุใน 14:35    │ │   [Coupon     │
│  │                        │ │    code input] │
│  │   [⬇ Save QR]         │ │   [Apply]      │
│  │   [📋 Copy หมายเลข]    │ │                │
│  │                        │ │   ─────        │
│  └────────────────────────┘ │   Subtotal     │
│                              │   ส่วนลด        │
│  ┌─ STEP 2: อัปโหลดสลิป ──┐ │   ─────        │
│  │  [Drag & drop zone]    │ │   ยอดสุทธิ ฿2,500│
│  │  หรือ Browse           │ │                │
│  │                        │ │   🔒 ปลอดภัย    │
│  │  [Submit slip →]      │ │   จ่ายครั้งเดียว  │
│  └────────────────────────┘ │   เข้าเรียนตลอดชีพ│
│                              │                │
└──────────────────────────────┴────────────────┘
```

**Step indicator (3 step):**
- ชำระเงิน → รอตรวจสอบ → เริ่มเรียน
- Active state: indigo + animated pulse
- Completed: emerald + checkmark
- Pending: muted

**PromptPay QR section:**
- QR code ใหญ่ centered (240×240 px) มี subtle border + corner indicators (เหมือน QR scanner)
- ราคา ใหญ่ display font
- **Countdown timer** ของ QR (15 นาที expire) — เหมือน Exam timer pattern
- ปุ่ม "Save QR" + "Copy เลขพร้อมเพย์" (toast confirm "Copied!")
- Link "วิธีจ่ายแบบ step-by-step" → modal มี GIF/screenshot

**Slip upload section:**
- Drag & drop zone — dashed border, แบบใหญ่
- ตอน drag over: indigo glow + scale 1.02
- ตอน upload: preview image + ปุ่ม "Replace" / "Remove"
- File validation: max 5MB, image only — show error inline ถ้าผิด
- ปุ่ม "ส่งสลิป" disabled จนกว่าจะมีไฟล์
- Loading state: progress bar

**Order summary card (Sticky on Desktop):**
- Course thumbnail mini
- Title + Instructor (Ming)
- Original price + discount + Final price
- Coupon input + Apply button (real-time validation: ✓ "ลด 20%" / ✗ "ไม่ถูกต้อง")
- Trust signals: 🔒 ปลอดภัย / ✓ จ่ายครั้งเดียว เข้าเรียนตลอดชีพ / 💬 ติดต่อ admin (Line)

**Success state (after submit slip):**
- Full-screen modal: ✓ animation + "ส่งสลิปสำเร็จ — รอ admin ตรวจสอบ 1-24 ชม."
- "ดูสถานะการจ่ายเงิน →" CTA
- Auto-close 5s

**Mobile:** order summary ย้ายไปสุดท้าย (full-width) + sticky bottom bar โชว์ยอด + ปุ่ม

---

### B2. `/payments` — Payment History

**Layout:**

**Header slim:** "ประวัติการชำระเงิน" + filter chip group (ทั้งหมด / รออนุมัติ / อนุมัติ / ปฏิเสธ)

**Stats summary card** (optional, full-width):
- จำนวนคอร์สที่ซื้อทั้งหมด · ยอดรวม · คอร์สที่กำลังรออนุมัติ

**Payment list (cards stacked):**
- Row layout:
  - Left: course thumbnail (64×64 rounded)
  - Center:
    - Course title
    - "ซื้อเมื่อ 12 พ.ค. 2026" + transaction ID เล็กๆ
    - **Status badge:**
      - 🟡 "รออนุมัติ" (amber pulse)
      - 🟢 "อนุมัติแล้ว" (emerald)
      - 🔴 "ถูกปฏิเสธ" (rose)
  - Right: ราคา + ปุ่ม dropdown menu:
    - "ดูสลิป" → modal
    - "ติดต่อ admin" → Line link
    - "เรียนเลย" (เฉพาะตอนอนุมัติ)
- Click row → expand inline showing slip preview + admin note

**Empty state:** "ยังไม่เคยซื้อคอร์ส — ไปเลือกคอร์สกัน" + CTA

---

### B3. `/profile` — Settings

**Layout:**

**Sidebar tabs (Left) — Desktop:**
- Profile info
- Security
- (future: Notifications / Billing / Connected accounts)

**Right content area:**

**TAB 1 — Profile Info:**
- **Avatar section:**
  - Current avatar 120px ring
  - "เปลี่ยนรูป" button → upload + crop modal (square aspect)
  - "ลบรูป" link
- **Form (single column max-w-md):**
  - ชื่อจริง / ชื่อเล่น / ระดับชั้น (segmented) / DEK code (pills) / Bio (textarea max 80 chars + counter)
  - **Save button:** sticky bottom on mobile, inline desktop
  - Auto-save indicator (reuse from exam pattern: persistent status "บันทึกล่าสุด 14:32")

**TAB 2 — Security:**
- **Change Password:**
  - Current password (with toggle)
  - New password + Confirm + strength meter (reuse signup pattern)
  - Save button
- **Active sessions** (optional / future): list devices
- **Danger zone** (separated section, bottom):
  - Border-destructive + warning icon
  - "ลบบัญชี" button (destructive variant) → confirm modal with type "ลบบัญชี" to confirm

**Mobile:** tabs เป็น horizontal scroll pill bar ด้านบน + content ด้านล่าง

---

## 🧩 Custom Components ใหม่

| Component | Where | Detail |
|---|---|---|
| `<AuthSplitLayout>` | All auth pages | brand panel + form panel |
| `<FloatingLabelInput>` | Auth forms | label slides on focus |
| `<PasswordStrengthMeter>` | Signup + reset | 4-segment bar + label |
| `<OAuthButton>` | Login | google logo + border |
| `<MultiStepForm>` | Signup | step indicator dots + transitions |
| `<PromptPayQR>` | Checkout | QR + countdown + save/copy actions |
| `<SlipDropzone>` | Checkout | drag-drop + preview + validation |
| `<CheckoutStepIndicator>` | Checkout | 3-step pipeline (pulse current) |
| `<CouponInput>` | Checkout | input + apply + live validation |
| `<PaymentStatusBadge>` | Payments | 3 states พร้อม pulse |
| `<AvatarUploader>` | Profile | crop modal + remove option |
| `<DangerZone>` | Profile security | section pattern |
| `<SettingsTabs>` | Profile | vertical sidebar (Desktop) + horizontal (Mobile) |
| `<ResendCountdown>` | Forgot password | 60s timer + resend button |

**REUSE ของเดิม (สำคัญ — ใช้จาก snapshot):**
- `<Card>`, `<Button>`, `<Badge>`, `<Modal>` — base ทั้งหมด
- `<ConfettiBurst>` — signup success
- `<ProgressRing>` — base ของ QR countdown
- `<ExamTimer>` pattern — QR countdown ใช้ pattern เดียวกัน (warning state เมื่อเหลือน้อย)
- `<Auto-save indicator>` — Google Docs style ที่ profile

---

## 🎨 Specific Polish

- **Auth illustrations:** ห้ามใช้ stock photo — ใช้ SVG abstract หรือ minimal line art ที่สื่อ "การเรียน" + Mingsmileyface vibe
- **PromptPay QR:** QR code ต้อง mock ที่ดูสมจริง (จริงๆเป็น placeholder SVG ก็ได้) + มี logo Mingsmileyface กลาง QR
- **Slip preview:** ทำ mock image ที่เหมือนสลิปธนาคารไทย (มี ธ.กรุงเทพ/ไทยพาณิชย์/กสิกร เป็นตัวอย่าง)
- **Status colors ใน /payments:** ใช้ tier colors จาก snapshot ให้สม่ำเสมอ
- **Trust signals:** ใช้ icon + sentence สั้น ไม่ใช้ stock badge ภาษาอังกฤษเก๋

---

## 📦 Deliverable

ส่ง HTML+Tailwind ใน Artifact ทีละหน้า ตามลำดับ:

1. **`/login`** + `/signup` รวมเป็น artifact เดียว (toggle ระหว่าง 2 หน้าใน same canvas เพราะ layout เหมือนกัน) — warm-up
2. **`/forgot-password`** + `/reset-password` รวมเป็น artifact เดียว
3. ⭐ **`/checkout/[courseId]`** (สำคัญสุด — money moment)
4. **`/payments`** (history list)
5. **`/profile`** (2 tabs)

หยุดหลังแต่ละ artifact ให้ Ming feedback

ทุก artifact ต้องมี:
- Dark + Light mode toggle
- Desktop + iPad preview
- ทุก state: empty / loading / success / error / validation error
- Real Thai mock data: ชื่อจริงไทย, นามสกุล, นิคเนม, course title ที่สมจริง

---

**ถามก่อนเริ่ม:**

1. **Auth illustration** อยากให้เป็น **(a)** abstract geometric (minimal shapes + gradient) หรือ **(b)** semi-realistic character (เด็ก ม.ปลายไทยถือหนังสือ) หรือ **(c)** typographic (big quote + gradient bg, ไม่มีรูปเลย)? — ส่วนตัวแนะนำ (a) หรือ (c) เพราะดู premium กว่า + ไม่มีปัญหา representation

2. **Checkout flow** อยากให้ PromptPay QR + Slip upload อยู่ **(a)** หน้าเดียวกัน (ทั้ง 2 steps visible พร้อมกัน) หรือ **(b)** แยก 2 step ชัดเจน (กดถัดไปเปลี่ยน screen)? — แนะนำ (a) เพราะ user อาจ scroll ดู QR + slip พร้อมกันได้สะดวก
