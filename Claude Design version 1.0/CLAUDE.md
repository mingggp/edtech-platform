# Mingsmileyface — Project Rules

## Brand name
- English: **mingsmileyface** (lowercase wordmark in nav/footer logos).
- Thai version: **หมิงสมายลี่เฟซ** — use this when the brand name appears in Thai sentence/heading copy.

## Payments / Checkout model
- Payment is verified **automatically** via a PromptPay gateway webhook (Opn/2C2P/GB Prime Pay).
- There is **NO manual slip upload** and **NO admin-review "pending"** state.
- Valid payment statuses only: **สำเร็จ (paid)** and **หมดอายุ / ยกเลิก (expired/cancelled)**.

## Subjects taught (do NOT invent others)
Exactly **4 subjects** — never split or add more:
1. **TGAT2**
2. **TPAT3**
3. **คณิต** (Math) — ONE subject covering every level
4. **ฟิสิกส์** (Physics) — ONE subject covering every level

Rules:
- Do **NOT** separate "A-Level คณิต" from "คณิต ม.ปลาย". All math = one subject **คณิต**; all physics = one subject **ฟิสิกส์**.
- Only **คณิต** and **ฟิสิกส์** may carry a secondary *level* filter inside the subject:
  **ม.4 · ม.5 · ม.6** (in-term / เนื้อหาแต่ละระดับมัธยม) plus **A-Level**. TGAT2 and TPAT3 have no level filter.
- Never add เคมี, ชีววิทยา, ภาษาอังกฤษ, or any subject outside this list.
- **Priority display order** whenever the 4 subjects are listed (filters, tabs, dashboards, cards): **คณิต → ฟิสิกส์ → TPAT3 → TGAT2** (an "all" option may precede them).

### Subject keys — ONE vocabulary, no exceptions
`subjects.js` is the **single source of truth**. Read from it; never hard-code a subject list.

| key (code / DB / URL / `data-subj`) | label (what students see) |
|---|---|
| `math` | คณิต |
| `phys` | ฟิสิกส์ |
| `tpat3` | TPAT3 |
| `tgat2` | TGAT2 |

- Keys are **always lowercase**. `TPAT3`, `tpat`, `tgat`, `amath`, `aphys`, `MATH` are all **dead** — do not reintroduce them.
- **Never render a key directly.** Use `Subjects.label(key)` — a key that leaks to the screen shows "tpat3" to a student.
- CSS tokens follow the key: `--subj-math` `--subj-phys` `--subj-tpat3` `--subj-tgat2` (+ `-fg`, `-grad`).
- Helper class names follow the key too: `.s-math` `.s-phys` `.s-tpat3` `.s-tgat2`, `.subj-*` likewise.
- **Not subject keys** (leave alone): `tcas.js` uses `group:'tgat'` / `group:'tpat'` for the *exam family* (TGAT1–3, TPAT1–5), and `id:'tgat-tpat'` is a countdown widget. These are a different concept.
- Level filter values (math/phys only): `m4` `m5` `m6` `alevel`.

## Subject brand colors (use on every page that splits the 4 subjects)
Canonical tokens live in `brand.css` (`--subj-*` / `--subj-*-grad`). Always use them — never invent new per-subject colors.
- **คณิต** → blue / ฟ้าน้ำเงิน (`--subj-math`)
- **ฟิสิกส์** → purple-pink / ม่วงชมพู (`--subj-phys`)
- **TPAT3** → maroon / แดงเลือดหมู (`--subj-tpat`)
- **TGAT2** → yellow-orange / เหลืองออกส้ม (`--subj-tgat`)

## Visual style — Glassmorphism (house style)
Use **glassmorphism** as the default surface treatment across the app: translucent fill + heavy backdrop-blur + 1px light hairline (`--glass-line-strong`) + subtle inner top highlight, layered over the aurora/blob background so the blur has something to refract.
- Tokens already in `brand.css`: `--glass`, `--glass-strong`, `--glass-line`, `--glass-line-strong`; helper class `.glass`.
- Apply to cards, filter/toolbars, panels, popovers, sidebar, topbar. Keep text on solid-enough fills for contrast (esp. TGAT2 yellow — darken to an "ink" shade on light themes).
- Goal: feel **premium / pro**. Reference: `Exams.html` filter bar + exam cards.
