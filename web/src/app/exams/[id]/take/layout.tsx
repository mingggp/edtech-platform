import { RouteGuard } from "@/components/auth/route-guard";

export default function TakeExamLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard>{children}</RouteGuard>;
}
