import { RouteGuard } from "@/components/auth/route-guard";
import { SiteHeader } from "@/components/layout/site-header";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">{children}</main>
    </RouteGuard>
  );
}
