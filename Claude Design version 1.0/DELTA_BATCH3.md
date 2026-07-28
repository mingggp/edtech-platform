# 📦 Mingsmileyface — Delta Snapshot (Batch 3 · Exam System)

> Append to the Batch 2 snapshot. Covers ONLY what was added / changed / refined while building
> the 4 exam pages: `Exams.html` · `Exam Take.html` · `Exam Result.html` · `Exam Results.html`.
> All tokens still OKLCH. No new base colors invented — reuses brand violet/magenta/coral/cyan/lime.

---

## ⚠️ Correction to Batch 3 brief
- **No `<LetterGradeBadge>` (A+/A/B+…) was built.** Per mid-build decision, the result system uses
  **percent + percentile only** (no academic letter grade). Brief's component table is superseded.
  If letters return in a later batch, map them then — not committed now.
- Auto-save indicator was changed from a toast to a **persistent status** (Google-Docs style) — see §3.
- Question Navigator built as a **5×6 grid** (not a scrolling list) — OMR familiarity. Confirmed.

---

## 1. New Components (working code)

### 1.1 ExamTimer — normal / warning / critical
State driven by JS adding `.warning` / `.critical`. Thresholds: warning ≤ 10:00, critical ≤ 5:00.
```css
.timer { /* base */
  display: inline-flex; align-items: center; gap: 14px;
  padding: 8px 18px 8px 14px;
  background: var(--bg-1); border: 1px solid var(--line); border-radius: 14px;
  font-family: "Bricolage Grotesque"; font-weight: 700;
  font-variant-numeric: tabular-nums; font-size: 22px; letter-spacing: -0.025em;
  color: var(--fg-0); transition: all .25s var(--ease-spring);
}
.timer .lab { /* "เวลาที่เหลือ" overline */
  font-family: "JetBrains Mono"; font-size: 9.5px; font-weight: 600;
  letter-spacing: 0.18em; text-transform: uppercase; color: var(--fg-3);
}
.timer.warning {
  color: var(--warning);
  border-color: oklch(0.83 0.17 82 / 0.4);
  background: oklch(0.83 0.17 82 / 0.08);
}
.timer.critical {
  color: var(--danger);
  border-color: oklch(0.66 0.22 25 / 0.5);
  background: oklch(0.66 0.22 25 / 0.12);
  animation: tshake 0.9s ease-in-out infinite;
}
@keyframes tshake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-1px); } 75% { transform: translateX(1px); } }
```
- Pattern: timer has stacked label + clock (two lines) inside one pill. Icon + label tint with state.
- **Warning = amber tint + (optional) soft pulse**; **critical = red tint + 0.9s shake** (subtle, ±1px).

### 1.2 QuestionNavigator — 5×6 grid
Cells are `<button.qcell>`. States combine freely (answered + flagged + current all at once).
```css
.qgrid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
.qcell {
  aspect-ratio: 1; border-radius: 9px;
  background: var(--bg-2); border: 1px solid var(--line); color: var(--fg-2);
  font-family: "JetBrains Mono"; font-size: 11.5px; font-weight: 600;
  transition: all .18s var(--ease-spring);
}                                          /* label = zero-padded "01".."30" */
.qcell.answered { background: var(--grad-signature); color: #fff; border-color: transparent;
  box-shadow: 0 4px 12px -4px oklch(0.66 0.23 295 / 0.6), 0 0 0 1px oklch(0.99 0.005 285 / 0.12) inset; }
.qcell.flagged::after {                    /* amber corner triangle */
  content: ""; position: absolute; top: 2px; right: 2px;
  border-style: solid; border-width: 0 9px 9px 0;
  border-color: transparent var(--warning) transparent transparent;
  filter: drop-shadow(0 1px 2px oklch(0 0 0 / 0.5)); }
.qcell.current { outline: 2px solid var(--fg-0); outline-offset: 2px; transform: scale(1.04); z-index: 1; }
```
Paired with a `.qlegend` (4 swatch rows) + `.qmini` (ตอบแล้ว / เหลือ / ปักธง counters).

### 1.3 CustomRadio (choice card) — letter label + selected/hover
```css
.choice { display: grid; grid-template-columns: auto 1fr auto; gap: 18px;
  padding: 16px 20px; border-radius: 14px; background: var(--bg-1);
  border: 2px solid var(--line); transition: all .18s var(--ease-spring); }
.choice:hover { border-color: var(--brand-magenta); background: var(--bg-2); transform: translateY(-1px); }
.choice .letter { width: 36px; height: 36px; border-radius: 50%;
  background: var(--bg-2); border: 1.5px solid var(--line);
  font-family: "Bricolage Grotesque"; font-weight: 700; font-size: 15px; color: var(--fg-1); }
.choice[aria-checked="true"] {              /* selected = full signature gradient fill */
  background: var(--grad-signature); border-color: transparent; color: #fff;
  box-shadow: 0 8px 24px -8px oklch(0.66 0.23 295 / 0.55), 0 0 0 1px oklch(0.99 0.005 285 / 0.1) inset; }
.choice[aria-checked="true"] .letter { background: rgba(255,255,255,0.22); border-color: rgba(255,255,255,0.32); color: #fff; }
.choice[aria-checked="true"] .check { display: flex; }   /* white check circle on right */
```
- `kbd-hint` (1–5) appears on hover, hides when selected. Keyboard 1–5 selects, F flags, ←→ navigates.
- Supports 5 options (A–E) — TGAT-style.

### 1.4 ScoreRevealRing — SVG + synced counter + tier color
- Ring radius 130, `stroke-dasharray = 2πr = 816.8`, draw via `stroke-dashoffset` over **2s** `cubic-bezier(0.16,1,0.3,1)`.
- Number counter runs in **parallel** (rAF loop, 1.9s, `easeOutCubic = 1 − (1−t)³`), counts both `%` AND `score/30`.
- Two gradient defs: `#revealGrad` (signature, ≥50%) and `#revealGradLow` (cyan→cyan, <50% sympathy).
```css
.reveal-pct { font-family: "Bricolage Grotesque"; font-weight: 800; font-size: 92px;
  letter-spacing: -0.045em; background: var(--grad-signature);
  -webkit-background-clip: text; background-clip: text; color: transparent; }
.reveal-ring .bar { stroke: url(#revealGrad); stroke-linecap: round;
  filter: drop-shadow(0 0 16px oklch(0.68 0.25 5 / 0.55));
  transition: stroke-dashoffset 2s cubic-bezier(0.16,1,0.3,1); }
```

### 1.5 PerformanceBarChart — topic breakdown
Per-row `data-pct`; JS sets `.fill` width on reveal-end, staggered 100ms. Color by tier class:
```css
.bk-row { display: grid; grid-template-columns: 140px 1fr auto; gap: 16px; align-items: center; }
.bk-row .track { height: 12px; border-radius: 99px; background: var(--bg-3); overflow: hidden; }
.bk-row .fill { height: 100%; width: 0; transition: width 1s var(--ease-spring); }
.bk-row.strong .fill { background: var(--success); }                                   /* ≥85% */
.bk-row.mid .fill    { background: var(--grad-signature); }                            /* 60–84% */
.bk-row.weak .fill   { background: linear-gradient(90deg, oklch(0.66 0.22 25), oklch(0.74 0.21 35)); } /* <60% */
```
+ `.bk-tag.good` (จุดแข็ง, success) and `.bk-tag.work` (ควรเสริม, warning) summary chips.

### 1.6 QuestionReviewItem — accordion + correct/wrong
`<details.qrev-item>`; summary grid = verdict icon · qn · snippet · answer-pair · chevron.
```css
.qrev-item .verdict.correct { background: oklch(0.78 0.18 150 / 0.16); color: var(--success); }
.qrev-item .verdict.wrong   { background: oklch(0.66 0.22 25 / 0.16);  color: var(--danger); }
/* answer pair on wrong: "คุณ B → เฉลย C" (yours in danger, correct in success) */
/* expand body: full text + 4 option rows (.opt.correct / .opt.yourwrong) + .explain card (วิธีคิด) */
```
Filter chips above: ทั้งหมด / ผิด / ถูก / ปักธง (segmented-box style from §6.16, re-skinned).
Plus a static **mini-overview**: `repeat(15,1fr)` grid of green/red cells (≠ the take-page navigator).

### 1.7 SparklineChart — 30-day trend (lives on gradient card)
Drawn on the gradient summary card, so strokes/fills are **white-on-gradient**, not brand color.
```html
<svg viewBox="0 0 240 64" preserveAspectRatio="none">
  <path d="…Z" fill="url(#sparkFill)"/>          <!-- white 0.3→0 vertical fade -->
  <path d="…" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="240" cy="12" r="4" fill="#fff"/>   <!-- end dot + 8px ring halo -->
</svg>
```

### 1.8 ConfirmSubmitModal — destructive + unanswered list
Reuses cmdk/modal shell (translateY(-12px) scale(.98) → 0/1, .22s spring). Adds:
- `.icon-ring` (warning amber circle), dynamic copy (changes if 0 unanswered → success tone).
- `.uchips` — wrap of zero-padded unanswered question numbers.
- Footer: `.btn-ghost` "ทำต่อ" + **`.btn-danger`** "ส่งเลย" → links `Exam Result.html?reveal=1`.
```css
.btn-danger { background: var(--danger); color: #fff; }
.btn-danger:hover { background: oklch(from var(--danger) calc(l + 0.04) c h); transform: translateY(-1px); }
```

### 1.9 Sparkles — lighter than ConfettiBurst (mid-tier 50–79%)
Same DOM/animation engine as ConfettiBurst (§6.12) but: **16 particles** (vs 22–36), single cyan color,
round only, with glow, shorter throw. Uses the same `@keyframes confettiBurst`.
```js
// 16 × oklch(0.80 0.16 205), box-shadow 0 0 8px same, dist 90–210, dur 800–1200ms ease-out
```

### 1.10 TierUnlockToast — badge celebration
Slides in top-right with **spring overshoot**. Gold gem reuses TrophyRing conic-glow recipe (§6.7).
```css
.badge-toast { position: fixed; top: 84px; right: 28px; width: min(380px, calc(100vw - 40px));
  border-radius: 20px; padding: 20px;
  background: oklch(from var(--bg-1) l c h / 0.9); backdrop-filter: blur(28px) saturate(160%);
  border: 1px solid oklch(0.86 0.18 80 / 0.4);
  box-shadow: 0 24px 60px -16px oklch(0 0 0 / 0.55), 0 0 60px -16px oklch(0.86 0.18 80 / 0.5);
  transform: translateX(calc(100% + 40px)); transition: transform .5s var(--ease-bounce); }
.badge-toast.in { transform: translateX(0); }
.badge-toast .gem::before { /* spinning conic halo */
  content: ""; position: absolute; inset: -6px; border-radius: 50%;
  background: conic-gradient(from 0deg, oklch(0.95 0.14 90 / 0.6), transparent, oklch(0.95 0.14 90 / 0.6), transparent);
  filter: blur(6px); animation: spin 8s linear infinite; z-index: -1; }
```
Fires ~900ms after reveal dismiss, only when score ≥ 80%. Auto-hides after 7s; has close button.

---

## 2. Animation Patterns (NEW)

### 2.1 Score reveal timeline (THE wow moment) — full sequence
Trigger: `?reveal=1` query param. Skippable via ESC / click anywhere / "ดูรายละเอียด" button.
```
0.0s  reveal fades in (opacity .7s)
0.3s  spotlight radial gradient turns on (.lit, opacity 1.2s)
0.5s  eyebrow "ผลสอบของคุณ..." fades up (.in)
1.0s  ring stroke draws (2s, cubic-bezier(0.16,1,0.3,1))
1.0s  number counter starts in PARALLEL (1.9s, easeOutCubic) — counts % and score/30 together
3.1s  percentile + headline POP (spring scale 0.5→1.12→1.0, var(--ease-bounce), .7s)
3.5s  celebration: ≥80% → ConfettiBurst (36) | 50–79% → Sparkles (16) | <50% → none
4.0s  CTA + skip hint fade up
6.5s  auto-dismiss → fade out (.7s) → Phase B revealed underneath; bars animate; badge toast @ +900ms
```
- **Replay**: "เล่นแอนิเมชันอีกครั้ง" button in hero resets all classes + ring offset + counters, re-runs.
- **Default (no `?reveal=1`)**: Phase B shows immediately (returning-view), bars animate on load.

### 2.2 Tier branching (score-based) — single source of truth
| Score | headline copy | ring color | celebration | percentile label |
|---|---|---|---|---|
| **≥85** | "สุดยอดไปเลย! 🔥" | signature grad | Confetti ×36 | Top 6% |
| **70–84** | "เก่งมาก! 🎉" | signature grad | Confetti ×36 | Top 12% |
| **50–69** | "ทำได้ดีนะ ลุยต่อ! 💪" | signature grad | Sparkles ×16 (cyan) | กลุ่มกลางๆ |
| **<50** | "ไม่เป็นไร — รอบหน้าดีขึ้นแน่! 🌱" | `#revealGradLow` (cyan) | none | กำลังไต่ขึ้น |
- **Celebration cutoff = 80%** (confetti). **Sympathy cutoff = below 50%** (cool ring, growth copy 🌱, zero particles).
- Mid-tier (50–79%) deliberately gets a *quieter* win (sparkles, not confetti) so 80%+ stays special.

### 2.3 Timer pulse — warning vs critical
- **Warning** (≤10min): amber tint, optional `box-shadow` breathe (2s ease-in-out). Calm.
- **Critical** (≤5min): red tint + `tshake` 0.9s (±1px horizontal). Urgent but not seizure-y — keep ≤1px.

---

## 3. Design Decisions (NEW)

- **Result identity = percent + percentile, NOT letter grades.** Less judgmental, more "where am I" framing.
- **Comparison = bell-curve distribution, never head-to-head numbers.** Copy: "สูงกว่าผู้ทำข้อสอบนี้ 88%"
  (position language, no named rivals). **Toggleable** (`.dist-chart.hidden`) — can be hidden if sensitive.
- **Auto-save = persistent status pill** (Google-Docs style), not a toast. States: green "ซิงค์ล่าสุด HH:MM"
  → blue spinner "กำลังบันทึก..." on each answer → "บันทึกแล้ว · N วินาทีก่อน" → back to "ซิงค์ล่าสุด" after 60s.
- **Question Navigator = grid, not list** — OMR / answer-sheet familiarity for Thai exam students.
- **AI Insight = exactly one line, specific & actionable** — names the weak topic + links the remedial chapter.
  Tone: pride first ("เก่งมากเรื่อง X") then gentle nudge ("แต่ยังพลาด Y"). Never scold.
- **Percentile fallback**: when sample too small, swap "Top N%" → soft phrase ("กลุ่มกลางๆ" / "กำลังไต่ขึ้น").
- **Take page strips ALL chrome** — no sidebar, no aurora, no topbar nav. Only exit + timer + sync + submit.
  Focus-mode shell ≠ standard app shell.

---

## 4. Tokens refined / added

### 4.1 No new base colors. New *applications* of existing tokens:
```css
/* timer states */
--timer-warning-tint: oklch(0.83 0.17 82 / 0.08);   /* bg */
--timer-warning-line: oklch(0.83 0.17 82 / 0.4);
--timer-critical-tint: oklch(0.66 0.22 25 / 0.12);
--timer-critical-line: oklch(0.66 0.22 25 / 0.5);

/* gold celebration glow (badge toast + tier flag) */
--gold:        oklch(0.86 0.18 80);
--gold-glow:   0 0 60px -16px oklch(0.86 0.18 80 / 0.5);
--gold-conic:  conic-gradient(from 0deg, oklch(0.95 0.14 90 / 0.6), transparent, oklch(0.95 0.14 90 / 0.6), transparent);

/* sympathy ring gradient (score <50%) */
--grad-reveal-low: linear-gradient(135deg, oklch(0.74 0.15 235), oklch(0.80 0.16 205));

/* subject hover glow (exam cards + result rows) — paired with subj-grad */
--subj-glow-math:  oklch(0.55 0.24 320 / 0.45);
--subj-glow-phys:  oklch(0.50 0.18 210 / 0.45);
--subj-glow-tpat3: oklch(0.58 0.22 5 / 0.45);
--subj-glow-tgat:  oklch(0.65 0.20 50 / 0.45);
--subj-glow-alvl:  oklch(0.55 0.18 320 / 0.45);
```

### 4.2 Shadow / glow patterns (new)
```css
/* answered nav cell */
0 4px 12px -4px oklch(0.66 0.23 295 / 0.6), 0 0 0 1px oklch(0.99 0.005 285 / 0.12) inset
/* score ring stroke glow */
drop-shadow(0 0 16px oklch(0.68 0.25 5 / 0.55))
/* exam card / result row hover (subject-tinted) */
0 20px 60px -20px oklch(0 0 0 / 0.55), 0 0 60px -20px var(--subj-glow)
/* light-mode variant swaps black → oklch(0.18 0.014 285 / 0.2) */
```

### 4.3 Animation timing constants (new)
```
--ring-draw:      2s     cubic-bezier(0.16, 1, 0.3, 1)   /* score ring stroke */
--counter-up:     1.9s   easeOutCubic (1 − (1−t)³)        /* number tick, parallel to ring */
--grade-pop:      .7s    var(--ease-bounce)               /* percentile/headline entrance */
--bar-fill:       1s     var(--ease-spring) (stagger 100ms)
--toast-slide:    .5s    var(--ease-bounce)               /* badge toast overshoot */
--timer-shake:    .9s    ease-in-out infinite (±1px)      /* critical only */
--reveal-fade:    .7s    ease                             /* takeover in/out */
--auto-dismiss:   6500ms                                  /* reveal → Phase B */
```

---

## 5. Lessons Learned

- **Reveal must be skippable + replayable.** A 6.5s blackout is magic once, annoying on revisit. Default
  returning-view to Phase B; gate the takeover behind `?reveal=1`; offer a "replay" button. Don't auto-play twice.
- **Counter + ring must run in PARALLEL, not sequential** — they read as one event. Drive number with rAF
  (not CSS) so it can ease independently of the SVG stroke transition.
- **Tier branching belongs in ONE config function** (`configureReveal()`) — headline, ring gradient, percentile,
  particle type all derive from `SCORE`. Keep the cutoffs (50 / 80 / 85) in one place.
- **Mid-tier needs its own treatment.** Early build only had celebrate-vs-sympathy; 60–79% felt wrong getting
  full confetti. Added sparkles as the "good, keep going" middle register. Three tiers, not two.
- **Don't reuse the live navigator grid for the static review overview** — they look similar but mean different
  things (interactive vs read-only result map). Built `.qrev-overview` (15-col, green/red) separately from `.qgrid`.

### Anti-patterns found (avoid in Batch 4)
- ❌ Head-to-head score comparison ("คุณได้ 80%, เพื่อนได้ 85%") — demotivating. Use distribution/position instead.
- ❌ Letter grades for a tutoring product — too school-like / judgmental. Percent + percentile is friendlier.
- ❌ Save toasts that fire on every keystroke — noisy. Persistent status pill reads calmer.
- ❌ Timer shake > 1px or faster than ~0.9s — feels like an error state, raises panic. Keep urgency subtle.
- ❌ Confetti on every score — devalues it. Reserve particles for genuine wins (≥80%).
```