# 📦 Design System Snapshot — Delta Update (Batch 8 → Batch 9)

> **ส่งใน Claude Design แชท Batch 8 (ก่อนปิด)**
> เป็น **delta update** เท่านั้น — มี snapshot Batch 2 + delta Batch 3/4/5/6/7 อยู่แล้ว
> เน้นเฉพาะ **สิ่งที่เพิ่ม / เปลี่ยน / refined ใน Batch 8 (Growth & Marketing)**

---

## ⚠️ สำคัญ — สร้างเป็น Document/Artifact ด้วย (อย่าลืม!)

**ขอให้ตอบกลับเป็น Document (Artifact) จริงๆ ไม่ใช่แค่พิมพ์ในแชท** — จะได้ copy เก็บเป็นไฟล์ไปใช้ใน Batch ถัดไปได้สะดวก ที่ผ่านมาชอบลืมสร้าง Document ขอย้ำว่า **รอบนี้สร้าง Artifact ชนิด Markdown ให้ด้วยนะ** 🙏

---

ก่อนปิด session นี้ ขอ **delta snapshot** สำหรับ Batch 8 — จะเอาไปต่อกับ snapshot Batch 2 + delta Batch 3/4/5/6/7 ในแชทใหม่ Batch ถัดไป ขอครอบคลุม:

## 1. New Components (Code)
ขอ HTML + Tailwind code ของ components ที่สร้างใน Batch 8 ทั้งหมด:
- `<TutorHero>` — รูปครูหมิง + bio + วิชาที่สอน
- `<TestimonialCard>` — รีวิว + ดาว + carousel/grid
- `<ResultsShowcase>` — มหา'ลัยที่นักเรียนสอบติด
- `<PricingCard>` — tier + checklist + CTA + ป้าย "คุ้มสุด" (+ bundle variant)
- `<FeatureCompareTable>` — เทียบแพ็ก/บันเดิล
- `<FaqAccordion>` — accordion (reuse Batch 3)
- `<ContactChannels>` — Line/email/social + ฟอร์มติดต่อ
- `<ReferralCard>` — code + share + reward (ส่วนลดสองฝั่ง)
- `<ReferralProgress>` — ชวนกี่คน + reward ที่ได้
- `<LegalLayout>` — TOC ด้านข้าง + เนื้อหา (terms/privacy)
- `<BlogCard>` — (ถ้าทำ shell)

## 2. Animation / Interaction Patterns (NEW)
- **Testimonial carousel** — auto/manual scroll + transition
- **Pricing card hover** — เด่นตัว "คุ้มสุด" + CTA
- **Pricing toggle** (ถ้ามี per-course vs bundle) — สลับราคา
- **Referral share** — copy/share + success feedback (reuse ConfettiBurst)
- **FAQ accordion** — expand/collapse

## 3. Design Decisions (NEW)
- **Brand fix:** เปลี่ยน EdTech → Mingsmileyface ทั่วเว็บ (logo/footer/title) — สรุปที่ทำ
- **Pricing model:** per-course + bundle (ไม่เอา subscription) — สรุปที่เคาะ
- **6 วิชาเท่านั้น:** ตัดเคมี/ชีวะออกจาก marketing (TGAT2/TPAT3/A-Level คณิต/ฟิสิกส์ + คณิต/ฟิสิกส์ ม.ปลาย)
- **Referral reward:** ส่วนลดทั้งสองฝั่ง (logic)
- **Social proof:** รีวิว/ผลสอบจริง > เลขลอย
- **/about hero direction** ที่เลือก (ถ้ามี 2 options)

## 4. Tokens ที่ refine / เพิ่ม
- OKLCH values ใหม่ (pricing highlight, testimonial card, legal layout)
- Shadow/elevation ของ pricing card "คุ้มสุด"
- Marketing section spacing rhythm (ต่างจาก app pages ไหม)

## 5. Lessons Learned
- pattern ไหนจาก Batch 1-7 ที่ปรับใน Batch 8
- anti-pattern ที่เจอ
- component ไหน reusable ต่อ (เช่น FaqAccordion, PricingCard, TestimonialCard)

---

**Format:** **Artifact ชนิด Markdown** (ขอเป็น Document จริงๆ อย่าลืม) — สั้นได้ เน้นใช้งานต่อได้

**ใช้ทำอะไร:** เอาไปแปะใน Claude Design แชทใหม่ Batch ถัดไป — รวมกับ snapshot Batch 2 + delta Batch 3/4/5/6/7 เดิม

ขอบคุณครับ 🙏
