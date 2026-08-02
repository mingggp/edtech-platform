'use client';

/**
 * สถานะการล็อกอิน — ใครล็อกอินอยู่ ใช้ร่วมกันทั้งเว็บ
 *
 * เก็บ token ไว้ที่ lib/api/client.ts (local หรือ sessionStorage แล้วแต่ว่า
 * ผู้ใช้ติ๊ก "จดจำฉันไว้" ไหม) ส่วนที่นี่เก็บ "ข้อมูลผู้ใช้" ที่โหลดมาแล้ว
 * เพื่อไม่ต้องยิง /users/me ซ้ำทุกหน้า
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
  /** @param remember เก็บ token ไว้แม้ปิดเบราว์เซอร์ (ช่อง "จดจำฉันไว้") */
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => void;
}

export interface SignupPayload {
  email: string;
  password: string;
  full_name: string;
  nickname?: string;
  /** m4 | m5 | m6 | other — รุ่น DEK backend คำนวณให้เอง ไม่ต้องส่ง */
  grade_level?: string;
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
    async (email: string, password: string, remember = true) => {
      await authApi.login(email, password, remember);
      await qc.invalidateQueries({ queryKey: ['me'] });
    },
    [qc],
  );

  const signup = useCallback(
    async (payload: SignupPayload) => {
      const r = await authApi.signup(payload);
      // backend ส่งข้อมูลผู้ใช้มาพร้อม token แล้ว ใส่เข้า cache เลย
      // ไม่ต้องยิง /users/me ซ้ำ — หน้าถัดไปจึงไม่ต้องรอโหลดอีกรอบ
      qc.setQueryData(['me'], r.user);
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
      signup,
      logout,
    }),
    [data, isPending, isFetched, login, signup, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth ต้องอยู่ภายใต้ <AuthProvider>');
  return ctx;
}
