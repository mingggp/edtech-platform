# 📦 Mingsmileyface — Delta Snapshot (Batch 6 · Gamification & Engagement)

> Append to: Snapshot Batch 2 + Delta Batch 3 / 4 / 5.
> Covers ONLY what was added/changed while building Batch 6 — the engagement layer.
> 5 pages + a shared profile system. All tokens still **OKLCH**, vanilla **token-CSS (NOT Tailwind)**.
> **No new base colors** — reuses brand violet/magenta/coral/cyan/lime + gold (celebration only).
> New shared files: **`streak.css/js` · `xp.css/js` · `ach.css/js` · `leaderboard.css/js` · `celebration.css/js` · `people.js` · `peek.css/js`**

---

## 0. Pages shipped (5) + shared profile system

**Gamification pages**
- `Streak & Daily Goal.html` (Cluster A) — StreakWidget + calendar heatmap + freeze + DailyGoalRing + 3 QuestCards + milestone track
- `XP & Level.html` (B1) — LevelBadge + tier ladder + transparent XP sources + XP log + LevelUpModal
- `Achievements.html` (B2) — pinned showcase (drag-reorder) + next-up highlight + rarity + per-badge progress + category grids + empty state
- `Leaderboard.html` (C1) — week/month/all-time + grade filter + podium + sticky my-rank + privacy

**Shared profile system (NEW — cross-page)**
- `people.js` — **single source of truth roster** (25 people: 15 leaderboard students + 10 dashboard friends), derived fields, `MingPeople.get(id)/all()/lb()`
- `peek.css` + `peek.js` — **floating profile peek**, auto-binds any `[data-peek="<id>"]`, privacy-aware. Used by Leaderboard + Dashboard (friends + ranking).
- `Public Profile.html` now reads `?u=<id>` → renders that person from the roster (`?me=1` = self).

**Dashboard wiring (kept subtle, per request):** gamification is NOT a big hero on the dashboard — reached via sidebar nav (อันดับ/ความสำเร็จ/สตรีค), the user chip (LV·XP → XP page), and a small "ดูจังหวะฉลอง" link on Achievements.

---

## 1. New Components (working code)

### 1.1 StreakWidget — flame medallion + 5 states
State class on `.streak-hero`: `is-done / is-idle / is-warning / is-freeze / is-empty` drives a status-pill tint + the flame.
```css
.sh-flame { width:92px; height:92px; border-radius:50%;
  background: radial-gradient(circle at 50% 35%, oklch(0.80 0.20 60), oklch(0.66 0.24 30) 55%, oklch(0.52 0.22 18));
  box-shadow: 0 12px 36px -8px oklch(0.66 0.24 35 / 0.7), 0 0 0 1px oklch(0.99 0.005 285 / 0.12) inset; }
.sh-flame::before { /* conic halo */ inset:-7px; background: conic-gradient(from 0deg, oklch(0.82 0.18 60/.55), transparent, oklch(0.72 0.20 30/.55), transparent); filter: blur(7px); animation: shspin 9s linear infinite; }
.sh-flame svg { animation: shflame 2.4s ease-in-out infinite; }       /* scale 1→1.07 + rotate ±2deg */
.streak-hero.is-done    { --sh-tint: oklch(0.78 0.18 150/.14); --sh-fg: var(--success); }
.streak-hero.is-warning { --sh-tint: oklch(0.83 0.17 82/.14);  --sh-fg: var(--warning); }
.streak-hero.is-freeze  { --sh-tint: oklch(0.80 0.16 205/.14); --sh-fg: var(--brand-cyan); }
.streak-hero.is-empty .sh-flame { background: radial-gradient(circle at 50% 35%, oklch(0.40 0.04 285), oklch(0.28 0.03 285)); }  /* dim, halo off */
```
- 7-day dot strip (`.sh-day.on/.freeze/.today/.future`); freeze day = cyan snowflake. Copy stays **calm, never scolding**.

### 1.2 StreakCalendar — GitHub-style heatmap
`repeat(7,1fr)` grid, Monday-first. Intensity classes `l1..l4` (violet→magenta→coral→flame ramp) + `freeze` (cyan w/ snowflake mask). Built in JS from a `{day: level}` map.
```css
.cal-cell.l1{background:oklch(0.42 0.13 300)} .cal-cell.l2{background:oklch(0.54 0.20 330)}
.cal-cell.l3{background:oklch(0.62 0.23 6)}   .cal-cell.l4{background:linear-gradient(160deg,oklch(0.74 0.19 50),oklch(0.66 0.23 28))}
.cal-cell.freeze{background:oklch(0.80 0.16 205/.18); border:1px solid oklch(0.80 0.16 205/.5)}
```

### 1.3 StreakFreeze — the "no-punishment" safety net
`.freeze-card` (cyan-tinted) + inline `.sh-freeze` gem chips (❄️ count). Copy: a missed day is auto-covered, streak not reset to zero. Earns +1 freeze at streak milestones.

### 1.4 DailyGoalRing — minute ring (base = ScoreRevealRing, Batch 3)
SVG ring r=84, `circumference≈527.8`, gradient `#goalGrad` (violet→coral→amber). Target selectable 15/30/60.
**CRITICAL (engine):** the fill offset is **set synchronously in JS** (`bar.style.strokeDashoffset = target`); a rAF tween is layered on top only as enhancement — never rely on a CSS transition to reach the end state (it stalls — see §5). Completion → `goalpulse` + cyan Sparkles (16).

### 1.5 QuestCard — 3 daily quests + claim
`.quest` (per-color: violet/cyan/coral), `.q-mini` progress + `.q-frac`; `.done` swaps to a success check. A `.quest-claim` bar turns `.ready` (signature gradient) when all 3 done → claim fires ConfettiBurst (+130 XP bonus).

### 1.6 LevelBadge — medallion + tier ribbon
`.lvl-badge .disc` radial-gradient tinted by `--tier`; conic halo `::before`; bevel `::after`. `.ribbon` shows "ทอง · Gold". Tier vars: `--tier-bronze/silver/gold/plat/diamond`.

### 1.7 XPProgressBar — shimmer bar + "อีก X XP"
`.xp-bar > .fill` (signature gradient) + a `::after` shimmer sweep (`xpshimmer 2.6s`). Header shows `cur / next XP` + `% to next level`.

### 1.8 Tier ladder — bronze → diamond
`.tier` cards with rotated `.gem` (45°), `.current` ringed + "คุณอยู่ที่นี่" flag, `.locked` desaturated. Tier vars per class.

### 1.9 LevelUpModal — ring fill + unlocks
`.lvup` modal: `Lv N → Lv N+1` transit, ring fills (synchronous-set + rAF), confetti+sparkle, `.ul-chip` list of new unlocks. Gold theme.

### 1.10 BadgeProgressCard + RarityTag (Achievements)
`.ach` card: locked → `.ach-prog` (bar + "เรียนอีก N" / "x/y"), unlocked → `.ach-meta` (date + "% ของนักเรียนที่มี"). `.rar` chip + `[data-tier]`:
```css
.ach[data-tier="common"]{--rar:var(--fg-2)} .ach[data-tier="rare"]{--rar:var(--brand-cyan)}
.ach[data-tier="epic"]{--rar:var(--brand-magenta)} .ach[data-tier="legend"]{--rar:oklch(0.86 0.18 80)}
.ach[data-tier="legend"]{border-color:oklch(0.86 0.18 80/.28)}  /* + gold wash bg */
.rar{white-space:nowrap}   /* Thai labels must not wrap mid-word */
```
Showcase = drag-reorder (HTML5 DnD), pin/unpin two-way synced, max 6 + empty "ปักเพิ่ม" slots.

### 1.11 LeaderboardPodium + MyRankRow
Podium (extends Dashboard `.podium`): visual order 2nd/1st/3rd, gold/silver/bronze gradients, crown on #1, `data-peek`+`data-rank`+`data-period` on each. `.my-rank` = **sticky bottom** glass bar (rank / score / gap-to-next). Privacy toggle (`body.priv-on`) dims me-row + shows note. Move arrows ▲▼• vs previous week.

### 1.12 BadgeUnlockModal + ProfilePeek
- `.cel-modal` shells with theme variants `data-kind="badge|legend|level|streak"` (violet/gold/gold/coral).
- **ProfilePeek** (`peek.js`): floating card — avatar, name, grade + rank chips, 2×2 stats (minutes/streak/level/badges), top subject, "ทักทาย" + "ดูโปรไฟล์เต็ม → Public Profile.html?u=<id>". Private users → locked card; self (when hidden) → self-note.

---

## 2. Animation / Interaction Patterns (NEW)

### 2.1 Streak flame states
- **done** = full flame + spinning conic halo + `shflame` breathe. **idle/warning** = desaturated flame. **freeze** = cyan-tinted, halo on. **empty** = grey disc, halo + breathe OFF.

### 2.2 Ring fill (XP / daily goal / level-up) — source-of-truth pattern
Derived from ScoreRevealRing, but adapted to this engine: **set the final `stroke-dashoffset` synchronously**, then optionally rAF-tween from start for real browsers. easeOutCubic `1−(1−t)³`, ~0.9–1.1s. Never a bare CSS `transition: stroke-dashoffset` (stalls).

### 2.3 Level-up sequence
modal open → ring fills (1.1s) → confetti(~34) + sparkle(14) @ +200ms. Gold gradient. Dismiss via OK / Esc / backdrop.

### 2.4 Celebration tiers (restraint ladder)
| Tier | Trigger | Treatment |
|---|---|---|
| **เล็ก (small)** | daily-goal complete | ring `gdPulse` + micro sparkle (~8) |
| **กลาง (mid)** | badge unlock, rank up | toast (spring) OR modal + sparkle (~14) |
| **ใหญ่ (big)** | level-up, legendary badge, streak 7/30/100 | full confetti (34–40) + sparkle |
Confetti count scales with the **energy tweak** (calm ×0.6 / balanced ×1 / vivid ×1.5).

### 2.5 Toast queue (TierUnlockToast reuse)
`.toast-stack` top-right; multiple unlocks → **staggered ~900ms apart**, never simultaneous. Each `.cel-toast` slides in; **transform set inline via JS** (not CSS transition — engine stall), opacity transition kept; auto-hide ~6s + manual close.

### 2.6 Profile peek
Opens anchored to the clicked row/pod; smart-flips L/R + clamps to viewport. Shown via **display toggle + a transform-only `peekIn` keyframe** (opacity kept solid — keyframe opacity stalls at `from`).

---

## 3. Design Decisions (NEW)

- **"สนุกแบบมีน้ำใจ" (kind gamification):** streak **freeze** (miss a day, not reset); **compare-to-self > others** (aside shows personal best/trend, distribution not head-to-head); **no dark patterns** (no "friend passed you!", no pressure countdowns).
- **Gamification is a side layer, NOT the dashboard hero** — reached via nav/profile-chip, never a big widget on the home page (explicit user call).
- **XP formula (committed):** เรียน **+5/นาที** · ทำข้อสอบจบ **+60** · เข้าเรียนครั้งแรกของวัน **+20** · ทำ 3 ภารกิจครบ **+130 โบนัส** · ปลดล็อกเหรียญ **+100 โบนัส** · หมุดหมายสตรีค **+200 โบนัส**.
- **Level → tier mapping:** Lv 1–5 ทองแดง(มือใหม่หัดลุย) · 6–10 เงิน(นักเรียนขยัน) · 11–20 ทอง(นักรบสมการ) · 21–35 แพลทินัม(เซียนข้อสอบ) · 36+ เพชร(ตำนานติวเตอร์). Tier name = metal + Thai nickname.
- **Rarity tiers:** common(ธรรมดา) / rare(หายาก) / epic(เอพิค) / legend(ตำนาน) — by "% ของนักเรียนที่มี"; legend gets gold border + wash + glow.
- **Leaderboard scope:** tabs สัปดาห์/เดือน/ตลอดกาล + grade filter (ม.4/5/6); weekly & monthly computable from existing StudyLog. **Privacy = hide-from-public** (applies to ranking row AND profile peek/full profile).
- **Subjects locked to the 6** (CLAUDE.md). Fixed one stray "เคมี" in a Dashboard friend status while wiring.

---

## 4. Tokens refined / added (no new base colors)
```css
/* streak flame */
--flame-grad: radial-gradient(circle at 50% 35%, oklch(0.80 0.20 60), oklch(0.66 0.24 30) 55%, oklch(0.52 0.22 18));
--flame-glow: 0 12px 36px -8px oklch(0.66 0.24 35 / 0.7);

/* level tiers */
--tier-bronze: oklch(0.66 0.12 55);   --tier-silver: oklch(0.82 0.03 250);
--tier-gold:   oklch(0.84 0.16 86);   --tier-plat:   oklch(0.86 0.06 200);
--tier-diamond:oklch(0.82 0.13 200);

/* rarity / celebration gold */
--gold: oklch(0.86 0.18 80);
--legend-glow: 0 0 50px -18px oklch(0.86 0.18 80 / 0.5);
--gold-conic:  conic-gradient(from 0deg, oklch(0.95 0.14 90/.6), transparent, oklch(0.95 0.14 90/.6), transparent);

/* heatmap ramp */ oklch(0.42 0.13 300) → oklch(0.54 0.20 330) → oklch(0.62 0.23 6) → flame-grad
/* freeze (cyan reuse) */ oklch(0.80 0.16 205)

/* easing (reused) */
--ease-spring: cubic-bezier(.2,.8,.2,1);  --ease-bounce: cubic-bezier(.34,1.56,.64,1);
```
**Animation timing constants:** ring-fill ~0.9–1.1s easeOutCubic · level-up ring 1.1s · flame breathe 2.4s · conic halo 9s (calm 16s / vivid 5s) · toast slide .5s ease-bounce · toast queue stagger ~900ms · goal pulse 1.2s · peekIn .18s.

---

## 5. Lessons Learned

- **This preview engine stalls opacity/transform CSS transitions AND keyframes on fixed/high-z or dynamically-toggled elements** — they rest at the `from` value. Hit 4× this batch: `.lb-fade` (leaderboard hidden at opacity 0), `.cel-toast` (stuck off-screen), `.peek` keyframe (ghosted at 0.4 opacity), goal/level rings (never filled). **Fixes:** drive the visible/final state explicitly — inline `style.transform`/`strokeDashoffset` set synchronously, `display` toggle instead of opacity-fade, and keep `.open{opacity:1}` solid (transform-only flourish keyframe is OK). rAF tweens are enhancement, never the source of truth.
- **`classList.toggle(cls, force)` with an `undefined` force FLIPS instead of forcing off** — coerce booleans: `el.classList.toggle('x', !!cond)`. (Caused every friend to render as "private".)
- **Thai wraps mid-word in chips** — `white-space:nowrap` on rarity tags, status pills, level transit (carried lesson from Batch 4).
- **Reuse worked great:** ScoreRevealRing → XP/goal/level rings; ConfettiBurst/Sparkles/TierUnlockToast (Batch 3) → all celebrations; Dashboard `.podium`/`.rank-row` → Leaderboard; Public Profile gem/badge-ring vocab → Achievements + peek.
- **One roster, many views:** moving people data into `people.js` killed the per-page divergence (like the Batch 5 "generate sidebar once" lesson, applied to data).

### Anti-patterns (avoid in Batch 7)
- ❌ Relying on CSS opacity/transform transitions or keyframes for entrance of fixed/toggled overlays in this engine.
- ❌ `classList.toggle(x, maybeUndefined)`.
- ❌ Head-to-head leaderboard comparison / pressure copy / confetti on every action.
- ❌ Making gamification a forced dashboard hero — keep it opt-in.
- ❌ Inventing subjects outside the 6.

### Reusable straight into Batch 7 (Onboarding + Notifications + Settings)
- **Ring (synchronous-set pattern)** → onboarding-progress / completion ring.
- **Celebration tiers + ConfettiBurst/Sparkles/toast queue** → "onboarding complete" + notification moments.
- **`peek.js` + `people.js`** → any user mention/avatar across notifications & settings.
- **Toast (`.cel-toast`, inline-transform)** → notification toasts.
- **Privacy toggle pattern + SettingsTabs (Batch 4)** → notification/privacy settings.
- **`?u=` query-driven profile render** → deep-linkable detail views.
