# Mingsmileyface — Design System Snapshot

> Captured from Batch 1 (Brand · Landing · Dashboard) + Batch 2 (Courses · Course Detail · Learn · Public Profile).
> **Important correction to original brief:** the actual committed system is **Aurora gradient (violet → magenta → coral)** with **electric-cyan** counter-accent, **not** indigo + amber. Don't revert.
> All tokens are OKLCH. Body font is IBM Plex Sans Thai, display is Bricolage Grotesque.

---

## 1. Color Tokens (OKLCH)

### 1.1 Neutrals · Dark mode (primary)
```css
--bg-0: oklch(0.13 0.014 285);  /* page bg, deepest */
--bg-1: oklch(0.17 0.016 285);  /* card surface */
--bg-2: oklch(0.21 0.018 285);  /* hover / muted */
--bg-3: oklch(0.26 0.020 285);  /* active / chip */
--line:       oklch(0.30 0.022 285 / 0.7);
--line-soft:  oklch(0.30 0.022 285 / 0.35);
--fg-0: oklch(0.985 0.005 285); /* primary text */
--fg-1: oklch(0.78 0.018 285);  /* secondary text */
--fg-2: oklch(0.58 0.022 285);  /* muted text */
--fg-3: oklch(0.42 0.024 285);  /* disabled / micro */
```

### 1.2 Neutrals · Light mode
```css
--bg-0: oklch(0.99 0.004 80);
--bg-1: oklch(0.975 0.006 80);
--bg-2: oklch(0.955 0.008 80);
--bg-3: oklch(0.93 0.010 80);
--line:       oklch(0.85 0.012 280 / 0.9);
--line-soft:  oklch(0.85 0.012 280 / 0.55);
--fg-0: oklch(0.18 0.014 285);
--fg-1: oklch(0.34 0.016 285);
--fg-2: oklch(0.52 0.018 285);
--fg-3: oklch(0.68 0.018 285);
```
Note: dark uses cool hue (285); light uses warm (80). Both intentional — not a bug.

### 1.3 Brand hues (same chroma ~0.23, varied hue)
```css
/* Dark mode */
--brand-violet:  oklch(0.66 0.23 295);  /* Aurora start */
--brand-magenta: oklch(0.68 0.25 5);    /* Aurora mid · primary accent */
--brand-coral:   oklch(0.74 0.21 35);   /* Aurora end · stars */
--brand-cyan:    oklch(0.80 0.16 205);  /* counter-accent · info · live */
--brand-lime:    oklch(0.86 0.20 130);  /* reward · level-up */

/* Light mode equivalents (lower L, same hue) */
--brand-violet:  oklch(0.55 0.22 295);
--brand-magenta: oklch(0.58 0.24 5);
--brand-coral:   oklch(0.66 0.20 35);
--brand-cyan:    oklch(0.66 0.15 205);
--brand-lime:    oklch(0.78 0.18 130);
```

### 1.4 Signature gradients
```css
--grad-signature: linear-gradient(115deg,
  oklch(0.66 0.23 295) 0%,    /* violet */
  oklch(0.68 0.25 5)   48%,   /* magenta */
  oklch(0.78 0.20 50)  100%); /* coral */

--grad-cool: linear-gradient(115deg,
  oklch(0.66 0.23 295), oklch(0.80 0.16 205));

--grad-warm: linear-gradient(115deg,
  oklch(0.68 0.25 5), oklch(0.86 0.20 130));

--grad-glow: radial-gradient(60% 60% at 50% 0%,
  oklch(0.68 0.25 5 / 0.55), transparent 70%);
```
Use `--grad-signature` for: hero CTA, primary buttons, streak counter, EXP bar, "earned" badges, progress bar fill, brand mark.

### 1.5 Semantic
```css
--success: oklch(0.78 0.18 150);  /* green ·  done · "ฟรี" tag */
--warning: oklch(0.83 0.17 82);   /* amber-yellow */
--danger:  oklch(0.66 0.22 25);   /* red ·  destructive */
--info:    oklch(0.74 0.15 235);  /* blue ·  notification */

/* Light variants: lower L by ~0.16 */
```

### 1.6 Subject signature colors (Courses)
Each subject = single gradient pair. Use for tiles, card thumbnails, color bleed bg.
```css
/* คณิต  (math) — violet to magenta */
--subj-math: linear-gradient(140deg,
  oklch(0.45 0.22 295), oklch(0.55 0.24 320), oklch(0.62 0.24 5));

/* ฟิสิกส์ (phys) — deep blue to cyan */
--subj-phys: linear-gradient(140deg,
  oklch(0.40 0.16 240), oklch(0.50 0.18 210), oklch(0.58 0.16 195));

/* TPAT3 — deep red to rose (engineering/exam) */
--subj-tpat3: linear-gradient(140deg,
  oklch(0.48 0.22 25), oklch(0.58 0.22 5), oklch(0.62 0.20 350));

/* TGAT — amber to orange (aptitude/logic) */
--subj-tgat: linear-gradient(140deg,
  oklch(0.55 0.18 60), oklch(0.65 0.20 50), oklch(0.74 0.18 40));

/* A-Level — magenta to violet (formal exam) */
--subj-alvl: linear-gradient(140deg,
  oklch(0.50 0.18 345), oklch(0.55 0.18 320), oklch(0.58 0.18 295));

/* "ทั้งหมด" — neutral surface */
--subj-all: linear-gradient(135deg, var(--bg-2), var(--bg-1));
```
Original brief had เคมี+ชีวะ; **removed in revision**, TPAT3 added.

### 1.7 Tier colors (badges / achievements)
Used in tier label, tooltip accent, gem outer glow. Gem color itself uses one of the 7 "gem color recipes" (see §6.6).
```css
--tier-common: var(--fg-2);              /* neutral text */
--tier-rare:   var(--brand-cyan);        /* cyan */
--tier-epic:   var(--brand-magenta);     /* magenta */
--tier-legend: oklch(0.86 0.18 80);      /* gold */
```
Hierarchy: COMMON → RARE → EPIC → LEGEND. Always uppercase, JetBrains Mono 9–10px, letter-spacing 0.14–0.20em.

### 1.8 Glass / overlay tokens
```css
/* Dark */
--glass:        oklch(0.22 0.018 285 / 0.55);
--glass-strong: oklch(0.17 0.016 285 / 0.78);
--glass-line:        oklch(0.99 0.005 285 / 0.08);
--glass-line-strong: oklch(0.99 0.005 285 / 0.14);

/* Light */
--glass:        oklch(1 0 0 / 0.7);
--glass-strong: oklch(1 0 0 / 0.86);
--glass-line:        oklch(0.18 0.014 285 / 0.06);
--glass-line-strong: oklch(0.18 0.014 285 / 0.10);
```

---

## 2. Typography

### 2.1 Families
```css
--font-display: "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif;
--font-body:    "IBM Plex Sans Thai", "IBM Plex Sans", ui-sans-serif, system-ui;
--font-mono:    "JetBrains Mono", ui-monospace, monospace;
```
- **Display** — hero headlines, section h2, score reveal, milestone moments only. Optical sizing AUTO. Never use in long paragraphs.
- **Body** — everything Thai + Latin. line-height ≥ 1.55 for Thai diacritics.
- **Mono** — tokens, chips, timestamps, code, score breakdown, kbd hints, JetBrains-style metadata. Never long prose.

Google Fonts URL:
```
https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;500;600;700;800&family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap
```

### 2.2 Type scale
```css
/* Display (Bricolage, 700) */
--t-display:  64px / 1.0  / -0.035em   /* hero on landing */
--t-h1:       clamp(36px, 4.4vw, 60px) / 1.0 / -0.035em
--t-h2:       clamp(26px, 2.6vw, 36px) / 1.1 / -0.025em
--t-h3:       22px / 1.25 / -0.015em
--t-h4:       18px / 1.3  / -0.01em

/* Body (Plex Thai) */
--t-body-lg:  17px / 1.65
--t-body:     15px / 1.65
--t-body-sm:  13.5px / 1.5
--t-caption:  12.5px / 1.5
--t-overline: 11px / 1.4  / 0.16em   /* uppercase JetBrains */

/* Mono (token labels) */
--t-mono-md:  12px / 1.4 / 0.04em
--t-mono-sm:  11px / 1.4 / 0.10em
--t-mono-xs:  10.5px / 1.4 / 0.16em uppercase
```

### 2.3 Usage rules
- Hero h1: `clamp(48px, 6.4vw, 92px)` (Landing); `clamp(36px, 4.4vw, 60px)` (in-app).
- Body min 13px (caption); never go below.
- Numerics in stats: Bricolage 700, size 32–48px, `letter-spacing: -0.025em`.
- ALL Thai content uses `line-height: 1.55+`. Latin headlines can go to 1.0.
- `font-feature-settings: "ss01", "cv11"` on body — better Plex Thai feel.

---

## 3. Spacing + Sizing

### 3.1 Spacing scale
Used: **4 / 6 / 8 / 10 / 12 / 14 / 16 / 18 / 20 / 22 / 24 / 28 / 32 / 36 / 40 / 48 / 56 / 64 / 80 / 96 / 120px**.
Card internal padding: 18px (sm), 22px (md), 28px (lg), 36px (hero).
Section vertical rhythm: 28px gap (dashboard); 36–48px gap (profile); 80–120px (landing).

### 3.2 Container widths
```
Landing nav / hero / sections — 1280–1360px (px-32)
Dashboard page                — 1480px max (px-32)
Course Detail shell           — 1280px max
Learn lp-container            — 960px max
Public Profile page           — 1280px max
```

### 3.3 Breakpoints
```
≥ 1440  desktop primary (design target)
≤ 1280  iPad landscape — drop course-grid to 1fr 1fr
≤ 1100  iPad portrait  — collapse split → stacked, sticky → static
≤ 980   sidebar collapses to 72–76px icon-only auto
≤ 720   mobile — single col, hide nav links, sticky bottom bar appears
```

### 3.4 Sidebar / panel widths
```
Sidebar expanded:      260px (dashboard/courses/profile)
Sidebar collapsed:     76px  (icon-only, persists in localStorage)
Sidebar (Learn page):  320px (chapter list needs more)
Notes drawer:          min(420px, 96vw)  — slide from right
Sticky enroll card:    min(360px, 1fr)   — Course Detail right col
```

---

## 4. Radius · Shadow · Border

### 4.1 Radius
```css
--r-sm: 8px     /* badge dots, tier pills, small chip */
--r-md: 10–12px /* button, chip, input, ico-btn */
--r-lg: 14–16px /* small card, demo card */
--r-xl: 18–22px /* main card, stat card */
--r-2xl: 24–28px /* hero card, featured strip */
--r-full: 999px /* pills, avatars, progress bars */
```
Buttons = 12px; pills = 999px; cards = 16–24px; modals/hero = 28–32px.

### 4.2 Shadow
```css
--shadow-1: 0 1px 0 0 oklch(0.99 0.005 285 / 0.04) inset,
            0 1px 2px oklch(0 0 0 / 0.4);                /* inset highlight on solid btn */

--shadow-2: 0 20px 60px -20px oklch(0 0 0 / 0.55),
            0 8px 24px -12px oklch(0 0 0 / 0.4);          /* card-hover lift */

--shadow-glow: 0 0 0 1px oklch(0.99 0.005 285 / 0.06),
               0 20px 80px -20px oklch(0.66 0.23 295 / 0.6); /* primary CTA, featured */

/* Trophy badge ring glow */
0 12px 40px -8px oklch(0 0 0 / 0.45),
0 0 60px var(--show-glow)   /* show-glow = oklch(brand-violet / 0.4) tier-dependent */

/* Primary button rest */
0 8px 24px -8px oklch(0.66 0.23 295 / 0.6),
0 0 0 1px oklch(0.99 0.005 285 / 0.1) inset

/* Primary button hover */
0 12px 32px -8px oklch(0.66 0.23 295 / 0.8),
0 0 0 1px oklch(0.99 0.005 285 / 0.16) inset
```
**Light mode shadows** use `oklch(0.18 0.014 285 / 0.18)` instead of pure black — softer.

### 4.3 Border
- 1px solid `var(--line)` standard (0.7 opacity).
- 1px solid `var(--line-soft)` (0.35 opacity) for dividers inside cards.
- 1.5px on focused chart goal-line, lesson rail.
- Focus ring: `0 0 0 2px var(--bg-0), 0 0 0 4px var(--brand-magenta)`.

---

## 5. Animation + Motion

### 5.1 Timing functions
```css
--ease-spring: cubic-bezier(.2, .8, .2, 1);   /* default — UI lift, drawer slide */
--ease-out:    cubic-bezier(.2, .7, .4, 1);   /* confetti particles */
--ease-linear: linear;                          /* spin, marquee */
--ease-bounce: cubic-bezier(.34, 1.56, .64, 1); /* attention */
```

### 5.2 Durations
```
--dur-instant: 120ms  /* tab change, chip press */
--dur-fast:    180ms  /* hover color, focus ring */
--dur-base:    240–260ms /* card lift, drawer slide */
--dur-slow:    400–600ms /* progress bar fill, page bg bleed */
--dur-ambient: 2.0–4.0s  /* pulse, float, shimmer (looped) */
```

### 5.3 Signature motions

| Pattern | Duration | Ease | Notes |
|---|---|---|---|
| Card hover lift | 240ms | spring | `translateY(-4px) + shadow-2 + border-color` |
| Drawer slide-in | 260ms | spring | `transform: translateX(100%) → 0` + backdrop fade |
| Sidebar collapse | 260ms | spring | `grid-template-columns` transition, chevron rotate 180° |
| Cmd+K palette open | 220ms | spring | `translateY(-12px) scale(0.98)` → `0 1` + opacity |
| Progress bar fill | 600ms | spring | `width` transition |
| Confetti burst | 700–1100ms | out | 22 particles, `--tx --ty` CSS vars |
| Conic glow rotate | 8s | linear | infinite — trophy ring, conic-gradient outer |
| Badge float | 4s | spring (alt) | `translateY(-6px)` at 50% |
| Lesson active pulse | 2.4s | ease-in-out | `box-shadow: 0 0 0 6px → 0` infinite |
| Flame breathing | 2.4s | ease-in-out | `scale(1) rotate(-2deg) ↔ scale(1.06) rotate(2deg)` |
| EXP bar shimmer | 2.4s | ease-in-out | `linear-gradient` translateX |
| Aurora orb drift | 18–26s | ease-in-out | translate ±60–80px |
| Wave emoji | 2.6s | ease-in-out | 14° rotate sequence on greeting |
| Marquee news | 40s | linear | translateX(-50%) loop |
| Knob shimmer | 800ms loop | linear | bg-position 200% → 0% (skeleton) |

### 5.4 Reveal-on-scroll
`.reveal { opacity: 0; transform: translateY(20px); transition: .8s spring; }`
`.reveal.in { opacity: 1; transform: translateY(0); }`
Stagger via `data-delay="1..6"` → 80ms increments.

---

## 6. Custom Components (working code)

> All examples use vanilla CSS + the tokens above. Drop into Tailwind 4 by mapping to `@theme` directives.

### 6.1 Buttons
```html
<button class="btn btn-primary">เริ่มเลย <svg>...</svg></button>
<button class="btn btn-secondary">ดูตัวอย่าง</button>
<button class="btn btn-ghost">ยกเลิก</button>
<button class="btn btn-glass">▶︎ ดูตัวอย่างคอร์ส</button>
<button class="btn btn-primary btn-lg">…</button>  <!-- 52px h -->
<button class="btn btn-primary btn-sm">…</button>  <!-- 34px h -->
<button class="btn btn-primary btn-icon" aria-label="…"><svg/></button>
```
```css
.btn {
  appearance: none; border: 0;
  font-family: inherit; font-weight: 600; font-size: 14.5px;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 0 22px; height: 44px;
  border-radius: 12px; cursor: pointer;
  transition: transform .18s var(--ease-spring), box-shadow .2s, opacity .2s, background .2s;
  letter-spacing: -0.005em; white-space: nowrap;
}
.btn:hover  { transform: translateY(-1px); }
.btn:active { transform: translateY(0); }
.btn:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--bg-0), 0 0 0 4px var(--brand-magenta); }

.btn-primary {
  background: var(--grad-signature); color: #fff;
  box-shadow: 0 8px 24px -8px oklch(0.66 0.23 295 / 0.6),
              0 0 0 1px oklch(0.99 0.005 285 / 0.1) inset;
}
.btn-secondary { background: var(--bg-3); color: var(--fg-0); }
.btn-ghost     { background: transparent; color: var(--fg-1); border: 1px solid var(--line); }
.btn-glass     { background: var(--glass); backdrop-filter: blur(20px);
                 border: 1px solid var(--glass-line-strong); color: var(--fg-0); }
.btn-danger    { background: var(--danger); color: #fff; }
.btn-success   { background: var(--success); color: oklch(0.12 0.06 150); }
.btn[disabled] { opacity: 0.4; cursor: not-allowed; transform: none !important; box-shadow: none; }

.btn-lg { height: 52px; padding: 0 28px; font-size: 15px; border-radius: 14px; }
.btn-sm { height: 34px; padding: 0 14px; font-size: 13px; border-radius: 10px; }
.btn-icon { width: 44px; padding: 0; }
```

### 6.2 Card (5 variants)
```css
.card {
  border-radius: 20px;
  border: 1px solid var(--line);
  background: var(--bg-1);
  transition: transform .26s var(--ease-spring), box-shadow .26s, border-color .2s;
}
.card.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-2);
  border-color: var(--glass-line-strong);
}
.card.glass {
  background: var(--glass);
  backdrop-filter: blur(40px) saturate(160%);
  border: 1px solid var(--glass-line-strong);
}
.card.gradient {
  border-color: transparent;
  background: var(--grad-signature);
  color: #fff;
  position: relative; overflow: hidden;
}
.card.gradient::after { /* dot grid overlay */
  content: ""; position: absolute; inset: 0;
  background-image: radial-gradient(oklch(0.99 0.005 285 / 0.16) 1px, transparent 1px);
  background-size: 22px 22px;
  mask-image: radial-gradient(80% 80% at 70% 30%, #000, transparent);
}
```

### 6.3 Input · Textarea · Select
```css
.input, .textarea {
  width: 100%; height: 40px;
  background: var(--bg-1);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 0 14px;
  color: var(--fg-0);
  font: inherit; font-size: 14px;
  transition: border-color .2s, background .2s;
}
.input::placeholder { color: var(--fg-3); }
.input:focus, .textarea:focus { outline: none; border-color: var(--brand-magenta); background: var(--bg-0); }
.textarea { min-height: 100px; padding: 12px 14px; resize: vertical; line-height: 1.5; }

.select {  /* native select w/ custom caret */
  appearance: none; -webkit-appearance: none;
  background: var(--bg-1); border: 1px solid var(--line);
  color: var(--fg-1); padding: 8px 34px 8px 14px;
  border-radius: 10px; font: inherit; font-size: 13px;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat: no-repeat; background-position: right 12px center;
}
```

### 6.4 Badge / chip
```html
<span class="badge">DEFAULT</span>
<span class="badge hot">🔥 HOT</span>      <!-- magenta -->
<span class="badge new">NEW</span>          <!-- success -->
<span class="badge rec">RECOMMEND</span>    <!-- cyan -->
<span class="badge gold">-38%</span>        <!-- amber-yellow -->
```
```css
.badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px; border-radius: 99px;
  font-size: 11px; font-weight: 600; letter-spacing: 0.02em;
  border: 1px solid var(--line); color: var(--fg-1); background: var(--bg-2);
}
.badge.hot { background: oklch(0.68 0.25 5 / 0.14); color: var(--brand-magenta); border-color: oklch(0.68 0.25 5 / 0.3); }
.badge.new { background: oklch(0.78 0.18 150 / 0.14); color: var(--success);       border-color: oklch(0.78 0.18 150 / 0.3); }
.badge.rec { background: oklch(0.80 0.16 205 / 0.14); color: var(--brand-cyan);    border-color: oklch(0.80 0.16 205 / 0.3); }
.badge.gold{ background: oklch(0.86 0.18 80 / 0.14);  color: oklch(0.78 0.18 80);   border-color: oklch(0.86 0.18 80 / 0.3); }
```

### 6.5 Avatar + level ring overlay
```html
<div class="ph-avatar">
  ปม
  <div class="lvl-ring"><div><small>LV</small>14</div></div>
</div>
```
```css
.ph-avatar {
  width: 120px; height: 120px; border-radius: 50%;
  background: linear-gradient(135deg, oklch(0.55 0.22 295), oklch(0.68 0.25 5), oklch(0.78 0.20 50));
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-weight: 700; font-size: 48px; color: #fff;
  position: relative;
  box-shadow: 0 16px 40px -8px oklch(0 0 0 / 0.4),
              0 0 0 4px oklch(0.99 0.005 285 / 0.16),
              0 0 0 6px oklch(0.99 0.005 285 / 0.06);
}
.lvl-ring {
  position: absolute; bottom: -6px; right: -6px;
  width: 44px; height: 44px; border-radius: 50%;
  background: var(--bg-0); border: 3px solid oklch(0.99 0.005 285 / 0.95);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-weight: 700; font-size: 11px; color: var(--fg-0);
}
```
Smaller avatars (sidebar/friend widget): 38px round, gradient bg per-user, optional `::after` status dot.

### 6.6 Progress Ring (SVG)
```html
<div class="ring">
  <svg viewBox="0 0 200 200">
    <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="oklch(0.66 0.23 295)"/>
      <stop offset="50%"  stop-color="oklch(0.68 0.25 5)"/>
      <stop offset="100%" stop-color="oklch(0.78 0.20 50)"/>
    </linearGradient></defs>
    <circle cx="100" cy="100" r="86" fill="none" stroke="var(--bg-3)" stroke-width="14"/>
    <circle cx="100" cy="100" r="86" fill="none" stroke="url(#rg)" stroke-width="14"
            stroke-linecap="round" stroke-dasharray="540" stroke-dashoffset="151"
            transform="rotate(-90 100 100)"
            style="filter: drop-shadow(0 0 12px oklch(0.66 0.23 295 / 0.5));"/>
  </svg>
  <div class="ring-center">
    <div class="pct">72%</div><div class="lab">บทที่จบ</div>
  </div>
</div>
```
For small inline rings (header progress): use `conic-gradient(brand-magenta 0deg Ndeg, bg-3 Ndeg)` with `::before { inset: 3–5px; background: bg-1; }` to carve out center.

### 6.7 TrophyRing (showcase badge — conic glow + float + inner well)
```css
.badge-ring {
  width: 140px; height: 140px; border-radius: 50%;
  background: oklch(0.99 0.005 285 / 0.16);
  backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center;
  position: relative;
  border: 2px solid oklch(0.99 0.005 285 / 0.28);
  box-shadow: 0 12px 40px -8px oklch(0 0 0 / 0.45),
              0 0 60px var(--show-glow);
  animation: badgeFloat 4s ease-in-out infinite;
}
.badge-ring::before {  /* spinning conic outer halo */
  content: ""; position: absolute; inset: -8px; border-radius: 50%;
  background: conic-gradient(from 0deg, oklch(0.99 0.005 285 / 0.6), transparent, oklch(0.99 0.005 285 / 0.6), transparent);
  z-index: -1; filter: blur(8px); opacity: 0.6;
  animation: spin 8s linear infinite;
}
.badge-ring::after {  /* inner well shadow */
  content: ""; position: absolute; inset: 6px; border-radius: 50%;
  background: var(--badge-inner);
  box-shadow: inset 0 4px 14px oklch(0.99 0.005 285 / 0.18),
              inset 0 -6px 20px oklch(0 0 0 / 0.25);
}
.badge-ring svg { position: relative; width: 60%; height: 60%; z-index: 1;
                  filter: drop-shadow(0 4px 12px oklch(0 0 0 / 0.4)); }

@keyframes badgeFloat { 50% { transform: translateY(-6px); } }
@keyframes spin { to { transform: rotate(360deg); } }
```

Gem color recipes (used in `<.trophy>` gallery items):
```css
.trophy[data-color="violet"]  { --gem-grad: linear-gradient(160deg, oklch(0.72 0.18 295), oklch(0.55 0.22 320)); --gem-glow: oklch(0.66 0.23 295 / 0.5); }
.trophy[data-color="magenta"] { --gem-grad: linear-gradient(160deg, oklch(0.72 0.22 5),   oklch(0.55 0.24 25));  --gem-glow: oklch(0.68 0.25 5 / 0.5); }
.trophy[data-color="coral"]   { --gem-grad: linear-gradient(160deg, oklch(0.80 0.18 50),  oklch(0.62 0.20 35));  --gem-glow: oklch(0.74 0.21 35 / 0.5); }
.trophy[data-color="cyan"]    { --gem-grad: linear-gradient(160deg, oklch(0.84 0.14 205), oklch(0.62 0.16 220)); --gem-glow: oklch(0.80 0.16 205 / 0.5); }
.trophy[data-color="lime"]    { --gem-grad: linear-gradient(160deg, oklch(0.88 0.18 130), oklch(0.70 0.20 145)); --gem-glow: oklch(0.78 0.20 145 / 0.5); }
.trophy[data-color="gold"]    { --gem-grad: linear-gradient(160deg, oklch(0.90 0.16 90),  oklch(0.70 0.18 70));  --gem-glow: oklch(0.78 0.18 80 / 0.5); }
.trophy[data-color="silver"]  { --gem-grad: linear-gradient(160deg, oklch(0.92 0.04 250), oklch(0.62 0.05 270)); --gem-glow: oklch(0.72 0.04 260 / 0.4); }
.trophy.locked .gem { background: linear-gradient(160deg, oklch(0.30 0.02 285), oklch(0.22 0.02 285)); }
.trophy.locked { opacity: 0.45; }
```

### 6.8 Filter chips (subject tiles + segmented pills)
**Subject tile (radio):**
```css
.subj {
  position: relative; aspect-ratio: 3/2; border-radius: 18px; padding: 18px;
  border: 1px solid var(--glass-line-strong);
  background: var(--subj-grad);
  color: #fff; cursor: pointer; overflow: hidden;
  display: flex; flex-direction: column; justify-content: space-between;
  transition: transform .28s var(--ease-spring), box-shadow .28s;
}
.subj:hover { transform: translateY(-3px); box-shadow: 0 16px 40px -12px var(--subj-shadow); }
.subj:hover .subj-ico { transform: translate(3px, -3px); }
.subj[aria-pressed="true"] {
  outline: 2px solid var(--fg-0); outline-offset: 3px;
  transform: scale(1.02);
}
.subj .check {  /* white circle w/ check, appears on press */
  position: absolute; top: 14px; right: 14px;
  width: 26px; height: 26px; border-radius: 50%;
  background: #fff; color: oklch(0.30 0.18 295);
  opacity: 0; transform: scale(0.5);
  transition: opacity .2s, transform .25s var(--ease-spring);
}
.subj[aria-pressed="true"] .check { opacity: 1; transform: scale(1); }
```

**Segmented pill group (grade multi-select):**
```css
.segment {
  display: inline-flex; padding: 4px;
  background: var(--bg-1); border: 1px solid var(--line);
  border-radius: 12px; gap: 2px;
}
.segment button {
  appearance: none; border: 0; background: transparent;
  color: var(--fg-2); padding: 8px 16px; border-radius: 8px;
  font: inherit; font-size: 13px; font-weight: 500; cursor: pointer;
}
.segment button[aria-pressed="true"] {
  background: var(--bg-3); color: var(--fg-0);
  box-shadow: var(--shadow-1);
}
```

**Active filter chip (with subject gradient):**
```css
.af-chip { display: inline-flex; align-items: center; gap: 6px;
           padding: 5px 6px 5px 12px; border-radius: 99px;
           background: var(--bg-2); border: 1px solid var(--line); color: var(--fg-0); }
.af-chip.subject-chip { background: var(--subj-grad); border-color: transparent; color: #fff; }
.af-chip button { /* X close */
  width: 20px; height: 20px; border-radius: 50%; border: 0;
  background: oklch(0.99 0.005 285 / 0.16); cursor: pointer;
}
```

### 6.9 Command Palette (⌘K) — full overlay
```html
<div class="cmdk-backdrop" id="cmdk">
  <div class="cmdk">
    <div class="cmdk-input-row">
      <svg>…</svg>
      <input placeholder="ค้นหาคอร์ส บทเรียน หรือคำสั่ง…"/>
      <span class="esc">ESC</span>
    </div>
    <div class="cmdk-body">
      <div class="cmdk-group">
        <h5>คอร์สแนะนำ</h5>
        <div class="cmdk-item active">
          <div class="icon"><svg/></div>
          <div class="label">แคลคูลัส · ขั้นเทพ<small>คณิต A-Level · ม.6 · ฿2,490</small></div>
          <span class="meta">↵</span>
        </div>
      </div>
    </div>
    <div class="cmdk-foot">
      <div class="keys"><span><kbd>↑↓</kbd> เลื่อน</span><span><kbd>↵</kbd> เลือก</span></div>
    </div>
  </div>
</div>
```
```css
.cmdk-backdrop {
  position: fixed; inset: 0; z-index: 100;
  background: oklch(from var(--bg-0) l c h / 0.6);
  backdrop-filter: blur(20px) saturate(160%);
  display: none; align-items: flex-start; justify-content: center;
  padding-top: 12vh; opacity: 0; transition: opacity .2s;
}
.cmdk-backdrop.open { display: flex; opacity: 1; }
.cmdk {
  width: min(640px, 92vw);
  background: var(--bg-1); border: 1px solid var(--glass-line-strong);
  border-radius: 18px; overflow: hidden;
  box-shadow: 0 30px 80px -20px oklch(0 0 0 / 0.6);
  transform: translateY(-12px) scale(0.98); opacity: 0;
  transition: transform .22s var(--ease-spring), opacity .22s;
}
.cmdk-backdrop.open .cmdk { transform: translateY(0) scale(1); opacity: 1; }
```
JS: `Cmd+K`/`Ctrl+K` toggle, `Esc` close, click backdrop to close, `↑↓` cycle `.cmdk-item.active`.

### 6.10 Sticky Enroll Card + Mobile Bottom Bar
```css
.enroll {
  position: sticky; top: 24px;
  border-radius: 22px;
  background: var(--bg-1);
  border: 1px solid var(--glass-line-strong);
  box-shadow: 0 30px 80px -20px oklch(0 0 0 / 0.5);
}
.enroll-cover { aspect-ratio: 16/10; position: relative; background: var(--subject-grad); }
.enroll-body { padding: 24px; display: flex; flex-direction: column; gap: 18px; }

/* Mobile only: hide sticky enroll, show fixed bottom bar */
@media (max-width: 720px) {
  .enroll { display: none; }
  .mobile-bottom {
    display: flex; position: fixed; left: 0; right: 0; bottom: 0;
    padding: 14px 20px;
    background: oklch(from var(--bg-0) l c h / 0.85);
    backdrop-filter: blur(28px) saturate(160%);
    border-top: 1px solid var(--line); z-index: 50;
    justify-content: space-between; align-items: center; gap: 14px;
  }
}
```

### 6.11 Notes Drawer (slide-from-right overlay)
```css
.lp-notes {
  position: fixed; top: 56px; bottom: 0; right: 0;
  width: min(420px, 96vw);
  background: var(--bg-1); border-left: 1px solid var(--line);
  z-index: 40;
  transform: translateX(100%);
  transition: transform .26s var(--ease-spring), box-shadow .26s;
  display: flex; flex-direction: column;
}
.lp-notes.open {
  transform: translateX(0);
  box-shadow: -20px 0 60px -20px oklch(0 0 0 / 0.5);
}
.lp-notes-backdrop {
  position: fixed; inset: 56px 0 0 0; z-index: 35;
  background: oklch(0 0 0 / 0); pointer-events: none;
  transition: background .26s;
}
.lp-notes-backdrop.open {
  background: oklch(from var(--bg-0) l c h / 0.45);
  backdrop-filter: blur(4px); pointer-events: auto;
}
```
JS: toggle `.open` class on both drawer + backdrop; Esc closes; backdrop click closes.

### 6.12 ConfettiBurst (6 colors × 22 particles)
```js
function fireConfetti(originRect) {
  const COLORS = [
    'oklch(0.66 0.23 295)', 'oklch(0.68 0.25 5)',  'oklch(0.78 0.20 50)',
    'oklch(0.80 0.16 205)', 'oklch(0.86 0.20 130)', 'oklch(0.96 0.18 80)',
  ];
  const c = document.createElement('div');
  c.style.cssText = `position:fixed; left:${originRect.left + originRect.width/2}px;
                     top:${originRect.top + originRect.height/2}px;
                     pointer-events:none; z-index:9999;`;
  document.body.appendChild(c);
  for (let i = 0; i < 22; i++) {
    const p = document.createElement('div');
    const angle = (Math.PI*2*i)/22 + (Math.random()-0.5)*0.5;
    const dist = 80 + Math.random()*90;
    const tx = Math.cos(angle)*dist;
    const ty = Math.sin(angle)*dist - 20;
    const size = 6 + Math.random()*5;
    const color = COLORS[i % COLORS.length];
    const shape = Math.random() > 0.5 ? '50%' : '2px';
    p.style.cssText = `
      position:absolute; width:${size}px; height:${size}px;
      background:${color}; border-radius:${shape};
      --tx:${tx}px; --ty:${ty}px;
      animation: confettiBurst ${700+Math.random()*400}ms cubic-bezier(.2,.7,.4,1) forwards;
      animation-delay: ${Math.random()*60}ms;
    `;
    c.appendChild(p);
  }
  setTimeout(() => c.remove(), 1500);
}
```
```css
@keyframes confettiBurst {
  0%   { opacity: 1; transform: translate(0,0) scale(0.5); }
  100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(1); }
}
```

### 6.13 Empty State
```css
.empty {
  display: flex; flex-direction: column; align-items: center; text-align: center;
  padding: 80px 40px; gap: 16px;
  border-radius: 24px; border: 1px dashed var(--line);
  background: var(--bg-1);
}
.empty .illus {
  width: 140px; height: 140px; border-radius: 36px;
  background: linear-gradient(160deg, oklch(0.22 0.04 285), oklch(0.16 0.02 285));
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--line); position: relative; overflow: hidden;
}
.empty .illus::before {
  content: ""; position: absolute; inset: 0;
  background: radial-gradient(circle at 70% 30%, oklch(0.66 0.23 295 / 0.3), transparent 60%);
}
.empty .illus svg { width: 60px; height: 60px; color: var(--brand-magenta); opacity: 0.7; }
.empty h3 { font: 600 22px var(--font-display); letter-spacing: -0.015em; }
.empty p  { color: var(--fg-2); font-size: 14px; line-height: 1.55; max-width: 44ch; }
```
Dynamic msg pattern: `"ยังไม่มีคอร์ส {subject} × {grade} — รอเร็วๆ นี้!"`

### 6.14 Skeleton
```css
.skel-line, .skeleton-thumb {
  background: linear-gradient(90deg, var(--bg-2), var(--bg-3), var(--bg-2));
  background-size: 200% 100%;
  animation: skel 1.6s ease-in-out infinite;
  border-radius: 6px;
}
@keyframes skel { 0%, 100% { background-position: 200% 0; } 50% { background-position: 0% 0; } }
```

### 6.15 Tooltip (trophy hover)
```css
.trophy .tip {
  position: absolute; bottom: calc(100% + 6px); left: 50%;
  transform: translateX(-50%) translateY(4px);
  background: var(--bg-0); border: 1px solid var(--line);
  border-radius: 10px; padding: 10px 12px;
  width: max-content; max-width: 220px;
  font-size: 11.5px; color: var(--fg-1); line-height: 1.5;
  opacity: 0; pointer-events: none;
  transition: opacity .15s, transform .15s;
  z-index: 10; box-shadow: var(--shadow-2);
}
.trophy:hover .tip { opacity: 1; transform: translateX(-50%) translateY(0); }
.trophy .tip b { font: 600 12px var(--font-display); color: var(--fg-0); display: block; }
.trophy .tip .hint { font-family: var(--font-mono); font-size: 10.5px; color: var(--fg-3); margin-top: 4px; }
```

### 6.16 Tabs (segmented box style)
```css
.tabs {
  display: flex; gap: 4px; padding: 4px;
  background: var(--bg-2); border: 1px solid var(--line);
  border-radius: 12px; width: fit-content;
}
.tabs button {
  appearance: none; border: 0; background: transparent;
  color: var(--fg-2); padding: 8px 16px; border-radius: 8px;
  font: inherit; font-size: 13px; font-weight: 500;
  display: inline-flex; align-items: center; gap: 6px;
}
.tabs button[aria-pressed="true"] {
  background: var(--bg-0); color: var(--fg-0);
  box-shadow: var(--shadow-1);
}
.tabs button .count {  /* numerical badge inside tab */
  font-family: var(--font-mono); font-size: 10.5px; font-weight: 700;
  padding: 1px 6px; border-radius: 99px;
  background: var(--bg-3); color: var(--fg-2);
}
.tabs button[aria-pressed="true"] .count { background: oklch(0.68 0.25 5 / 0.18); color: var(--brand-magenta); }

.tab-panel { display: none; padding-top: 8px; }
.tab-panel.active { display: block; }
```

### 6.17 Accordion (chapter / FAQ)
```css
.chapter { border: 1px solid var(--line); border-radius: 16px; background: var(--bg-1); }
.chapter[open] { border-color: var(--glass-line-strong); }
.chapter summary { cursor: pointer; padding: 18px 22px; display: grid;
                   grid-template-columns: auto 1fr auto auto; gap: 14px; align-items: center; }
.chapter summary::-webkit-details-marker { display: none; }
.chapter summary::marker { display: none; }
.chapter .chev { transition: transform .26s var(--ease-spring); }
.chapter[open] .chev { transform: rotate(180deg); }
```

### 6.18 Theme Toggle
```html
<div class="theme-toggle" role="tablist">
  <button data-set="dark"  aria-pressed="true"><svg moon/></button>
  <button data-set="light" aria-pressed="false"><svg sun/></button>
</div>
```
`<html data-theme="dark|light">`; toggle persists in `localStorage.ming-theme`.

---

## 7. Layout Patterns

### 7.1 Standard app shell (Dashboard / Courses / Profile)
```
┌────────┬────────────────────────────────────┐
│        │ topbar 64px (sticky, glass blur)   │
│ side   ├────────────────────────────────────┤
│  bar   │ .scroll (only this scrolls)        │
│ 260px  │   .page max-w-1480 px-32           │
│        │     section { gap: 28–36px }       │
│ (76px  │                                    │
│ collap)│                                    │
└────────┴────────────────────────────────────┘
body { overflow: hidden }   ← critical
.app { display: grid; height: 100vh; grid-template-columns: 260px 1fr; }
.main-col { display: flex; flex-direction: column; overflow: hidden; }
.scroll { flex: 1; overflow-y: auto; }
```

### 7.2 Learn page (3-zone focus mode)
```
header 56px slim ─────────────────────────────
│ sidebar 320px │ main lp-container 960px │ (notes drawer slides over right)
│ (chapter      │  - player 16:9          │
│  accordion)   │  - lesson info          │
│               │  - mark complete        │
│               │  - tabs                 │
```
Notes drawer is **overlay**, not column — position: fixed; top: 56px; right: 0; backdrop blur. Sidebar can collapse to 0 (`.app.sidebar-collapsed`).

### 7.3 Course Detail (split with sticky enroll)
```
hero-bg (full bleed, ~460px height, z:-1)
  ┌─ left-col (1.6fr)         ┐  ┌─ right-col (1fr) ┐
  │  hero text                 │  │ .enroll          │
  │  body sections            │  │  sticky top: 24px│
  │  - about                   │  │  cover           │
  │  - learn (2-col grid)      │  │  price + CTA     │
  │  - chapters accordion      │  │  3 stats         │
  │  - instructor              │  │  3 guarantees    │
  │  - FAQ                     │  │                  │
  └────────────────────────────┘  └──────────────────┘
                                  Mobile: enroll hides, .mobile-bottom shows
```
`.detail-shell { isolation: isolate; }` — required for `.hero-bg z-index: -1` to stay contained.

### 7.4 Hero pattern (gradient mesh + dot noise + radial glows)
```css
.hero-bg {
  position: absolute; inset: 0 0 auto 0; height: 460px;
  background: linear-gradient(135deg,
    oklch(0.30 0.20 295) 0%, oklch(0.38 0.22 320) 38%,
    oklch(0.45 0.22 5)  75%, oklch(0.50 0.20 30) 100%);
}
.hero-bg::before {  /* dot grid */
  content: ""; position: absolute; inset: 0;
  background-image: radial-gradient(oklch(0.99 0.005 285 / 0.18) 1px, transparent 1px);
  background-size: 26px 26px;
  mask-image: radial-gradient(80% 60% at 70% 20%, #000, transparent);
}
.hero-bg::after {  /* fade to bg-0 */
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(180deg, transparent 30%, var(--bg-0) 100%);
}
```

### 7.5 Aurora background (Landing-style, ambient)
```html
<div class="aurora"><div class="blob b1"></div><div class="blob b2"></div></div>
<div class="noise"></div>
```
3–4 absolutely-positioned blurred radial circles, each 560–780px, animating slow translate (18–26s).
`.noise` = SVG turbulence as PNG-ish overlay at 4% opacity, mix-blend overlay.

---

## 8. Design Decisions Log

### Subject → gradient mapping rationale
- **คณิต = violet/magenta** → strongest brand association, matches signature gradient
- **ฟิสิกส์ = deep-blue/cyan** → cool, calm, "physics is logical"
- **TPAT3 = red/rose** → urgency, exam, engineering ambition
- **TGAT = amber/orange** → cognitive warmth, aptitude
- **A-Level = magenta/violet** → formal, premium, capstone
- (เคมี + ชีวะ removed in revision per user request)

### Tier visual hierarchy
- **COMMON** → `fg-2` (neutral, just text), no glow
- **RARE** → cyan accent, small glow
- **EPIC** → magenta accent, conic glow on featured
- **LEGEND** → gold accent (`oklch(0.86 0.18 80)`), strongest conic glow, deserves floating animation
- Visual scale: COMMON = quiet, LEGEND = motion + scale + glow stack

### Glass vs solid card — when to use which
- **Solid card** (`bg-1`) = default, info-dense layouts (dashboard, course list)
- **Glass card** (`var(--glass)` + blur) = floating UI over imagery/gradients (hero overlays, sticky nav, command palette, hero floating cards, badge ring, course thumb tag overlays)
- **Gradient card** (signature gradient bg) = brand moments only (final CTA, featured course, podium top-3, showcase badge). Never two on same screen.

### Animation budget
- ✅ **Always animate**: hover lifts, drawer slides, focus rings, mark-complete confetti, progress bar fills, tab transitions
- ✅ **Subtle ambient**: streak flame breath, EXP shimmer, badge ring conic rotate, aurora drift, lesson-active pulse
- ⚠️ **Sparingly**: wave emoji on greeting (once), score reveal (on result page)
- ❌ **Don't animate**: typography (no fade-in on letters), card content shifting, anything looping faster than 2s except shimmer
- ❌ **No emoji as primary icon** — always inline SVG (lucide style). Emoji only for explicit content: 🔥 streak, 👋 greeting.

### When to glass
- Topbars / sidebars over scrolling content → backdrop-filter blur(20–28px), saturate(160%)
- Floating elements over gradients (hero floating cards) → glass-strong
- Modal/overlay backdrops → blur(4–20px)
- **Never** full-page glass; **never** glass on cards in info-dense lists

### Persistence
- `localStorage.ming-theme` (dark | light)
- `localStorage.ming-sidebar` (expanded | collapsed)
- Future: `ming-pinned-badges`, `ming-notes-draft`

### Tone of voice — Thai copy
- ใช้ "เรา" / "พี่หมิง" — never "ทางสถาบัน"
- คำเชิงบวกเฉพาะเจาะจง: "เก่งมาก!", "ไม่ยอมแพ้นะ", "ลุยเลย", "ปังมาก"
- หลีกเลี่ยง: 555, จ้าาา, ฮะ, งับ (เด็กเกินไป) — และคำราชการ ("กรุณาดำเนินการ")
- Verb-first CTAs: "เริ่มเลย" / "ลุยต่อ" / "ไปต่อ → บทที่ 8"
- Numerics in feedback: "เก่งมาก! ทำได้ดีกว่าครั้งที่แล้ว 8 คะแนน"

### Tech notes for implementation
- Built as standalone HTML; port to Next.js 15 + Tailwind 4 + shadcn/ui via `@theme` directives in `globals.css`
- All colors as OKLCH custom props → Tailwind can reference as `bg-[var(--brand-magenta)]`
- All icons inline SVG (lucide-style stroke 2, no fill on most); never use icon font
- `data-theme` switching via `document.documentElement.setAttribute('data-theme', t)`
- Subject filter / Cmd+K / mark-complete = client state (Zustand or React state, no server roundtrip)
- Confetti = pure DOM + CSS animation, no library needed
- All shadow vars work in both themes (light shadows use `oklch(0.18 0.014 285 / 0.18)` instead of pure black)
- `body { overflow: hidden }` is **required** for the app shell pattern — scroll happens inside `.scroll`, not on body

---

## 9. Files in this repo (reference)
- `brand.css` — global tokens, aurora bg, primitives (buttons, badges, theme toggle)
- `Brand Identity.html` — full system reference
- `Landing Page.html` — Aurora hero + sections
- `Dashboard.html` — app shell pattern, weekly chart, podium, friends widget
- `Courses.html` — subject tile filter + ⌘K palette + grade segment
- `Course Detail.html` — sticky enroll + accordion + mobile bottom bar
- `Learn.html` — 3-zone focus mode + notes drawer + confetti
- `Public Profile.html` — hero banner + showcase + trophy gallery + activity

---

End of snapshot. Total tokens ≈ 24 hours of design decisions condensed. Use as priming for Batch 3 (Exam System) chat.
