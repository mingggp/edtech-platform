/**
 * Type ที่ตรงกับ response ของ backend (`backend/app/schemas.py`)
 *
 * เขียนมือ ไม่ได้ generate — ถ้าแก้ schema ฝั่ง backend ต้องมาแก้ที่นี่ด้วย
 * (อนาคตถ้าอยากอัตโนมัติ ใช้ `openapi-typescript` ยิงที่ /openapi.json ได้เลย
 *  backend เปิด docs ไว้อยู่แล้ว)
 */
import type { LevelId, SubjectId } from '@/config/subjects';

/* ---------------------------------------------------------------- auth */
export interface Token {
  access_token: string;
  refresh_token: string;
  token_type?: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  nickname: string | null;
  grade_level: string | null;
  dek_code: string | null;
  role: 'student' | 'admin';
  avatar_url: string | null;
  total_minutes: number;
  /* กีม */
  xp_total: number;
  level: number;
  streak_current: number;
  streak_best: number;
  daily_goal_minutes: number;
}

/* -------------------------------------------------------------- courses */

/** ป้ายบนการ์ดคอร์ส — แอดมินตั้งเอง ไม่ได้คำนวณ */
export type Ribbon = 'hot' | 'new' | 'rec' | 'free';

export interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  price_old: number | null;
  /** อาจเป็น null สำหรับคอร์สเก่าที่ยังไม่ได้ระบุวิชา */
  subject: SubjectId | null;
  level: LevelId | null;
  ribbon: Ribbon | null;
  thumbnail: string | null;
  highlights: string | null;
  target_audience: string | null;
  is_active: boolean;
  /* ---- ค่าที่ backend คำนวณให้ ไม่มีในตาราง ---- */
  /** จำนวนบทเรียน */
  total_lessons: number;
  /** ความยาวรวมของคอร์ส (นาที) */
  total_minutes: number;
  /** จำนวนคนที่ลงเรียนแล้ว */
  student_count: number;
  created_at: string | null;
}

export interface Lesson {
  id: number;
  title: string;
  youtube_id: string;
  duration: number;
  order: number;
  doc_url: string | null;
}

export interface Chapter {
  id: number;
  title: string;
  order: number;
  lessons: Lesson[];
}

/* ------------------------------------------------------------- payments */
/**
 * awaiting = สร้าง QR แล้วรอผู้ใช้จ่ายภายใน 15 นาที
 * ไม่มีสถานะ "รอแอดมินอนุมัติ" — เกตเวย์ตัดสินเองทั้งหมด (ดู CLAUDE.md)
 */
export type PaymentStatus = 'awaiting' | 'paid' | 'expired';

export interface Payment {
  id: number;
  user_id: number;
  course_id: number;
  amount: number;
  status: PaymentStatus;
  created_at: string;
  expires_at: string | null;
  paid_at: string | null;
  provider: string | null;
  provider_ref: string | null;
  coupon_code: string | null;
  course_title?: string | null;
}

export interface Checkout {
  ref: string;
  amount: number;
  status: PaymentStatus;
  expires_at: string;
  qr_url: string;
}

/* ------------------------------------------------------------ กีม */
export interface StreakStatus {
  current: number;
  best: number;
  freezes: number;
  studied_today: boolean;
  minutes_today: number;
  goal_minutes: number;
  met_goal_today: boolean;
}

export interface Gamification {
  xp_total: number;
  level: number;
  xp_into_level: number;
  xp_for_next_level: number;
  streak: StreakStatus;
  badges: string[];
}

export interface XpEvent {
  amount: number;
  source: string;
  note: string | null;
  created_at: string;
}

export type NotificationType =
  | 'payment' | 'streak' | 'achievement' | 'exam' | 'lesson' | 'social' | 'system';

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  created_at: string;
}

export interface LeaderboardRow {
  rank: number;
  user_id: number;
  name: string;
  grade_level: string | null;
  avatar_url: string | null;
  level: number;
  xp_total: number;
  streak: number;
  minutes: number;
}

export type LeaderboardPeriod = 'day' | 'week' | 'month' | 'all';
