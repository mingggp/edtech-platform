# 📦 Design System Snapshot — Delta Update (Batch 6 → Batch 7)

> **ส่งใน Claude Design แชท Batch 6 (ก่อนปิด)**
> เป็น **delta update** เท่านั้น — มี snapshot Batch 2 + delta Batch 3/4/5 อยู่แล้ว
> เน้นเฉพาะ **สิ่งที่เพิ่ม / เปลี่ยน / refined ใน Batch 6 (Gamification & Engagement)**

---

## ⚠️ สำคัญ — สร้างเป็น Document/Artifact ด้วย (อย่าลืม!)

**ขอให้ตอบกลับเป็น Document (Artifact) จริงๆ ไม่ใช่แค่พิมพ์ในแชท** — จะได้ copy เก็บเป็นไฟล์ไปใช้ใน Batch 7 ได้สะดวก ที่ผ่านมาชอบลืมสร้าง Document ขอย้ำว่า **รอบนี้สร้าง Artifact ชนิด Markdown ให้ด้วยนะ** 🙏

---

ก่อนปิด session นี้ ขอ **delta snapshot** สำหรับ Batch 6 — จะเอาไปต่อกับ snapshot Batch 2 + delta Batch 3/4/5 ในแชทใหม่ Batch 7 ขอครอบคลุม:

## 1. New Components (Code)
ขอ HTML + Tailwind code ของ components ที่สร้างใน Batch 6 ทั้งหมด:
- `<StreakWidget>` — 🔥 + วันต่อเนื่อง + สถานะวันนี้ (states: ยังไม่เรียน / เรียนแล้ว / กำลังจะหลุด / freeze)
- `<StreakCalendar>` — heatmap เดือน + best/total active days
- `<StreakFreeze>` — ❄️ count + กลไกกันหลุด
- `<DailyGoalRing>` — วงแหวนเป้านาที (base จาก ScoreRevealRing)
- `<QuestCard>` — 3 ภารกิจวันนี้ + reward + เช็คลิสต์
- `<XPProgressBar>` — XP ปัจจุบัน/ถัดไป + "อีก X"
- `<LevelBadge>` — เลเวล + tier color (bronze→diamond)
- `<LevelUpModal>` — ring fill + tier ใหม่ + celebration
- `<BadgeProgressCard>` — bar + เงื่อนไขที่เหลือ
- `<RarityTag>` — common→legendary styling + glow
- `<LeaderboardPodium>` — top 3 visual
- `<MyRankRow>` — sticky อันดับตัวเอง
- `<BadgeUnlockModal>` — เหรียญเด้ง + sparkle

## 2. Animation / Interaction Patterns (NEW)
- **Streak flame** — animation เปลวไฟติด/ใกล้หลุด/freeze
- **XP ring + daily goal ring fill** — ต่อยอดจาก ScoreRevealRing ยังไง (timing/easing)
- **Level-up sequence** — timeline เต็ม
- **Celebration tiers** — เรื่องใหญ่ (full confetti) / กลาง (toast+sparkle) / เล็ก (micro) แยกยังไง
- **Toast queue** — ปลดล็อกหลายอย่างพร้อมกัน → คิวทีละอัน

## 3. Design Decisions (NEW)
- **"สนุกแบบมีน้ำใจ"** — streak freeze (ไม่ลงโทษ), เทียบตัวเอง > เทียบคนอื่น, ไม่มี dark pattern
- **XP formula** — เรียน/สอบ/เหรียญ/streak ให้ XP เท่าไหร่ (สรุปที่เคาะ)
- **Level tier mapping** — เลเวล → tier name + สี
- **Rarity tiers** — เกณฑ์ common/rare/legendary
- **Leaderboard scope** — tab ตลอดกาล/สัปดาห์/(เพื่อน) + privacy hide

## 4. Tokens ที่ refine / เพิ่ม
- OKLCH values ใหม่ (streak flame, tier colors bronze→diamond, rarity glow)
- Shadow/glow patterns ใหม่ (legendary glow, level-up ring)
- Animation timing constants ใหม่ (flame, ring fill, level-up)

## 5. Lessons Learned
- pattern ไหนจาก Batch 1-5 ที่ปรับใน Batch 6
- anti-pattern ที่เจอ
- component ไหน reusable ไป Batch 7 (เช่น ring, celebration → onboarding complete)

---

**Format:** **Artifact ชนิด Markdown** (ขอเป็น Document จริงๆ อย่าลืม) — สั้นได้ เน้นใช้งานต่อได้

**ใช้ทำอะไร:** เอาไปแปะใน Claude Design แชทใหม่ Batch 7 (Onboarding + Notifications + Settings) — รวมกับ snapshot Batch 2 + delta Batch 3/4/5 เดิม

ขอบคุณครับ 🙏
