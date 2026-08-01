/**
 * ไอคอนวิชา — ยกมาจาก SUBJ_ICON ใน 'Browse Courses.html'
 * แยกจาก layout/icons.tsx เพราะชุดนั้นเป็นไอคอนเมนู คนละหน้าที่กัน
 */
import type { SubjectId } from '@/config/subjects';

const PATHS: Record<SubjectId | 'all', string> = {
  math: '<path d="M16 4c-2 0-3 1-3 3v10c0 2-1 3-3 3"/><path d="M4 12h6M7 9v6"/>',
  phys: '<circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
  tpat3: '<path d="M12 2 4 5v6c0 5 4 10 8 11 4-1 8-6 8-11V5l-8-3z"/><path d="m9 12 2 2 4-4"/>',
  tgat2: '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-5 0V18a3 3 0 0 1-3-3 3 3 0 0 1 .5-5A2.5 2.5 0 0 1 7 5.5 2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5"/>',
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
