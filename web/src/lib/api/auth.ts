/** Auth-related API calls + zod schemas
 *
 * Backend endpoints (routers/auth.py):
 *   POST /auth/login          { email, password } -> { access_token, refresh_token, token_type }
 *   POST /auth/signup         { email, password, full_name, nickname?, grade_level? } -> User
 *   POST /auth/refresh        { refresh_token } -> { access_token, refresh_token, token_type }
 *   POST /auth/forgot-password{ email } -> 204 (always)
 *   POST /auth/reset-password { token, new_password } -> 204
 *   POST /auth/change-password{ current_password, new_password } -> 204 (auth required)
 *
 * Note: backend /auth/login returns ONLY tokens — call fetchMe() afterwards to get user.
 */
import { z } from "zod";
import { api } from "./client";
import { fetchMe } from "./users";
import type { AuthResponse, User } from "@/lib/types";

export const loginSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านอย่างน้อย 8 ตัวอักษร"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    email: z.string().email("อีเมลไม่ถูกต้อง"),
    full_name: z.string().min(2, "กรอกชื่อ-นามสกุลของคุณ"),
    password: z
      .string()
      .min(8, "รหัสผ่านอย่างน้อย 8 ตัวอักษร")
      .regex(/[A-Z]/, "ต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว")
      .regex(/[0-9]/, "ต้องมีตัวเลขอย่างน้อย 1 ตัว"),
    confirm_password: z.string(),
    nickname: z.string().optional(),
    grade_level: z.string().optional(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirm_password"],
  });
export type SignupInput = z.infer<typeof signupSchema>;

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

/** Login + auto-fetch user (backend ไม่ส่ง user มากับ token) */
export async function login(input: LoginInput): Promise<AuthResponse> {
  const { data: tokens } = await api.post<TokenResponse>("/auth/login", input);
  // ต้องตั้ง token ก่อน fetchMe เพราะ interceptor จะอ่านจาก store
  // แต่ที่นี่เรา return ให้ caller ตั้งเอง — ดังนั้น fetch user ด้วย header ตรงๆ
  const { data: user } = await api.get<User>("/users/me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  return { ...tokens, user };
}

/** Signup -> auto-login เพื่อให้ flow ต่อเนื่อง */
export async function signup(input: SignupInput): Promise<AuthResponse> {
  const { confirm_password: _ignored, ...payload } = input;
  await api.post<User>("/auth/signup", payload);
  return login({ email: input.email, password: input.password });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await api.post("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, new_password: string): Promise<void> {
  await api.post("/auth/reset-password", { token, new_password });
}

// re-export for convenience
export { fetchMe };
