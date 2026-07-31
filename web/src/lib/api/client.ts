/**
 * ตัวกลางคุยกับ backend — ทุก request ต้องผ่านที่นี่
 *
 * เหตุผลที่ไม่เรียก fetch ตรง ๆ กระจายทั่วโปรเจกต์:
 *   - แนบ token / ต่อ refresh token ให้อัตโนมัติ ที่เดียว
 *   - แปลง error ของ FastAPI (`{detail: ...}`) เป็นข้อความไทยที่อ่านรู้เรื่อง
 *   - บังคับ base URL ให้ตรงกันทุกที่
 *
 * กับดักที่กันไว้:
 *   1. token หมดอายุกลางทาง → refresh อัตโนมัติแล้วยิงซ้ำ 1 ครั้ง
 *   2. refresh หลาย request พร้อมกัน → ใช้ promise ตัวเดียวร่วมกัน
 *      ไม่งั้นจะยิง /auth/refresh พร้อมกันสิบอัน แล้ว token ตีกัน
 *   3. เรียกจาก server component → ไม่มี localStorage ต้องไม่พัง
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, '') ?? 'http://localhost:8000';

const ACCESS_KEY = 'ming-access-token';
const REFRESH_KEY = 'ming-refresh-token';

const isBrowser = () => typeof window !== 'undefined';

export const tokenStore = {
  get access() {
    return isBrowser() ? localStorage.getItem(ACCESS_KEY) : null;
  },
  get refresh() {
    return isBrowser() ? localStorage.getItem(REFRESH_KEY) : null;
  },
  set(access: string, refresh?: string) {
    if (!isBrowser()) return;
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    if (!isBrowser()) return;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public detail?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
  /** ผู้ใช้ยังไม่ล็อกอินหรือ token หมดอายุ */
  get isAuth() {
    return this.status === 401 || this.status === 403;
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let detail: unknown;
  let message = `เกิดข้อผิดพลาด (${res.status})`;
  try {
    const body = await res.json();
    detail = body?.detail ?? body;
    if (typeof detail === 'string') {
      message = detail;
    } else if (Array.isArray(detail)) {
      // pydantic validation error
      message = detail.map((d) => d?.msg).filter(Boolean).join(', ') || message;
    }
  } catch {
    /* body ไม่ใช่ JSON — ใช้ข้อความ default */
  }
  if (res.status === 401) message = 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่';
  if (res.status === 503) message = message || 'ระบบยังไม่พร้อมใช้งาน';
  return new ApiError(res.status, message, detail);
}

/* refresh token ที่กำลังทำงานอยู่ — ให้ทุก request ที่ 401 พร้อมกันรอตัวเดียวกัน */
let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const rt = tokenStore.refresh;
  if (!rt) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token: string; refresh_token?: string };
    tokenStore.set(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    return null;
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** ไม่แนบ token (เช่นหน้า public) */
  anonymous?: boolean;
  /** ใช้ภายใน — กันวนซ้ำตอน retry */
  _retried?: boolean;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, anonymous, _retried, headers, ...rest } = opts;

  const h = new Headers(headers);
  if (body !== undefined && !(body instanceof FormData)) {
    h.set('Content-Type', 'application/json');
  }
  const token = anonymous ? null : tokenStore.access;
  if (token) h.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: h,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  if (res.status === 401 && !anonymous && !_retried && tokenStore.refresh) {
    refreshing ??= doRefresh().finally(() => {
      refreshing = null;
    });
    const fresh = await refreshing;
    if (fresh) return request<T>(path, { ...opts, _retried: true });
    tokenStore.clear();
  }

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'PATCH', body }),
  del: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'DELETE' }),
};
