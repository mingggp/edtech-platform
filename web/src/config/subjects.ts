/**
 * 4 วิชาที่สอน — SOURCE OF TRUTH ฝั่ง Next.js
 *
 * ต้องตรงกับอีก 2 ที่เสมอ:
 *   - `Claude Design version 1.0/subjects.js`   (ต้นแบบฝั่งดีไซน์)
 *   - `backend/app/schemas.py` SUBJECTS / LEVELS
 * มีเทสต์เช็คไว้ที่ `src/config/__tests__` (ถ้าไฟล์นั้นตก แปลว่าสามที่หลุดกัน)
 *
 * กติกาจาก CLAUDE.md:
 *   - มี 4 วิชาเท่านั้น ห้ามเพิ่ม ห้ามแยก "A-Level คณิต" ออกจาก "คณิต"
 *   - ลำดับแสดงผลทุกที่: คณิต → ฟิสิกส์ → TPAT3 → TGAT2
 *   - เฉพาะ math / phys ที่มีระดับย่อย
 *
 * แยกให้ขาด:
 *   id    = คีย์ในโค้ด / DB / URL / data-attr  → ตัวเล็กเสมอ
 *   label = ข้อความที่นักเรียนเห็น
 * ห้าม render `id` ตรง ๆ ให้ใช้ subjectLabel() — เคยหลุดมาแล้วจนขึ้นคำว่า "tpat3" บนจอ
 */

export const SUBJECT_IDS = ['math', 'phys', 'tpat3', 'tgat2'] as const;
export type SubjectId = (typeof SUBJECT_IDS)[number];

export const LEVEL_IDS = ['m4', 'm5', 'm6', 'alevel'] as const;
export type LevelId = (typeof LEVEL_IDS)[number];

export interface Subject {
  id: SubjectId;
  /** ข้อความสั้นที่ใช้บนชิป/แท็บ */
  label: string;
  /** ชื่อเต็มไว้ใช้ที่ต้องการความชัดเจน */
  full: string;
  /** ข้อความอังกฤษตัวเล็กใต้ชื่อวิชาบนการ์ดเลือกวิชา */
  en: string;
  tagline: string;
  /** มีตัวกรองระดับ (ม.4/5/6/A-Level) ได้ไหม */
  hasLevels: boolean;
  /** CSS custom property — นิยามใน styles/brand.css */
  color: string;
  fg: string;
  grad: string;
  glyph: string;
}

export const SUBJECTS: readonly Subject[] = [
  {
    id: 'math',
    label: 'คณิต',
    full: 'คณิตศาสตร์',
    en: 'MATH',
    tagline: 'ครบทุกระดับ ม.ปลาย + A-Level',
    hasLevels: true,
    color: 'var(--subj-math)',
    fg: 'var(--subj-math-fg)',
    grad: 'var(--subj-math-grad)',
    glyph: '∫',
  },
  {
    id: 'phys',
    label: 'ฟิสิกส์',
    full: 'ฟิสิกส์',
    en: 'PHYSICS',
    tagline: 'ครบทุกระดับ ม.ปลาย + A-Level',
    hasLevels: true,
    color: 'var(--subj-phys)',
    fg: 'var(--subj-phys-fg)',
    grad: 'var(--subj-phys-grad)',
    glyph: 'Φ',
  },
  {
    id: 'tpat3',
    label: 'TPAT3',
    full: 'TPAT3 ความถนัดวิทยาศาสตร์ เทคโนโลยี วิศวกรรมศาสตร์',
    en: 'ENGINEERING',
    tagline: 'ความถนัดวิทย์ · เทคโนฯ · วิศวะ',
    hasLevels: false,
    color: 'var(--subj-tpat3)',
    fg: 'var(--subj-tpat3-fg)',
    grad: 'var(--subj-tpat3-grad)',
    glyph: '⌬',
  },
  {
    id: 'tgat2',
    label: 'TGAT2',
    full: 'TGAT2 การคิดอย่างมีเหตุผล',
    en: 'APTITUDE',
    tagline: 'การคิดอย่างมีเหตุผล',
    hasLevels: false,
    color: 'var(--subj-tgat2)',
    fg: 'var(--subj-tgat2-fg)',
    grad: 'var(--subj-tgat2-grad)',
    glyph: '∑',
  },
] as const;

export const LEVELS: readonly { id: LevelId; label: string }[] = [
  { id: 'm4', label: 'ม.4' },
  { id: 'm5', label: 'ม.5' },
  { id: 'm6', label: 'ม.6' },
  { id: 'alevel', label: 'A-Level' },
] as const;

const BY_ID = new Map(SUBJECTS.map((s) => [s.id, s]));
const LEVEL_BY_ID = new Map(LEVELS.map((l) => [l.id, l]));

export function isSubjectId(v: unknown): v is SubjectId {
  return typeof v === 'string' && BY_ID.has(v as SubjectId);
}

export function isLevelId(v: unknown): v is LevelId {
  return typeof v === 'string' && LEVEL_BY_ID.has(v as LevelId);
}

export function getSubject(id: SubjectId): Subject;
export function getSubject(id: string): Subject | undefined;
export function getSubject(id: string): Subject | undefined {
  return BY_ID.get(id as SubjectId);
}

/** แปลงคีย์เป็นข้อความบนจอ — ใช้ตัวนี้เสมอเวลาจะ render */
export function subjectLabel(id: string): string {
  return BY_ID.get(id as SubjectId)?.label ?? id;
}

export function levelLabel(id: string | null | undefined): string {
  if (!id) return '';
  return LEVEL_BY_ID.get(id as LevelId)?.label ?? id;
}

/** เรียง id ตามลำดับแบรนด์ (คณิต → ฟิสิกส์ → TPAT3 → TGAT2) */
export function sortSubjectIds(ids: readonly string[]): string[] {
  const order = SUBJECT_IDS as readonly string[];
  return [...ids].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

/**
 * ตรวจคู่ (วิชา, ระดับ) ว่าถูกกติกาไหม — ใช้ก่อนยิงขึ้น backend
 * backend ตรวจซ้ำอีกชั้นอยู่แล้ว แต่เช็คฝั่ง client ทำให้ error อ่านง่ายกว่า
 */
export function validateSubjectLevel(
  subject: string | null | undefined,
  level: string | null | undefined,
): string | null {
  if (subject != null && !isSubjectId(subject)) return `ไม่รู้จักวิชา "${subject}"`;
  if (level != null) {
    if (!isLevelId(level)) return `ไม่รู้จักระดับ "${level}"`;
    const s = subject ? getSubject(subject) : undefined;
    if (s && !s.hasLevels) return `${s.label} ไม่มีระดับย่อย`;
  }
  return null;
}
