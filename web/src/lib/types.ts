/**
 * Shared TypeScript types ที่ map กับ FastAPI schemas (backend/app/schemas.py)
 * แก้ที่นี่ที่เดียวเมื่อ backend เปลี่ยน — แล้ว grep หา usage
 */

export type Role = "student" | "admin";

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  nickname: string | null;
  grade_level: string | null;
  role: Role;
  total_minutes: number;
  avatar_url: string | null;
  showcase_badges: string | null;
  created_at: string | null;
  last_login?: string | null;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  thumbnail: string | null;
  target_audience: string | null;
  highlights: string | null;
  is_active: boolean;
  total_lessons: number;
  created_at: string | null;
  // optional/derived
  rating?: number;
  enrolled_count?: number;
  total_minutes?: number;
}

export interface Chapter {
  id: number;
  course_id: number;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: number;
  chapter_id: number;
  title: string;
  youtube_id: string;
  duration: number; // minutes
  order: number;
  doc_url: string | null;
}

/** Shape ที่ /users/me/courses คืน (ไม่ใช่ EnrollmentRead เต็มๆ) */
export interface MyCourse {
  id: number;
  title: string;
  thumbnail: string | null;
  progress: number;
  color?: string;
  enrolled_at: string;
}

export interface Enrollment {
  id: number;
  course_id: number;
  user_id: number;
  enrolled_at: string;
}

export interface Payment {
  id: number;
  user_id: number;
  course_id: number;
  amount: number;
  status: "pending" | "approved" | "rejected";
  slip_url: string | null;
  created_at: string;
  // ถ้า backend ใส่ join มาให้
  user_email?: string | null;
  user_full_name?: string | null;
  course_title?: string | null;
}

export interface Coupon {
  id: number;
  code: string;
  discount_type: "percent" | "amount";
  discount_value: number;
  max_usage: number;
  current_usage: number;
  expires_at: string | null;
  is_active?: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  user: User;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}
