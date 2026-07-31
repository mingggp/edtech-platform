"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Crown, Medal, Trophy } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getLeaderboard } from "@/lib/api/learning";
import { cn } from "@/lib/utils";

const PODIUM_STYLES: Record<number, { bg: string; icon: typeof Crown; color: string; label: string }> = {
  1: { bg: "bg-amber-500/10", icon: Crown, color: "text-amber-500", label: "อันดับ 1" },
  2: { bg: "bg-zinc-300/30 dark:bg-zinc-500/20", icon: Trophy, color: "text-zinc-400", label: "อันดับ 2" },
  3: { bg: "bg-orange-700/15", icon: Medal, color: "text-orange-600", label: "อันดับ 3" },
};

export default function LeaderboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: getLeaderboard,
  });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <header className="mb-8 text-center">
          <Trophy className="mx-auto mb-3 size-12 text-amber-500" />
          <h1 className="display text-3xl sm:text-4xl">อันดับนักเรียนขยัน</h1>
          <p className="mt-2 text-muted-foreground">
            จัดอันดับตามเวลาเรียนสะสม — เรียนยิ่งเยอะ ติดอันดับยิ่งสูง
          </p>
        </header>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}

        {data && data.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground">
            ยังไม่มีข้อมูลการเรียน — เริ่มเรียนเพื่อขึ้นอันดับ!
          </Card>
        )}

        <div className="space-y-3">
          {data?.map((entry, idx) => {
            const rank = idx + 1;
            const style = PODIUM_STYLES[rank];
            const Icon = style?.icon;
            return (
              <Link key={entry.id} href={`/u/${entry.id}`}>
              <Card
                className={cn("flex items-center gap-4 p-4 transition-all hover:shadow-md", style?.bg)}
              >
                <div
                  className={cn(
                    "grid size-12 shrink-0 place-items-center rounded-xl font-bold",
                    style ? "bg-background shadow-sm" : "bg-secondary text-muted-foreground"
                  )}
                >
                  {Icon ? <Icon className={cn("size-5", style.color)} /> : `#${rank}`}
                </div>

                <Avatar className="size-12">
                  {entry.avatar_url && (
                    <AvatarImage
                      src={entry.avatar_url.startsWith("http") ? entry.avatar_url : `/api${entry.avatar_url}`}
                      alt={entry.full_name}
                    />
                  )}
                  <AvatarFallback>{entry.full_name?.[0] ?? "?"}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold">{entry.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {rank <= 3 ? style?.label : `อันดับ ${rank}`} · เรียนจบ {entry.completed_count} บท
                  </p>
                </div>

                <div className="text-right">
                  <p className="display text-xl">{Math.round(entry.total_minutes / 60)}</p>
                  <p className="text-xs text-muted-foreground">ชั่วโมง</p>
                </div>
              </Card>
              </Link>
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
