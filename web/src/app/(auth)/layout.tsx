/**
 * เปลือกของหน้าเข้าสู่ระบบ / สมัคร / ลืมรหัสผ่าน
 *
 * ไม่มี sidebar ไม่มี topbar — คนที่ยังไม่ล็อกอินไม่ควรเห็นเมนูฝั่งนักเรียน
 * ซ้ายเป็นแผงแบรนด์ ขวาเป็นฟอร์ม (จอเล็กจะเรียงเป็นแนวตั้งเอง)
 */
import { BrandPanel } from './brand-panel';
import { ThemeToggle } from './theme-toggle';
import './auth.css';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <div className="auth">
        <BrandPanel />
        <section className="form-panel">
          <div className="form-topbar">
            <ThemeToggle />
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}
