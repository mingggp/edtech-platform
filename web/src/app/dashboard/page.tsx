"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Clock, Trophy } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/store";
import { getMyEnrollments } from "@/lib/api/courses";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: getMyEnrollments,
  });

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "อรุณสวัสดิ์";
    if (hour < 18) return "สวัสดีตอนบ่าย";
    return "สวัสดีตอนเย็น";
  })();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="display text-3xl">
          {greeting}, {user?.full_name?.split(" ")[0] || "นักเรียน"} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">มาเรียนต่อจากที่ค้างไว้กันเถอะ</p>
      </header>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={BookOpen} label="คอร์สที่ลงทะเบียน" value={enrollments?.length ?? 0} />
        <StatCard
          icon={Clock}
          label="เวลาเรียนรวม"
          value={`${Math.round((user?.total_minutes ?? 0) / 60)} ชม.`}
        />
        <StatCard
          icon={Trophy}
          label="ระดับชั้น"
          value={user?.grade_level || "—"}
        />
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/profile" className="rounded-lg border bg-card p-4 transition-colors hover:bg-secondary/40">
          <p className="text-sm font-medium">โปรไฟล์</p>
          <p className="mt-0.5 text-xs text-muted-foreground">แก้ไขข้อมูลส่วนตัว</p>
        </Link>
        <Link href="/payments" className="rounded-lg border bg-card p-4 transition-colors hover:bg-secondary/40">
          <p className="text-sm font-medium">ประวัติการชำระเงิน</p>
          <p className="mt-0.5 text-xs text-muted-foreground">ดูรายการที่จ่ายไป</p>
        </Link>
        <Link href="/leaderboard" className="rounded-lg border bg-card p-4 transition-colors hover:bg-secondary/40">
          <p className="text-sm font-medium">อันดับ</p>
          <p className="mt-0.5 text-xs text-muted-foreground">เปรียบเทียบเวลาเรียน</p>
        </Link>
      </div>

      {/* My courses */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold">คอร์สของฉัน</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/courses">เรียกดูคอร์สเพิ่มเติม <ArrowRight className="size-4" /></Link>
          </Button>
        </div>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="animate-pulse p-6">
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="mt-3 h-3 w-full rounded bg-muted" />
              </Card>
            ))}
          </div>
        )}

        {enrollments && enrollments.length === 0 && (
          <Card className="border-dashed p-10 text-center">
            <BookOpen className="mx-auto mb-3 size-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">คุณยังไม่ได้ลงทะเบียนคอร์สใด</p>
            <Button className="mt-4" asChild>
              <Link href="/courses">ดูคอร์สทั้งหมด</Link>
            </Button>
          </Card>
        )}

        {enrollments && enrollments.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {enrollments.map((c) => (
              <Card key={c.id} className="p-6">
                <CardTitle className="line-clamp-2">{c.title}</CardTitle>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>ความคืบหน้า</span>
                    <span>{c.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full gradient-brand transition-all"
                      style={{ width: `${c.progress}%` }}
                    />
                  </div>
                </div>
                <Button className="mt-4 w-full" asChild>
                  <Link href={`/learn/${c.id}`}>เรียนต่อ</Link>
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="display text-2xl">{value}</div>
      </CardContent>
    </Card>
  );
}
