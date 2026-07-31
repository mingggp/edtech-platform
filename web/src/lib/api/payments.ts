/** Payments API calls
 *
 * Backend endpoints (routers/payments.py):
 *   POST /coupons/validate                  { code } -> { code, discount_type, discount_value }
 *   GET  /payments/qr?amount=N              -> image/png
 *   POST /payments/upload                   multipart: file, course_id, coupon_code? -> Payment
 *   GET  /users/me/courses                  -> Enrollment[]  (mine)
 */
import { api } from "./client";
import type { Payment } from "@/lib/types";

export interface CouponInfo {
  code: string;
  discount_type: "percent" | "amount";
  discount_value: number;
}

export interface CheckoutQuote {
  course_id: number;
  base_price: number;
  discount: number;
  final_price: number;
  coupon: CouponInfo | null;
}

/** Validate coupon ฝั่ง backend แล้วคำนวณราคาสุดท้ายฝั่ง client */
export async function quoteCheckout(
  courseId: number,
  basePrice: number,
  couponCode?: string
): Promise<CheckoutQuote> {
  if (!couponCode) {
    return {
      course_id: courseId,
      base_price: basePrice,
      discount: 0,
      final_price: basePrice,
      coupon: null,
    };
  }
  try {
    const { data: c } = await api.post<CouponInfo>("/coupons/validate", { code: couponCode });
    const discount =
      c.discount_type === "percent"
        ? Math.floor((basePrice * c.discount_value) / 100)
        : c.discount_value;
    return {
      course_id: courseId,
      base_price: basePrice,
      discount,
      final_price: Math.max(0, basePrice - discount),
      coupon: c,
    };
  } catch {
    // คูปองใช้ไม่ได้ — คืนราคาเต็ม + null coupon (อย่า throw เพื่อให้ UI แสดง error เอง)
    return {
      course_id: courseId,
      base_price: basePrice,
      discount: 0,
      final_price: basePrice,
      coupon: null,
    };
  }
}

export function getPromptPayQR(amount: number): string {
  // คืน URL ที่ <img> ดึงเองได้ — backend stream PNG กลับมา
  return `/api/payments/qr?amount=${amount}`;
}

export async function listMyPayments(): Promise<Payment[]> {
  const { data } = await api.get<Payment[]>("/users/me/payments");
  return data;
}

export async function uploadSlip(
  courseId: number | string,
  file: File,
  couponCode?: string
): Promise<Payment> {
  const fd = new FormData();
  fd.append("course_id", String(courseId));
  if (couponCode) fd.append("coupon_code", couponCode);
  fd.append("file", file);
  const { data } = await api.post<Payment>("/payments/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
