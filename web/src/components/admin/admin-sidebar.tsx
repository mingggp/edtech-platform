"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, BookOpen, CreditCard, Tag, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "ผู้ใช้", icon: Users },
  { href: "/admin/courses", label: "คอร์ส", icon: BookOpen },
  { href: "/admin/exams", label: "ข้อสอบ", icon: FileText },
  { href: "/admin/payments", label: "การชำระเงิน", icon: CreditCard },
  { href: "/admin/coupons", label: "คูปอง", icon: Tag },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="space-y-1 lg:sticky lg:top-20">
      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        หลังบ้าน
      </p>
      {ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}
