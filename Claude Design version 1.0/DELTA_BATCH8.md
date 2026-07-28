# 📦 Mingsmileyface — DELTA · Batch 8
### Growth & Marketing (About · Testimonials · Results · Pricing · FAQ · Referral · Contact · Legal · public Courses/Detail)

> Delta update บน Snapshot Batch 2 + delta Batch 3/4/5/6/7
> ครอบคลุมเฉพาะสิ่งที่ **เพิ่ม / เปลี่ยน / refine ใน Batch 8**
> โทเคนหลัก (สี/ฟอนต์/เงา/ปุ่ม) ยังใช้จาก `brand.css` เดิมทั้งหมด

---

## 0. ไฟล์ใหม่ที่เพิ่ม (shared system)

| ไฟล์ | หน้าที่ |
|---|---|
| `marketing.css` | chrome ฝั่ง marketing — nav · footer · section primitives · trust strip · creds · testimonial card · final-CTA · page-hero · breadcrumb |
| `marketing-common.js` | theme toggle · nav `.scrolled` · reveal-on-scroll (+ failsafe) · restore accent/pricelayout ก่อน paint |
| `marketing-tweaks.jsx` | Tweaks panel: accent swap (signature/cool/warm) |
| `pricing-tweaks.jsx` | Tweaks panel: accent + pricing layout (การ์ด/ตาราง) |
| `legal.css` | document layout — sticky TOC + prose column (terms/privacy) |

**หน้าใหม่:** `About.html` · `Testimonials.html` · `Results.html` · `Pricing.html` · `FAQ.html` · `Referral.html` · `Contact.html` · `Terms.html` · `Privacy.html`
**แปลงเป็น marketing:** `Courses.html` (public catalog), `Course Detail.html` (public sell page, อ่าน `?c=<id>`)
**เปลี่ยนชื่อ (เก็บเวอร์ชันแอป):** `Courses.html` เดิม → `My Courses.html` ("คอร์สของฉัน")
**ไม่ได้ทำ:** `/blog` shell (user เลือก skip), `<BlogCard>`

---

## 1. New Components (class names + โครงสร้าง)

> เป็น vanilla HTML + CSS (ไม่ใช่ Tailwind — โปรเจกต์นี้ใช้ `brand.css` tokens + utility ของตัวเอง).
> ข้างล่างคือ **class API** ของแต่ละ component เพื่อ reuse/แปลงเป็น React/Tailwind ต่อ.

### `<TutorHero>` → `.about-hero-inner`
```
.about-hero-inner (grid 1.1fr / 0.9fr)
  .about-hero-copy  (eyebrow · h1 · lede · hero-cta)
  .about-photo-wrap
    .about-photo (aspect 4/5, gradient placeholder, .ph-name, .signature)
    .float-chip.c1 / .c2  (glass chips ลอยนอกกรอบ — อยู่นอก .about-photo เพราะ overflow:hidden)
```
+ timeline `.timeline > .tl-row(.tl-year/.tl-spine/.tl-dot/.tl-body)` , philosophy `.princ-grid > .princ`, subjects `.subj-block > .subj-card.s-*`

### `<TestimonialCard>` → `.review` (+ rating summary)
```
.rating-big (.score/.stars/.count) + .rating-bars > .rbar(.lab/.track/.fill/.pct)
.filter-bar > .filter-chip[aria-pressed]      // กรองตามวิชา + ตัวนับ
.wall (CSS columns:3, masonry)  > .review(.top/.body/.who) , .review.feature (gradient)
```
**หมายเหตุ:** ใช้ **filter + masonry + "ดูเพิ่ม"** แทน carousel (ดูข้อ 2)

### `<ResultsShowcase>` → `.adm-grid` + score cards
```
.score-grid > .testi-card (reuse) — .score-block(.num/.delta) + .quote + .who(.uni-tag)
.adm-grid > .uni-card — .crest + .cnt + .facs>.fac     // มหา'ลัยที่สอบติด + จำนวน
.improve > .cell(.big/.desc)                            // ก่อน→หลัง band
```

### `<PricingCard>` → `.plan` (+ featured + bundle)
```
.plan-grid > .plan / .plan.featured(ป้าย .pop "★ คุ้มที่สุด", gradient + shadow-glow)
  .phead(.tier/h3/p) · .subj-row>.schip · .priceblock(.now/.strike/.save/.once) · .feats>li>.ck · .pcta
.percourse (dashed strip "ซื้อแยกรายคอร์ส เริ่ม ฿1,490")
```

### `<FeatureCompareTable>` → `.ptable`
```
.ptable-wrap > table.ptable
  thead .pcol / .pcol.hot(คอลัมน์ TCAS เด่น, .pophead)
  tbody .rowlab + td(.yes/.no/.val) + td.hot
  tr.ctarow (ปุ่มต่อคอลัมน์)
```
สลับ cards↔table ผ่าน `:root[data-pricelayout="table"]`

### `<FaqAccordion>` → `details.qa` (+ category rail + search)
```
.faq-layout (grid 280px / 1fr)
  .faq-rail (sticky) > .cat-btn[aria-pressed] (.ci/.cc count)
  .faq-search > input#faq-q
  .faq-list > details.qa > summary(.qcat/.chev) + .ans>.ans-inner
```
filter = category ∩ search (JS render จาก array)

### `<ContactChannels>` → `.cmethod` + `.cform`
```
.contact-layout (grid 1.05fr / 0.95fr)
  form.cform (.field[.invalid]/.err , .form-success state via .cform.sent)
  .cinfo > .cmethod.line/.mail/.ig + .hours-card(.hours-row/.resp)
```

### `<ReferralCard>` → `.share-card`
```
.share-card (glass) — .sc-head + .code-box(.code/#copy-code) + .link-box(/#copy-link) + .share-row(.share-btn.line/#share-more)
.reward-pills > .rpill(.amt/.who)
.reward-grid > .rcard.you (ผู้ชวน ฿200) / .rcard (เพื่อน 10%)
```

### `<ReferralProgress>` → `.track-stats` + `.friends`
```
.track-stats > .tstat(.n/.l)             // ชวนกี่คน · ซื้อแล้ว · เครดิตรวม
.friends > .friend-row(.av/.nm/.st/.earn)
  .st.rewarded (success) / .st.joined (cyan) / .st.invited (neutral)
```

### `<LegalLayout>` → `.legal-layout`
```
.legal-layout (grid 250px / 1fr)
  aside.toc (sticky) > ol > a[.active]      // scroll-spy
  article.legal-doc > .meta-row + .intro + section.clause(h2>.num) + .callout.ok/.info + ul.bullets
```

---

## 2. Animation / Interaction Patterns (NEW)

| Pattern | ทำจริงเป็นแบบไหน |
|---|---|
| **Testimonials** | ❗ไม่ได้ใช้ carousel — ใช้ **filter chips (ตามวิชา) + masonry (CSS columns) + ปุ่ม "ดูรีวิวเพิ่ม"** + การ์ดเด้งเข้า `@keyframes rvIn` (stagger delay) |
| **Pricing card hover** | `translateY(-4px)` + `shadow-2`; การ์ด `.featured` มี gradient + `--shadow-glow` ตลอด + ป้าย "★ คุ้มที่สุด" |
| **Pricing layout toggle** | Tweak `การ์ด/ตาราง` → `html[data-pricelayout]` สลับ `.price-cards`↔`.price-table`, persist `localStorage('ming-pricelayout')`, label ใน hero sync ด้วย MutationObserver |
| **Referral share** | clipboard API (+ fallback execCommand) → ปุ่มเปลี่ยนเป็น "คัดลอกแล้ว" + **toast** ลอยล่าง; Line ผ่าน `line.me/R/msg/text/`; "แชร์อื่นๆ" ใช้ `navigator.share` (fallback = copy). ❗**ไม่ได้ใช้ ConfettiBurst** |
| **FAQ accordion** | native `<details>/<summary>` + chevron rotate; filter+search re-render |
| **TOC scroll-spy** | IntersectionObserver (`rootMargin:-20%/-70%`) ไฮไลต์หัวข้อ active + smooth-scroll offset 92px |
| **Contact form** | validate required → `.field.invalid` + `.err`; submit สำเร็จ → สลับเป็น `.form-success` (mock) |
| **reveal-on-scroll** | `.reveal`→`.in` ผ่าน IntersectionObserver + **setTimeout failsafe** (ดูข้อ 5) |

---

## 3. Design Decisions (เคาะแล้ว)

- **Brand scrub:** ลบ **เคมี** ออกจาก marketing ทั้งหมด (Landing title/hero/about, course card → TPAT3, testimonial → A-Level ฟิสิกส์, footer). nav รวมเป็น **6 เมนู** เหมือนกันทุกหน้า: คอร์ส · ราคา · ผลงานนักเรียน · รีวิว · เกี่ยวกับ · FAQ.
- **6 วิชาเท่านั้น:** TGAT2 · TPAT3 · A-Level คณิต · A-Level ฟิสิกส์ · คณิต ม.ปลาย · ฟิสิกส์ ม.ปลาย (ไม่มีเคมี/ชีวะ/อังกฤษ).
- **Pricing model:** per-course (เริ่ม ฿1,490) **+ 3 bundles** — ไม่มี subscription, จ่ายครั้งเดียวเรียนถึงวันสอบ:
  - ปูพื้น ม.ปลาย ฿2,990 (จาก ฿3,580)
  - **TCAS เต็มสนาม ฿6,900** (จาก ฿9,360) ← featured "คุ้มสุด"
  - A-Level เข้มข้น ฿4,290 (จาก ฿4,980)
- **Referral reward (สองฝั่ง):** ผู้ชวนได้ **เครดิต ฿200/เพื่อน** (ชวนไม่จำกัด) · เพื่อนได้ **ส่วนลด 10%** คอร์สแรก · เครดิตเข้าเมื่อเพื่อน **ชำระเงินสำเร็จ** (ผูกกับ PromptPay auto-verify).
- **Payment facts (ตาม CLAUDE.md):** PromptPay ยืนยันอัตโนมัติ · ไม่มีแนบสลิป · ไม่มีรอแอดมินตรวจ · สถานะมีแค่ **สำเร็จ / หมดอายุ(ยกเลิก)**. ย้ำใน FAQ + Pricing billing block + Terms + Privacy.
- **Social proof:** ใช้ **ข้อมูลตัวอย่างสมจริง** (รีวิว/คะแนน/มหา'ลัย) วางโครงสร้างไว้ให้ swap ของจริงทีหลัง — เลี่ยงเลขลอยไร้ที่มา.
- **/about hero:** ทิศทางเดียว — split hero + portrait placeholder (4:5) + floating chips (7 ปี / ★4.9).
- **Public vs App split:** `Courses.html` + `Course Detail.html` = หน้า public (marketing chrome, ไม่ต้องล็อกอิน) · `My Courses.html` = หน้าแอป (sidebar). sidebar ทุกหน้าแอปชี้ "คอร์สของฉัน" → `My Courses.html`.
- **Course Detail แบบ data-driven:** การ์ดคอร์สลิงก์ `Course Detail.html?c=<id>`; หน้าอ่าน param → สลับ ชื่อ/วิชา/glyph/badge/rating/stats/ราคา (รองรับ discount % + คอร์สฟรี) จาก `COURSE_DB`; ไม่มี/ไม่รู้จัก param → fallback เทมเพลตเริ่มต้น.

---

## 4. Tokens ที่ refine / เพิ่ม

```css
/* accent swap (Tweaks) — remap signature gradient ทั้งเว็บ */
:root[data-accent="cool"] { --grad-signature: var(--grad-cool); }
:root[data-accent="warm"] { --grad-signature: var(--grad-warm); }

/* pricing featured plan */
background: linear-gradient(150deg, oklch(0.42 0.20 295), oklch(0.50 0.22 330) 55%, oklch(0.58 0.22 5));
box-shadow: var(--shadow-glow);

/* testimonial / score / referral feature card */
background: linear-gradient(140deg, oklch(0.40 0.20 295), oklch(0.48 0.22 320) 45%, oklch(0.58 0.22 5));

/* discount / save pill (magenta) */
bg: oklch(0.68 0.25 5 / 0.14); color: var(--brand-magenta); border: oklch(0.68 0.25 5 / 0.26);
/* success / "rewarded" / free (green) */
bg: oklch(0.78 0.18 150 / 0.14); color: var(--success);

/* subject gradients (6) — ใช้ทั้ง About subject-cards และ Courses thumbs */
tgat2: linear-gradient(145deg, oklch(0.42 0.20 295), oklch(0.52 0.22 320));
tpat3: linear-gradient(145deg, oklch(0.46 0.22 330), oklch(0.56 0.22 5));
amath: linear-gradient(145deg, oklch(0.40 0.18 270), oklch(0.50 0.20 300));
aphys: linear-gradient(145deg, oklch(0.38 0.16 240), oklch(0.50 0.16 205));
math : linear-gradient(145deg, oklch(0.44 0.18 280), oklch(0.40 0.18 320));
phys : linear-gradient(145deg, oklch(0.40 0.15 225), oklch(0.46 0.15 195));
```

**Spacing rhythm (marketing ≠ app):**
- marketing: `section { padding: 120px 0 }` (`.tight` = 80px) · `.container` max 1280 · `.container-wide` max 1360 · pad 32px
- app pages ยังแน่นกว่า (sidebar shell) — **อย่าผสม `section{120px}` เข้า app pages** (ดูข้อ 5)

---

## 5. Lessons Learned

**ปรับจาก Batch 1–7**
- reuse `.testi-card` (Landing) ในทั้ง Testimonials + Results ได้เลย — score card = testi-card + `.score-block`.
- FAQ accordion = native `<details>` (เบา, ไม่ต้อง JS เปิด/ปิด) + เลเยอร์ filter/search ด้านบน.
- การ์ดทุกชนิด render จาก **JS data array** → swap ข้อมูลจริงง่าย, ใส่ `id` ให้ทุกคอร์สเพื่อ deep-link.

**Anti-patterns ที่เจอ (กันพลาดรอบหน้า)**
1. **IntersectionObserver ถูก throttle ใน iframe ที่อยู่เบื้องหลัง** → `.reveal` ค้าง opacity:0. แก้ด้วย **setTimeout failsafe** ปลด `.in` ให้ element ที่ยังอยู่ใน viewport หลัง ~1.6s. (ใส่ใน `marketing-common.js` แล้ว)
2. **`<span>` ที่ตั้ง width%/height%** จะยุบเป็น 0 — rating bar `.fill` ต้อง `display:block`.
3. **selector กว้างชนกัน:** `nav { justify-content:space-between }` ใน marketing.css ไปโดน breadcrumb ที่เป็น `<nav>` → เปลี่ยน breadcrumb เป็น `<div class="crumb">`.
4. **`overflow:hidden` คลิป floating chips** → ย้าย chips ออกนอกกล่องที่ clip (`.about-photo-wrap` ครอบ `.about-photo`).
5. **`section { padding:120px }` ของ marketing.css จะระเบิด layout ของ app `.section`** → ตอนแปลง `Course Detail.html` เป็น marketing **ไม่ได้ลิงก์ `marketing.css`** แต่ **inline เฉพาะ nav+footer CSS** เพื่อเลี่ยง collision. (บทเรียน: marketing.css ปลอดภัยเฉพาะหน้า marketing ล้วน)
6. **segmented control (Tweaks)** ขับด้วย pointer events — synthetic `.click()` ไม่ทำงาน, ต้อง dispatch `pointerdown/up`.

**Reusable ต่อ Batch หน้า**
`PricingCard` · `FeatureCompareTable` · `TestimonialCard/.review` · `FaqAccordion` · `LegalLayout` · `.cmethod` (contact) · `.share-card`+toast · `marketing.css`/`marketing-common.js` (nav/footer/reveal) · subject gradient tokens (6).

**โครงสร้างที่วางไว้ให้ backend ต่อ**
ทุกหน้าคอร์ส (public `Courses`/`Course Detail`, app `My Courses`, `Admin Courses/Editor`) ตอนนี้ถือ data แยกกัน (mock). field/`id` ออกแบบให้ตรงกัน → ต่อ backend = อ่านจากฐานข้อมูลกลางที่เดียว แก้ Admin แล้วสะท้อนทุกหน้า (ยังไม่ทำใน design phase).
