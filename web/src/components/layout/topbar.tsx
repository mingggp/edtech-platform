'use client';

/** แถบบน — เบรดครัมบ์ · สลับธีม · กระดิ่งแจ้งเตือน · รูปโปรไฟล์ */
import Link from 'next/link';
import type { ReactNode } from 'react';

import { PROFILE_MENU } from '@/config/nav';
import { useTheme } from '@/components/theme-provider';
import { NavIcon } from './icons';

export function Topbar({ crumb }: { crumb?: ReactNode }) {
  const { preference, setPreference, theme } = useTheme();
  const isDark = theme === 'petronas' || theme === 'dark' || theme === 'f1';

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
            <span className="av" aria-hidden="true" />
          </summary>
          <div className="av-menu glass">
            {PROFILE_MENU.map((it) => (
              <Link key={it.href} href={it.href}>
                <NavIcon name={it.icon} />
                {it.label}
              </Link>
            ))}
            <Link href="/login" className="danger">
              <NavIcon name="home" />
              ออกจากระบบ
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
