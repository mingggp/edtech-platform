"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Clock, FileText, History, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { listExams, listMyResults } from "@/lib/api/exams";
import { useAuthStore } from "@/lib/auth/store";

export default function ExamsListPage() {
  const isAuthed = !!useAuthStore((s) => s.accessToken);
  const examsQ = useQuery({ queryKey: ["exams"], queryFn: listExams });
  const resultsQ = useQuery({
    queryKey: ["my-exam-results"],
    queryFn: listMyResults,
    enabled: isAuthed,
  });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="display text-3xl sm:text-4xl">คลังข้อสอบ</h1>
            <p className="mt-2 text-muted-foreground">
              ฝึกทำข้อสอบเตรียมความพร้อม TCAS / A-Level
            </p>
          </div>
          {isAuthed && (
            <Button variant="outline" asChild>
              <Link href="/exams/results">
                <History className="size-4" /> ประวัติการทำ
              </Link>
            </Button>
          )}
        </header>

        {examsQ.isLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        )}

        {examsQ.data && examsQ.data.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground">
            <FileText className="mx-auto mb-3 size-12 opacity-40" />
            ยังไม่มีข้อสอบเปิด
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {examsQ.data?.map((exam) => {
            const myResults = resultsQ.data?.filter((r) => r.exam_id === exam.id) ?? [];
            const bestScore = myResults.length
              ? Math.max(...myResults.map((r) => r.score))
              : null;
            const totalQuestions = exam.questions?.length ?? 0;

            return (
              <Card key={exam.id} className="p-6">
                <div className="flex items-start gap-3">
                  <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="size-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="line-clamp-2 font-semibold">{exam.title}</h3>
                    {exam.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {exam.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {totalQuestions > 0 && <span>{totalQuestions} ข้อ</span>}
                      {exam.time_limit > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" /> {exam.time_limit} นาที
                        </span>
                      )}
                      {bestScore != null && (
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          คะแนนสูงสุด {bestScore}/{myResults[0].total_score}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button className="mt-4 w-full" asChild>
                  <Link href={isAuthed ? `/exams/${exam.id}/take` : `/login?next=/exams/${exam.id}/take`}>
                    <PlayCircle className="size-4" />
                    {bestScore != null ? "ทำใหม่อีกครั้ง" : "เริ่มทำข้อสอบ"}
                  </Link>
                </Button>
              </Card>
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
