# 📦 Mingsmileyface — DELTA · Batch 7
### Onboarding · Notifications · Settings · Sidebar redesign

> Delta update บนของเดิม (Snapshot Batch 2 + Delta 3/4/5/6).
> เทคนิคเดิม: **vanilla HTML + token-CSS (OKLCH, ไม่ใช่ Tailwind)**, ฟอนต์ Bricolage Grotesque / IBM Plex Sans Thai / JetBrains Mono.
> **ห้ามเพิ่มวิชานอก 6 วิชา · payment มีแค่ สำเร็จ/หมดอายุ (PromptPay auto-verify ไม่มีแนบสลิป)** — ตาม CLAUDE.md
> ⚠️ ของจริงที่ทำ = **in-app only** (อีเมล/push ยังไม่ทำ), **ไม่มี AnnouncementComposer ฝั่ง admin** ใน batch นี้

---

## 0. ไฟล์ใหม่ที่เพิ่ม (shared)

| ไฟล์ | หน้าที่ |
|---|---|
| `onboarding.css` | wizard + SetupChecklist + empty states + page-transition system |
| `notifications.js` | **`MingNotif`** — single source of truth + bell badge + dropdown panel (auto-inject ทุกหน้า) |
| `notifications.css` | notification row (shared) + dropdown panel + หน้าเต็ม |
| `settings.css` | toggle switch · set-row · **ThemeSelector** · accent picker · privacy cards |
| `sidebar.css` | **4 sidebar vibes** (classic/editorial/console/soft) + home-logo + av-menu |
| `sidebar.js` | upgrader: ฉีดระบบ sidebar ใหม่ลงทุกหน้าแบบ idempotent |
| `Onboarding.html` · `Dashboard Onboarding.html` · `Notifications.html` · `Settings.html` | หน้าใหม่ |
| `Profile.html` | กลายเป็น **redirect → Settings.html** |

---

## 1. New Components

### `<OnboardingWizard>` — `Onboarding.html`
3-step focus-mode (สั้น = รอด): **ทักทาย → เป้าหมาย → เวลาเรียน**. ข้ามได้ทุก step.
- reuse `.steps-ind` / `.wizard-step` / `stepIn` / `.segmented` จาก `auth.css`
- เลือกวิชาสอบ multi-select (`.goal-card` ใช้ subject gradients §1.6), มหา'ลัยเป้า (`.uni-pill` + free text)
- daily goal `.time-card` = **30 นาที / 1–2 ชม. / 2 ชม.+** (`data-v="30|90|120"`)
- เก็บลง `localStorage['ming-onboard']` → dashboard อ่านต่อ
```html
<div class="goal-grid" role="group">
  <button class="goal-card s-tgat" data-v="TGAT2" aria-pressed="false">
    <span class="gc-ico">…</span><span class="gc-name">TGAT2</span>
    <span class="gc-sub">การคิดเชิงตรรกะ</span>
    <span class="gc-check">✓</span>
  </button> …
</div>
```

### `<SetupChecklist>` — ใน `Dashboard Onboarding.html`
เช็คลิสต์ 4 ข้อ + **progress ring** (`stroke-dashoffset` set แบบ synchronous) → ครบ 4 → การ์ดหุบ + เหรียญ "เริ่มต้นดี" + confetti.
**course-pick ย้ายมาที่นี่** (ออกจาก wizard) — ตัว activate/conversion. มี recommended-course rail ที่อ่าน `goal_exams` มาคัด "★ ตรงเป้า".
```
.setup → .setup-list → .task[data-task] (.tk-box ✓ / .tk-ico / .tk-go)
.task.done { line-through + tk-box=success }
.setup.complete → .setup-celebrate (medal + dismiss)
```

### `<NotificationBell>` + `<NotificationPanel>` + `<NotificationItem>`
`notifications.js` auto-inject: ใส่ `data-notif-bell` บนปุ่ม `.icon-btn` แล้วได้ badge + panel ฟรี.
- badge = `.dot.count` (pill นับเลข, 9+)
- panel = fixed popover (display-toggle + `ntPop` keyframe transform-only — **opacity solid**)
- row ใช้ร่วมกับหน้าเต็ม: `MingNotif.rowHTML(n, {showType})`
```
N type: lesson·exam·payment·streak·achievement·social·system
.nt-ico.t-<type> → สีต่อ type | social → avatar จาก people.js
.nt-row.unread { bg tint + .nt-dot }
tag: .nt-tag.ok(สำเร็จ)/.warn(หมดอายุ)/.score
```
**API:** `MingNotif.all() / unread() / unreadCount() / markRead(id) / markAllRead() / rowHTML() / timeAgo() / bucket() / onChange(cb)`

### `<NotificationCenter>` — `Notifications.html`
filter (ทั้งหมด/ยังไม่อ่าน/รายชนิด + ตัวนับ) · group ตามวัน (วันนี้/เมื่อวาน/7 วัน/ก่อนหน้า) · อ่านทั้งหมด · empty state ให้กำลังใจ.

### `<ThemeSelector>` — Settings ▸ ลักษณะ & ธีม
3 การ์ดพรีวิว (มืด/สว่าง/**ตามระบบ** split-preview) เปลี่ยนสดทั้งเว็บ.
- pref = `'dark'|'light'|'system'`; system → `matchMedia('(prefers-color-scheme: light)')`
- เก็บ `localStorage['ming-theme']` (ค่า resolve แล้ว ให้หน้าอื่นอ่าน) + `['ming-theme-pref']`
- sync กับปุ่ม dark/light บน topbar
```
.theme-grid → .theme-opt.t-dark/.t-light/.t-system (.tp-prev mini-mockup + .tp-check)
```

### `<SettingsNav>` (5+1 tabs) — `Settings.html`
**ข้อมูลโปรไฟล์ · การแจ้งเตือน · ความเป็นส่วนตัว · การชำระเงิน · ลักษณะ & ธีม · ความปลอดภัย**
reuse `.prof-tabs` / `.prof-panel` จาก `profile.css`. Profile-info + Security ยกมาจากของเดิม.
- **NotificationPrefs**: master toggle (gate ทั้งลิสต์ด้วย `.muted`) + per-type `.switch[role=switch]` + เวลาเตือน + โน้ต "in-app only"
- **Privacy**: `.vis-grid` (สาธารณะ/เพื่อน/ส่วนตัว radio cards) + toggle (อันดับ/กิจกรรม/กำลังใจ/ค้นเจอ)
- **Billing**: สรุปแพ็กเกจ + ประวัติ (สำเร็จ tag) + ลิงก์ไป `Payments.html` + โน้ต PromptPay auto-verify

### `<Sidebar>` ใหม่ (anti-template) — `sidebar.css` + `sidebar.js`
**4 vibes** สลับด้วย `<html data-sb="…">` — เปลี่ยนทั้งโครงสร้าง+ฟอนต์:
| vibe | ฟอนต์ | ลายเซ็น |
|---|---|---|
| `editorial` | Space Grotesk + Anuphan | เมนูตัวใหญ่ เส้นคั่นบาง จุด accent |
| `console` | Chakra Petch + JetBrains Mono | `// หมวด` · `› เมนู` · active `$` invert · พื้นจุดกริด |
| `soft` ★ ใช้จริง | Kanit | sidebar การ์ดลอยมุมมน · pill · active gradient |
| `classic` | เดิม | fallback app-shell.css |

**Home logo** (`data-home`): บ้านตัวใหญ่กลาง sidebar + "หน้าหลัก" ใต้ + แสง**วนรอบขอบ**
- `orbit` = จุดแสงวิ่งวนรอบ (rotating wrapper ถือ comet dot 2 ดวง) · `aura` ★ = เรืองหายใจ · `solid`
- ฟอนต์เด่นใช้กับ **display surfaces เท่านั้น** (sidebar/h1/h2) — UI หนาแน่นคงฟอนต์อ่านง่าย
- **nav merge**: ยุบ Payments+Profile → "ตั้งค่า" เดียว · profile buttons (sb-user + top-av `.av-menu`) → Settings

---

## 2. Animation / Interaction Patterns (NEW)

- **Page transition (Onboarding → Dashboard)** — "aurora curtain" + 2 แบบใหม่ ขับด้วย **Web Animations API** (ไม่ใช่ CSS transition — engine นี้ stall):
  - `aurora` clip-path circle bloom · `f1` แถบเฉียง sweep ซ้าย→ขวา + speed streaks (มี **gradient fill backstop** ปิดช่อง skew) · `slide` panel ยกขึ้น
  - ส่ง type ข้ามหน้าผ่าน `?intro=1&t=&pace=&accent=` → dashboard reveal แบบเดียวกัน (peel)
  - **กันค้างเสมอ**: เนื้อหา visible by default + `setTimeout` killAll การันตี
- **SetupChecklist** — ring fill `.7s cubic-bezier(.16,1,.3,1)` (set offset แบบ sync) · ครบ → confetti + การ์ดหุบ (max-height/opacity transition)
- **Notification bell** — badge count pill · panel `ntPop .18s` (transform+display, opacity solid)
- **Mark read** — `MingNotif.onChange` → re-render panel + bell + page พร้อมกัน
- **Theme switch** — เปลี่ยน `data-theme` ทันที (ไม่มี transition flash)
- **Settings auto-save** — `.autosave` pill 3 state (synced/saving spin) แบบ Google Docs, debounce 900ms
- **Home glow** — `homeOrbit` (rotate 360 wrapper + comet dot) / `homeAura` (box-shadow breathe) — in-flow keyframes ปลอดภัย
- **Tweak pace multiplier** — `chill 1.4× / smooth 1× / hype .66×` คูณทุก duration + ความถี่ confetti

---

## 3. Design Decisions (ที่เคาะ)

- **Wizard 3 step** (ไม่ใช่ 5) — เด็ก ม.ปลายหลุดง่าย ยิ่งสั้นยิ่งรอด
- **course-pick ย้ายเข้า SetupChecklist** — ลด friction ใน wizard แต่ไม่เสีย conversion (activate ไปเกิดที่เช็คลิสต์)
- **Notification in-app only ก่อน** — อีเมล/push ไว้ทีหลัง (โน้ตบอกผู้ใช้ใน Settings)
- **payment notification = สำเร็จ/หมดอายุ เท่านั้น** — ไม่มี pending/manual-review (CLAUDE.md)
- **Settings = หน้าใหม่** + Profile redirect — โครง 6 tab, Payments ยุบเข้ามาเป็น tab
- **type → icon/สี**: lesson=cyan · exam=violet · payment=green · streak=coral · achievement=gold · social=magenta · system=neutral
- **Sidebar "Built Different"** — หนีลุค template ที่คนดูออกว่าใช้ AI: เปลี่ยนฟอนต์+โครงสร้างเป็น vibe เลือกได้, default = **soft (Kanit) + home aura glow**

---

## 4. Tokens ที่ refine / เพิ่ม

```css
/* notification type accents (อยู่บนฐานสีเดิม ไม่เพิ่มสีใหม่) */
--nt-lesson:      oklch(0.74 0.15 235);   /* info/cyan */
--nt-exam:        oklch(0.70 0.20 295);   /* violet */
--nt-payment:     oklch(0.78 0.18 150);   /* success green */
--nt-streak:      oklch(0.78 0.20 45);    /* coral-amber */
--nt-achievement: oklch(0.84 0.16 85);    /* gold */
--nt-social:      oklch(0.72 0.22 5);     /* magenta */
--nt-unread-bg:   oklch(0.68 0.25 5 / 0.05);

/* elevation */
panel/dropdown:   0 30px 70px -20px oklch(0 0 0 / 0.6), inset hairline
av-menu:          0 24px 60px -18px oklch(0 0 0 / 0.6)

/* easing (เดิม) */
--ease-spring: cubic-bezier(.2,.8,.2,1);   --ease-bounce: cubic-bezier(.34,1.56,.64,1);

/* timing */
ring fill .7s · ntPop .18s · avPop .16s · step transition stepIn · badge/aura breathe 2.8s
home orbit 2.8s linear · curtain cover ~640ms (×pace)

/* vibe fonts (Google) */
Space Grotesk · Anuphan · Kanit · Chakra Petch
```

---

## 5. Lessons Learned

**ปรับจาก Batch 1-6**
- reuse เยอะ: `ScoreRevealRing → progress/completion ring` · `ConfettiBurst → onboarding/checklist` · `people.js → social noti avatars` · `SettingsTabs/privacy toggle → Settings` · peek popover pattern → noti panel + av-menu
- "single source + many views" (`people.js` lesson) → ทำซ้ำกับ `MingNotif`

**Anti-patterns / กับดักที่เจอ (สำคัญ)**
- **`eval_js` รันใน iframe ที่ backgrounded → animation clock แช่แข็ง** (`currentTime`=0, `.finished` ไม่ resolve) → ห้ามตัดสินทรานซิชันจาก eval; วัด layout ด้วย `getBoundingClientRect` แทน
- **html-to-image (save_screenshot) ทิ้ง `::before/::after` content, conic-gradient, mask, bg-pattern และ re-wrap ข้อความผิด width** → อย่าตัดสิน decoration/overlap จาก screenshot; ยืนยันด้วย `getComputedStyle`
- **`.btn-back` ชน `auth.css` (`width:100%`)** → ปุ่ม next หลุดกรอบ; override `width:auto`
- **F1 skew 13° เปิดช่องมุมล่างขวา** → ใส่ **gradient fill backstop** ปิด แทนการเดา inset
- **`.segmented` เป็น grid 4-col ตายตัว** → ใส่ 2 ปุ่มแล้วยืดเพี้ยน; ทำ `.lang2` 2-col
- **vibe font swap ทั้ง body ทำ dense UI ล้น/ซ้อน** (Kanit/Anuphan metrics สูง) → จำกัด display font ไว้ที่ sidebar/หัวเรื่อง, dense UI คงฟอนต์อ่านง่าย
- **หน้าที่ collapse sidebar ด้วย media query เอง** (Dashboard `@max-width:980px`) ไม่ใช่ `.collapsed` class → ต้องเพิ่ม media query ย่อ home tile ด้วย ไม่งั้นล้น rail
- **ไฟล์ชื่อมีอักขระพิเศษ** (`&`, `()`) → `run_script` readFile/saveFile ปฏิเสธ ("disallowed characters"); ต้องแก้ด้วย str_replace_edit แทน
- **`<a>` ทับ keyframe opacity บน fixed/high-z ยัง stall** (บทเรียนเดิม) → fixed popover ใช้ display-toggle + transform-only keyframe, opacity solid เสมอ

**Reusable → Batch 8 (Growth & Marketing)**
- `MingNotif` toast/queue pattern → in-product announcements / promo nudge
- **SetupChecklist** → onboarding checklist / referral progress / pricing feature-list
- **page-transition engine (WAAPI + curtain)** → hero reveal / section reveal บน landing
- **Tweak vibe pattern** (`data-sb` + ฟอนต์สลับ) → A/B แนว visual ของ marketing page
- **ThemeSelector card pattern** → plan/pricing selector cards
- `set-row` / `.switch` / `.vis-card` → preference / plan-compare UI
- subject gradients + `rec-card` → course promo cards
```
```

> _Batch 7 ปิด — ทุกหน้าที่มี sidebar ใช้ระบบ shared `sidebar.css`+`sidebar.js` (soft vibe + home aura) เหมือนกันทั้งเว็บแล้ว_
