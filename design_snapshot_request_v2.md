# 📦 Design System Snapshot — Delta Update (Batch 3 → Batch 4)

> **ส่งใน Claude Design แชท Batch 3 (ก่อนปิด)**
> เป็น **delta update** เท่านั้น — ไม่ต้องทำ full snapshot ใหม่ทั้งหมด เพราะเรามี snapshot จาก Batch 2 อยู่แล้ว
> เน้นเก็บเฉพาะ **สิ่งที่เพิ่ม / เปลี่ยน / refined ใน Batch 3**

---

ก่อนปิด session นี้ ขอ **delta snapshot** สำหรับ Batch 3 — จะเอาไปต่อกับ snapshot Batch 2 ในแชทใหม่ ขอครอบคลุม:

## 1. New Components (Code)
ขอ HTML + Tailwind code ของ components ที่สร้างใน Batch 3 ทั้งหมด:
- `<ExamTimer>` — normal / warning / critical states (สำคัญ: animation pattern)
- `<QuestionNavigator>` — 5×6 grid + states (unanswered / answered / flagged / current)
- `<CustomRadio>` — letter label + selected / hover states
- `<ScoreRevealRing>` — SVG + counter sync + tier color logic
- `<LetterGradeBadge>` — A+/A/B+/B/C+/C/D/F styling per tier
- `<PerformanceBarChart>` — topic breakdown bars
- `<QuestionReviewItem>` — accordion + correct/wrong indication
- `<SparklineChart>` — 30-day trend
- `<ConfirmSubmitModal>` — destructive variant + unanswered list
- `<Sparkles>` particle — lighter than confetti
- `<TierUnlockToast>` — badge celebration

## 2. Animation Patterns (NEW)
- **Score reveal sequence** — full timeline (0s → 5.5s) พร้อม easing functions
- **Sympathy mode transition** — ต่างจาก celebration ยังไง (สี + timing + copy)
- **Neutral mid-tier (51-79%)** — ระดับกลาง: ไม่ confetti, ไม่ sympathy
- **Timer pulse** — warning state vs critical state

## 3. Design Decisions (NEW)
- **Tier color mapping** สำหรับ score reveal:
  - ≥80% (celebration): สี + glow / confetti spec
  - 51-79% (neutral): สี + subtle motion spec
  - ≤50% (sympathy): สี + copy tone (encouraging keywords)
- **Letter grade hierarchy** — A+/A/B+/B/C+/C/D/F mapped กับ % range
- **Percentile fallback** — กรณีข้อมูลไม่พอ แสดงอะไรแทน
- **Question Navigator** — เลือก grid (ไม่ใช่ list) เพราะ OMR familiarity
- **Auto-save** — ใช้ persistent status (Google Docs style) ไม่ใช่ toast

## 4. Tokens ที่ refine / เพิ่ม
- มี OKLCH color values ใหม่ไหม? (เช่น tier celebration colors, timer warning red)
- Shadow / glow patterns ใหม่ (gold glow ใน score reveal, timer pulse glow)
- Animation timing constants ใหม่ (counter-up duration, ring-draw duration)

## 5. Lessons Learned
- มี pattern ไหนที่ design มา Batch 1-2 แล้วต้องปรับใน Batch 3 ไหม?
- มี anti-pattern ที่ค้นพบใน Batch 3 (สิ่งที่ไม่ควรทำใน batch หน้า) ไหม?

---

**Format:** Markdown 1 block — สั้นได้ เน้นใช้งานต่อได้

**ใช้ทำอะไร:** เอาไปแปะใน Claude Design แชทใหม่ Batch 4 (Auth + Commerce) — รวมกับ snapshot Batch 2 เดิม

ขอบคุณครับ — Score reveal animation นี่ทำได้เทพมากจริง
