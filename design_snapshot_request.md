# 📦 Design System Snapshot Request

> **ส่งใน Claude Design แชทเดิม (ก่อนปิด)** — เพื่อเก็บ implicit knowledge ทั้งหมดออกมา
> เป้าหมาย: เอาไปแปะในแชทใหม่ Batch 3 จะได้ไม่หลุด consistency

---

ก่อนปิด session นี้ ขอให้ดึง **Design System Snapshot** ทั้งหมดออกมาเป็น markdown ที่ copy-paste ได้ใน 1 message — เพราะจะเปิดแชทใหม่สำหรับ Batch 3 และไม่อยากให้ design tokens เพี้ยน

ขอครอบคลุม:

## 1. Color Tokens (OKLCH values ที่ใช้จริง)
- Brand primary (indigo) — ทุก step (50–950)
- Brand accent (amber) — ทุก step
- Semantic: background, foreground, card, muted, border, ring, destructive, success, warning
- **Subject signature colors** ที่ทำไว้ใน `/courses` (คณิต/ฟิสิกส์/เคมี/ชีวะ/TGAT/A-Level) — gradient from/to ทั้งหมด
- **Tier colors** (EPIC / RARE / LEGEND) ที่ใช้ใน badges
- ทั้ง light + dark mode

## 2. Typography
- Font families (display + body) + fallbacks
- Type scale ทั้งหมด ที่ใช้จริง (font-size, line-height, letter-spacing, weight)
- Heading vs body usage patterns

## 3. Spacing + Sizing
- Spacing scale ที่ใช้
- Container max-widths (Desktop / iPad / Mobile breakpoints จริง)
- Sidebar / Panel widths ที่ใช้ใน Learn page

## 4. Radius + Shadow + Border
- Border radius scale (card, button, pill, modal)
- Shadow scale (sm/md/lg/xl + custom เช่น "card-hover", "trophy-glow")
- Border width + opacity patterns

## 5. Animation + Motion
- Timing functions ที่ใช้ (cubic-bezier values)
- Duration scale (fast/base/slow ms)
- Common patterns: lift-on-hover, score-reveal, confetti-burst, ring-rotate, drawer-slide

## 6. Custom Components (CODE)
ขอ HTML + Tailwind code ของ components ที่ทำมาแล้ว ทุกตัว — เพื่อ reuse:
- `<Button>` ทุก variant (primary, secondary, ghost, destructive)
- `<Card>` พร้อม variants (default, gradient, glass, hover)
- `<Input>` + `<Textarea>` + `<Select>`
- `<Badge>` (pill + tier-aware variants)
- `<Avatar>` + level ring overlay pattern
- `<ProgressRing>` SVG (รวมที่ใช้ใน trophy)
- `<TrophyRing>` (conic glow + float + inner well)
- `<FilterChips>` (subject tiles + segmented pills)
- `<CommandPalette>` (⌘K)
- `<StickyEnrollCard>` + mobile bottom bar
- `<NotesDrawer>` (slide from right + backdrop blur)
- `<ConfettiBurst>` (6-color, 22 particles)
- `<EmptyState>` + `<Skeleton>` patterns
- `<Tooltip>` (trophy hover)
- `<Tabs>` (segmented + underline variants ถ้ามี)

## 7. Layout Patterns
- Page shell structure (header + main + footer)
- 3-zone learn layout breakdown
- Hero patterns (gradient mesh + radial noise + dot grid)
- Sticky bars (top header + mobile bottom)

## 8. Design Decisions Log
- Subject color mapping (วิชา → gradient pair) ตัดสินใจยังไง
- Tier hierarchy (EPIC vs RARE vs LEGEND) — visual cue ต่างกันยังไง
- เมื่อไหร่ใช้ glass morphism vs solid card
- Animation budget (อะไรเคลื่อนไหวได้ อะไรห้าม)

---

**Format:** Markdown ใน 1 block code — ไม่ต้องสวย เน้นครบ + ใช้งานได้จริง

**ใช้ทำอะไร:** จะแปะใน Claude Design แชทใหม่เป็น "context priming" ก่อน Batch 3 (Exam System)

ขอบคุณมากครับ — งาน 4 หน้า Batch 2 ออกมาเทพมาก
