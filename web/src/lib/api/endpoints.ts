/**
 * รายการ endpoint ทั้งหมด — จัดกลุ่มตามโดเมน
 *
 * กติกา: component ห้ามเขียน path เป็น string เอง ให้เรียกผ่านฟังก์ชันในนี้
 * เวลา backend เปลี่ยน path จะได้แก้ที่เดียวและ TypeScript ฟ้องให้ครบ
 */
import { API_BASE, api, tokenStore } from './client';
import type {
  AppNotification, Chapter, Checkout, Course, Gamification, LeaderboardPeriod,
  LeaderboardRow, Payment, SignupResult, Token, User, XpEvent,
} from './types';

/* ------------------------------------------------------------------ auth */
export const auth = {
  /** @param remember เก็บ token ไว้แม้ปิดเบราว์เซอร์ (ช่อง "จดจำฉันไว้") */
  async login(email: string, password: string, remember = true) {
    const t = await api.post<Token>('/auth/login', { email, password }, { anonymous: true });
    tokenStore.set(t.access_token, t.refresh_token, remember);
    return t;
  },

  /**
   * สมัครสมาชิก
   *
   * path คือ /auth/signup ไม่ใช่ /auth/register — เคยเขียนผิดไว้ตรงนี้
   * ทำให้กดสมัครแล้วได้ 404 เงียบ ๆ (ยังไม่มีหน้าสมัครตอนนั้นเลยไม่มีใครเจอ)
   *
   * ไม่ส่ง dek_code — backend คำนวณจาก grade_level ให้เอง
   */
  async signup(payload: {
    email: string; password: string; full_name: string;
    nickname?: string; grade_level?: string;
  }) {
    const r = await api.post<SignupResult>('/auth/signup', payload, { anonymous: true });
    // สมัครใหม่ถือว่าอยากอยู่ต่อ เก็บแบบค้างไว้
    tokenStore.set(r.access_token, r.refresh_token, true);
    return r;
  },

  logout() {
    tokenStore.clear();
  },
  me: () => api.get<User>('/users/me'),

  /** ขอลิงก์ตั้งรหัสใหม่ — backend ตอบ 204 เสมอ ไม่บอกว่ามีอีเมลนี้ไหม
   *  (ถ้าบอก จะกลายเป็นช่องให้คนไล่เดาว่าใครสมัครไว้บ้าง) */
  forgotPassword: (email: string) =>
    api.post<void>('/auth/forgot-password', { email }, { anonymous: true }),

  resetPassword: (token: string, new_password: string) =>
    api.post<void>('/auth/reset-password', { token, new_password }, { anonymous: true }),
};

/* --------------------------------------------------------------- courses */
export const courses = {
  list: () => api.get<Course[]>('/courses', { anonymous: true }),
  get: (id: number) => api.get<Course>(`/courses/${id}`, { anonymous: true }),
  /** สารบัญคอร์ส — บท + บทเรียนย่อย */
  chapters: (id: number) => api.get<Chapter[]>(`/courses/${id}/chapters`, { anonymous: true }),
  mine: () => api.get<Course[]>('/users/me/courses'),
};

/* -------------------------------------------------------------- payments */
export const payments = {
  /** เริ่มจ่าย — ได้ ref + QR กลับมา แล้วเอา ref ไป poll ต่อ */
  checkout: (course_id: number, coupon_code?: string) =>
    api.post<Checkout>('/payments/checkout', { course_id, coupon_code }),
  /** หน้า Checkout เรียกซ้ำ ๆ จนกว่าจะ paid หรือ expired */
  status: (ref: string) => api.get<Payment>(`/payments/${ref}`),
  history: () => api.get<Payment[]>('/users/me/payments'),
  validateCoupon: (code: string) =>
    api.post<{ code: string; discount_type: string; discount_value: number }>(
      '/coupons/validate', { code },
    ),
  /** URL รูป QR พร้อมเพย์ — ต้องเป็น absolute เพราะ <img> โหลดเอง ไม่ผ่าน client.ts */
  qrUrl: (amount: number, ref: string) =>
    `${API_BASE}/payments/qr?amount=${encodeURIComponent(amount)}&ref=${encodeURIComponent(ref)}`,
  /** จำลองว่าจ่ายแล้ว — backend ปิดตายเมื่อ ENV=production */
  simulatePaid: (ref: string) =>
    api.post<{ status: string; payment_status: string }>(`/payments/${ref}/simulate-paid`),
  /** ลงทะเบียนคอร์สฟรี — backend ปฏิเสธถ้าคอร์สมีราคา */
  enrollFree: (course_id: number) =>
    api.post<{ status: string; course_id: number }>(`/users/me/courses?course_id=${course_id}`),
};

/* ------------------------------------------------------------------- กีม */
export const gamification = {
  summary: () => api.get<Gamification>('/users/me/gamification'),
  xpHistory: (limit = 30) => api.get<XpEvent[]>(`/users/me/xp-history?limit=${limit}`),
  setDailyGoal: (minutes: number) =>
    api.put<{ daily_goal_minutes: number }>('/users/me/daily-goal', { minutes }),
  /** บันทึกเวลาเรียน — จุดเดียวที่ขยับสตรีค/XP/เหรียญ */
  logStudy: (minutes: number) =>
    api.post<{ streak: Gamification['streak']; xp_total: number; level: number; new_badges: string[] }>(
      '/users/me/study-time', { minutes },
    ),
  leaderboard: (period: LeaderboardPeriod = 'week', grade?: string) => {
    const q = new URLSearchParams({ period });
    if (grade && grade !== 'all') q.set('grade', grade);
    return api.get<LeaderboardRow[]>(`/leaderboard?${q}`, { anonymous: true });
  },
};

/* ---------------------------------------------------------- notifications */
export const notifications = {
  list: (opts: { limit?: number; unreadOnly?: boolean } = {}) => {
    const q = new URLSearchParams();
    if (opts.limit) q.set('limit', String(opts.limit));
    if (opts.unreadOnly) q.set('unread_only', 'true');
    const qs = q.toString();
    return api.get<AppNotification[]>(`/users/me/notifications${qs ? `?${qs}` : ''}`);
  },
  readAll: () => api.post<{ marked: number }>('/users/me/notifications/read-all'),
};
