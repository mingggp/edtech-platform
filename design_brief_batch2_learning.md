# 🎨 Mingsmileyface — Batch 2: Core Learning Flow

> Continuation prompt สำหรับ Claude Design
> Batch 1 (Brand Identity + Landing + Dashboard) ผ่านแล้ว — ครั้งนี้เป็น "หัวใจ" ของแพลตฟอร์ม

---

## 🔁 Recap (อย่าหลุดจาก Batch 1)

- **Brand:** Mingsmileyface — ติวเตอร์คนเดียว สำหรับนักเรียน ม.ปลายไทย
- **Vibe:** **Premium Pop** — Apple Music / Spotify / Linear / Arc Browser
- **Priority device:** Desktop (1440px) + iPad (1024px) → Mobile (375px) เป็นรอง
- **Colors:** Indigo (#5B5BD6 ish) + Amber accent, OKLCH-based, **Dark mode first**
- **Type:** Plus Jakarta Sans (display) + Inter (body)
- **Tech ที่ implement ได้:** Next.js 15 + Tailwind 4 + shadcn/ui + lucide-react
- **Tone:** เพื่อนติวเตอร์ที่ฉลาด — ไม่ใช้ "555 / งับ / จ้าาา"

---

## 🎯 หน้าที่ต้องออกแบบใน Batch นี้ (4 หน้า)

### 1. `/courses` — Course Discovery
**Goal:** ให้นักเรียนเจอคอร์สที่ใช่ภายใน 3 วินาที — ไม่ใช่ wall of cards ที่น่าเบื่อ

**Layout (Desktop 1440px):**
- **Hero header** บางๆ: "คอร์สเรียนทั้งหมด" + นับจำนวน + search bar (ขวา)
- **Filter chips** แถวเดียว: ทั้งหมด / คณิต / ฟิสิกส์ / เคมี / ชีวะ / TGAT / A-Level (กดได้ active state)
- **Sub-filter pill:** ม.4 / ม.5 / ม.6 / เตรียมสอบ
- **Featured strip** ด้านบน: 1 คอร์สใหญ่ horizontal card (gradient bg + cover ใหญ่ + CTA)
- **Grid:** 3 columns (Desktop) / 2 (iPad) / 1 (Mobile)
- **Card design:**
  - Cover image 16:9 + gradient overlay
  - Title (display font) + category tag
  - Stats row: นักเรียน X คน • Y บทเรียน • Z ชั่วโมง
  - Price (ขวาล่าง) — ถ้าฟรีโชว์ badge "ฟรี" สีเขียว, ถ้ามีส่วนลดโชว์ราคาขีดฆ่า
  - Hover: ยกขึ้น 4px + shadow + cover scale 1.02
- **Empty state:** ภาพ illustration น่ารัก + "ยังไม่มีคอร์สในหมวดนี้"

---

### 2. `/courses/[id]` — Course Detail
**Goal:** ให้นักเรียน "อยากจ่าย" — sell the transformation, not the features

**Layout (Desktop 2-column split):**

**Hero section (full-width):**
- Background: cover image + dark gradient overlay
- ซ้าย (60%): Category tag → Title ใหญ่ display → 1-line tagline → instructor chip (avatar + "by Ming")
- ขวา (40%): Sticky enroll card
  - Cover image
  - Price ใหญ่ + ราคาขีดฆ่าถ้ามีส่วนลด
  - CTA primary: **"ลงทะเบียนเรียน"** (ถ้าซื้อแล้วเปลี่ยนเป็น **"เรียนต่อ"** + progress bar เล็กๆ ด้านล่าง)
  - Quick stats row: ⏱️ Y ชม. • 📚 Z บท • 🎯 ม.X

**Body section (max-w-4xl center):**
- **เกี่ยวกับคอร์ส** — paragraph 2-3 ย่อหน้า
- **สิ่งที่จะได้** — 6 ข้อ grid 2 cols พร้อม icon ✓ amber
- **เนื้อหา** — accordion ของบท → ขยายเห็นบทเรียน (title + ⏱️ duration + 🔒/👁️ icon)
- **ผู้สอน** — large avatar + bio + social icons
- **FAQ** — accordion (mockup ก็ได้)

**สำคัญ:** ต้องมี mobile-sticky bottom bar ที่โชว์ราคา + ปุ่ม "ลงทะเบียน" (เมื่อ scroll ผ่าน hero)

---

### 3. `/learn/[id]` — Learning Page **(THE HEART)**
**Goal:** focused study mode — ให้นักเรียนไม่อยากปิดแท็บ

**Layout (Desktop 3-zone):**

```
┌────────────────────────────────────────────────────┐
│  SiteHeader (slim variant — ไม่ใช่ full header)     │
├──────────┬───────────────────────────────┬─────────┤
│          │                               │         │
│ Sidebar  │   YouTube Player              │  Notes  │
│ (280px)  │   (16:9, max-w-5xl)           │  Panel  │
│          │                               │  (320px,│
│ Chapters │                               │  toggle)│
│ & Lessons│                               │         │
│          │                               │         │
│          ├───────────────────────────────┤         │
│          │   Lesson info + actions       │         │
│          │   Tabs: Overview/Resources/Q&A│         │
└──────────┴───────────────────────────────┴─────────┘
```

**Sidebar (Left — collapsible):**
- บนสุด: Course title (truncate) + ⬅ back link
- Course progress bar + % (sticky)
- Chapter cards (collapsed by default, expand active)
  - Chapter number + title + "X/Y บทเรียน"
  - Lessons list:
    - ▶ active = indigo background + glow
    - ✓ completed = checkmark amber
    - 🔒 locked = greyed (ถ้ายังไม่จ่าย)
    - duration ด้านขวา

**Center (Video + Info):**
- YouTube player ไม่มี border, มี subtle drop shadow
- ด้านล่าง player:
  - Lesson title (display, ใหญ่)
  - Meta: Chapter X • Lesson Y • ⏱️ Z นาที
  - **"ทำเครื่องหมายว่าเรียนจบ"** button — primary, มี particle burst animation เมื่อกด
  - Prev / Next lesson buttons (ghost)
- Tabs: Overview (description) / Resources (doc links) / Q&A (mockup)

**Right Notes Panel (toggleable):**
- ปุ่ม toggle ลอย (sticky right edge)
- เปิดมาเป็น textarea + auto-save indicator
- ปุ่ม "บันทึก timestamp ปัจจุบัน" → จด timestamp video + notes
- (จะ implement จริงทีหลัง — ทำ UI ก็พอ)

**Critical animations:**
- Mark complete → ✓ ขึ้นใน sidebar + progress bar fill smooth + tiny confetti burst (subtle, ไม่งานวัด)
- เปลี่ยน lesson → fade transition
- Sidebar collapse → smooth slide

**iPad mode (1024px):** ซ่อน Notes panel เป็น drawer, sidebar เป็น overlay กดเปิด

---

### 4. `/u/[id]` — Public Profile (with Achievements)
**Goal:** ให้นักเรียนภูมิใจที่จะแชร์ลิงก์โปรไฟล์ตัวเอง

**Layout:**

**Hero Banner:**
- Background: gradient mesh ตาม brand colors + subtle noise texture
- Avatar 120px ring-4 (white) อยู่กลางหรือซ้าย
- Name (display, ใหญ่) + nickname เป็น "@nickname"
- Pills row: 🎓 ม.5 • DEK67 • streak 🔥 12 days
- ปุ่มขวาบน: Share (ถ้าเป็นเจ้าของโปรไฟล์ — Edit Profile)

**Stats Row (4 cards):**
- เวลาเรียนรวม (ชั่วโมง) + icon clock
- คอร์สลงทะเบียน + icon book
- บทเรียนเรียนจบ + icon check
- อันดับ leaderboard ปัจจุบัน + icon trophy

**🏆 Achievements Showcase (เด่นที่สุด):**
- Section title: "เหรียญที่โชว์" + ลิงก์ "จัดการเหรียญ →" (ถ้าเจ้าของ)
- 3 badges ใหญ่ตรงกลาง (เลือกโชว์ได้ 3) — vertical card with:
  - SVG badge ring (ไม่ใช่ emoji!) ขนาดใหญ่ มี glow + shimmer animation
  - Badge name (display)
  - Earned date

**📚 Gallery (ทุก badges):**
- Grid 6 cols (Desktop) / 4 (iPad)
- Unlocked: เต็มสี + tooltip hover แสดง detail
- Locked: greyscale + 🔒 overlay + hint text เล็กๆ
- Categories: เริ่มเรียน / ขยัน / ทำข้อสอบ / ครบ 100 ชม. / ฯลฯ

**Recent Activity (optional):**
- Timeline เล็กๆ: "เรียนจบ บทที่ X" / "ได้เหรียญ Y" / "ทำข้อสอบ Z ได้คะแนน W"

---

## 🧩 Custom Components ใหม่ที่ต้องออกแบบ

| Component | Where | Detail |
|---|---|---|
| `<ChapterAccordion>` | Course detail + Learn sidebar | smooth expand, chevron rotate |
| `<LessonRow>` | Learn sidebar | 4 states: locked/active/completed/preview |
| `<VideoPlayer>` shell | Learn page | YouTube iframe + custom skin (เฟรมรอบ + shadow) |
| `<ProgressRing>` SVG | Multiple places | animated stroke-dashoffset |
| `<BadgeRing>` SVG | Public profile + Dashboard | 7 designs ต่อกันได้ (ฟรอม Batch 1 ถ้าทำแล้วใช้ต่อ) |
| `<MarkCompleteButton>` | Learn page | particle burst on click |
| `<EnrollCard>` sticky | Course detail | desktop sidebar + mobile bottom bar |
| `<NotesPanel>` | Learn page | slide-in drawer |
| `<FilterChips>` | Courses listing | active state + clear filter |
| `<EmptyState>` | Courses listing + Profile | illustration + message |

---

## 🎨 Reminders

- **อย่าใช้ emoji เป็น icon หลัก** — ใช้ lucide-react หรือ custom SVG
- **OKLCH colors เท่านั้น** (อย่าใช้ hex ใน design tokens)
- **Glass morphism** ใช้ที่ navigation + sticky bars + modal เท่านั้น (อย่าใช้เต็มหน้า)
- **Spacing rhythm:** ใช้ 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px
- **Border radius:** card = 16px, button = 12px, pill = full
- **Mock data:** ใช้ชื่อคอร์ส/บทเรียนที่สมจริง เช่น "ตรีโกณมิติ ม.5 เทอม 1" / "บทที่ 3: ฟังก์ชัน sin cos tan"
- **Sample names:** ชื่อนักเรียนใช้ไทย + nickname จริง เช่น "ปกรณ์ — Mickey" "พิมพ์ลภัส — Mind"

---

## 📦 Deliverable

ส่ง **HTML + Tailwind ใน Claude Artifact** ทีละหน้า ตามลำดับนี้:

1. ⏩ **`/courses`** ก่อน (ง่ายสุด เป็น warm-up)
2. **`/courses/[id]`** (sell page — ต้องสวย)
3. 🎯 **`/learn/[id]`** (สำคัญที่สุด — ถ้าหน้านี้สวย คนใช้จะติด)
4. **`/u/[id]`** (โชว์ achievement system สวยๆ)

**ก่อนข้ามไปหน้าถัดไป** หยุดให้ user (Ming) feedback ก่อน — อย่าทำรวด

ทุก artifact ต้องมี:
- Dark mode + Light mode toggle ใน corner
- Responsive — Desktop preview + iPad preview (toggle)
- Mock states: empty / loading / loaded / error (ถ้าเกี่ยวข้อง)
- Inline code comments อธิบาย "ทำไมเลือก design นี้"

---

**Question to Designer ก่อนเริ่ม:** อยากให้ Notes Panel ใน Learn page เป็น (a) overlay drawer ที่ปิดแล้วหาย หรือ (b) inline column ที่ resize-able? — เลือก (a) สำหรับ focus mode, (b) สำหรับ research mode
