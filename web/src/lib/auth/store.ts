/**
 * Auth state — เก็บ token ใน localStorage (ผ่าน zustand persist)
 *
 * หมายเหตุ: production จริงควรย้ายไปใช้ httpOnly cookie เพื่อกัน XSS
 * แต่ MVP นี้ใช้ localStorage ก่อนเพื่อให้คุยกับ FastAPI JWT ได้ตรงๆ
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/lib/types";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setAuth: (auth: { accessToken: string; refreshToken: string; user: User }) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setAuth: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user }),
      setTokens: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: "edtech-auth",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/** สั้นๆ สำหรับเช็ค: เช่น `if (useAuth().isAdmin) ...` */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  return {
    user,
    isAuthenticated: !!useAuthStore((s) => s.accessToken),
    isAdmin: user?.role === "admin",
  };
}
