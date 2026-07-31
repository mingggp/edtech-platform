"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, Lock, Sparkles, Star } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge as BadgeUI } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toaster";
import { getMyAchievements, updateShowcase, type Badge } from "@/lib/api/achievements";
import { getApiErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const MAX_SHOWCASE = 6;

const CATEGORY_LABEL: Record<string, string> = {
  General: "ทั่วไป",
  Learning: "การเรียน",
  Crazy: "ขั้นเทพ",
};

export default function AchievementsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-achievements"],
    queryFn: getMyAchievements,
  });

  const showcaseMut = useMutation({
    mutationFn: updateShowcase,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-achievements"] });
      toast({ variant: "success", title: "อัพเดท showcase แล้ว" });
    },
    onError: (e) => toast({ variant: "error", title: "ผิดพลาด", description: getApiErrorMessage(e) }),
  });

  const earned = useMemo(() => data?.filter((b) => b.is_unlocked) ?? [], [data]);
  const locked = useMemo(() => data?.filter((b) => !b.is_unlocked) ?? [], [data]);
  const showcased = useMemo(() => earned.filter((b) => b.is_showcased), [earned]);

  const toggleShowcase = (badge: Badge) => {
    if (!badge.is_unlocked) return;
    const current = earned.filter((b) => b.is_showcased).map((b) => b.id);
    let next: string[];
    if (current.includes(badge.id)) {
      next = current.filter((id) => id !== badge.id);
    } else {
      if (current.length >= MAX_SHOWCASE) {
        toast({ variant: "error", title: `เลือกได้สูงสุด ${MAX_SHOWCASE} เหรียญ` });
        return;
      }
      next = [...current, badge.id];
    }
    showcaseMut.mutate(next);
  };

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, Badge[]> = {};
    (data ?? []).forEach((b) => {
      const k = b.category || "อื่นๆ";
      if (!groups[k]) groups[k] = [];
      groups[k].push(b);
    });
    return groups;
  }, [data]);

  return (
    <div className="space-y-8">
      <header className="text-center">
        <Award className="mx-auto mb-3 size-12 text-accent" />
        <h1 className="display text-3xl">Achievement ของฉัน</h1>
        <p className="mt-2 text-muted-foreground">
          ปลดล็อก {earned.length} จาก {data?.length ?? 0} เหรียญ · โชว์อยู่ {showcased.length}/{MAX_SHOWCASE}
        </p>
      </header>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      )}

      {data && (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
            <TabsTrigger value="earned">
              ปลดล็อกแล้ว <BadgeUI variant="success" className="ml-1.5">{earned.length}</BadgeUI>
            </TabsTrigger>
            <TabsTrigger value="locked">
              ยังไม่ปลดล็อก <BadgeUI variant="secondary" className="ml-1.5">{locked.length}</BadgeUI>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-8">
            {Object.entries(groupedByCategory).map(([cat, badges]) => (
              <section key={cat}>
                <h2 className="mb-3 text-lg font-semibold">{CATEGORY_LABEL[cat] ?? cat}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {badges.map((b) => (
                    <BadgeCard key={b.id} badge={b} onToggleShowcase={toggleShowcase} disabled={showcaseMut.isPending} />
                  ))}
                </div>
              </section>
            ))}
          </TabsContent>

          <TabsContent value="earned">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {earned.map((b) => (
                <BadgeCard key={b.id} badge={b} onToggleShowcase={toggleShowcase} disabled={showcaseMut.isPending} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="locked">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {locked.map((b) => (
                <BadgeCard key={b.id} badge={b} onToggleShowcase={toggleShowcase} disabled />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {data && data.length === 0 && !isLoading && (
        <Card className="p-12 text-center text-muted-foreground">ระบบ achievement กำลังจะเปิดเร็วๆ นี้</Card>
      )}
    </div>
  );
}

function BadgeCard({
  badge: b,
  onToggleShowcase,
  disabled,
}: {
  badge: Badge;
  onToggleShowcase: (b: Badge) => void;
  disabled?: boolean;
}) {
  return (
    <Card
      className={cn(
        "relative p-5 transition-all",
        b.is_unlocked ? "border-accent/30 bg-accent/5" : "opacity-60",
        b.is_showcased && "ring-2 ring-accent"
      )}
    >
      {b.is_showcased && (
        <div className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-accent text-accent-foreground shadow-md">
          <Star className="size-3.5 fill-current" />
        </div>
      )}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-xl text-2xl",
            b.is_unlocked ? "bg-accent/20" : "bg-muted"
          )}
        >
          {b.is_unlocked ? b.icon : <Lock className="size-5 text-muted-foreground" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{b.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
          {b.is_unlocked && (
            <button
              onClick={() => onToggleShowcase(b)}
              disabled={disabled}
              className={cn(
                "mt-3 inline-flex items-center gap-1 text-xs font-medium transition-colors disabled:opacity-50",
                b.is_showcased ? "text-accent hover:underline" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="size-3" />
              {b.is_showcased ? "เอาออกจาก showcase" : "ปักโชว์บนโปรไฟล์"}
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
