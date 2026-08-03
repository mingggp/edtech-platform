'use client';

/** แถบบน — เบรดครัมบ์ · สลับธีม · กระดิ่งแจ้งเตือน · เมนูโปรไฟล์ */
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';

import { Avatar } from '@/components/avatar';
import { useTheme } from '@/components/theme-provider';
import { PROFILE_MENU } from '@/config/nav';
import { auth as authApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth-context';
import { NavIcon } from './icons';

/** ชนิดไฟล์ที่ backend รับ — ต้องตรงกับ ALLOWED_IMAGE_MIME ใน uploads.py */
const ACCEPT = 'image/jpeg,image/png,image/webp';
/** ขนาดสูงสุด ต้องตรงกับ MAX_IMAGE_BYTES ใน uploads.py
 *  เช็คฝั่งนี้ด้วยเพื่อไม่ให้นักเรียนรออัปโหลดรูป 20 MB จนจบแล้วค่อยโดนปฏิเสธ */
const MAX_BYTES = 5 * 1024 * 1024;

export function Topbar({ crumb }: { crumb?: ReactNode }) {
  const { preference, setPreference, theme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const isDark = theme === 'petronas' || theme === 'dark' || theme === 'f1';

  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  /**
   * ออกจากระบบ
   *
   * บั๊กเดิม: ตรงนี้เป็นแค่ <Link href="/login"> ไม่ได้ล้าง token เลย
   * กดแล้วไปหน้า /login จริง แต่ยังล็อกอินอยู่ -> หน้า login เห็นว่ามีผู้ใช้
   * ก็เด้งกลับ /dashboard ทันที = ออกจากบัญชีไม่ได้เลยทั้งเว็บ
   */
  function onLogout() {
    logout();
    router.replace('/login');
  }

  async function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // เคลียร์ค่าทันที ไม่งั้นเลือกไฟล์เดิมซ้ำจะไม่เกิด event (ค่าไม่เปลี่ยน)
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_BYTES) {
      setMsg({ text: 'ไฟล์ใหญ่เกิน 5 MB', bad: true });
      return;
    }
    setBusy(true);
    setMsg({ text: 'กำลังอัปโหลด…' });
    try {
      await authApi.uploadAvatar(file);
      await qc.invalidateQueries({ queryKey: ['me'] });
      setMsg({ text: 'เปลี่ยนรูปแล้ว' });
      setTimeout(() => setMsg(null), 2500);
    } catch (err) {
      setMsg({ text: (err as Error)?.message ?? 'อัปโหลดไม่สำเร็จ', bad: true });
    } finally {
      setBusy(false);
    }
  }

  async function onRemovePhoto() {
    setBusy(true);
    try {
      await authApi.removeAvatar();
      await qc.invalidateQueries({ queryKey: ['me'] });
      setMsg({ text: 'เอารูปออกแล้ว' });
      setTimeout(() => setMsg(null), 2500);
    } catch (err) {
      setMsg({ text: (err as Error)?.message ?? 'ลบรูปไม่สำเร็จ', bad: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="topbar glass">
      <div className="crumb">{crumb}</div>

      <div className="top-actions">
        <button
          className="icon-btn"
          aria-label={isDark ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด'}
          aria-pressed={isDark}
          onClick={() => setPreference(isDark ? 'petronas-light' : 'petronas')}
          title={preference === 'system' ? 'ตอนนี้ตามระบบอยู่' : undefined}
        >
          {isDark ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          )}
        </button>

        <Link href="/settings#notif" className="icon-btn" aria-label="การแจ้งเตือน">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
        </Link>

        <details className="top-av">
          <summary aria-label="เมนูโปรไฟล์">
            <Avatar person={user} size={34} />
          </summary>

          <div className="av-menu glass">
            {/* บอกว่ากำลังใช้บัญชีไหนอยู่ — จำเป็นตอนใช้คอมร่วมกับคนอื่น */}
            {user ? (
              <div className="avm-head">
                <span className="avm-pic">
                  <Avatar person={user} size={40} />
                  <button
                    type="button"
                    className="pic-edit"
                    disabled={busy}
                    onClick={() => fileRef.current?.click()}
                    aria-label="เปลี่ยนรูปโปรไฟล์"
                    title="เปลี่ยนรูปโปรไฟล์"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </button>
                </span>
                <div>
                  <b>{user.nickname || user.full_name || 'นักเรียน'}</b>
                  <span>{user.email}</span>
                </div>
              </div>
            ) : null}

            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              hidden
              onChange={onPickFile}
            />

            {msg ? <div className={`avm-msg${msg.bad ? ' bad' : ''}`}>{msg.text}</div> : null}

            <button type="button" disabled={busy} onClick={() => fileRef.current?.click()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
              </svg>
              {user?.avatar_url ? 'เปลี่ยนรูปโปรไฟล์' : 'ใส่รูปโปรไฟล์'}
            </button>

            {user?.avatar_url ? (
              <button type="button" disabled={busy} onClick={onRemovePhoto}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                </svg>
                เอารูปออก
              </button>
            ) : null}

            {PROFILE_MENU.map((it) => (
              <Link key={it.href} href={it.href}>
                <NavIcon name={it.icon} />
                {it.label}
              </Link>
            ))}

            <button type="button" className="danger" onClick={onLogout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              ออกจากระบบ
            </button>
          </div>
        </details>
      </div>
    </header>
  );
}
