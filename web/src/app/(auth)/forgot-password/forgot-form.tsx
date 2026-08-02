'use client';

/**
 * ลืมรหัสผ่าน — ย้ายจาก 'Forgot Reset Password.html' (ส่วน #st-forgot / #st-sent)
 *
 * เรื่องความปลอดภัยที่ต้องรู้:
 * backend ตอบ 204 เสมอ ไม่ว่าอีเมลนั้นจะมีในระบบหรือไม่ และหน้านี้ก็ต้องแสดงผล
 * เหมือนกันทั้งสองกรณี ถ้าบอกว่า "ไม่พบอีเมลนี้" จะกลายเป็นช่องให้คนไล่กรอก
 * ทีละอีเมลเพื่อดูว่าใครเป็นนักเรียนที่นี่บ้าง
 */
import Link from 'next/link';
import { useState, type FormEvent } from 'react';

import { auth as authApi } from '@/lib/api/endpoints';
import { EMAIL_RE, ErrorBanner, Field, SubmitButton } from '../fields';

/** กันกดส่งซ้ำรัว ๆ — backend จำกัดที่ 5 ครั้ง/นาที อยู่แล้ว
 *  แต่บอกผู้ใช้ก่อนดีกว่าปล่อยให้โดนปฏิเสธแล้วงง */
const RESEND_SECONDS = 60;

export function ForgotForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    if (busy || cooldown > 0) return;

    if (!EMAIL_RE.test(email.trim())) {
      setError('กรุณากรอกอีเมลให้ถูกต้อง');
      return;
    }
    setError(null);
    setBanner(null);
    setBusy(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
      setCooldown(RESEND_SECONDS);
      const t = setInterval(() => {
        setCooldown((s) => {
          if (s <= 1) { clearInterval(t); return 0; }
          return s - 1;
        });
      }, 1000);
    } catch (err) {
      setBanner((err as Error)?.message ?? 'ส่งไม่สำเร็จ ลองใหม่อีกครั้ง');
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="form-card">
        <div className="big-ring">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m2 7 10 6 10-6" />
          </svg>
        </div>
        <div className="fc-head centered">
          <h1 className="fc-title">ส่งลิงก์ให้แล้ว</h1>
          <p className="fc-sub">
            ถ้ามีบัญชีที่ใช้อีเมลนี้ เราส่งลิงก์ตั้งรหัสผ่านใหม่ไปให้แล้ว
            <br />
            ลิงก์ใช้ได้ภายใน 30 นาที — เช็คในกล่องจดหมายขยะด้วยนะ
          </p>
        </div>

        <p className="sent-to centered">{email.trim()}</p>

        <div style={{ marginTop: 24 }}>
          <button
            type="button"
            className="btn btn-ghost btn-submit"
            disabled={cooldown > 0 || busy}
            onClick={() => void send()}
          >
            <span className="label">
              {cooldown > 0 ? `ส่งอีกครั้งได้ใน ${cooldown} วิ` : 'ส่งอีกครั้ง'}
            </span>
          </button>
        </div>

        <p className="fc-foot">
          <Link href="/login">← กลับไปหน้าเข้าสู่ระบบ</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="form-card">
      <div className="fc-head">
        <div className="fc-eyebrow">ลืมรหัสผ่าน</div>
        <h1 className="fc-title">ตั้งรหัสผ่านใหม่</h1>
        <p className="fc-sub">กรอกอีเมลที่ใช้สมัคร แล้วเราจะส่งลิงก์ตั้งรหัสใหม่ไปให้</p>
      </div>

      <ErrorBanner>{banner}</ErrorBanner>

      <form onSubmit={send} noValidate>
        <Field
          label="อีเมล" type="email" autoComplete="email" value={email} error={error}
          onChange={(e) => { setEmail(e.target.value); setError(null); }}
        />
        <SubmitButton busy={busy}>ส่งลิงก์ตั้งรหัสใหม่</SubmitButton>
      </form>

      <p className="fc-foot">
        นึกออกแล้ว? <Link href="/login">เข้าสู่ระบบ</Link>
      </p>
    </div>
  );
}
