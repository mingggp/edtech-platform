'use client';

/**
 * สถานะการล็อกอิน — ใครล็อกอินอยู่ ใช้ร่วมกันทั้งเว็บ
 *
 * เก็บ token ไว้ที่ lib/api/client.ts (localStorage) ส่วนที่นี่เก็บ "ข้อมูลผู้ใช้"
 * ที่โหลดมาแล้ว เพื่อไม่ต้องยิง /users/me ซ้ำทุกหน้า
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

import { ApiError, tokenStore } from './api/client';
import { auth as authApi } from './api/endpoints';
import type { User } from './api/types';

interface AuthCtx {
  user: User | null;
  /** ยังโหลดข้อมูลผู้ใช้ไม่เสร็จ — อย่าเพิ่งตัดสินว่ายังไม่ล็อกอิน */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  const { data, isPending, isFetched } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me(),
    /* ไม่มี token ก็ไม่ต้องยิง — กัน 401 โผล่ใน console ตั้งแต่เปิดเว็บ */
    enabled: typeof window !== 'undefined' && !!tokenStore.access,
    retry: (count, err) => !(err instanceof ApiError && err.isAuth) && count < 1,
    staleTime: 5 * 60_000,
  });

  const login = useCallback(
    async (email: string, password: string) => {
      await authApi.login(email, password);
      await qc.invalidateQueries({ queryKey: ['me'] });
    },
    [qc],
  );

  const logout = useCallback(() => {
    authApi.logout();
    qc.clear();
  }, [qc]);

  const value = useMemo<AuthCtx>(
    () => ({
      user: data ?? null,
      // ยังไม่มี token = รู้ผลแล้วว่าไม่ได้ล็อกอิน ไม่ต้องรอ
      loading: typeof window !== 'undefined' && !!tokenStore.access && isPending && !isFetched,
      login,
      logout,
    }),
    [data, isPending, isFetched, login, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth ต้องอยู่ภายใต้ <AuthProvider>');
  return ctx;
}
