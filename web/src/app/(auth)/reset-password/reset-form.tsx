'use client';

/**
 * ตั้งรหัสผ่านใหม่ — ย้ายจาก 'Forgot Reset Password.html' (#st-reset / #st-done / #st-expired)
 *
 * เข้ามาหน้านี้ผ่านลิงก์ในอีเมล: /reset-password?token=xxxx
 * ตัว token คือของจริงที่ backend ออกให้ ห้ามเดา ห้ามสร้างเอง
 */
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { ApiError } from '@/lib/api/client';
import { auth as authApi } from '@/lib/api/endpoints';
import { ErrorBanner, Field, PASSWORD_MIN, StrengthMeter, SubmitButton } from '../fields';

interface Rule { text: string; ok: (v: string, confirm: string) => boolean }

const RULES: Rule[] = [
  { text: `อย่างน้อย ${PASSWORD_MIN} ตัวอักษร`, ok: (v) => v.length >= PASSWORD_MIN },
  { text: 'มีตัวเลขอย่างน้อย 1 ตัว', ok: (v) => /[0-9]/.test(v) },
  { text: 'มีตัวอักษรภาษาอังกฤษ', ok: (v) => /[A-Za-z]/.test(v) },
  { text: 'ยืนยันรหัสผ่านตรงกัน', ok: (v, c) => !!v && v === c },
];

export function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  /* token ใช้ไม่ได้ — แยกจาก error ทั่วไปเพราะทางแก้คนละอย่าง
     (อันนี้ต้องไปขอลิงก์ใหม่ ไม่ใช่แค่กรอกใหม่) */
  const [dead, setDead] = useState(false);

  /* ไม่มี token มาด้วยเลย = เปิดหน้านี้ตรง ๆ ไม่ได้มาจากอีเมล */
  if (!token || dead) {
    return (
      <div className="form-card">
        <div className="big-ring">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
          </svg>
        </div>
        <div className="fc-head centered">
          <h1 className="fc-title">ลิงก์ใช้ไม่ได้แล้ว</h1>
          <p className="fc-sub">
            ลิงก์ตั้งรหัสผ่านหมดอายุหรือถูกใช้ไปแล้ว
            <br />
            ขอลิงก์ใหม่ได้เลย ใช้เวลาไม่ถึงนาที
          </p>
        </div>
        <Link href="/forgot-password" className="btn btn-primary btn-submit" style={{ marginTop: 8 }}>
          <span className="label">ขอลิงก์ใหม่</span>
        </Link>
        <p className="fc-foot"><Link href="/login">← กลับไปหน้าเข้าสู่ระบบ</Link></p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="form-card">
        <div className="success-tick" style={{ margin: '0 auto 24px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="fc-head centered">
          <h1 className="fc-title">ตั้งรหัสผ่านใหม่แล้ว</h1>
          <p className="fc-sub">เข้าสู่ระบบด้วยรหัสใหม่ได้เลย</p>
        </div>
        <Link href="/login" className="btn btn-primary btn-submit" style={{ marginTop: 8 }}>
          <span className="label">ไปหน้าเข้าสู่ระบบ</span>
        </Link>
      </div>
    );
  }

  const passed = RULES.map((r) => r.ok(password, confirm));
  const allOk = passed.every(Boolean);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || !allOk || !token) return;
    setBanner(null);
    setBusy(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.replace('/login'), 2500);
    } catch (err) {
      // 400/401/404 จาก endpoint นี้แปลว่า token ใช้ไม่ได้ ไม่ใช่รหัสผ่านไม่ผ่าน
      if (err instanceof ApiError && err.status !== 422) setDead(true);
      else setBanner((err as Error)?.message ?? 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ');
      setBusy(false);
    }
  }

  return (
    <div className="form-card">
      <div className="fc-head">
        <div className="fc-eyebrow">ตั้งรหัสผ่านใหม่</div>
        <h1 className="fc-title">ตั้งรหัสใหม่</h1>
        <p className="fc-sub">เลือกรหัสที่จำได้แต่คนอื่นเดาไม่ออก</p>
      </div>

      <ErrorBanner>{banner}</ErrorBanner>

      <form onSubmit={onSubmit} noValidate>
        <Field
          label="รหัสผ่านใหม่" password autoComplete="new-password"
          value={password} onChange={(e) => setPassword(e.target.value)}
        />
        <StrengthMeter value={password} />
        <Field
          label="ยืนยันรหัสผ่านใหม่" password autoComplete="new-password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)}
        />

        <ul className="checklist">
          {RULES.map((r, i) => (
            <li key={r.text} className={passed[i] ? 'ok' : ''}>
              <span className="ck">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              {r.text}
            </li>
          ))}
        </ul>

        <SubmitButton busy={busy} disabled={!allOk}>ตั้งรหัสผ่านใหม่</SubmitButton>
      </form>

      <p className="fc-foot"><Link href="/login">← กลับไปหน้าเข้าสู่ระบบ</Link></p>
    </div>
  );
}
