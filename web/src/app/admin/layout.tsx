import Link from "next/link";
import { LayoutDashboard, Users, BookOpen, CreditCard, Tag } from "lucide-react";

import { RouteGuard } from "@/components/auth/route-guard";
import { SiteHeader } from "@/components/layout/site-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireRole="admin">
      <SiteHeader />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[220px_1fr]">
        <AdminSidebar />
        <main>{children}</main>
      </div>
    </RouteGuard>
  );
}
