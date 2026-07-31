/**
 * ไอคอนเมนู — เก็บเป็น path ของ SVG ล้วน ไม่พึ่ง icon library
 *
 * ทำไม: ไอคอนชุดนี้ยกมาจากดีไซน์ตรง ๆ ให้เส้นและน้ำหนักตรงกับที่ออกแบบไว้
 * ถ้าใช้ lucide จะได้ไอคอนคนละทรงกับที่นายเห็นในโฟลเดอร์ดีไซน์
 *
 * เพิ่มไอคอนใหม่: เพิ่ม key ที่นี่ + เพิ่มใน IconName (config/nav.ts)
 * TypeScript จะฟ้องถ้าลืมข้างใดข้างหนึ่ง
 */
import type { IconName } from '@/config/nav';

const PATHS: Record<IconName, string> = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.2V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.2"/><path d="M9.5 21v-6.5h5V21"/>',
  courses: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  exams: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13l2 2 4-4"/>',
  tcas: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  browse: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  results: '<path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/>',
  xp: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/>',
  rank: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16M10 14.66V17c0 .55.47.98.97 1.21C12.15 18.75 13 19.95 13 21M14 14.66V17c0 .55-.47.98-.97 1.21C11.85 18.75 11 19.95 11 21M18 2H6v7a6 6 0 0 0 12 0z"/>',
  friends: '<circle cx="9" cy="7" r="4"/><path d="M16 11h6M19 8v6M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/>',
  achieve: '<path d="m12 2 3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>',
  streak: '<path d="M12 2c1.2 4.2 5 5.2 5 10a5 5 0 1 1-10 0c0-3.2 2-4.2 2-7.2 0 2.2 1.1 3.2 3 3.2-1.1-2.2-1.1-4.2 0-6z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  overview: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  payments: '<rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  coupons: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2a2 2 0 0 1-.6-1.4V4a2 2 0 0 1 2-2h7.6a2 2 0 0 1 1.4.6l6.8 6.8a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  site: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  reports: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
  audit: '<path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/>',
};

export function NavIcon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  );
}
