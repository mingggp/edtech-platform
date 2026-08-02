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

/**
 * เก็บ token ไว้ที่ไหน — ขึ้นกับว่าติ๊ก "จดจำฉันไว้" หรือเปล่า
 *
 *   ติ๊ก      localStorage    อยู่ต่อแม้ปิดเบราว์เซอร์
 *   ไม่ติ๊ก   sessionStorage  หายทันทีที่ปิดแท็บ
 *
 * สำคัญกับนักเรียนที่ใช้คอมส่วนกลาง เช่นห้องสมุดหรือคอมที่โรงเรียน —
 * ถ้าเก็บลง localStorage หมดทุกกรณี คนถัดไปที่มาเปิดเว็บจะเข้าบัญชีเขาได้เลย
 *
 * ตอนอ่านต้องดูทั้งสองที่ เพราะไม่รู้ว่ารอบก่อนผู้ใช้เลือกแบบไหน
 */
function stores(): Storage[] {
  if (!isBrowser()) return [];
  try {
    return [window.localStorage, window.sessionStorage];
  } catch {
    return [];   // โหมดส่วนตัวบางเบราว์เซอร์เข้าถึงไม่ได้
  }
}

function read(key: string): string | null {
  for (const s of stores()) {
    const v = s.getItem(key);
    if (v) return v;
  }
  return null;
}

export const tokenStore = {
  get access() {
    return read(ACCESS_KEY);
  },
  get refresh() {
    return read(REFRESH_KEY);
  },
  /** ตอนนี้ token ถูกเก็บแบบค้างข้ามการปิดเบราว์เซอร์อยู่ไหม */
  get persistent() {
    const [local] = stores();
    return !!local?.getItem(ACCESS_KEY);
  },
  /** @param remember ค้างไว้แม้ปิดเบราว์เซอร์ (ค่าเริ่มต้น: ค้าง) */
  set(access: string, refresh?: string, remember = true) {
    const all = stores();
    if (!all.length) return;
    // ลบของเก่าจากทั้งสองที่ก่อน กันค่าค้างในที่ที่ไม่ได้ใช้แล้ว
    // (ถ้าไม่ลบ: ล็อกอินแบบจำไว้ แล้วรอบหน้าล็อกอินแบบไม่จำ -> token เก่า
    //  ยังอยู่ใน localStorage และถูกอ่านเจอก่อน = ยังล็อกอินค้างอยู่ทั้งที่ไม่ได้สั่ง)
    this.clear();
    const target = remember ? all[0] : all[1];
    target.setItem(ACCESS_KEY, access);
    if (refresh) target.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    for (const s of stores()) {
      s.removeItem(ACCESS_KEY);
      s.removeItem(REFRESH_KEY);
    }
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

/**
 * ดึงข้อความ error ออกจาก body
 *
 * backend ตัวนี้มี exception handler ของตัวเองใน main.py ที่ตอบเป็น
 *     { success: false, error: "ข้อความ" }
 * ไม่ใช่ { detail: "..." } แบบมาตรฐานของ FastAPI
 *
 * เดิมโค้ดนี้อ่านแต่ `detail` -> ข้อความจริงไม่เคยถึงผู้ใช้เลย
 * นักเรียนเห็นแค่ "เกิดข้อผิดพลาด (400)" แทนที่จะเห็น
 * "คุณลงทะเบียนคอร์สนี้ไปแล้ว"  (เจอตอนทดสอบ end-to-end)
 *
 * รองรับทั้ง 3 รูปแบบ เผื่อ backend เปลี่ยนกลับไปใช้มาตรฐานในอนาคต
 */
function pickMessage(body: unknown): string | null {
  if (typeof body === 'string') return body || null;
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;

  // pydantic validation — { error: 'Validation Error', details: [{msg}] }
  if (Array.isArray(b.details)) {
    const msgs = b.details.map((d) => (d as { msg?: string })?.msg).filter(Boolean);
    if (msgs.length) return msgs.join(', ');
  }
  for (const key of ['error', 'detail', 'message'] as const) {
    const v = b[key];
    if (typeof v === 'string' && v.trim()) return v;
    if (Array.isArray(v)) {
      const msgs = v.map((d) => (d as { msg?: string })?.msg).filter(Boolean);
      if (msgs.length) return msgs.join(', ');
    }
  }
  return null;
}

async function parseError(res: Response): Promise<ApiError> {
  let body: unknown;
  let message = `เกิดข้อผิดพลาด (${res.status})`;
  try {
    body = await res.json();
    message = pickMessage(body) ?? message;
  } catch {
    /* body ไม่ใช่ JSON — ใช้ข้อความ default */
  }
  // 401 มีความหมายเดียวเสมอ ทับข้อความจาก backend ให้เข้าใจง่าย
  if (res.status === 401) message = 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่';
  return new ApiError(res.status, message, body);
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
    // ต้องเก็บที่เดิม — ถ้าปล่อยให้ใช้ค่า default (จำไว้) token ของคนที่
    // เลือก "ไม่จำ" จะถูกย้ายจาก sessionStorage ไป localStorage ตอน refresh
    // แล้วค้างอยู่หลังปิดเบราว์เซอร์ ทั้งที่ผู้ใช้สั่งไม่ให้จำ
    tokenStore.set(data.access_token, data.refresh_token, tokenStore.persistent);
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
