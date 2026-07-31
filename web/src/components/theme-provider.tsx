'use client';

/**
 * ธีมทั้งเว็บ — ตัวเดียวคุมทุกหน้า
 *
 * แก้บั๊กที่เจอในโฟลเดอร์ดีไซน์: ตัวเลือก "ตามระบบ" resolve แค่ตอนโหลด
 * หน้า Settings หน้าอื่นอ่าน `ming-theme` ที่ resolve ไว้แล้ว
 * ⇒ ผู้ใช้เปลี่ยนธีมเครื่องระหว่างอยู่หน้าอื่น เว็บไม่ตาม
 *
 * ที่นี่แยกสองอย่างออกจากกันชัด ๆ:
 *   preference  สิ่งที่ผู้ใช้เลือก (รวม 'system')  → เก็บใน localStorage
 *   resolved    ธีมจริงที่ใส่ลง <html data-theme>  → คำนวณใหม่ทุกครั้งที่ระบบเปลี่ยน
 */
import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';

/** ธีมจริงที่ brand.css รองรับ */
export const THEMES = ['petronas', 'petronas-light', 'dark', 'light', 'f1'] as const;
export type Theme = (typeof THEMES)[number];

/** สิ่งที่ผู้ใช้เลือกได้ — 'system' ไม่ใช่ธีมจริง เป็นคำสั่งให้ตามเครื่อง */
export type ThemePreference = Theme | 'system';

const STORAGE_KEY = 'ming-theme-pref';
const DEFAULT_PREF: ThemePreference = 'petronas-light';

/** ธีมที่จะใช้เมื่อผู้ใช้เลือก 'ตามระบบ' */
const SYSTEM_DARK: Theme = 'petronas';
const SYSTEM_LIGHT: Theme = 'petronas-light';

interface ThemeCtx {
  preference: ThemePreference;
  theme: Theme;
  setPreference: (p: ThemePreference) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

function resolve(pref: ThemePreference, systemPrefersDark: boolean): Theme {
  if (pref === 'system') return systemPrefersDark ? SYSTEM_DARK : SYSTEM_LIGHT;
  return pref;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPref] = useState<ThemePreference>(DEFAULT_PREF);
  const [systemDark, setSystemDark] = useState(false);

  // อ่านค่าที่เคยเลือกไว้ (ทำใน effect เพื่อให้ SSR กับ client ตรงกัน)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
      if (saved && (saved === 'system' || (THEMES as readonly string[]).includes(saved))) {
        setPref(saved);
      }
    } catch {
      /* โหมดส่วนตัวบางเบราว์เซอร์อ่าน localStorage ไม่ได้ — ใช้ค่า default */
    }
  }, []);

  // ฟังการเปลี่ยนธีมของเครื่อง — จุดที่เวอร์ชันเดิมพลาด
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setSystemDark(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const theme = useMemo(() => resolve(preference, systemDark), [preference, systemDark]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setPreference = useCallback((p: ThemePreference) => {
    setPref(p);
    try {
      localStorage.setItem(STORAGE_KEY, p);
    } catch {
      /* เก็บไม่ได้ก็ไม่เป็นไร ธีมยังทำงานในเซสชันนี้ */
    }
  }, []);

  const value = useMemo(
    () => ({ preference, theme, setPreference }),
    [preference, theme, setPreference],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTheme ต้องอยู่ภายใต้ <ThemeProvider>');
  return ctx;
}

/**
 * สคริปต์ที่ต้องรันก่อนหน้าเว็บวาด เพื่อกันจอกะพริบขาว (FOUC)
 * ใส่ไว้ใน <head> ผ่าน dangerouslySetInnerHTML — ยาวไม่ถึง 20 บรรทัด
 * ตั้งใจให้ logic ตรงกับ resolve() ข้างบน ถ้าแก้ที่นึงต้องแก้อีกที่
 */
export const themeInitScript = `
(function(){
  try{
    var p = localStorage.getItem('${STORAGE_KEY}') || '${DEFAULT_PREF}';
    var t = p === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? '${SYSTEM_DARK}' : '${SYSTEM_LIGHT}')
      : p;
    document.documentElement.setAttribute('data-theme', t);
  }catch(e){
    document.documentElement.setAttribute('data-theme','${DEFAULT_PREF}');
  }
})();
`.trim();
