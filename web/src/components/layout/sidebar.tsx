'use client';

/**
 * Sidebar — component เดียวใช้ได้ทั้งฝั่งนักเรียนและหลังบ้าน
 *
 * นี่คือจุดที่โปรเจกต์เดิมพัง: แต่ละหน้า HTML เขียน markup sidebar เอง
 * พอแก้เมนูทีต้องไล่แก้ 14 ไฟล์ สุดท้ายต้องเขียน sidebar.js มาลบทิ้ง
 * แล้วสร้างใหม่ตอน runtime ทุกครั้งที่โหลดหน้า (~68 KB ที่ไม่มีวันได้แสดง)
 *
 * ที่นี่: เมนูมาจาก config/nav.ts ที่เดียว หน้าไหนก็ได้ sidebar เหมือนกันเป๊ะ
 * เพิ่มเมนู = แก้ nav.ts ไฟล์เดียว
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { NavGroup } from '@/config/nav';
import { NavIcon } from './icons';

const COLLAPSE_KEY = 'ming-sidebar';

/** เมนูถือว่า active เมื่อ path ตรงเป๊ะ หรือเป็นหน้าลูกของมัน
 *  ยกเว้น '/' และ '/admin' ที่ต้องตรงเป๊ะ ไม่งั้นจะ active ตลอด */
function isActive(pathname: string, href: string) {
  if (href === '/' || href === '/admin') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface SidebarProps {
  groups: NavGroup[];
  /** ข้อความใต้โลโก้ เช่น "หลังบ้าน" */
  logoSub?: string;
  /** ลิงก์ท้าย sidebar เช่น "กลับหน้านักเรียน" */
  footerLink?: { href: string; label: string };
  badges?: Partial<Record<'notifications' | 'newExams', number>>;
}

export function Sidebar({ groups, logoSub, footerLink, badges }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === 'collapsed');
    } catch {
      /* อ่านไม่ได้ก็ใช้ค่า default */
    }
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? 'collapsed' : 'open');
      } catch {
        /* ไม่ต้องทำอะไร */
      }
      return next;
    });
  }

  return (
    <aside className="sidebar glass" data-collapsed={collapsed || undefined}>
      <button className="sb-toggle" onClick={toggle} aria-label={collapsed ? 'ขยายเมนู' : 'พับเมนู'}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
          <path d={collapsed ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6'} />
        </svg>
      </button>

      <Link href="/dashboard" className="sb-logo">
        <span className="mark" aria-hidden="true">
          <svg viewBox="0 0 120 120" fill="none">
            <path d="M40 50 Q40 38 50 38 Q60 38 60 50" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
            <path d="M68 50 Q68 38 78 38 Q88 38 88 50" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
            <path d="M34 72 Q60 100 94 72" stroke="#fff" strokeWidth={10} strokeLinecap="round" />
          </svg>
        </span>
        <span className="word">
          mingsmileyface
          {logoSub ? <small>{logoSub}</small> : null}
        </span>
      </Link>

      {groups.map((g) => (
        <nav key={g.id} className="sb-group" data-group={g.id}>
          {g.heading ? <div className="heading">{g.heading}</div> : null}
          {g.items.map((it) => {
            const active = isActive(pathname, it.href);
            const count = it.badgeKey ? badges?.[it.badgeKey] : undefined;
            return (
              <Link
                key={it.href}
                href={it.href}
                className="sb-item"
                data-active={active || undefined}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? it.label : undefined}
              >
                <NavIcon name={it.icon} />
                <span className="text">
                  <b>{it.label}</b>
                  {it.sub ? <small>{it.sub}</small> : null}
                </span>
                {count ? <span className="ct">{count}</span> : null}
              </Link>
            );
          })}
        </nav>
      ))}

      {footerLink ? (
        <div className="sb-foot">
          <Link href={footerLink.href} className="sb-item">
            <NavIcon name="home" />
            <span className="text">
              <b>{footerLink.label}</b>
            </span>
          </Link>
        </div>
      ) : null}
    </aside>
  );
}
