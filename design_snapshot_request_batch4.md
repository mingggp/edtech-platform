# 📦 Design System Snapshot — Delta Update (Batch 4 → Batch 5)

> **ส่งใน Claude Design แชท Batch 4 (ก่อนปิด)**
> เป็น **delta update** เท่านั้น — ไม่ต้องทำ full snapshot ใหม่ เพราะมี snapshot Batch 2 + delta Batch 3 อยู่แล้ว
> เน้นเฉพาะ **สิ่งที่เพิ่ม / เปลี่ยน / refined ใน Batch 4 (Auth + Commerce)**

---

ก่อนปิด session นี้ ขอ **delta snapshot** สำหรับ Batch 4 — จะเอาไปต่อกับ snapshot Batch 2 + delta Batch 3 ในแชทใหม่ Batch 5 (Admin Studio) ขอครอบคลุม:

## 1. New Components (Code)
ขอ HTML + Tailwind code ของ components ที่สร้างใน Batch 4 ทั้งหมด:
- `<AuthSplitLayout>` — brand-art panel + form panel (responsive collapse)
- `<FloatingLabelInput>` — label slide on focus/filled + error state
- `<PasswordStrengthMeter>` — 4-segment bar + label logic
- `<OAuthButton>` — google "G" + border style
- `<MultiStepForm>` — step dots indicator + transition between steps
- `<PromptPayQR>` — QR + countdown + save/copy actions (สำคัญ: pattern ของ countdown)
- `<SlipDropzone>` — drag-drop + preview + file validation states
- `<CheckoutStepIndicator>` — 3-step pipeline (current pulse / done check / pending)
- `<CouponInput>` — input + apply + live validation (✓/✗ states)
- `<PaymentStatusBadge>` — 3 states (รออนุมัติ amber pulse / อนุมัติ emerald / ปฏิเสธ rose)
- `<AvatarUploader>` — crop modal + remove option
- `<DangerZone>` — destructive section pattern (type-to-confirm)
- `<SettingsTabs>` — vertical (desktop) + horizontal scroll (mobile)
- `<ResendCountdown>` — 60s timer + resend button

## 2. Animation / Interaction Patterns (NEW)
- **QR countdown** — warning state เมื่อเหลือน้อย (ต่อยอดจาก ExamTimer ยังไง)
- **Slip dropzone** — drag-over glow + scale, upload progress
- **Multi-step transition** — slide/fade timing ระหว่าง step
- **Inline form error** — shake + helper copy pattern
- **Signup success** — confetti light burst reuse spec
- **Coupon validate** — real-time ✓/✗ feedback timing

## 3. Design Decisions (NEW)
- **Auth layout** — split ratio (brand 60 / form 40), mobile collapse rule (hero strip 30%)
- **Form card** — glass vs solid (สรุปเลือกอันไหน + ค่า opacity/blur)
- **Checkout flow** — QR + slip หน้าเดียว (scroll) vs 2-step (สรุปที่เลือก)
- **PromptPay QR mock** — realistic vs stylized (สรุป + logo center spec)
- **Trust signals** — icon + sentence pattern (ไม่ใช้ stock badge)
- **Tier/status color mapping** ใน /payments ให้สอดคล้อง score reveal tiers

## 4. Tokens ที่ refine / เพิ่ม
- OKLCH values ใหม่ไหม (เช่น สี status badge, glass card bg, dropzone glow)
- Shadow / glow patterns ใหม่ (glass elevation, QR border indicators)
- Animation timing constants ใหม่ (countdown tick, step transition, dropzone)
- Floating label transition timing/easing

## 5. Lessons Learned
- pattern ไหนจาก Batch 1-3 ที่ต้องปรับใน Batch 4 ไหม
- anti-pattern ที่เจอใน Batch 4 (สิ่งที่ไม่ควรทำใน admin batch หน้า)
- component ไหน reusable ไปฝั่ง admin ได้เลย (เช่น SlipDropzone → cover upload, DangerZone → ลบคอร์ส, SettingsTabs → admin settings)

---

**Format:** Markdown 1 block — สั้นได้ เน้นใช้งานต่อได้

**ใช้ทำอะไร:** เอาไปแปะใน Claude Design แชทใหม่ Batch 5 (Admin / Tutor Studio) — รวมกับ snapshot Batch 2 + delta Batch 3 เดิม

ขอบคุณครับ 🙏
