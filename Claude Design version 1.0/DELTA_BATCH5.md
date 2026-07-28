# 📦 Mingsmileyface — Delta Snapshot (Batch 5 · Admin / Tutor Studio · หลังบ้าน)

> Append to: Snapshot Batch 2 + Delta Batch 3 + Delta Batch 4.
> Covers ONLY what was added/changed building Batch 5 — the operator/tutor back-office (หมิงเอง).
> 9 pages, all OKLCH tokens, **vanilla token-CSS (NOT Tailwind)**. **Reuses** brand violet/magenta/coral/cyan/lime + every Batch 2–4 component.
> Shared CSS added: **`admin.css` · `admin-content.css` · `admin-data.css` · `admin-exams.css` · `admin-system.css`** + shared JS **`admin-shell.js` · `admin-common.js` · `admin-chart.js`**.

---

## ⚠️ Corrections to the Batch 5 brief (mid-build decisions — these SUPERSEDE the brief)
- **`/admin/payments` is a READ-ONLY reconciliation desk, NOT an approve/reject slip queue.** The brief
  predates the Batch 4 auto-verify pivot. Per `CLAUDE.md`: payment is decided by the PromptPay gateway
  webhook (Opn Payments). **No slip upload, no อนุมัติ/ปฏิเสธ, no รออนุมัติ/pending state, no `🔴3` badge.**
  Only **สำเร็จ (emerald) / หมดอายุ·ยกเลิก (rose)** — reuses `<PaymentStatusBadge>` 2-state from Batch 4.
- **Overview banner is revenue-focused** ("รายได้วันนี้ ฿X · ↑ จากเมื่อวาน"), not "3 สลิปรอตรวจ" (which
  contradicts auto-verify). KPIs: รายได้เดือนนี้ / คำสั่งซื้อสำเร็จ / นักเรียนทั้งหมด / อัตราชำระสำเร็จ.
- **Sidebar "การเงิน" badge** = total transactions count (47), NOT a pending-review count.
- Subjects stay locked to the 6 in `CLAUDE.md`: **TGAT2 · TPAT3 · A-Level คณิต · A-Level ฟิสิกส์ +
  คณิต/ฟิสิกส์ ม.ปลาย**. Never invent เคมี/ชีวะ/อังกฤษ.

---

## 1. Pages shipped (9)
**ดำเนินงาน:** `Admin Overview.html` · `Admin Payments.html` · `Admin Courses.html` + `Admin Course Editor.html`
· `Admin Exams.html` + `Admin Exam Editor.html` · `Admin Users.html` · `Admin Coupons.html`
**ระบบ:** `Admin Settings.html` · `Admin Reports.html` · `Admin Audit.html`

---

## 2. New Components (working code / behaviour)

### 2.1 AdminShell (`admin-shell.js` + `admin.css`) — operator shell
- **Generated sidebar** stamped by one JS source-of-truth (kills "sidebar drift" from earlier batches).
  Each page sets `window.__ADMIN_ACTIVE='users'` → shell marks the right `.active`. `<aside id="adm-sb">` is
  filled at runtime. **2 groups:** ดำเนินงาน (ภาพรวม/การเงิน/คอร์ส/ข้อสอบ/นักเรียน/คูปอง) + ระบบ (ตั้งค่า/รายงาน/audit).
- **Collapse** to 72px (hover-reveal toggle at sidebar edge); auto-collapses ≤880px. Logo + "← กลับหน้านักเรียน"
  exit + operator chip (online dot) pinned bottom.
- **Topbar:** breadcrumb left · ⌘K search · theme toggle (`.tt` 2-button) · "เปิดเว็บจริง" external link.
```css
.adm { display: grid; grid-template-columns: 248px 1fr; height: 100vh; transition: grid-template-columns .26s var(--ease-spring); }
.adm.collapsed { grid-template-columns: 72px 1fr; }
.adm-item.active::before { content:""; position:absolute; left:-12px; top:9px; bottom:9px; width:3px; background:var(--grad-signature); border-radius:0 4px 4px 0; }
```

### 2.2 KpiCard — big number + trend + sparkline
```css
.kpi .kpi-val { font-family:"Bricolage Grotesque"; font-weight:700; font-size:28px; letter-spacing:-0.03em; }
.kpi .trend.up { color:var(--success); background:oklch(0.78 0.18 150 / 0.12); }   /* ↑ green */
.kpi .trend.down { color:var(--danger);  background:oklch(0.66 0.22 25 / 0.12); }  /* ↓ red  */
.kpi.violet .kpi-accent{background:var(--brand-violet)} /* +magenta/cyan/lime variants, 3px left bar */
```
Inline sparkline: `data-spark="22,20,24,..."` → area+line path drawn at load (96×30 viewBox).

### 2.3 RevenueChart (`admin-chart.js`) — smart, interactive (rebuilt after v1 was "อ่านยาก")
- **3 metrics** (รายได้/คำสั่งซื้อ/นักเรียนใหม่) × **3 ranges** (7/30/ปี) × **area|bar** × **เทียบช่วงก่อน** (dashed ghost line).
- Smooth Catmull-Rom path, Y-axis labels + dashed gridlines, **peak marker**, **hover crosshair + glass tooltip**
  (value + % vs previous), summary header (total + ↑↓%), stats strip (รวม/เฉลี่ย/สูงสุด). Re-renders on resize.
- Lesson: build it as its own JS module with a `geom` cache for hit-testing; tooltip uses `getBoundingClientRect`
  to map mouse→data index.

### 2.4 ActivityFeed — icon + actor + amount + time rows (Overview). Color-keyed: buy/fail/user/exam.

### 2.5 DataTable (`admin-data.css`) — Users & Coupons
Sticky header, zebra (`[data-zebra=on]` tweak), row hover, **click-sort headers** (dir toggle), **real pagination**
(page/page-size 10·25·50, slice client-side over backend-style data). Reusable across any admin list.

### 2.6 FilterBar — search + dropdown chip filters + active-filter chips + "ล้างทั้งหมด"
`.fdrop` button → `.fdrop-menu` (click-outside closes); selected filters render removable `.afilter` chips +
result count. Used on Users and (richest form) Audit.

### 2.7 PaymentLedgerPane (`admin.css` `.md`) — master–detail, read-only
List left (avatar/name/course/amount/relative-time, `.sel` row w/ gradient bar) + detail right (big amount,
2-state badge, "ยืนยันโดยเกตเวย์" tag, course/PromptPay/Opn/REF/charge-id/fee rows, **net = amount − 1.65% fee**).
**Keyboard ↑↓** moves selection. Failed rows show strikethrough amount + "เกตเวย์ไม่ตัดเงิน" note. No approve/reject UI.

### 2.8 CourseCard + StatusToggle (`admin-content.css`) — Courses list
Card grid (cover stripe + price + enrolled count) ⇄ list toggle. **Inline เผยแพร่/ร่าง switch on the card**
(no need to open editor). Subject filter + search + summary strip.

### 2.9 CourseForm + CurriculumEditor + DangerZone (Course Editor)
Tabs: ข้อมูลคอร์ส / เนื้อหา / นักเรียนในคอร์ส. Curriculum = section→lesson, collapse/expand, drag handle,
add/remove, type icons (วิดีโอ/เอกสาร/แบบทดสอบ) + "ดูฟรี" tag. Cover **dropzone** + video link. **DangerZone**
type-to-confirm (reuse Batch 4) = "ลบคอร์ส". **AutoSavePill** (Google-Docs style) in topbar.

### 2.10 QuestionEditor (`admin-exams.css`) — exam authoring master–detail
Question list left (number, 2-line clamp, complete ✓ / incomplete ⚠ flag, image tag) + editor right:
โจทย์ textarea, image dropzone, **choices ก–จ with circular correct-picker** (`.choice.correct` → emerald),
add/remove choice, คำเฉลย. **Preview mode toggle** renders the student view (reuse `<CustomRadio>` from Batch 3,
correct answer revealed + explanation card). Add/dup/delete question, prev/next nav, autosave.

### 2.11 CouponForm + 3-state rows (`admin-data.css`) — Coupons
Modal: code (auto-uppercase + "สุ่มโค้ด") · type %/฿ segmented · value (prefix) · usage limit · expiry date.
Table: mono code + copy · discount · used X/Y mini progress · expiry (พ.ศ.) · **auto status** ใช้งานได้ /
เต็มสิทธิ์ (gray) / หมดอายุ (strikethrough) computed from date+quota. Owns the coupon map (MING20/WELCOME10…).

### 2.12 SettingsSection (`admin-system.css`) — vertical tabs + autosave
Sticky vertical tabs (หน้าร้าน/การชำระเงิน/ติดต่อ) → panels. Banner image manager (dropzone + delete),
per-section save bar + AutoSavePill. PromptPay/บัญชี/Line fields. Horizontal-scroll tabs on mobile.

### 2.13 ReportCard (`admin-system.css`) — Reports
Category icon (bug/content/other) + title + desc + reporter chip + **3-state** ใหม่/กำลังแก้/ปิด (rose/amber/emerald)
+ status-tab filter + search. Empty = "เคลียร์หมดแล้ว 🎉".

### 2.14 AuditDiff + AuditTimeline (`admin-system.css`) — Audit log (most-detailed filter set)
Timeline grouped by **day** (วันนี้/เมื่อวาน/7วัน/30วัน/ก่อนหน้า). Each item: action dot (create/edit/delete/
publish/login), **actor avatar chip**, objtype tag, **IP + full พ.ศ. timestamp**, **before→after diff rows**
(old strikethrough-rose → new emerald; null = "เพิ่ม"/"ลบ"). **Filters:** action tabs + date-range dropdown
(today/7/30 + **custom from–to date picker**) + objtype + actor (auto-populated) + search + **active-filter
chips + ล้างทั้งหมด + result count + ส่งออก CSV** (exports the filtered set incl. diffs).

### 2.15 LiveNow + StudentActivityDrawer (`admin-data.css`) — student monitoring (Users)
**Added on request.** Top "กำลังเรียนอยู่ตอนนี้" panel = cards of online students w/ course·chapter·lesson +
**live mm:ss study timer (ticks every 1s)** + chapter-progress. Table gains a **"กำลังเรียน"** column. Click
row/card → **right drawer**: current status (live timer or "หยุดที่บท…"), **enrolled courses w/ per-course
progress**, **recent activity timeline** (เริ่มดู/ดูจบ/ทำแบบฝึกหัด/ทำข้อสอบ + duration + relative time).

---

## 3. Animation / Interaction patterns (NEW)
- **Admin density rhythm** — `[data-density]` tweak. comfortable: `--row-h:46px --pad-card:20px --gap-page:22px`;
  compact: `40/16/18`. Admin ≈ **20% denser** than student side but still breathes.
- **Master–detail selection** — `.md-row.sel` gets `background:var(--bg-2)` + 3px gradient left-bar; ↑↓ keyboard.
- **DataTable sort/hover** — `th.sorted` magenta sort glyph, dir toggles on re-click; pagination slices client-side.
- **KPI trend color logic** — up→emerald `oklch(0.78 0.18 150)`, down→rose `oklch(0.66 0.22 25)`, flat→muted.
- **Chart hover** — crosshair line + active dot + glass tooltip, mapped via cached `geom` + bounding rect.
- **Empty vs populated** — EVERY admin page has an `.adm-empty` state (icon tile + h3 + copy + CTA); most expose
  a Demo "ว่างเปล่า/มีข้อมูล" tweak to preview first-run.
- **Live timer** — `setInterval(tick,1000)` over `[data-start]` elements → `fmtElapsed(now-start)` mm:ss.

---

## 4. Design Decisions (NEW)
- **Admin sub-vibe = "control room"** — same tokens, different mindset: denser, calmer (less confetti/score-reveal
  flourish), clarity + speed + keyboard. Think Linear / Stripe Dashboard, never Bootstrap-admin.
- **Sidebar grouping** ดำเนินงาน vs ระบบ; one generated block per page; badge = data count (not a to-do).
- **Payments = read-only ledger** (auto-verify decided it). If a manual-review variant is ever needed it's a
  separate fallback — default ships without approve/reject.
- **Table-first vs card** — lists with many comparable scalar columns (users, coupons, exams) = **DataTable**;
  things the operator visually recognises / previews (courses) = **card grid** (matches student view).
- **Chart = area default + bar variant + range toggle**, plus metric switch + compare — one rich chart, not many.
- **Drawer (student activity)** opens via **inline-transform toggle, no CSS transition** (see Lessons).

---

## 5. Tokens refined / added (no new base colors)
```css
/* admin spacing / density (root) */
--row-h: 46px; --pad-card: 20px; --gap-page: 22px;     /* [data-density=compact] → 40 / 16 / 18 */
--ease-spring: cubic-bezier(.2,.8,.2,1);

/* status (reuse Batch 4 semantics) */
--status-paid:   oklch(0.78 0.18 150);   /* สำเร็จ / done / publish / online */
--status-failed: oklch(0.66 0.22 25);    /* หมดอายุ·ยกเลิก / delete / new-report */
--status-warn:   oklch(0.78 0.14 85);    /* กำลังแก้ / incomplete question */
--poll-cyan:     oklch(0.80 0.16 205);   /* info / linked / TGAT2 family */

/* chart */
--chart-line:  var(--brand-violet);
--chart-fill:  linear-gradient(0deg, oklch(0.66 0.23 295/0.45) → /0.02);   /* #cg gradient */
--chart-bar2:  oklch(0.80 0.16 205 / 0.28);   /* secondary orders bars */

/* surfaces / elevation */
sidebar+topbar: oklch(from var(--bg-0) l c h / 0.7) + backdrop-filter blur(20px) saturate(160%)
master-detail / drawer pane: var(--bg-1) + 1px var(--line-soft) + var(--shadow-1)
drawer: box-shadow -20px 0 50px -20px oklch(0 0 0 / 0.5); z-index 151 (overlay 150)
sticky th: position:sticky; top:0; background:var(--bg-1); z-index:2
zebra row: oklch(from var(--bg-1) calc(l + 0.012) c h)   /* only when [data-zebra=on] */
```
Accent tweak still re-points `--grad-signature` → signature/cool/warm (Batch 4 mechanism, carried over).

---

## 6. Lessons Learned
- **This preview engine cannot transition/animate `transform` on a fixed, high-z panel (the drawer).** A
  `transition: transform` OR a `@keyframes` (even with the class applied + correct specificity + inline style)
  leaves the element **stuck at the base value** — `.drawer.open` simply never wins while a transition/animation
  is in play, and the same bug then hit `opacity`. **Fix:** remove ALL transition/animation on the drawer and set
  `transform` **inline via JS** on open/close (inline wins the static cascade) → instant, 100% reliable snap.
  (Smooth-slide is not worth it here; correctness first.)
- **Stale-CSS in preview is real** — bump a `?v=N` query on the `<link>`/`<script>` after edits, or you'll debug
  against an old file for ages. Caused several phantom "rule isn't applying" rabbit holes this batch.
- **html-to-image screenshots miss glass tooltips / mid-transition states** (carried from Batch 4) — read the
  live DOM (`getBoundingClientRect`, computed style) to confirm, don't trust a blank capture.
- **Chart v1 was too sparse / hard to read** — a bare line+bars isn't enough for an operator; the rebuild
  (axis + tooltip + compare + stats + metric switch) is the floor for a "dashboard" chart.
- **Generate the sidebar once.** Hand-copied sidebars drift; a single `admin-shell.js` + per-page `__ADMIN_ACTIVE`
  keeps all 9 pages in lockstep.

### Anti-patterns (avoid in Batch 6)
- ❌ Manual slip approve/reject, "รออนุมัติ" status, pending-count badge — product is auto-webhook.
- ❌ Inventing subjects outside the 6.
- ❌ Bootstrap-admin vibe: garish table colors, icon soup, heavy borders — stay Linear/Stripe.
- ❌ Relying on CSS transitions/animations for the drawer (or similar fixed overlays) in this engine.

### Reusable straight into Batch 6
- **`admin-shell.js` + `admin.css` shell** → any new admin page (set `__ADMIN_ACTIVE`, add a menu item).
- **DataTable + FilterBar + pagination** (`admin-data.css`) → any list/management screen.
- **Master–detail pane** (`.md`) → order/transaction/student detail.
- **QuestionEditor / CurriculumEditor / CouponForm / SettingsSection / AuditDiff / StatusToggle** → editors & logs.
- **StudentActivityDrawer + LiveNow** → any monitoring/detail side-panel (uses inline-transform pattern).
- **RevenueChart** (`admin-chart.js`) → any metric viz (swap the DATA/METRICS maps).
- **AutoSavePill · DangerZone · PaymentStatusBadge** carried from Batch 4, now standard across admin.
