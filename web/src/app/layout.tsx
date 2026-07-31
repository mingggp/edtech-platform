import type { Metadata, Viewport } from 'next';

import { Providers } from '@/components/providers';
import { themeInitScript } from '@/components/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Mingsmileyface — ติวคณิต ฟิสิกส์ TPAT3 TGAT2',
    template: '%s — Mingsmileyface',
  },
  description:
    'คอร์สออนไลน์ของพี่หมิง — คณิต ฟิสิกส์ ม.ปลาย และเตรียมสอบ TPAT3 TGAT2 พร้อมคลังข้อสอบและเครื่องคำนวณ TCAS',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0d14' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        {/* ตั้งธีมก่อนหน้าเว็บวาด ไม่งั้นจอกะพริบขาวก่อนเปลี่ยนเป็นธีมมืด */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@400;500;600;700&family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
