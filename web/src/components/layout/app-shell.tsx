'use client';

/**
 * เปลือกหน้าจอฝั่งนักเรียน — sidebar + แถบบน + พื้นที่เนื้อหา
 *
 * ทุกหน้าใน route group `(app)` ใช้ตัวนี้ผ่าน layout เดียว
 * หน้าไหนอยากปรับความกว้าง/ระยะห่าง ส่ง prop มา ไม่ต้อง copy โครงไปเขียนเอง
 * (โปรเจกต์เดิม 10 หน้าเขียน .topbar/.scroll ซ้ำกันคนละก๊อป)
 */
import type { ReactNode } from 'react';

import { APP_NAV } from '@/config/nav';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

export interface AppShellProps {
  children: ReactNode;
  /** เบรดครัมบ์บนแถบบน */
  crumb?: ReactNode;
  /** ความกว้างสูงสุดของเนื้อหา — แต่ละหน้าไม่เท่ากันได้ */
  maxWidth?: number;
}

export function AppShell({ children, crumb, maxWidth = 1100 }: AppShellProps) {
  return (
    <div className="app">
      <Sidebar groups={APP_NAV} />
      <div className="main-col">
        <Topbar crumb={crumb} />
        <div className="scroll">
          <main className="page" style={{ maxWidth }}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

/** หัวข้อหน้า — ใช้ให้เหมือนกันทุกหน้าจะได้ไม่ต้องจัดระยะเอง */
export function PageHeader({
  eyebrow, title, meta, actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div className="titles">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {meta ? <div className="meta">{meta}</div> : null}
      </div>
      {actions ? <div className="head-actions">{actions}</div> : null}
    </header>
  );
}
