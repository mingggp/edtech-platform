# 🎨 Mingsmileyface — Batch 3: Exam System

> **ส่งใน Claude Design แชทใหม่** หลังแปะ Design System Snapshot จาก Batch 2 แล้ว
> เนื้อหา: ระบบข้อสอบครบวงจร — list → take → result reveal

---

## 🆕 บริบทแชทใหม่

นี่คือแชทใหม่สำหรับ **Batch 3** ของโปรเจกต์ **Mingsmileyface** (เว็บคอร์สเรียนออนไลน์สำหรับนักเรียนม.ปลายไทย โดยติวเตอร์เดี่ยว)

**แชทก่อนหน้า** ทำไปแล้ว 2 batches:
- **Batch 1:** Brand Identity + Landing + Dashboard
- **Batch 2:** Courses Discovery + Course Detail + Learn Page + Public Profile

Design tokens + components ทั้งหมดอยู่ใน **Snapshot ข้างบน** ↑ — ใช้ค่าเดิม **ห้ามทำใหม่** เพื่อ consistency

---

## 🎯 Recap Brand (สั้นๆ)

- **Vibe:** Premium Pop — Apple Music / Spotify / Linear / Arc Browser / Spotify Wrapped
- **Device priority:** Desktop 1440px + iPad 1024px → Mobile 375px (รอง)
- **Mode:** Dark mode first, light mode toggle
- **Tone:** เพื่อนติวเตอร์ที่ฉลาด ไม่ใช้ slang เด็กๆ
- **Target:** นักเรียน ม.4–ม.6 ไทย

---

## 📚 Batch 3: 4 หน้า

### 1. `/exams` — Exam Listing
**Goal:** ให้นักเรียนเลือกข้อสอบ "ที่อยากท้าทาย" — ไม่ใช่ list น่าเบื่อแบบโรงเรียน

**Layout (Desktop):**
- **Hero header slim:** "ห้องสอบ" + tagline "ลองตัวเองดู — รู้จุดอ่อนก่อนไปสอบจริง"
- **Filter row** (ใช้ FilterChips pattern เดิมจาก /courses):
  - Subject chips (ใช้ subject gradient colors เดิม)
  - Pill: ทั้งหมด / ยังไม่เคยทำ / ทำแล้ว / ทำซ้ำได้
- **Exam cards grid** (3 cols Desktop / 2 iPad / 1 Mobile):
  - **Card design:**
    - Top strip: subject gradient bar (4px ด้านบน) ตามวิชา
    - Difficulty pill (มุมขวาบน): ง่าย / กลาง / ยาก / โหด (color: emerald/amber/orange/rose)
    - Title (display)
    - Description 2 บรรทัด
    - Stats row: ⏱️ X นาที • 📝 Y ข้อ • 🎯 ทำมาแล้ว Z ครั้ง
    - ถ้าเคยทำ: แสดง best score เป็น mini-ring + "เคยได้ X%"
    - CTA: "เริ่มทำ" (primary) หรือ "ทำซ้ำ" (secondary ถ้าเคยทำแล้ว)
  - Hover: lift + shadow + subject color subtle glow
- **Featured exam strip** ด้านบน (1 ข้อสอบโชว์ใหญ่): ข้อสอบ TGAT/A-Level mock ล่าสุด

---

### 2. `/exams/[id]/take` — **Taking Exam (FOCUS MODE)**
**Goal:** สมาธิเต็มที่ — ลด distraction ให้หมด แต่ progress ต้องชัด

**Layout (Desktop 2-zone):**

```
┌──────────────────────────────────────────────┐
│  Exam title (slim)         ⏱️ 24:36 ⚠️ [Submit]│  ← Top bar (sticky)
├──────────┬───────────────────────────────────┤
│          │                                   │
│ Q nav    │   Question content                │
│ (180px)  │   (centered, max-w-3xl)           │
│          │                                   │
│ Grid     │   "ข้อ 12 / 30"                    │
│ 1-30     │   Question text                   │
│          │   [Image if any]                  │
│ ●●●○○    │                                   │
│ ✓✓✓?○    │   ◯ A. choice 1                  │
│ ...      │   ◯ B. choice 2                  │
│          │   ● C. choice 3 (selected)       │
│ Flag for │   ◯ D. choice 4                  │
│ review   │                                   │
│          │   [← ก่อนหน้า]  [ถัดไป →]          │
└──────────┴───────────────────────────────────┘
```

**Top bar (sticky):**
- Exam title (truncate ถ้ายาว)
- **Timer** — center / right
  - Default: ตัวเลขใหญ่ + ⏱️ icon
  - Warning state (เหลือ < 5 นาที): pulse + amber color
  - Critical (เหลือ < 1 นาที): red + faster pulse + subtle shake
- Submit button (primary danger color)
- Progress bar บางๆใต้ bar (Z/Total)

**Question Navigator Sidebar (Left):**
- 5×6 grid ของหมายเลขข้อ (ถ้า 30 ข้อ)
- States ต่อข้อ:
  - ⚪ ยังไม่ทำ (empty circle outline)
  - ✓ ตอบแล้ว (filled circle indigo)
  - 🚩 marked for review (amber outline + flag icon)
  - 🟦 currently viewing (ring + scale 1.1)
- "Flag for review" ปุ่มล่าง — กดเพื่อ mark ข้อปัจจุบัน
- Mini-stats: "ตอบแล้ว 12/30 · เหลือ 18"

**Question Content (Center):**
- ข้อ "12 / 30" เล็กๆ ด้านบน + subject tag
- Question text (text-lg, readable line-height)
- Image (ถ้ามี) — max-w-2xl, rounded-2xl, subtle shadow
- 4 choices vertical:
  - **Custom radio design** (อย่าใช้ default browser):
    - Outline 2px ปกติ
    - Selected: indigo background + white text + checkmark icon
    - Hover: subtle bg + border indigo
    - มี letter label (A B C D) วงกลม 32px ทางซ้าย
    - Text เป็น text-base, padding generous (16px vertical)
  - Spacing 12px ระหว่างตัวเลือก
- **Nav buttons** ด้านล่าง:
  - "← ก่อนหน้า" (ghost) | "ถัดไป →" (primary)
  - Keyboard hint: "↑↓ เปลี่ยนข้อ · 1-4 เลือกตัวเลือก · F = flag"

**Submit Confirmation Modal:**
- ก่อน submit เช็คว่ามีข้อยังไม่ตอบไหม
- ถ้ามี: "เหลือ X ข้อยังไม่ตอบ · แน่ใจจะส่ง?" + แสดง list ข้อที่ยังว่าง
- ปุ่ม: "กลับไปทำต่อ" (primary) | "ส่งเลย" (destructive)

**Critical UX:**
- **Auto-save ทุก answer** ทันทีที่เลือก (มี subtle indicator "บันทึกแล้ว ✓" ที่ corner)
- **Confirm before leaving** — beforeunload warning ถ้ายังไม่ submit
- Timer ไม่หยุดถ้า refresh (เป็น server time)

---

### 3. `/exams/results/[id]` — **Result Reveal (THE WOW MOMENT)**
**Goal:** เปิดผลแบบ **Spotify Wrapped** — ให้รู้สึกพิเศษ

**Layout — 2 phases:**

**Phase A: Reveal Animation (5-7 วินาที, auto-play)**
1. Black/dark canvas + spotlight effect (radial gradient)
2. "ผลสอบของคุณ..." fade in (subtle)
3. **Score circle progress ring** ขนาดใหญ่ 280px:
   - Stroke animates 0% → final % (ใช้ 2.5s easeOutCubic)
   - Number counts up 0 → score (parallel animation)
   - Color ของ ring เปลี่ยนตาม performance:
     - ≥85% → emerald + confetti burst (reuse Batch 2 component!) + gold glow
     - 70-84% → indigo + sparkles
     - 50-69% → amber + neutral
     - <50% → muted + กำลังใจ message
4. **Letter grade** (A+/A/B+/B/C+/C/D/F) reveal ด้านล่าง — bouncy scale entrance
5. Hold 1 วินาทีให้ดู
6. Auto-transition → Phase B

**Phase B: Detailed Review (scroll-able)**

**Hero strip (sticky-ish):**
- Score circle เล็กลง (120px) ด้าน left
- ขวา: Exam title + "ทำเมื่อ X นาที/ชม.ที่แล้ว" + tier badge
- Stats grid (4):
  - คะแนนรวม — "24 / 30"
  - %ถูก — "80%"
  - เวลาที่ใช้ — "18:42 / 30:00"
  - Ranking — "ติด top 12% ของคนที่ทำข้อสอบนี้"

**Performance breakdown card:**
- Bar chart โชว์แต่ละหมวด:
  - "พีชคณิต": ████████░░ 8/10
  - "เรขาคณิต": ██████░░░░ 6/10
  - ฯลฯ
- Insight ที่ขับเน้น: "💪 จุดแข็ง: เรขาคณิต" / "📚 ควรเสริม: ตรีโกณ"

**Question-by-question review (accordion or list):**
- แต่ละข้อ:
  - ✓ (เขียว) หรือ ✗ (แดง) icon
  - "ข้อ 12" + question text snippet
  - "คำตอบของคุณ: B" | "เฉลย: C" (เน้นความต่างถ้าผิด)
  - Expand → เห็น full question + เฉลยพร้อม explanation
  - Tag subject category
- Filter chips: ทั้งหมด / ผิดเท่านั้น / ถูกเท่านั้น / flagged
- 6-grid mini-overview ด้านบน (เหมือน navigator แต่ static + เขียว/แดง)

**Bottom CTA bar:**
- "ทำข้อสอบนี้อีกครั้ง" (primary)
- "ดูข้อสอบอื่น →" (ghost)
- "แชร์ผล" (icon)
- **ถ้าได้ tier ใหม่:** "🏆 ปลดล็อกเหรียญ: [Badge name]" — เด้ง toast หรือ modal celebration

---

### 4. `/exams/results` — Past Results List
**Goal:** track progress over time — ให้เห็นว่าเก่งขึ้น

**Layout:**
- **Header slim:** "ผลสอบของฉัน" + นับ "X ครั้ง"
- **Stats summary card** (full-width gradient bg):
  - คะแนนเฉลี่ย / สัปดาห์นี้ทำกี่ครั้ง / best score
  - **Sparkline chart** เล็กๆ โชว์ trend คะแนนเฉลี่ย 30 วันล่าสุด
- **Filter row:** subject chips + date range (week/month/all)
- **Result cards stacked** (1 col Desktop, full-width):
  - Row layout:
    - Left: small score ring (60px) + grade letter
    - Center: Exam title + subject tag + "ทำเมื่อ 2 วันที่แล้ว" + "ใช้เวลา 18 นาที"
    - Right: vertical buttons "ดูผล" + "ทำซ้ำ"
  - Click ทั้ง row → ไป `/exams/results/[id]`
  - Hover: lift + subject color glow
- **Empty state:** "ยังไม่เคยทำข้อสอบ — ลองสักข้อสิ?" + CTA

---

## 🧩 Custom Components ใหม่

| Component | Where | Detail |
|---|---|---|
| `<ExamTimer>` | Take page | normal/warning/critical states + pulse animation |
| `<QuestionNavigator>` | Take page | 5×6 grid + flag state + current state |
| `<CustomRadio>` | Take page | letter label + selected state + hover |
| `<ScoreRevealRing>` | Result reveal | SVG ring + counter + color tier |
| `<LetterGradeBadge>` | Result | A+ to F with tier styling |
| `<PerformanceBarChart>` | Result | category breakdown |
| `<QuestionReviewItem>` | Result | accordion expand + correct/wrong indication |
| `<SparklineChart>` | Result list | 30-day trend |
| `<ConfirmSubmitModal>` | Take page | with unanswered list |
| `<Sparkles>` particle | Reveal mid-tier | lighter than confetti |
| `<TierUnlockToast>` | Result | celebrate new badge |

**REUSE จาก Batch 2** (อย่าทำใหม่):
- `<ConfettiBurst>` — เอามาใช้ใน reveal high score
- `<ProgressRing>` — base ของ ScoreRevealRing
- `<FilterChips>` — exam list filter
- `<Card>` variants ทั้งหมด
- `<Button>` ทุก variant
- `<EmptyState>`

---

## 🎬 Animation Spec (สำคัญสำหรับ Reveal)

**Score Reveal sequence:**
```
0.0s  → backdrop fades in (dark)
0.3s  → spotlight radial gradient appears
0.5s  → "ผลสอบของคุณ..." text fade in
1.0s  → number counter starts (0 → final, 2.5s duration, easeOutCubic)
1.0s  → ring stroke starts drawing (parallel)
3.5s  → ring + number lock, pause 0.3s
3.8s  → letter grade scales in (spring: scale 0.5 → 1.2 → 1.0)
4.1s  → IF score ≥85%: confetti fires + emerald glow pulse
4.5s  → "ดูรายละเอียด" hint appears
5.5s  → auto-transition to Phase B (or click to skip)
```

Keep animations skippable (ESC or click).

---

## 📦 Deliverable

ส่งเป็น HTML+Tailwind ใน Artifact ทีละหน้า ตามลำดับ:

1. **`/exams`** (listing — ใช้ pattern เดิมเยอะ, warm-up)
2. **`/exams/[id]/take`** (focus mode — สำคัญสำหรับ UX)
3. ⭐ **`/exams/results/[id]`** (THE WOW — ทุ่ม animation ที่นี่)
4. **`/exams/results`** (past results — ใช้ pattern คล้าย dashboard)

หยุดหลังแต่ละหน้าให้ Ming feedback — อย่าทำรวด

ทุก artifact ต้องมี:
- Dark + Light mode toggle
- Desktop + iPad preview
- Mock data จริง: ชื่อข้อสอบ "TGAT3 พิชิตคณิต Mock #4" / "A-Level Physics Final Round" / คำถามคณิตจริง
- States: empty / mid-progress / completed / timeout

---

**ถามก่อนเริ่ม:** Reveal animation อยากให้เป็น **(a) ฟูลสกรีน blackout takeover** (Spotify Wrapped style) หรือ **(b) inline ใน page ปกติ** (เปิดมาเห็นการ์ดผล + animation อยู่ใน hero)?

แนะนำ (a) สำหรับ first-time view, แล้วถ้ากลับมาดูซ้ำเป็น (b) — แต่อาจซับซ้อน เลือก (b) ตลอดก็ได้ถ้าทำง่ายกว่า
