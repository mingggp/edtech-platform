# 🎮 Mingsmileyface — Batch 6: Gamification & Engagement

> **ส่งใน Claude Design แชทใหม่** หลังแปะ:
> 1. Snapshot Batch 2 (เดิม)
> 2. Delta Snapshot Batch 3 (มี TierUnlockToast / Sparkles / ScoreRevealRing — สำคัญมากกับ batch นี้)
> 3. Delta Snapshot Batch 4
> 4. Delta Snapshot Batch 5
>
> เนื้อหา: ทำให้ "การกลับมาเรียนทุกวัน" สนุก — streak, XP/level, เหรียญ, จังหวะฉลอง

---

## 🆕 บริบทแชทใหม่

นี่คือแชทใหม่สำหรับ **Batch 6** ของโปรเจกต์ **Mingsmileyface** (เว็บคอร์สเรียนออนไลน์สำหรับ ม.ปลายไทย โดยติวเตอร์เดี่ยว)

**5 batches ก่อนหน้า:**
- **Batch 1:** Brand + Landing + Dashboard
- **Batch 2:** Courses + Detail + Learn + Public Profile
- **Batch 3:** Exam List + Take + Result Reveal + History
- **Batch 4:** Auth + Checkout + Payments + Profile
- **Batch 5:** Admin / Tutor Studio

**Batch 6 = ชั้นความสนุก (engagement layer)** — ของฟังก์ชันครบแล้ว ตอนนี้เติม "เหตุผลให้กลับมาทุกวัน" เป้าหมายคือ **retention** ของนักเรียน ม.ปลาย ที่หลุดง่าย

Design tokens + components ทั้งหมดอยู่ใน **snapshots ข้างบน** ↑ — **reuse ของเดิมเสมอ ห้ามทำใหม่** โดยเฉพาะ celebration components จาก Batch 3

---

## 🎯 Recap Brand (สั้น)
- **Vibe:** Premium Pop — Apple Music / Duolingo (engagement) / Spotify Wrapped (celebration) / Linear
- **Device:** Desktop 1440 + iPad 1024 → Mobile 375 (gamification เด็กเล่นบนมือถือเยอะ — mobile สำคัญกว่า batch ก่อนๆ)
- **Mode:** Dark first + light toggle
- **Audience:** นักเรียน ม.4–ม.6 — ชอบความสำเร็จที่เห็นภาพ แต่ **ห้ามให้รู้สึกกดดัน/เสพติด**

---

## 🧭 Design Decision สำคัญ — สนุกแบบมีน้ำใจ ไม่ใช่บีบคั้น

- **Streak ต้องไม่ลงโทษ:** มี "ตัวกันหลุด" (streak freeze) — พลาดวันนึงไม่ล้างศูนย์ทันที ลด anxiety
- **เทียบกับตัวเอง > เทียบกับคนอื่น:** leaderboard มี แต่ไม่ใช่พระเอก เน้น progress ส่วนตัว (เมื่อวาน vs วันนี้)
- **ฉลองแบบพอดี:** ปลดล็อกเหรียญใหญ่ = celebration เต็ม, เรื่องเล็ก = toast เบาๆ (อย่าให้ confetti เฝือ)
- **ไม่มี dark pattern:** ไม่มีนับถอยหลังกดดันให้ซื้อ ไม่มี "เพื่อนแซงคุณแล้ว!" แบบ toxic

---

## 📊 ของเดิมที่มีอยู่ (ต่อยอด ไม่ใช่เริ่มศูนย์)

> ✅ = มีข้อมูล/ระบบแล้ว | ⚠️ = ต้องเพิ่ม backend

- ✅ **7 เหรียญ** 3 หมวด (ทั่วไป/การเรียน/ขั้นเทพ) — คำนวณสดจาก log (newbie, ก้าวแรก, เครื่องร้อน, ป๋าเปย์, นกฮูก, ซอมบี้, นักรบวันหยุด)
- ✅ **หน้า /achievements** — grid ตามหมวด + tab (ทั้งหมด/ปลดล็อก/ยังไม่ปลดล็อก) + showcase ปักโปรไฟล์ได้ 6
- ✅ **หน้า /leaderboard** — เรียงตามเวลาเรียนสะสม (total_minutes) + podium top 3 + ลิงก์โปรไฟล์
- ✅ **StudyLog** เก็บเวลาเรียนทุกครั้ง (มี timestamp → คำนวณ streak/รายสัปดาห์ได้โดยไม่ต้องเพิ่มตารางใหม่)
- ⚠️ **ยังไม่มี:** streak, XP/level, วันที่ปลดล็อกเหรียญ, daily goal, จังหวะฉลองตอนปลดล็อก

---

## 📚 Batch 6: 6 หน้า/ระบบ แบ่ง 3 cluster

---

## CLUSTER A — Daily Habit (หัวใจ retention)

### A1. `<StreakSystem>` — ระบบเรียนต่อเนื่อง ⚠️ (คำนวณจาก StudyLog ได้)

ตัวที่ขาดหายและสำคัญสุดต่อ retention:

- **Streak widget (บน Dashboard):** 🔥 + เลขวันต่อเนื่อง + "เรียนวันนี้แล้ว/ยัง" — กดแล้วไปหน้า streak
- **Streak detail / calendar:** ปฏิทินเดือนนี้ ระบายวันที่เรียน (heatmap แบบ GitHub/Duolingo) + best streak + total active days
- **Streak freeze (ตัวกันหลุด):** ไอคอน ❄️ บอกว่ามีกี่อัน — พลาดวันนึง freeze จะกันให้ ไม่ล้างศูนย์
- **Milestone:** 3 / 7 / 30 / 100 วัน → celebration + เหรียญพิเศษ
- **States:** วันนี้ยังไม่เรียน (เตือนเบาๆ ไม่กดดัน) / เรียนแล้ว (เปลวไฟติด) / streak กำลังจะหลุด (เหลือ X ชม.) / freeze ทำงาน

### A2. `<DailyGoal>` + `<QuestCard>` — เป้าหมายรายวัน ⚠️

- **Daily goal ring (Dashboard):** วงแหวน progress "เป้าวันนี้ 30 นาที" (reuse pattern จาก ScoreRevealRing) — เติมเต็มแล้ว pulse + ฉลองเบาๆ
- **ภารกิจวันนี้ (3 quest):** เช่น "เรียน 1 บท · ทำข้อสอบ 1 ชุด · เรียนครบ 20 นาที" — เช็คลิสต์ + reward XP
- ตั้งเป้าเองได้ (15/30/60 นาที) — ปรับตามไหว ไม่บังคับ
- **States:** ยังไม่เริ่ม / กำลังทำ (x/3) / ครบแล้ว (เคลม reward)

---

## CLUSTER B — Progression (เห็นตัวเองโตขึ้น)

### B1. `<XPLevelSystem>` — แต้มและเลเวล ⚠️

ตอนนี้มีแค่ "นาทีสะสม" ดิบๆ — ทำให้เป็นระบบเลเวลที่เห็นภาพ:

- **Level badge:** เลเวลปัจจุบัน + ชื่อ tier (เช่น Lv.5 "นักเรียนขยัน") — โชว์บน profile/avatar
- **XP progress bar:** แต้มปัจจุบัน / ที่ต้องใช้ขึ้นเลเวลถัดไป + "อีก X XP"
- **XP sources (โปร่งใส):** เรียน 1 นาที = ? XP, ทำข้อสอบ = ? XP, ปลดล็อกเหรียญ = bonus, streak milestone = bonus — โชว์ให้เข้าใจว่าได้มาจากไหน
- **Level-up celebration:** modal + ring fill + Sparkles (reuse Batch 3) + ปลดล็อกอะไรใหม่
- **Tier visual:** สี/ไอคอนต่างกันต่อ tier (bronze → silver → gold → platinum → diamond)

### B2. `/achievements` — ยกเครื่องหน้าเหรียญ ✅⚠️

ต่อยอดของเดิม (grid + showcase ได้แล้ว) เติมสิ่งที่ทำให้ "อยากเก็บให้ครบ":

- **Progress บนเหรียญที่ยังไม่ปลดล็อก:** bar + "เรียนอีก 18 นาที จะได้ 🏆 เครื่องร้อน" (เดาเงื่อนไขจาก badge logic) ⚠️ ต้องส่ง progress มาจาก backend
- **Rarity tag:** เหรียญหมวด "ขั้นเทพ" = rare/legendary (สี + glow ต่างกัน)
- **วันที่ปลดล็อก** + "หายากแค่ไหน" (% ของนักเรียนที่มี) ⚠️
- **Next to unlock highlight:** ดันเหรียญที่ใกล้ปลดล็อกขึ้นบนสุด
- **Showcase picker:** ปรับ UX การปัก 6 เหรียญให้ลื่นขึ้น (drag จัดลำดับได้)
- **Empty/แรกเข้า:** "เริ่มเรียนเพื่อปลดล็อกเหรียญแรก"
- คงระบบ category + tab เดิมไว้

---

## CLUSTER C — Social & Celebration

### C1. `/leaderboard` — ยกเครื่องกระดานผู้นำ ✅⚠️

ของเดิมมีอันเดียว (นาทีสะสมตลอดกาล) — เพิ่มมิติให้ทุกคนมีโอกาสติด:

- **Tabs:** สัปดาห์นี้ / เดือนนี้ / ตลอดกาล (รายสัปดาห์คำนวณจาก StudyLog ได้ ⚠️) + (อนาคต: เฉพาะเพื่อน)
- **Podium top 3** แบบ visual เด่น (reuse celebration vibe) — ที่ 1 กลาง สูงสุด
- **"อันดับของคุณ" sticky row:** ปักล่างจอเสมอ แม้ไม่ติด top — เห็นว่าตัวเองอันดับเท่าไหร่ + ห่างคนข้างบนแค่ไหน
- **Filter:** ตามระดับชั้น (ม.4/5/6) เพื่อเทียบกับรุ่นเดียวกัน
- **Privacy:** ตั้งค่าซ่อนตัวเองจาก leaderboard ได้ (ไม่บังคับโชว์)
- คงการลิงก์ไป public profile + avatar + podium colors เดิม

### C2. `<CelebrationMoments>` — จังหวะฉลอง (reuse หนักมาก)

ทำให้ทุก achievement มี "โมเมนต์" — ส่วนนี้ reuse ของ Batch 3 เกือบทั้งหมด:

- **Badge unlock modal:** เหรียญเด้งขึ้น + ชื่อ + Sparkles → reuse `<TierUnlockToast>` + `<Sparkles>`
- **Level-up:** ring fill + tier ใหม่
- **Streak milestone:** 7/30/100 วัน → ฉลองพิเศษ
- **Daily goal complete:** เบาๆ — ring pulse + tick
- **ระดับความแรง:** เรื่องใหญ่ (level-up, เหรียญ legendary) = full confetti, เรื่องกลาง = toast + sparkle, เรื่องเล็ก = micro animation
- **Toast queue:** ปลดล็อกหลายอย่างพร้อมกัน → คิวทีละอัน ไม่รัวจนเฝือ

---

## 🧩 Custom Components ใหม่

| Component | Where | Detail |
|---|---|---|
| `<StreakWidget>` | Dashboard | 🔥 + วันต่อเนื่อง + สถานะวันนี้ |
| `<StreakCalendar>` | Streak detail | heatmap เดือน + best/total + freeze |
| `<StreakFreeze>` | Streak | ❄️ count + อธิบายกลไกกันหลุด |
| `<DailyGoalRing>` | Dashboard | วงแหวนเป้านาที (ปรับเป้าได้) |
| `<QuestCard>` | Dashboard | 3 ภารกิจวันนี้ + reward |
| `<XPProgressBar>` | Profile, dashboard | XP ปัจจุบัน/ถัดไป + "อีก X" |
| `<LevelBadge>` | Profile, avatar | เลเวล + tier color |
| `<LevelUpModal>` | Celebration | ring fill + tier ใหม่ |
| `<BadgeProgressCard>` | Achievements | bar + เงื่อนไขที่เหลือ |
| `<RarityTag>` | Achievements | common→legendary styling |
| `<LeaderboardPodium>` | Leaderboard | top 3 visual |
| `<MyRankRow>` | Leaderboard | sticky อันดับตัวเอง |
| `<BadgeUnlockModal>` | Celebration | เหรียญเด้ง + sparkle |

**REUSE ของเดิม (สำคัญ — จาก snapshot):**
- `<TierUnlockToast>`, `<Sparkles>`, `<ConfettiBurst>` (Batch 3) — celebration ทั้งหมด
- `<ScoreRevealRing>` pattern (Batch 3) — base ของ XP ring + daily goal ring
- `<Card>`, `<Badge>`, `<Tabs>`, `<Avatar>`, `<Skeleton>` — base
- `<SparklineChart>` (Batch 3) — กราฟ activity ใน streak
- Subject gradient colors (Batch 2) — ใช้กับ leaderboard filter ตามวิชา

---

## 🎨 Specific Polish
- **Mobile-first กว่าปกติ:** widget streak/goal บน dashboard ต้องสวยบนมือถือ (เด็กเปิดมือถือ)
- **Micro-interactions:** เปลวไฟ streak ติดแบบ smooth, ring เติมแบบ ScoreRevealRing, เหรียญ hover เด้ง
- **ไม่ anxiety:** copy เชิงบวก ("เก่งขึ้นทุกวัน") ไม่ใช่ขู่ ("อย่าให้ streak หลุด!")
- **Mock data ไทยจริง:** ชื่อนักเรียน, เลเวล, จำนวนวัน streak สมจริง (7-45 วัน), XP
- **Celebration restraint:** อย่าให้ทุกคลิกมี confetti — สงวนไว้ของจริง

---

## 📦 Deliverable

ส่ง HTML+Tailwind ใน Artifact ทีละกลุ่ม:

1. ⭐ **Streak + Daily Goal + Quest** (Cluster A) — รวม artifact เดียว + แสดงบน dashboard mock (หัวใจ retention)
2. **XP/Level system + Level-up celebration** (B1)
3. **`/achievements` ยกเครื่อง** (B2)
4. **`/leaderboard` ยกเครื่อง** (C1)
5. **Celebration moments showcase** (C2) — โชว์ทุก state การฉลองในที่เดียว

หยุดหลังแต่ละ artifact ให้หมิง feedback

ทุก artifact ต้องมี: Dark + Light · Desktop + Mobile · ทุก state (ว่าง/กำลังทำ/สำเร็จ/ใกล้หลุด) · Real Thai mock data

---

## ❓ ถามก่อนเริ่ม

1. **อะไรสำคัญสุด** ระหว่าง streak (กลับมาทุกวัน) กับ XP/level (เห็นตัวเองโต)? จะได้จัดลำดับ
2. **Daily goal** อยากให้วัดเป็น "นาทีเรียน" หรือ "จำนวนภารกิจ (quest)" หรือทั้งคู่?
3. **Leaderboard** เอาแค่ ตลอดกาล/รายสัปดาห์ หรืออยากได้ "เฉพาะเพื่อน" ด้วย (ต้องมีระบบเพื่อน — มี Friend model อยู่แล้วในโค้ด)?
4. **ความแรงการฉลอง** อยากสดใสแบบ Duolingo เต็มที่ หรือพรีเมียมสุขุมแบบ Spotify Wrapped?
5. **XP/Level + Streak ต้องแตะ backend** (เพิ่ม field/logic) — รอบนี้ทำแค่ดีไซน์ mock ก่อน แล้วค่อยต่อ backend ทีหลัง หรืออยากให้ผมต่อ backend ให้เลยหลังเคาะดีไซน์?

---

> **หมายเหตุ backend (จาก codebase จริง):** เหรียญ + showcase + leaderboard(นาทีสะสม) + StudyLog(timestamp ทุกครั้ง) มีแล้ว ✅ — streak และ leaderboard รายสัปดาห์ **คำนวณจาก StudyLog เดิมได้ ไม่ต้องเพิ่มตาราง** ส่วน XP/Level, daily goal, badge progress%, วันที่ปลดล็อก ต้องเพิ่ม field/logic ใน backend ⚠️ (งานไม่ใหญ่ ค่อยทำหลังเคาะดีไซน์)
