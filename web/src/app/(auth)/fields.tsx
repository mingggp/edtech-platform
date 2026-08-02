'use client';

/**
 * ชิ้นส่วนฟอร์มที่ใช้ร่วมกันทุกหน้า auth
 *
 * เขียนไว้ที่เดียวเพราะหน้า login / signup / ลืมรหัส / ตั้งรหัสใหม่
 * ใช้ช่องกรอกหน้าตาเดียวกันหมด ถ้าก๊อปวางไปทุกหน้า วันหนึ่งจะแก้ไม่ครบ
 */
import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';

/* --------------------------------------------------------------- ช่องกรอก */

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  /** ข้อความเตือนใต้ช่อง — ใส่ค่าเมื่ออยากให้ขึ้นกรอบแดง */
  error?: string | null;
  /** ปุ่มตาเปิด/ปิดการมองเห็นรหัสผ่าน + เตือน Caps Lock */
  password?: boolean;
}

export function Field({ label, error, password, id, ...rest }: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [shown, setShown] = useState(false);
  const [caps, setCaps] = useState(false);

  return (
    <div className={`field${password ? ' has-icon' : ''}${error ? ' invalid' : ''}`}>
      <input
        {...rest}
        id={inputId}
        type={password ? (shown ? 'text' : 'password') : rest.type}
        className="fl-input"
        /* ต้องเป็นเว้นวรรค 1 ตัวเสมอ — CSS ใช้ :not(:placeholder-shown)
           ตัดสินว่าจะยกป้ายขึ้นหรือยัง ถ้าเป็นสตริงว่างจะยกตลอดเวลา */
        placeholder=" "
        aria-invalid={error ? true : undefined}
        onKeyUp={(e) => {
          if (password) setCaps(e.getModifierState?.('CapsLock') ?? false);
          rest.onKeyUp?.(e);
        }}
        onBlur={(e) => {
          setCaps(false);
          rest.onBlur?.(e);
        }}
      />
      <label className="fl-label" htmlFor={inputId}>{label}</label>

      {password ? (
        <button
          type="button"
          className="eye"
          onClick={() => setShown((v) => !v)}
          aria-label={shown ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
        >
          {shown ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.9 5A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a13.2 13.2 0 0 1-2.4 3.1M6.6 6.6A13.3 13.3 0 0 0 2 12s3.5 7 10 7a10.9 10.9 0 0 0 4.1-.8" />
              <path d="M14.1 14.1a3 3 0 0 1-4.2-4.2M2 2l20 20" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      ) : null}

      {password && caps ? (
        <div className="caps-warn show">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="m18 15-6-6-6 6" /><path d="M6 19h12" />
          </svg>
          Caps Lock เปิดอยู่
        </div>
      ) : null}

      {error ? <div className="field-msg">{error}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------ แถบแจ้ง error */

export function ErrorBanner({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <div className="err-banner show" role="alert">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

/* ------------------------------------------------------------ ปุ่มส่งฟอร์ม */

export function SubmitButton({
  busy, children, ...rest
}: { busy?: boolean } & InputHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...(rest as object)}
      type="submit"
      className={`btn btn-primary btn-submit${busy ? ' loading' : ''}`}
      disabled={busy || rest.disabled}
    >
      <span className="label">{children}</span>
      <span className="spin" />
    </button>
  );
}

/* ------------------------------------------------------------- ช่องติ๊กถูก */

export function Checkbox({
  checked, onChange, children,
}: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="check-lbl">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      {children}
    </label>
  );
}

/* --------------------------------------------- ความแข็งแรงของรหัสผ่าน */

const STRENGTH_LABELS = ['—', 'อ่อนไป', 'พอใช้', 'ดี', 'แข็งแรง'];

export function passwordScore(v: string): number {
  if (!v) return 0;
  let s = 0;
  if (v.length >= 8) s++;
  if (/[0-9]/.test(v)) s++;
  if (/[A-Z]/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  return s;
}

export function StrengthMeter({ value }: { value: string }) {
  const score = passwordScore(value);
  return (
    <div className={`strength${score ? ` s${score}` : ''}`}>
      <div className="bars"><i /><i /><i /><i /></div>
      <div className="lab">
        ความแข็งแรง: <b>{STRENGTH_LABELS[score]}</b>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ ทั่วไป */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** ความยาวรหัสผ่านขั้นต่ำ — ต้องตรงกับ backend (PASSWORD_MIN_LEN ใน .env) */
export const PASSWORD_MIN = 8;

/** ปุ่ม Google — ยังกดไม่ได้ backend ไม่มี OAuth */
export function GoogleButton() {
  return (
    <>
      <button className="btn btn-ghost btn-oauth" type="button" disabled>
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 7.9-21l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.5Z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12a12 12 0 0 1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7Z" />
          <path fill="#4CAF50" d="M24 44a20 20 0 0 0 13.5-5.2l-6.2-5.3A12 12 0 0 1 12.7 28l-6.6 5.1A20 20 0 0 0 24 44Z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.3C39.6 36 44 30.7 44 24a20 20 0 0 0-.4-3.5Z" />
        </svg>
        เข้าสู่ระบบด้วย Google
      </button>
      <p className="oauth-note">ยังไม่เปิดใช้ — ตอนนี้เข้าด้วยอีเมลก่อนนะ</p>
    </>
  );
}
