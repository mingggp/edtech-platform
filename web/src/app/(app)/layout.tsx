/**
 * เปลือกร่วมของทุกหน้าฝั่งนักเรียน
 *
 * หน้าใหม่ในกลุ่มนี้ไม่ต้องทำอะไรกับ sidebar/topbar เลย — ได้มาอัตโนมัติ
 * นี่คือสิ่งที่โปรเจกต์เดิมไม่มี จนต้อง copy โครงไป 15 หน้า
 */
import { AppShell } from '@/components/layout/app-shell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
