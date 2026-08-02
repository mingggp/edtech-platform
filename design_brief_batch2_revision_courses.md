# 🔄 Revision: `/courses` — Filter-First Discovery

> Revision prompt สำหรับ Claude Design (ต่อจาก courses.html ที่ส่งมาแล้ว)

---

## ✅ ที่ทำได้ดีแล้ว (อย่าเปลี่ยน)

- Featured strip ด้านบน
- Card design (cover, gradient overlay, stats row, hover lift)
- Empty state
- Overall typography และ spacing rhythm

---

## 🎯 ที่อยากให้แก้

**Insight ของ user:** นักเรียน ม.ปลายที่เข้าเว็บ Mingsmileyface ไม่ได้มา "ค้นชื่อคอร์ส" — เขามา **"เลือกวิชาที่ตัวเองอยากเก่ง"** เลยอยากให้ filter ใหญ่และเด่นกว่า search

### Change 1: Search bar → demote
- ลบทิ้งจาก hero header **หรือ** ย่อเป็น icon-only button (⌘ / search icon) ที่ corner
- เวลากดให้เปิดเป็น **command palette overlay** (Cmd+K style — Linear/Raycast vibe) แทน input ใน layout
- ไม่กิน visual weight ใน hero

### Change 2: Filter → promote ให้เป็น HERO ของหน้า
**ทำเป็นเหมือน Spotify Genre Tiles หรือ Apple Music Browse Categories:**

**Subject row (วิชา) — เด่นที่สุด:**
- 6 cards ใหญ่ ขนาด ~180×120px (Desktop)
- แต่ละ card:
  - Custom SVG icon ใหญ่ (ไม่ใช่ emoji)
  - ชื่อวิชา display font
  - **Gradient background ที่ต่างกันต่อวิชา** (signature color per subject):
    - คณิต — indigo→purple
    - ฟิสิกส์ — blue→cyan
    - เคมี — emerald→teal
    - ชีวะ — lime→green
    - TGAT — amber→orange
    - A-Level — rose→pink
  - Active state: scale 1.05 + amber ring + check icon มุมขวาบน
  - Hover: subtle lift + gradient shift

**Grade row (ระดับชั้น) — รองลงมา:**
- 4 segmented pills ใต้ subject grid
- ม.4 / ม.5 / ม.6 / เตรียมสอบเข้ามหา'ลัย
- Style: pill button group (Apple-style segmented control)
- Multi-select ได้ (เลือกได้หลายระดับ)

**Active filters chip row:**
- ใต้ filter section
- แสดงว่ากำลัง filter อะไรอยู่ + ปุ่ม X ปลด filter เร็วๆ
- ปุ่ม "ล้างทั้งหมด" ด้านขวา

### Change 3: Layout proportion ใหม่
```
┌─────────────────────────────────────────────┐
│  Page title (slim)           [🔍] [⌘K hint] │  ← Search demoted
├─────────────────────────────────────────────┤
│                                             │
│  📚 เลือกวิชาที่อยากเก่ง                      │
│  ┌──────┬──────┬──────┬──────┬──────┬─────┐│
│  │ Math │Physic│Chem  │Bio   │TGAT  │A-Lvl││  ← Hero filter
│  └──────┴──────┴──────┴──────┴──────┴─────┘│
│                                             │
│  ระดับชั้น  [ ม.4 | ม.5 | ม.6 | เตรียมสอบ ] │
│                                             │
│  Filter chips: คณิต × ม.5 ×    [ล้างทั้งหมด] │
├─────────────────────────────────────────────┤
│  Featured course strip                      │
├─────────────────────────────────────────────┤
│  Result grid (3 cols)                       │
│  Card | Card | Card                         │
│  Card | Card | Card                         │
└─────────────────────────────────────────────┘
```

---

## 💡 Reference vibes
- **Spotify Browse** — colorful genre tiles ที่กดแล้วรู้สึกอยากเลือก
- **Apple Music "Listen Now" categories** — gradient cards + bold typography
- **Linear command palette** — search ที่ "เปิดเมื่อต้องการ" ไม่กิน layout
- **Raycast** — Cmd+K pattern

---

## 🎨 Detail polish

- เวลา hover subject card — มี subtle parallax effect บน icon (ขยับ ~3px) ให้รู้สึกมีชีวิต
- เวลา select subject — มี smooth color bleed จาก card ไป background ของ grid ด้านล่าง (ใช้ very subtle gradient ที่ matches subject color)
- ตอนยังไม่เลือก filter — โชว์ทุกคอร์ส + ป้าย "ทั้งหมด" highlighted
- ตอน 0 results — ภาพ empty state ที่อ้างอิงวิชาที่เลือก ("ยังไม่มีคอร์ส ฟิสิกส์ × ม.6 — รอเร็วๆ นี้!")

---

## 📦 Deliverable

- อัปเดต `courses.html` artifact เดิม (ไม่ต้องสร้างใหม่)
- ทำให้เห็นชัดว่า empty / 1-filter-selected / multi-filter-selected ต่างกันยังไง
- คง dark + light mode toggle
- คง responsive — บน iPad subject cards อาจเหลือ 3 cols × 2 rows
- บน Mobile subject cards เป็น horizontal scroll snap

---

**ถามก่อนเริ่ม:** subject cards อยากให้ active state เป็น **"เลือกได้ทีละ 1"** (radio-style) หรือ **"เลือกได้หลายวิชา"** (checkbox-style)? — ส่วนตัวแนะนำทีละ 1 เพื่อ focus + ลด cognitive load สำหรับเด็ก ม.ปลาย
