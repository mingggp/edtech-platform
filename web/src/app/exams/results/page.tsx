"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileText, History } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { listMyResults } from "@/lib/api/exams";
import { timeAgo } from "@/lib/utils";

export default function ResultsHistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-exam-results"],
    queryFn: listMyResults,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="display text-3xl flex items-center gap-3">
          <History className="size-7" /> ประวัติการทำข้อสอบ
        </h1>
        <p className="mt-1 text-muted-foreground">{data?.length ?? 0} ครั้ง</p>
      </header>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      )}

      {data && data.length === 0 && (
        <Card className="p-12 text-center">
          <FileText className="mx-auto mb-3 size-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">คุณยังไม่เคยทำข้อสอบ</p>
          <Button className="mt-4" asChild>
            <Link href="/exams">ดูคลังข้อสอบ</Link>
          </Button>
        </Card>
      )}

      <div className="space-y-3">
        {data?.map((r) => {
          const percent = r.total_score > 0 ? Math.round((r.score / r.total_score) * 100) : 0;
          const grade =
            percent >= 80 ? { label: "ดีมาก", variant: "success" as const } :
            percent >= 60 ? { label: "ดี", variant: "default" as const } :
            percent >= 40 ? { label: "พอใช้", variant: "warning" as const } :
                            { label: "ต้องปรับปรุง", variant: "destructive" as const };

          return (
            <Link key={r.id} href={`/exams/results/${r.id}`}>
              <Card className="flex flex-wrap items-center gap-4 p-4 transition-colors hover:bg-secondary/30">
                <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="size-6" />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <p className="font-semibold">{r.exam_title || `Exam #${r.exam_id}`}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(r.submitted_at)}</p>
                </div>
                <div className="text-right">
                  <p className="display text-2xl">
                    {r.score}/{r.total_score}
                  </p>
                  <Badge variant={grade.variant}>
                    {percent}% · {grade.label}
                  </Badge>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
