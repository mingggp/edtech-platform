"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth/store";

interface Props {
  children: React.ReactNode;
  /** required role (default: any authenticated user) */
  requireRole?: "admin";
  /** redirect ไปไหนถ้าไม่ผ่าน (default: /login) */
  redirectTo?: string;
}

/**
 * ปกป้อง route ฝั่ง client (เช็ค token + role)
 * หมายเหตุ: เป็น UX guard เท่านั้น — ของจริง backend ต้องเช็คซ้ำผ่าน Depends(require_admin)
 */
export function RouteGuard({ children, requireRole, redirectTo = "/login" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, user } = useAuthStore();

  useEffect(() => {
    if (!accessToken) {
      const next = encodeURIComponent(pathname);
      router.replace(`${redirectTo}?next=${next}`);
      return;
    }
    if (requireRole && user?.role !== requireRole) {
      router.replace("/dashboard");
    }
  }, [accessToken, user, requireRole, redirectTo, router, pathname]);

  // กัน flash content ก่อน redirect
  if (!accessToken) return null;
  if (requireRole && user?.role !== requireRole) return null;

  return <>{children}</>;
}
