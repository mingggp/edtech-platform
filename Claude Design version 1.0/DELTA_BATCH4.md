# 📦 Mingsmileyface — Delta Snapshot (Batch 4 · Auth + Commerce)

> Append to Batch 2 snapshot + Batch 3 delta. Covers ONLY what was added/changed while building
> Batch 4: `Login Signup.html` · `Forgot Reset Password.html` · `Checkout.html` · `Payments.html` · `Profile.html`.
> All tokens still OKLCH. Vanilla token-CSS (NOT Tailwind). No new base colors — reuses brand violet/magenta/coral/cyan/lime.
> Shared CSS extracted into: **`auth.css` · `checkout.css` · `app-shell.css` · `payments.css` · `profile.css`** (+ existing `brand.css`).

---

## ⚠️ Corrections to the Batch 4 brief (mid-build decisions — these SUPERSEDE the brief)
- **Checkout is now FULLY AUTOMATIC** via a PromptPay gateway webhook (Opn/2C2P/GB Prime Pay).
  **`<SlipDropzone>` was NOT built / removed.** No file upload, no manual "ส่งสลิป", no admin review.
- **`<PaymentStatusBadge>` reduced to 2 states**, not 3: **สำเร็จ (emerald)** / **หมดอายุ·ยกเลิก (rose)**.
  The amber "รออนุมัติ / pending-admin" state is **deleted** (contradicts auto-verify). A transient
  unpaid QR is just "waiting for webhook" inside Checkout, never a row in `/payments` history.
- **Checkout is a state machine** `qr → success | expired` (was specced "QR + slip, one page"). The
  QR screen polls; the 3-step pipeline reads **สแกนจ่าย → ยืนยันอัตโนมัติ → เริ่มเรียน**.
- A `Checkout v1 (manual slip).html` is kept for reference only — do not build on it.
- **Project rule file `CLAUDE.md`** now pins: (a) auto-gateway payment model, (b) subjects taught =
  **TGAT2 · TPAT3 · A-Level คณิต · A-Level ฟิสิกส์** (+ in-term คณิต / ฟิสิกส์). Never invent เคมี/ชีวะ/อังกฤษ.

---

## 1. New Components (working code)

### 1.1 AuthSplitLayout — brand panel + form panel
```css
.auth { display: grid; grid-template-columns: 1.32fr 1fr; height: 100vh; }  /* ≈57/43 */
/* brand panel: gradient mesh + dot-grid mask + floating geometry + math glyphs */
.brand-panel .mesh { background:
  radial-gradient(60% 55% at 18% 12%, oklch(0.66 0.23 295 / 0.55), transparent 62%),
  radial-gradient(55% 50% at 88% 28%, oklch(0.68 0.25 5 / 0.5), transparent 60%),
  radial-gradient(60% 60% at 70% 92%, oklch(0.80 0.16 205 / 0.42), transparent 62%),
  radial-gradient(50% 50% at 25% 88%, oklch(0.74 0.21 35 / 0.38), transparent 60%);
  animation: meshDrift 24s ease-in-out infinite; }
.grid-overlay { background-image: radial-gradient(oklch(0.99 0.005 285 / 0.10) 1px, transparent 1px);
  background-size: 26px 26px; mask-image: radial-gradient(80% 70% at 40% 40%, #000 30%, transparent 88%); }
/* floating math glyphs: ∫ Σ π √ Δ ∞ θ f(x) at oklch(0.99 0.005 285 / 0.3), floaty 9–16s */
```
- **Mobile collapse:** at ≤860px → 1 column; brand becomes top hero strip `min-height:38vh`; `.bp-sub`,
  ring/square/half the glyphs hidden. Form panel never hides the brand (rule from brief).
- **Form panel is translucent** (lets aurora show through) so the glass card actually reads as glass.

### 1.2 FloatingLabelInput
```css
.field .fl-input { height: 56px; padding: 22px 16px 8px; border: 1.5px solid var(--line); border-radius: 13px; }
.field .fl-label { position: absolute; left: 16px; top: 17px; color: var(--fg-3);
  transition: all .18s var(--ease-spring); white-space: nowrap; }      /* nowrap = no Thai mid-wrap */
.field .fl-input:focus + .fl-label,
.field .fl-input.filled + .fl-label { top: 9px; font-size: 10.5px; color: var(--brand-magenta); font-weight: 600; }
.field.invalid .fl-input { border-color: var(--danger); }              /* + .field-msg shows */
```
- JS toggles `.filled` on input/blur. Eye toggle + Caps-Lock warning (`getModifierState('CapsLock')`).

### 1.3 PasswordStrengthMeter — 4-segment
```css
.strength .bars { display: grid; grid-template-columns: repeat(4,1fr); gap: 5px; }
.strength .bars i { height: 4px; border-radius: 99px; background: var(--bg-3); transition: background .25s; }
.strength.s1 i:nth-child(-n+1){background:var(--danger);}  .strength.s2 i:nth-child(-n+2){background:var(--warning);}
.strength.s3 i:nth-child(-n+3){background:var(--brand-cyan);}  .strength.s4 i{background:var(--success);}
```
Score = (len≥8) + (digit) + (upper) + (symbol). Labels: อ่อนไป / พอใช้ / ดี / แข็งแรง.

### 1.4 OAuthButton — `.btn-ghost` + multicolor Google "G" SVG, height 50, gap 11.

### 1.5 MultiStepForm (signup 2-step wizard)
```css
.steps-ind .seg i { width: 0; background: var(--grad-accent); transition: width .4s var(--ease-spring); }
.steps-ind .seg.done i, .steps-ind .seg.active i { width: 100%; }
.wizard-step { display: none; } .wizard-step.active { display: block; animation: stepIn .35s var(--ease-spring); }
@keyframes stepIn { from { opacity:0; transform: translateX(14px); } to { opacity:1; transform: translateX(0); } }
```
Step 1 validates email+pass+confirm+terms before advancing. Step 2 = name + segmented grade + DEK pills.
Submit → confetti burst (reuse §6.12, 26 particles) → success overlay → redirect.

### 1.6 PromptPayQR — canvas mock + auto-poll (THE money moment)
```js
// 25×25 modules, seeded RNG, 3 finder patterns, center logo-hole left blank
function drawQR(){ /* white bg, oklch(0.10) modules; finder(0,0),(N-7,0),(0,N-7); skip inLogo cells */ }
```
```css
.qr-frame { padding:16px; background:#fff; border-radius:18px; box-shadow:0 12px 40px -12px oklch(0 0 0/0.4); }
.qr-logo { /* Ming logo centered */ box-shadow: 0 0 0 5px #fff, 0 6px 16px -4px oklch(0.66 0.23 295/0.6); }
.qr-corner { width:20px; height:20px; border:3px solid var(--brand-magenta); }   /* scanner L-corners */
.poll-pill { background: oklch(0.80 0.16 205/0.1); border:1px solid oklch(0.80 0.16 205/0.3); }  /* cyan */
.poll-pill .spin { border-top-color: var(--brand-cyan); animation: spin .8s linear infinite; }
```
- **Save/Copy actions were dropped** in the auto flow (only in v1 manual). Keep QR minimal: QR + amount + polling.

### 1.7 CheckoutStepIndicator — 3-step pipeline
```css
.pl-step.active .num { background: var(--grad-accent); color:#fff; }
.pl-step.active .num::after { content:""; inset:-5px; border:2px solid var(--brand-magenta);
  animation: plPulse 2s ease-out infinite; }                          /* current = pulse ring */
.pl-step.done .num { background: oklch(0.78 0.18 150/0.16); color: var(--success); }  /* done = check */
.pl-line.done { background: oklch(0.78 0.18 150/0.5); }
@keyframes plPulse { 0%{opacity:.7;transform:scale(1);} 100%{opacity:0;transform:scale(1.5);} }
```

### 1.8 CouponInput — live validate
```js
const COUPONS = { 'MING20': 0.20, 'WELCOME10': 0.10 };   // ✓ "ลด N%"  ✗ "โค้ดไม่ถูกต้องหรือหมดอายุ"
// on apply: recompute discount + net; sync total across summary / QR amount / paid-pill
```
`.coupon-msg.ok{color:var(--success)}` / `.coupon-msg.bad{color:var(--danger)}` with inline check/x SVG.

### 1.9 PaymentStatusBadge — **2 states only**
```css
.pstatus.paid    { background: oklch(0.78 0.18 150/0.14); color: var(--success); }     /* สำเร็จ */
.pstatus.failed  { background: oklch(0.66 0.22 25/0.14);  color: var(--danger);  }     /* หมดอายุ·ยกเลิก */
/* .pstatus.pending REMOVED — auto-verify has no admin-pending state */
```
Paired with expandable receipt row (`.pr-body-inner` max-height transition — see Lessons) + receipt modal
(gradient header, PromptPay · Opn Payments · REF · timestamps, "ดาวน์โหลด PDF").

### 1.10 AvatarUploader — crop modal
File input → FileReader → `.crop-area` (220px circle, `overflow:hidden`) + zoom `<input range>` driving
`img.transform: scale(zoom/100)` → "ใช้รูปนี้" writes `<img>` into `.avatar-big`. Has remove → letters fallback.

### 1.11 DangerZone — type-to-confirm
```css
.danger-zone { border:1px solid oklch(0.66 0.22 25/0.35); background: oklch(0.66 0.22 25/0.04); }
.btn-danger { background: var(--danger); color:#fff; }
```
Confirm modal disabled until typed text === "ลบบัญชี". (Reusable for ลบคอร์ส/ลบผู้ใช้ in admin.)

### 1.12 SettingsTabs — vertical (desktop) / horizontal scroll (mobile)
```css
.prof-grid { grid-template-columns: 220px 1fr; }       /* sticky vertical tabs + panel */
.prof-tab[aria-selected="true"]::before { /* magenta left bar */ background: var(--grad-signature); }
@media (max-width:820px){ .prof-tabs{display:none} .prof-tabs-mob{display:flex; overflow-x:auto} /* pill bar */ }
.prof-panel { display:none } .prof-panel.active { display:block; animation: profIn .3s var(--ease-spring); }
```

### 1.13 ResendCountdown — 60s → resend
`setInterval` ticks `0:60`→`0:00`, then swaps to `<button>ส่งลิงก์อีกครั้ง</button>` (restarts on click).

### 1.14 AutoSavePill (reused from Batch 3 exam pattern) — Google-Docs persistent status
States: `.synced` (emerald "ซิงค์ล่าสุด HH:MM") ⇄ `.saving` (cyan spinner "กำลังบันทึก...").
900ms debounce on any `[data-save]` input → "บันทึกแล้ว · HH:MM".

---

## 2. New Animation / Interaction Patterns
- **QR countdown** = ExamTimer pattern, thresholds tuned for 15-min TTL: **warning ≤5:00** (amber),
  **critical ≤2:00** (red + `tshake` ±1px). Auto-fires `setState('expired')` at 0.
- **Webhook simulation** — two triggers in demo: auto-resolve `setTimeout 8s` (Tweak-toggleable) +
  a "จำลองชำระสำเร็จ" button. Production: replace both with the gateway's `charge.complete` event.
- **Multi-step transition** — `stepIn .35s spring` (translateX 14px + fade); progress segs fill .4s.
- **Inline form error** — `shakeX .4s` on the error banner + per-field `.invalid` border + `.field-msg`.
- **Avatar crop** — live `transform: scale()` from a range slider inside a circular mask.
- **Coupon validate** — instant on apply (no debounce); rewrites totals everywhere at once.

---

## 3. Design Decisions
- **Auth split = ~57/43** (brand/form), brand on left. Mobile → brand top strip 38vh (never hidden).
- **Form card = GLASS by default** (Tweak: glass|solid). Glass = `oklch(0.30 0.022 285/0.5)` dark /
  `oklch(1 0 0/0.55)` light, `backdrop-filter: blur(50px) saturate(180%)`, +inset hairline. **The form
  panel behind it must be translucent** or glass looks identical to solid (key fix this batch).
- **Checkout = single standalone focus page**, state machine `qr→success|expired`, no slip, no sidebar.
- **PromptPay QR = realistic** (seeded canvas modules + finder patterns) + Ming logo center + magenta corners.
- **Trust signals = icon + short Thai sentence** (ยืนยันอัตโนมัติ / จ่ายครั้งเดียวเรียนตลอดชีพ / ทักแอดมิน Line). No English stock badges.
- **Payments status colors** map to score-reveal tiers: success=emerald `0.78 0.18 150`, danger=rose `0.66 0.22 25`.
- **App shell unified** — ALL 8 sidebar pages share one 11-item menu in 3 sections (หลัก / ค้นพบ / บัญชี),
  one `.active` per page. บัญชี = การชำระเงิน + โปรไฟล์ & ตั้งค่า. Extracted to `app-shell.css`.

---

## 4. Tokens refined / added (no new base colors)
```css
/* glass form card */
--card-glass-dark:  oklch(0.30 0.022 285 / 0.5);
--card-glass-light: oklch(1 0 0 / 0.55);
--card-glass-blur:  blur(50px) saturate(180%);

/* accent swap (Tweak) — re-points --grad-accent / signature */
[data-accent="cool"] → var(--grad-cool);   [data-accent="warm"] → var(--grad-warm);

/* status / gateway */
--poll-cyan:  oklch(0.80 0.16 205);                 /* polling pill, sessions, info */
--status-paid:   oklch(0.78 0.18 150);              /* สำเร็จ */
--status-failed: oklch(0.66 0.22 25);               /* หมดอายุ·ยกเลิก */
--danger-zone-line: oklch(0.66 0.22 25 / 0.35);
--qr-corner: 3px solid var(--brand-magenta);

/* easing (added locally) */
--ease-spring: cubic-bezier(.2,.8,.2,1);
--ease-bounce: cubic-bezier(.34,1.56,.64,1);
```
```
Animation timing constants (new):
--floating-label:  .18s  var(--ease-spring)
--step-transition: .35s  var(--ease-spring)   (stepIn: translateX 14px + fade)
--form-error:      .40s  shakeX
--qr-warning:      ≤5:00 amber | --qr-critical: ≤2:00 red+shake (15-min TTL)
--autosave-debounce: 900ms
--accordion:       .32s  max-height var(--ease-spring)   (NOT grid 0fr→1fr — see Lessons)
--webhook-sim:     8000ms (demo auto-resolve)
```

---

## 5. Lessons Learned
- **Glass needs something behind it.** Over an opaque panel, frosted glass == solid. Make the container
  translucent (let the aurora through) before the glass/solid distinction means anything.
- **Accordion: `grid-template-rows: 0fr→1fr` rendered as 0px** in this engine (even when forced). Use a
  `max-height` transition on the inner wrapper instead — reliable.
- **Thai wraps mid-syllable in flex columns / pills.** Add `white-space: nowrap` to floating labels, page
  `<h1>`, sidebar item labels, status pills, back-links — or you get "ตั้ง/ค่า", "หน้า/หลัก", etc.
- **The html-to-image screenshotter captures blank during CSS entrance animations** (stepIn / payIn / pop).
  Not a real bug — inject `*{animation:none}` before capturing, or read the live DOM to confirm.
- **Sidebar drift is real.** Old batches had divergent menus (some missing บัญชี). Unify into ONE shared
  block (`app-shell.css`) + a generator that stamps the right `.active` per page.

### Anti-patterns (avoid in Batch 5 / Admin)
- ❌ Manual slip upload + admin "approve/reject" queue — the whole product is auto-webhook now. An admin
  "payments" view should be **read-only reconciliation** (gateway already decided paid/expired), not approval.
- ❌ A "pending/รออนุมัติ" status anywhere user-facing — only สำเร็จ / หมดอายุ exist.
- ❌ Inventing subjects — stay within TGAT2 / TPAT3 / A-Level คณิต / A-Level ฟิสิกส์ (+ in-term คณิต/ฟิสิกส์).

### Reusable straight into Admin (Batch 5)
- **`app-shell.css` sidebar** → admin shell (swap menu items, same structure/collapse).
- **AvatarUploader / crop modal** → course cover / thumbnail upload (drag-drop can be added from its FileReader core).
- **DangerZone type-to-confirm** → ลบคอร์ส / ลบผู้ใช้ / ลบข้อสอบ.
- **SettingsTabs** → admin settings (vertical desktop / scroll mobile).
- **Expandable row + receipt modal** → admin order / transaction / student detail views.
- **AutoSavePill** → admin form autosave. **CouponInput** → admin coupon manager (it owns the coupon map).
- **FloatingLabelInput · PasswordStrengthMeter · segmented · DEK pills** (`auth.css`) → all admin forms.
