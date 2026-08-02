'use client';

/**
 * ปุ่มสลับสว่าง/มืด มุมขวาบนของหน้า auth
 *
 * ดีไซน์เดิมเขียน localStorage เองด้วยคีย์ 'ming-theme' ซึ่งคนละคีย์กับ
 * ThemeProvider ของเว็บจริง ('ming-theme-pref') ถ้าย้ายมาตรง ๆ ธีมจะไม่ตรงกัน
 * ระหว่างหน้าล็อกอินกับหน้าอื่น — ที่นี่จึงสั่งผ่าน useTheme() ตัวเดียวเสมอ
 */
import { useTheme } from '@/components/theme-provider';

const LIGHT = 'petronas-light';
const DARK = 'petronas';

export function ThemeToggle() {
  const { theme, setPreference } = useTheme();
  const isLight = theme === LIGHT || theme === 'light';

  return (
    <div className="theme-toggle" role="group" aria-label="ธีม">
      <button
        type="button"
        aria-pressed={isLight}
        aria-label="โหมดสว่าง"
        onClick={() => setPreference(LIGHT)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      </button>
      <button
        type="button"
        aria-pressed={!isLight}
        aria-label="โหมดมืด"
        onClick={() => setPreference(DARK)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      </button>
    </div>
  );
}
