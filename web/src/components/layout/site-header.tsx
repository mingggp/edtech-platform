"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Trophy,
  User,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { useAuth, useAuthStore } from "@/lib/auth/store";
import { fetchMe } from "@/lib/api/users";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/courses", label: "คอร์สเรียน" },
  { href: "/exams", label: "ข้อสอบ" },
  { href: "/leaderboard", label: "อันดับ" },
  { href: "/about", label: "เกี่ยวกับติวเตอร์" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-refresh user data in background — เพื่อ sync field ที่อาจเปลี่ยนฝั่ง backend
  // (เช่น role ถูก promote, total_minutes เพิ่ม, avatar อัพเดต)
  const userQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (userQuery.data) setUser(userQuery.data);
  }, [userQuery.data, setUser]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const initials = user?.full_name
    ?.split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-xl gradient-brand text-white shadow-md">
            <GraduationCap className="size-5" />
          </div>
          <span className="display text-lg">EdTech</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth actions */}
        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full pr-3 pl-1 py-1 hover:bg-secondary transition-colors">
                  <Avatar className="size-8">
                    {user?.avatar_url && (
                      <AvatarImage
                        src={
                          user.avatar_url.startsWith("http")
                            ? user.avatar_url
                            : `/api${user.avatar_url}`
                        }
                        alt={user.full_name ?? ""}
                      />
                    )}
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {user?.nickname || user?.full_name?.split(" ")[0] || "บัญชีของฉัน"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-xs text-muted-foreground">เข้าสู่ระบบเป็น</p>
                  <p className="truncate text-sm font-medium text-foreground">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="size-4" /> Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="size-4" /> โปรไฟล์
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/payments">
                    <CreditCard className="size-4" /> ประวัติการชำระเงิน
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/achievements">
                    <Trophy className="size-4" /> Achievements
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Settings className="size-4" /> หลังบ้าน
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="size-4" /> ออกจากระบบ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">เข้าสู่ระบบ</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">สมัครสมาชิก</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border/50 bg-background md:hidden">
          <div className="flex flex-col gap-1 px-4 py-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
              >
                {item.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-border" />
            {isAuthenticated ? (
              <>
                <MobileLink href="/dashboard">Dashboard</MobileLink>
                <MobileLink href="/profile">โปรไฟล์</MobileLink>
                <MobileLink href="/payments">ประวัติการชำระเงิน</MobileLink>
                <MobileLink href="/achievements">Achievements</MobileLink>
                {isAdmin && <MobileLink href="/admin">หลังบ้าน</MobileLink>}
                <button
                  onClick={handleLogout}
                  className="rounded-md px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  ออกจากระบบ
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary">
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                >
                  สมัครสมาชิก
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MobileLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary">
      {children}
    </Link>
  );
}
