'use client';

/**
 * หน้าสมัครสมาชิก — ย้ายจาก 'Login Signup.html' (ส่วน #view-signup)
 *
 * 2 ขั้นตอนตามดีไซน์:
 *   1. อีเมล · รหัสผ่าน · ยืนยันรหัสผ่าน · ยอมรับเงื่อนไข
 *   2. ชื่อจริง · ชื่อเล่น · ระดับชั้น
 *
 * ต่างจากดีไซน์ตรงเดียว: ดีไซน์มีปุ่มให้เลือกรุ่น DEK เอง (DEK68/69/70)
 * ตัดออกแล้วเพราะค่าพวกนั้นตายตัวและจะผิดเองทุกปี — ให้ backend คำนวณจาก
 * ระดับชั้น + ปีการศึกษาปัจจุบันแทน หน้านี้แค่แสดงผลลัพธ์ให้ดู
 */
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';

import { GRADES, type GradeKey } from '@/config/grades';
import { useAuth } from '@/lib/auth-context';
import {
  Checkbox, EMAIL_RE, ErrorBanner, Field, PASSWORD_MIN, StrengthMeter, SubmitButton,
} from '../fields';

function safeNext(raw: string | null): string {
  if (!raw) return '/dashboard';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/dashboard';
  return raw;
}

/**
 * รุ่น DEK ที่คาดว่าจะได้ — คำนวณแบบเดียวกับ backend/app/grades.py
 *
 * ⚠️ ที่นี่คำนวณ "เพื่อแสดงตัวอย่าง" เท่านั้น ค่าจริงที่บันทึกมาจาก backend
 * ถ้าสองฝั่งไม่ตรงกันให้เชื่อ backend — และถือเป็นบั๊กที่ต้องแก้
 * (เขียนซ้ำสองที่แบบนี้ไม่ดี แต่ถ้าจะให้ตรงจริง ๆ ต้องยิง API ทุกครั้งที่กดเลือก
 *  ระดับชั้น ซึ่งไม่คุ้ม — จึงยอมแลกกับการมีเทสต์คุมทั้งสองฝั่งแทน)
 */
function expectedDek(grade: GradeKey | null): string | null {
  const ahead = grade === 'm6' ? 1 : grade === 'm5' ? 2 : grade === 'm4' ? 3 : null;
  if (ahead === null) return null;
  const now = new Date();
  // ปีการศึกษาไทยเริ่มพฤษภาคม (เดือน 5) — ม.ค.–เม.ย. ยังเป็นปีการศึกษาก่อนหน้า
  const be = now.getFullYear() + 543 - (now.getMonth() + 1 < 5 ? 1 : 0);
  return String((be + ahead) % 100).padStart(2, '0');
}

export function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const { user, signup } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [grade, setGrade] = useState<GradeKey | null>(null);

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && !done) router.replace(next);
  }, [user, done, next, router]);

  /* ---------------- ขั้นที่ 1 ---------------- */
  function goStep2() {
    const found: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) found.email = 'กรุณากรอกอีเมลให้ถูกต้อง';
    if (password.length < PASSWORD_MIN) found.password = `รหัสผ่านอย่างน้อย ${PASSWORD_MIN} ตัวอักษร`;
    if (!confirm || confirm !== password) found.confirm = 'รหัสผ่านไม่ตรงกัน';
    if (!terms) found.terms = 'กรุณายอมรับเงื่อนไขก่อนดำเนินการต่อ';
    setErrors(found);
    if (!Object.keys(found).length) setStep(2);
  }

  /* ---------------- ขั้นที่ 2 · ส่งจริง ---------------- */
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;

    const found: typeof errors = {};
    if (!fullName.trim()) found.fullName = 'กรุณากรอกชื่อจริง';
    setErrors(found);
    if (Object.keys(found).length) return;

    setBanner(null);
    setBusy(true);
    try {
      await signup({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        nickname: nickname.trim() || undefined,
        grade_level: grade ?? undefined,
      });
      setDone(true);
      fireConfetti(cardRef.current);
      setTimeout(() => router.replace(next), 2200);
    } catch (err) {
      setBanner((err as Error)?.message ?? 'สมัครสมาชิกไม่สำเร็จ');
      setBusy(false);
      setStep(1);   // ส่วนใหญ่เป็นเรื่องอีเมลซ้ำ ซึ่งอยู่ขั้นที่ 1
    }
  }

  const dek = expectedDek(grade);

  return (
    <div className="form-card" ref={cardRef}>
      <div className={`success-ov${done ? ' show' : ''}`}>
        <div className="success-tick">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2>ยินดีต้อนรับสู่ Mingsmileyface! 🎉</h2>
        <p>สร้างบัญชีสำเร็จแล้ว — เริ่มเลือกคอร์สที่อยากเรียนได้เลย</p>
        <div className="redir"><span className="spin" /> กำลังพาไปหน้าถัดไป…</div>
      </div>

      <div className="steps-ind">
        <span className={`seg ${step === 1 ? 'active' : 'done'}`}><i /></span>
        <span className={`seg${step === 2 ? ' active' : ''}`}><i /></span>
        <span className="lab">ขั้นที่ {step} / 2</span>
      </div>

      <div className="fc-head">
        <h1 className="fc-title">{step === 1 ? 'สร้างบัญชีใหม่' : 'บอกเราหน่อย'}</h1>
        <p className="fc-sub">
          {step === 1
            ? 'เริ่มเรียนฟรีได้ทันที ไม่ต้องใช้บัตรเครดิต'
            : 'เพื่อแนะนำคอร์สและข้อสอบที่ตรงกับคุณ'}
        </p>
      </div>

      <ErrorBanner>{banner}</ErrorBanner>

      <form onSubmit={onSubmit} noValidate>
        {/* ---------------- ขั้นที่ 1 ---------------- */}
        <div className={`wizard-step${step === 1 ? ' active' : ''}`}>
          <Field
            label="อีเมล" type="email" autoComplete="email" value={email} error={errors.email}
            onChange={(e) => { setEmail(e.target.value); setErrors((s) => ({ ...s, email: undefined })); }}
          />
          <Field
            label="รหัสผ่าน" password autoComplete="new-password" value={password} error={errors.password}
            onChange={(e) => { setPassword(e.target.value); setErrors((s) => ({ ...s, password: undefined })); }}
          />
          <StrengthMeter value={password} />
          <Field
            label="ยืนยันรหัสผ่าน" password autoComplete="new-password" value={confirm} error={errors.confirm}
            onChange={(e) => { setConfirm(e.target.value); setErrors((s) => ({ ...s, confirm: undefined })); }}
          />

          <div className="terms-row">
            <Checkbox
              checked={terms}
              onChange={(v) => { setTerms(v); setErrors((s) => ({ ...s, terms: undefined })); }}
            >
              <span>
                ฉันยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว
              </span>
            </Checkbox>
            {errors.terms ? (
              <div className="field-msg" style={{ display: 'block', paddingLeft: 30 }}>{errors.terms}</div>
            ) : null}
          </div>

          <button type="button" className="btn btn-primary btn-submit" onClick={goStep2}>
            <span className="label">ถัดไป →</span>
          </button>
        </div>

        {/* ---------------- ขั้นที่ 2 ---------------- */}
        <div className={`wizard-step${step === 2 ? ' active' : ''}`}>
          <div className="field-row">
            <Field
              label="ชื่อจริง" value={fullName} error={errors.fullName}
              onChange={(e) => { setFullName(e.target.value); setErrors((s) => ({ ...s, fullName: undefined })); }}
            />
            <Field label="ชื่อเล่น" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </div>

          <div className="seg-label" id="grade-label">ระดับชั้น</div>
          <div className="segmented" role="radiogroup" aria-labelledby="grade-label">
            {GRADES.map((g) => (
              <button
                key={g.id}
                type="button"
                role="radio"
                aria-checked={grade === g.id}
                onClick={() => setGrade(g.id)}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className={`dek-note${dek ? '' : ' empty'}`}>
            {dek ? (
              <>
                <span>รุ่นของคุณคือ</span> <b>DEK{dek}</b>
                <span style={{ color: 'var(--fg-3)' }}>· ระบบคำนวณให้จากระดับชั้น</span>
              </>
            ) : (
              <span>เลือกระดับชั้นเพื่อดูรุ่น DEK ของคุณ</span>
            )}
          </div>

          <div className="wizard-nav">
            <button
              type="button" className="btn btn-ghost btn-back" onClick={() => setStep(1)}
              aria-label="ย้อนกลับ"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <SubmitButton busy={busy} style={{ flex: 1 }}>สร้างบัญชี</SubmitButton>
          </div>
        </div>
      </form>

      <p className="fc-foot">
        มีบัญชีอยู่แล้ว? <Link href="/login">เข้าสู่ระบบ</Link>
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- คอนเฟตติ */

const CONFETTI_COLORS = [
  'oklch(0.66 0.23 295)', 'oklch(0.68 0.25 5)', 'oklch(0.78 0.20 50)',
  'oklch(0.80 0.16 205)', 'oklch(0.86 0.20 130)', 'oklch(0.96 0.18 80)',
];

function fireConfetti(anchor: HTMLElement | null) {
  if (!anchor || typeof document === 'undefined') return;
  // เคารพคนที่ตั้งค่าเครื่องว่าไม่อยากเห็นแอนิเมชัน
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const rect = anchor.getBoundingClientRect();
  const box = document.createElement('div');
  box.style.cssText = `position:fixed;left:${rect.left + rect.width / 2}px;top:${rect.top + rect.height / 2 - 40}px;pointer-events:none;z-index:9999;`;
  document.body.appendChild(box);

  for (let i = 0; i < 26; i++) {
    const p = document.createElement('div');
    const angle = (Math.PI * 2 * i) / 26 + (Math.random() - 0.5) * 0.5;
    const dist = 90 + Math.random() * 110;
    const size = 6 + Math.random() * 5;
    p.style.cssText = [
      'position:absolute',
      `width:${size}px`, `height:${size}px`,
      `background:${CONFETTI_COLORS[i % CONFETTI_COLORS.length]}`,
      `border-radius:${Math.random() > 0.5 ? '50%' : '2px'}`,
      `--tx:${Math.cos(angle) * dist}px`, `--ty:${Math.sin(angle) * dist - 30}px`,
      `animation:confettiBurst ${750 + Math.random() * 450}ms cubic-bezier(.2,.7,.4,1) forwards`,
      `animation-delay:${Math.random() * 70}ms`,
    ].join(';');
    box.appendChild(p);
  }
  setTimeout(() => box.remove(), 1700);
}
