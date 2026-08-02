/**
 * ระดับชั้น — ต้องตรงกับ backend/app/grades.py เป๊ะ ๆ
 *
 *   key    m4 · m5 · m6 · other     สิ่งที่ส่งให้ API และเก็บลงฐานข้อมูล
 *   label  ม.4 · ม.5 · ม.6 · อื่นๆ  สิ่งที่นักเรียนเห็น
 *
 * แยกกันแบบเดียวกับ subject key (ดู config/subjects.ts) ด้วยเหตุผลเดียวกัน:
 * ถ้าเอาภาษาไทยไปเป็น key วันไหนอยากเปลี่ยนคำที่แสดงจะต้องไล่แก้ข้อมูลเก่าทั้งหมด
 * และเวลาใส่ใน URL หรือ query string ก็ต้อง encode ทุกครั้ง
 *
 * รุ่น DEK ไม่ได้อยู่ที่นี่ — backend คำนวณจากระดับชั้น + ปีการศึกษาปัจจุบันให้เอง
 * (ถ้าให้ผู้ใช้เลือกเอง หรือคำนวณสองที่ วันหนึ่งมันจะไม่ตรงกัน)
 */
export const GRADE_KEYS = ['m4', 'm5', 'm6', 'other'] as const;

export type GradeKey = (typeof GRADE_KEYS)[number];

const LABELS: Record<GradeKey, string> = {
  m4: 'ม.4',
  m5: 'ม.5',
  m6: 'ม.6',
  other: 'อื่นๆ',
};

export const GRADES = GRADE_KEYS.map((id) => ({ id, label: LABELS[id] }));

export function gradeLabel(key: string | null | undefined): string {
  if (!key) return '';
  return LABELS[key as GradeKey] ?? key;
}

export function isGradeKey(v: unknown): v is GradeKey {
  return typeof v === 'string' && (GRADE_KEYS as readonly string[]).includes(v);
}
