/**
 * ไอคอนวิชา — ยกมาจาก SUBJ_ICON ใน 'Browse Courses.html'
 * แยกจาก layout/icons.tsx เพราะชุดนั้นเป็นไอคอนเมนู คนละหน้าที่กัน
 */
import type { SubjectId } from '@/config/subjects';

const PATHS: Record<SubjectId | 'all', string> = {
  math: '<path d="M16 4c-2 0-3 1-3 3v10c0 2-1 3-3 3"/><path d="M4 12h6M7 9v6"/>',
  phys: '<circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
  // ฟันเฟือง — สื่อถึงวิศวกรรม/เทคโนโลยี (หมิงเลือกเอง แทนโล่เดิม)
  tpat3: '<circle cx="12" cy="12" r="3.2"/><path d="M10.4 2.5h3.2l.35 2.26c.67.17 1.3.44 1.88.79l1.87-1.3 2.26 2.26-1.3 1.87c.35.58.62 1.21.79 1.88l2.26.35v3.2l-2.26.35c-.17.67-.44 1.3-.79 1.88l1.3 1.87-2.26 2.26-1.87-1.3c-.58.35-1.21.62-1.88.79l-.35 2.26h-3.2l-.35-2.26a7.4 7.4 0 0 1-1.88-.79l-1.87 1.3-2.26-2.26 1.3-1.87a7.4 7.4 0 0 1-.79-1.88L2.5 13.6v-3.2l2.26-.35c.17-.67.44-1.3.79-1.88l-1.3-1.87 2.26-2.26 1.87 1.3c.58-.35 1.21-.62 1.88-.79z"/>',
  // สมองทั้งใบ (สองซีก) — เดิมเป็นซีกเดียว
  tgat2: '<path d="M12 4.5a2.5 2.5 0 0 0-4.96-.44 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08A2.5 2.5 0 0 0 12 19.5z"/><path d="M12 4.5a2.5 2.5 0 0 1 4.96-.44 2.5 2.5 0 0 1 1.98 3 2.5 2.5 0 0 1 1.32 4.24 3 3 0 0 1-.34 5.58 2.5 2.5 0 0 1-2.96 3.08A2.5 2.5 0 0 1 12 19.5z"/><path d="M12 4.5v15"/>',
  all: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
};

export function SubjectIcon({ id }: { id: SubjectId | 'all' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: PATHS[id] }}
    />
  );
}
