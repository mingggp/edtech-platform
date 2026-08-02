# 📦 Design System Snapshot — Delta Update (Batch 5 → Batch 6)

> **ส่งใน Claude Design แชท Batch 5 (ก่อนปิด)**
> เป็น **delta update** เท่านั้น — มี snapshot Batch 2 + delta Batch 3 + delta Batch 4 อยู่แล้ว
> เน้นเฉพาะ **สิ่งที่เพิ่ม / เปลี่ยน / refined ใน Batch 5 (Admin / Tutor Studio)**

---

ก่อนปิด session นี้ ขอ **delta snapshot** สำหรับ Batch 5 — จะเอาไปต่อกับ snapshot Batch 2 + delta Batch 3 + delta Batch 4 ในแชทใหม่ Batch 6 ขอครอบคลุม:

## 1. New Components (Code)
ขอ HTML + Tailwind code ของ components ที่สร้างใน Batch 5 ทั้งหมด:
- `<AdminShell>` — sidebar grouped + topbar + live badge + collapse drawer (mobile)
- `<KpiCard>` — ตัวเลขใหญ่ + trend arrow + sparkline จิ๋ว
- `<RevenueChart>` — toggle 7/30/ปี (area + bar variant)
- `<ActivityFeed>` — timeline item + actor + time
- `<DataTable>` — sort header + pagination + zebra + sticky header
- `<FilterBar>` — search + dropdown filter chips
- `<PaymentLedgerPane>` — master–detail (list ซ้าย + ใบเสร็จขวา) + variant ปุ่มอนุมัติ/ปฏิเสธ (ซ่อน default)
- `<CouponForm>` — code + type segmented + date picker
- `<QuestionEditor>` — question + choices + correct picker + preview toggle
- `<SettingsSection>` — titled section + save state
- `<AuditDiff>` — before→after highlight
- `<StatusToggle>` — เผยแพร่/ร่าง inline switch

## 2. Animation / Interaction Patterns (NEW)
- **Admin density rhythm** — spacing scale ที่ใช้ใน admin (แน่นกว่าฝั่งนักเรียน ~20% แต่ยังโปร่ง) ระบุค่าจริง
- **Master–detail selection** — selected row state + transition ตอนสลับรายการ
- **DataTable sort/hover** — sort indicator + row hover + pagination interaction
- **KPI trend** — sparkline + arrow color logic (ขึ้นเขียว/ลงแดง)
- **Empty vs populated** — pattern empty state ของ admin (สำคัญ — ทุกหน้าต้องมี)

## 3. Design Decisions (NEW)
- **Admin sub-vibe** — "control room" ต่างจากฝั่งนักเรียนยังไง (density / animation / clarity)
- **Sidebar grouping** — "ดำเนินงาน" vs "ระบบ" + live badge logic
- **Payments = read-only ledger** — ตัดสินใจ (auto-verify) แต่ keep approve/reject variant ไว้ fallback
- **Table-first** — เมื่อไหร่ใช้ table vs card ใน admin
- **Chart choice** — area vs bar + toggle ช่วงเวลา

## 4. Tokens ที่ refine / เพิ่ม
- OKLCH values ใหม่ไหม (admin surface, table zebra, KPI trend colors)
- Spacing scale สำหรับ density mode
- Shadow/elevation ของ master–detail pane + sticky header
- Chart color tokens (revenue gradient, bar fill)

## 5. Lessons Learned
- pattern ไหนจาก Batch 1-4 ที่ต้องปรับใน Batch 5 ไหม
- anti-pattern ที่เจอใน admin (สิ่งที่ไม่ควรทำใน batch หน้า)
- component ไหน reusable ข้าม student/admin ได้ (เช่น DataTable, FilterBar)

---

**Format:** Markdown 1 block — สั้นได้ เน้นใช้งานต่อได้

**ใช้ทำอะไร:** เอาไปแปะใน Claude Design แชทใหม่ Batch 6 — รวมกับ snapshot Batch 2 + delta Batch 3 + delta Batch 4 เดิม

ขอบคุณครับ 🙏
