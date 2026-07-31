/**
 * Axios instance สำหรับเรียก backend FastAPI
 *
 * - ทุกคำขอวิ่งผ่าน /api/* (Next rewrite ไปที่ NEXT_PUBLIC_API_URL ใน next.config.ts)
 * - แนบ Bearer token จาก authStore อัตโนมัติ
 * - ถ้า 401 → ลอง refresh แล้ว retry หนึ่งครั้ง; fail → logout + redirect /login
 */
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/lib/auth/store";

export const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ---------- Request: แนบ token ---------- //
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------- Response: refresh on 401 ---------- //
type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post<{ access_token: string; refresh_token?: string }>(
      "/api/auth/refresh",
      { refresh_token: refreshToken }
    );
    useAuthStore.getState().setTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
    });
    return data.access_token;
  } catch {
    useAuthStore.getState().logout();
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    // กัน auth/refresh เองเข้า loop
    if (original.url?.includes("/auth/refresh") || original.url?.includes("/auth/token")) {
      return Promise.reject(error);
    }

    original._retry = true;
    refreshPromise = refreshPromise ?? performRefresh().finally(() => {
      refreshPromise = null;
    });
    const newToken = await refreshPromise;
    if (!newToken) {
      if (typeof window !== "undefined") window.location.href = "/login";
      return Promise.reject(error);
    }
    if (original.headers) original.headers.Authorization = `Bearer ${newToken}`;
    return api.request(original);
  }
);

/** Helper: ดึง error message ออกจาก ApiError shape ของ backend */
export function getApiErrorMessage(err: unknown, fallback = "เกิดข้อผิดพลาด"): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; detail?: string } | undefined;
    return data?.error || data?.detail || err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
