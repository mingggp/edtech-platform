'use client';

/**
 * หน้าเข้าสู่ระบบ — ย้ายจาก 'Login Signup.html' (ส่วน #view-login)
 *
 * รองรับ ?next=/path เพื่อเด้งกลับไปหน้าที่ตั้งใจจะไปหลังล็อกอินสำเร็จ
 * เช่นกดซื้อคอร์สทั้งที่ยังไม่ล็อกอิน -> ล็อกอินเสร็จกลับมาหน้าจ่ายเงินต่อได้เลย
 */
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';

import { useAuth } from '@/lib/auth-context';
import {
  Checkbox, EMAIL_RE, ErrorBanner, Field, GoogleButton, SubmitButton,
} from '../fields';

/** กัน open-redirect: ยอมเฉพาะ path ภายในเว็บเท่านั้น
 *  ถ้าปล่อยผ่าน คนร้ายส่งลิงก์ /login?next=https://เว็บปลอม ให้นักเรียนได้ */
function safeNext(raw: string | null): string {
  if (!raw) return '/dashboard';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/dashboard';
  return raw;
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get('next');
  const next = safeNext(rawNext);
  const { user, logout, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /* เพิ่งกดเข้าสู่ระบบในหน้านี้เอง (ไม่ใช่เดินเข้ามาทั้งที่ล็อกอินอยู่แล้ว) */
  const justLoggedIn = useRef(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;

    const found: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) found.email = 'กรุณากรอกอีเมลให้ถูกต้อง';
    if (!password) found.password = 'กรุณากรอกรหัสผ่าน';
    setErrors(found);
    if (Object.keys(found).length) return;

    setBanner(null);
    setBusy(true);
    try {
      justLoggedIn.current = true;
      await login(email.trim(), password, remember);
      router.replace(next);
    } catch (err) {
      justLoggedIn.current = false;
      setBanner((err as Error)?.message ?? 'เข้าสู่ระบบไม่สำเร็จ');
      setBusy(false);   // สำเร็จแล้วไม่ปลดล็อก กันกดซ้ำระหว่างเปลี่ยนหน้า
    }
  }

  /* เดินเข้ามาทั้งที่ล็อกอินอยู่แล้ว
   *
   * เดิมตรงนี้เด้งไป /dashboard ทันทีแบบเงียบ ๆ ซึ่งเป็นกับดัก:
   * ถ้าหาปุ่มออกจากระบบไม่เจอ จะเข้าหน้านี้ไม่ได้เลยตลอดกาล
   * (และเคยเป็นแบบนั้นจริง เพราะปุ่มออกจากระบบไม่ได้ล้าง token)
   *
   * ตอนนี้ถามก่อนว่าจะไปต่อหรือจะเปลี่ยนบัญชี — จำเป็นมากเวลาพี่น้อง
   * ใช้คอมเครื่องเดียวกัน หรือเรียนที่ห้องคอมโรงเรียน
   */
  if (user && !justLoggedIn.current) {
    return (
      <div className="form-card">
        <div className="fc-head">
          <div className="fc-eyebrow">เข้าสู่ระบบอยู่แล้ว</div>
          <h1 className="fc-title">สวัสดี {user.nickname || user.full_name || ''} 👋</h1>
          <p className="fc-sub">
            ตอนนี้ใช้บัญชี <b>{user.email}</b> อยู่
          </p>
        </div>

        <Link href={next} className="btn btn-primary btn-submit">
          <span className="label">ไปต่อ →</span>
        </Link>

        <div style={{ height: 12 }} />

        <button
          type="button"
          className="btn btn-ghost btn-submit"
          onClick={() => { logout(); }}
        >
          <span className="label">เข้าด้วยบัญชีอื่น</span>
        </button>
      </div>
    );
  }

  return (
    <div className="form-card">
      <div className="fc-head">
        <div className="fc-eyebrow">เข้าสู่ระบบ</div>
        <h1 className="fc-title">ยินดีต้อนรับกลับมา 👋</h1>
        <p className="fc-sub">เข้าสู่ระบบเพื่อกลับไปเรียนต่อจากที่ค้างไว้</p>
      </div>

      <ErrorBanner>{banner}</ErrorBanner>

      <form onSubmit={onSubmit} noValidate>
        <Field
          label="อีเมล"
          type="email"
          autoComplete="email"
          value={email}
          error={errors.email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors((s) => ({ ...s, email: undefined }));
          }}
        />
        <Field
          label="รหัสผ่าน"
          password
          autoComplete="current-password"
          value={password}
          error={errors.password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors((s) => ({ ...s, password: undefined }));
          }}
        />

        <div className="fl-row">
          <Checkbox checked={remember} onChange={setRemember}>จดจำฉันไว้</Checkbox>
          <Link href="/forgot-password" className="link">ลืมรหัสผ่าน?</Link>
        </div>

        <SubmitButton busy={busy}>เข้าสู่ระบบ →</SubmitButton>
      </form>

      <div className="divider">หรือ</div>
      <GoogleButton />

      <p className="fc-foot">
        ยังไม่มีบัญชี?{' '}
        <Link href={rawNext ? `/signup?next=${encodeURIComponent(rawNext)}` : '/signup'}>
          สมัครสมาชิกฟรี
        </Link>
      </p>

      {process.env.NODE_ENV !== 'production' ? (
        <p className="dev-hint">
          บัญชีทดสอบ (เฉพาะตอนพัฒนา)
          <br />
          นักเรียน <code>student@test.com</code> / <code>password</code>
          <br />
          แอดมิน <code>admin@test.com</code> / <code>password</code>
        </p>
      ) : null}
    </div>
  );
}
