/** Admin API calls
 *
 * Backend endpoints:
 *   GET   /admin/metrics                                -> AdminMetrics
 *   GET   /admin/payment-stats                          -> PaymentStats
 *   GET   /admin/users                                  -> AdminUserListResponse
 *   PATCH /admin/users/{uid}                            -> User
 *   GET   /admin/payments?status=...                    -> Payment[]
 *   POST  /admin/payments/{id}/{act}                    act = approve | reject
 *   GET   /admin/courses                                -> Course[]
 *   GET/POST/DELETE /admin/coupons[/id]                 -> Coupon[]
 */
import { api } from "./client";
import type { User, Course, Payment, Coupon } from "@/lib/types";

// ---------- Metrics ---------- //
export interface AdminMetrics {
  total_users: number;
  admins: number;
  active_users: number;
  new_users_today: number;
}

export interface PaymentStats {
  labels: string[];
  data: number[];
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const { data } = await api.get<AdminMetrics>("/admin/metrics");
  return data;
}

export async function getPaymentStats(): Promise<PaymentStats> {
  const { data } = await api.get<PaymentStats>("/admin/payment-stats");
  return data;
}

// ---------- Users ---------- //
interface AdminUserListResponse {
  items: User[];
  meta: { total: number; page?: number; per_page?: number };
}

export async function listUsers(): Promise<User[]> {
  const { data } = await api.get<AdminUserListResponse | User[]>("/admin/users");
  // backend ใช้ AdminUserListResponse แต่เผื่อรองรับ array ตรง
  return Array.isArray(data) ? data : data.items;
}

export async function updateUser(
  userId: number,
  payload: { role?: "student" | "admin"; full_name?: string }
): Promise<User> {
  const { data } = await api.patch<User>(`/admin/users/${userId}`, payload);
  return data;
}

// ---------- Payments ---------- //
export async function listPayments(status?: "pending" | "approved" | "rejected"): Promise<Payment[]> {
  const { data } = await api.get<Payment[]>("/admin/payments", {
    params: status ? { status } : {},
  });
  return data;
}

export async function processPayment(
  id: number,
  action: "approve" | "reject"
): Promise<{ status: string }> {
  const { data } = await api.post<{ status: string }>(`/admin/payments/${id}/${action}`);
  return data;
}

// ---------- Courses ---------- //
export async function adminListCourses(): Promise<Course[]> {
  const { data } = await api.get<Course[]>("/admin/courses");
  return data;
}

// ---------- Coupons ---------- //
export async function listCoupons(): Promise<Coupon[]> {
  const { data } = await api.get<Coupon[]>("/admin/coupons");
  return data;
}

export async function createCoupon(payload: {
  code: string;
  discount_value: number;
  discount_type?: "percent" | "amount";
  expires_at?: string | null;
  max_usage?: number;
}): Promise<Coupon> {
  const { data } = await api.post<Coupon>("/admin/coupons", {
    discount_type: "percent",
    max_usage: 0,
    ...payload,
  });
  return data;
}

export async function deleteCoupon(id: number): Promise<void> {
  await api.delete(`/admin/coupons/${id}`);
}
