'use client';

/**
 * หน้าล็อกอินขั้นต่ำ
 *
 * ยังไม่ได้พอร์ตดีไซน์เต็มจาก 'Login Signup.html' — ทำขึ้นเพราะทุก endpoint
 * ของการซื้อคอร์สต้องล็อกอินก่อน ถ้าไม่มีหน้านี้จะทดสอบหน้าจ่ายเงินไม่ได้เลย
 *
 * รองรับ ?next=/path เพื่อเด้งกลับไปหน้าที่ตั้งใจจะไปหลังล็อกอินสำเร็จ
 */
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { useAuth } from '@/lib/auth-context';

/** กัน open-redirect: ยอมเฉพาะ path ภายในเว็บเท่านั้น */
function safeNext(raw: string | null): string {
  if (!raw) return '/dashboard';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/dashboard';
  return raw;
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const { user, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /* ล็อกอินอยู่แล้วก็ไม่ต้องเห็นหน้านี้ */
  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.replace(next);
    } catch (err) {
      setError((err as Error)?.message ?? 'เข้าสู่ระบบไม่สำเร็จ');
      setBusy(false);      // สำเร็จแล้วไม่ปลดล็อก กันกดซ้ำระหว่างเปลี่ยนหน้า
    }
  }

  return (
    <form className="auth-card" onSubmit={onSubmit}>
      <Link href="/" className="brand">
        <span className="mark" aria-hidden="true">
          <svg viewBox="0 0 120 120" fill="none">
            <path d="M40 50 Q40 38 50 38 Q60 38 60 50" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
            <path d="M68 50 Q68 38 78 38 Q88 38 88 50" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
            <path d="M34 72 Q60 100 94 72" stroke="#fff" strokeWidth={10} strokeLinecap="round" />
          </svg>
        </span>
        <b>mingsmileyface</b>
      </Link>

      <h1>เข้าสู่ระบบ</h1>
      <p className="sub">เข้าเรียนคอร์สที่ซื้อไว้ และเก็บสตรีคต่อ</p>

      {error ? <p className="auth-error" role="alert">{error}</p> : null}

      <div className="auth-field">
        <label htmlFor="email">อีเมล</label>
        <input
          id="email" type="email" autoComplete="email" required
          value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div className="auth-field">
        <label htmlFor="password">รหัสผ่าน</label>
        <input
          id="password" type="password" autoComplete="current-password" required
          value={password} onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button className="auth-submit" type="submit" disabled={busy}>
        {busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
      </button>

      {process.env.NODE_ENV !== 'production' ? (
        <p className="auth-hint">
          บัญชีทดสอบ (เฉพาะตอนพัฒนา)
          <br />
          นักเรียน <code>student@test.com</code> / <code>password</code>
          <br />
          แอดมิน <code>admin@test.com</code> / <code>password</code>
        </p>
      ) : null}
    </form>
  );
}
