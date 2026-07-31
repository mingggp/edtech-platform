"use client";

import { use, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, CheckCircle2, Clock, GraduationCap } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Badge as BadgeUI } from "@/components/ui/badge";
import { RouteGuard } from "@/components/auth/route-guard";
import { getPublicProfile } from "@/lib/api/profile";
import { getMyAchievements, type Badge } from "@/lib/api/achievements";

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <RouteGuard>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Inner userId={id} />
      </main>
      <SiteFooter />
    </RouteGuard>
  );
}

function Inner({ userId }: { userId: string }) {
  const profileQ = useQuery({
    queryKey: ["public-profile", userId],
    queryFn: () => getPublicProfile(userId),
  });
  // ใช้ ALL_BADGES catalog (โหลดผ่าน my achievements ของ user คนปัจจุบัน
  // เพราะ backend ยังไม่มี public endpoint สำหรับ badges ของคนอื่น)
  const badgesQ = useQuery({ queryKey: ["my-achievements"], queryFn: getMyAchievements });

  const showcaseBadges = useMemo(() => {
    if (!profileQ.data?.showcase_badges || !badgesQ.data) return [];
    const ids = profileQ.data.showcase_badges.split(",").filter(Boolean);
    const map = new Map(badgesQ.data.map((b) => [b.id, b]));
    return ids.map((id) => map.get(id)).filter((b): b is Badge => !!b);
  }, [profileQ.data, badgesQ.data]);

  if (profileQ.isLoading || !profileQ.data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  const p = profileQ.data;
  const displayName = p.nickname || p.full_name || "ผู้ใช้งาน";
  const initials = (p.full_name || "U")
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="overflow-hidden">
        <div className="h-24 gradient-brand" />
        <div className="-mt-12 flex flex-col items-center gap-3 px-6 pb-6 text-center sm:flex-row sm:text-left">
          <Avatar className="size-24 ring-4 ring-background">
            {p.avatar_url && (
              <AvatarImage
                src={p.avatar_url.startsWith("http") ? p.avatar_url : `/api${p.avatar_url}`}
                alt={displayName}
              />
            )}
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 sm:pt-12">
            <h1 className="display text-2xl">{displayName}</h1>
            {p.full_name && p.nickname && (
              <p className="text-sm text-muted-foreground">{p.full_name}</p>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
              {p.grade_level && (
                <BadgeUI variant="secondary">
                  <GraduationCap className="mr-1 size-3" /> {p.grade_level}
                </BadgeUI>
              )}
              {p.dek_code && <BadgeUI variant="outline">DEK{p.dek_code}</BadgeUI>}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatBox icon={Clock} label="เวลาเรียนรวม" value={`${Math.round(p.total_minutes / 60)} ชม.`} />
        <StatBox icon={BookOpen} label="คอร์สที่ลงทะเบียน" value={p.total_courses} />
        <StatBox icon={CheckCircle2} label="บทเรียนที่เรียนจบ" value={p.total_completed} />
      </div>

      {/* Showcase badges */}
      {showcaseBadges.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">เหรียญที่โชว์</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {showcaseBadges.map((b) => (
              <Card key={b.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/20 text-xl">
                    {b.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="display text-xl">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}
