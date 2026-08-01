/**
 * เปลือกของหน้าล็อกอิน/สมัคร — ไม่มี sidebar ไม่มี topbar
 * (คนยังไม่ล็อกอินไม่ควรเห็นเมนูฝั่งนักเรียน)
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="auth-shell">{children}</div>;
}
