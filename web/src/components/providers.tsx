'use client';

/**
 * Provider ทั้งหมดของแอป — เพิ่มตัวใหม่ที่นี่ที่เดียว
 *
 * QueryClient สร้างใน useState เพื่อให้แต่ละ request ฝั่ง server ได้ cache
 * ของตัวเอง ไม่ปนกันระหว่างผู้ใช้ (bug คลาสสิกของ Next.js App Router)
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { ThemeProvider } from './theme-provider';

export function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // ข้อมูลส่วนใหญ่ไม่ต้องสดวินาทีต่อวินาที ลดการยิงซ้ำตอนสลับแท็บ
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (count, err) => {
              // token หมดอายุ/ไม่มีสิทธิ์ → retry ไปก็เท่านั้น
              const status = (err as { status?: number })?.status;
              if (status === 401 || status === 403 || status === 404) return false;
              return count < 2;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={qc}>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryClientProvider>
  );
}
