/**
 * เมนูทั้งเว็บ — SOURCE OF TRUTH ที่เดียว
 *
 * ทำไมต้องมีไฟล์นี้:
 *   โฟลเดอร์ดีไซน์เคยมีปัญหา sidebar เพี้ยนกันคนละหน้า เพราะแต่ละหน้าเขียน
 *   markup เอง จนต้องเขียน sidebar.js มาไล่ patch ทุกหน้าตอน runtime
 *   ฝั่ง Admin ที่ generate จาก spec เดียว (admin-shell.js) ไม่เคยมีปัญหานี้
 *   → เอา pattern ฝั่ง Admin มาใช้กับทุกส่วน
 *
 * เพิ่มเมนูใหม่ = แก้ที่นี่ที่เดียว ห้ามเขียน <Link> เมนูตรง ๆ ใน component
 */

export interface NavItem {
  /** path จริง — ต้องมี route รองรับ ไม่งั้น 404 (มีเทสต์เช็คตอน build) */
  href: string;
  label: string;
  /** คำอธิบายใต้ชื่อเมนู (เฉพาะเมนูหลัก) */
  sub?: string;
  icon: IconName;
  /** ตัวเลขแจ้งเตือนข้าง ๆ เช่นจำนวนที่ยังไม่อ่าน */
  badgeKey?: 'notifications' | 'newExams';
  /** ยังไม่เปิดใช้ — แสดงแบบจาง กดไม่ได้ */
  soon?: boolean;
}

export interface NavGroup {
  id: string;
  heading?: string;
  items: NavItem[];
}

export type IconName =
  | 'home' | 'courses' | 'exams' | 'tcas' | 'browse' | 'results'
  | 'xp' | 'rank' | 'friends' | 'achieve' | 'streak' | 'settings'
  | 'overview' | 'payments' | 'users' | 'coupons' | 'site' | 'reports' | 'audit';

/* -------------------------------------------------------------------------
 * ฝั่งนักเรียน (ล็อกอินแล้ว)
 * เมนูหลัก = ปุ่มใหญ่ / เมนูรอง = แถวไอคอนเล็ก (ตามดีไซน์ Batch 7)
 * ---------------------------------------------------------------------- */
export const APP_NAV: NavGroup[] = [
  {
    id: 'primary',
    items: [
      { href: '/dashboard', label: 'หน้าหลัก', sub: 'ภาพรวมการเรียน', icon: 'home' },
      { href: '/my-courses', label: 'คอร์สของฉัน', sub: 'คอร์สที่ซื้อแล้ว', icon: 'courses' },
      { href: '/exams', label: 'ข้อสอบ', sub: 'ทำข้อสอบจับเวลา', icon: 'exams', badgeKey: 'newExams' },
      { href: '/tcas', label: 'คำนวณ TCAS', sub: 'เช็กโอกาสติดคณะที่เล็ง', icon: 'tcas' },
    ],
  },
  {
    id: 'secondary',
    heading: 'ทางลัด',
    items: [
      { href: '/courses', label: 'คอร์สทั้งหมด', icon: 'browse' },
      { href: '/exams/results', label: 'ผลสอบของฉัน', icon: 'results' },
      { href: '/xp', label: 'เลเวล & แต้ม', icon: 'xp' },
      { href: '/leaderboard', label: 'อันดับ', icon: 'rank' },
      { href: '/friends', label: 'เพื่อน', icon: 'friends' },
      { href: '/achievements', label: 'ความสำเร็จ', icon: 'achieve' },
      { href: '/streak', label: 'สตรีค', icon: 'streak' },
    ],
  },
];

/* -------------------------------------------------------------------------
 * ฝั่งหลังบ้าน
 * ---------------------------------------------------------------------- */
export const ADMIN_NAV: NavGroup[] = [
  {
    id: 'ops',
    heading: 'ดำเนินงาน',
    items: [
      { href: '/admin', label: 'ภาพรวม', icon: 'overview' },
      { href: '/admin/payments', label: 'การเงิน', icon: 'payments' },
      { href: '/admin/courses', label: 'คอร์ส', icon: 'courses' },
      { href: '/admin/exams', label: 'ข้อสอบ', icon: 'exams' },
      { href: '/admin/users', label: 'นักเรียน', icon: 'users' },
      { href: '/admin/coupons', label: 'คูปอง', icon: 'coupons' },
    ],
  },
  {
    id: 'system',
    heading: 'ระบบ',
    items: [
      { href: '/admin/site', label: 'หน้าเว็บ & เมนู', icon: 'site' },
      { href: '/admin/settings', label: 'ตั้งค่าเว็บ', icon: 'settings' },
      { href: '/admin/reports', label: 'รายงาน', icon: 'reports' },
      { href: '/admin/audit', label: 'Audit log', icon: 'audit' },
    ],
  },
];

/* -------------------------------------------------------------------------
 * เว็บสาธารณะ (คนยังไม่ล็อกอิน)
 * `soon: true` = ยังไม่เปิด แสดงจาง ๆ กดไม่ได้
 * เดิมฝั่งดีไซน์ต้องเขียน logic นี้ 2 ที่ (marketing-common.js + Landing Page)
 * ---------------------------------------------------------------------- */
export const PUBLIC_NAV: NavItem[] = [
  { href: '/', label: 'หน้าหลัก', icon: 'home' },
  { href: '/courses', label: 'คอร์ส', icon: 'courses' },
  { href: '/results', label: 'ผลงานนักเรียน', icon: 'results', soon: true },
  { href: '/reviews', label: 'รีวิว', icon: 'friends', soon: true },
  { href: '/about', label: 'เกี่ยวกับ', icon: 'home' },
  { href: '/location', label: 'สถานที่เรียน', icon: 'site' },
  { href: '/faq', label: 'FAQ', icon: 'reports', soon: true },
  { href: '/contact', label: 'ติดต่อ', icon: 'friends' },
];

/** เมนูในป๊อปอัปรูปโปรไฟล์ */
export const PROFILE_MENU: NavItem[] = [
  { href: '/u/me', label: 'ดูโปรไฟล์สาธารณะ', icon: 'friends' },
  { href: '/settings', label: 'ตั้งค่า', icon: 'settings' },
  { href: '/settings#billing', label: 'การชำระเงิน', icon: 'payments' },
];

/** ทุก href ที่ประกาศไว้ — ใช้เช็คว่ามี route รองรับครบ */
export function allNavHrefs(): string[] {
  const out: string[] = [];
  for (const g of [...APP_NAV, ...ADMIN_NAV]) for (const i of g.items) out.push(i.href);
  for (const i of [...PUBLIC_NAV, ...PROFILE_MENU]) out.push(i.href);
  return [...new Set(out)];
}
