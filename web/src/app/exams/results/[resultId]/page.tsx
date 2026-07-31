"use client";

import Link from "next/link";
import Image from "next/image";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getResultDetail } from "@/lib/api/exams";
import { cn } from "@/lib/utils";

export default function ResultDetailPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const { resultId } = use(params);
  const { data, isLoading } = useQuery({
    queryKey: ["exam-result", resultId],
    queryFn: () => getResultDetail(resultId),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const percent = data.total_score > 0 ? Math.round((data.score / data.total_score) * 100) : 0;
  const correctCount = data.questions.filter((q) => q.is_correct).length;
  const grade =
    percent >= 80 ? { label: "ดีมาก", variant: "success" as const, color: "text-emerald-600" } :
    percent >= 60 ? { label: "ดี", variant: "default" as const, color: "text-primary" } :
    percent >= 40 ? { label: "พอใช้", variant: "warning" as const, color: "text-amber-600" } :
                    { label: "ต้องปรับปรุง", variant: "destructive" as const, color: "text-destructive" };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/exams/results">
          <ArrowLeft className="size-4" /> กลับ
        </Link>
      </Button>

      {/* Score header */}
      <Card className="p-6 text-center">
        <p className="text-sm text-muted-foreground">ผลการทำข้อสอบ</p>
        <h1 className="display mt-1 text-2xl">{data.exam_title}</h1>
        <div className="my-6 flex items-center justify-center gap-6">
          <div>
            <p className={cn("display text-5xl", grade.color)}>{data.score}</p>
            <p className="text-xs text-muted-foreground">คะแนนที่ได้</p>
          </div>
          <div className="text-3xl text-muted-foreground">/</div>
          <div>
            <p className="display text-5xl">{data.total_score}</p>
            <p className="text-xs text-muted-foreground">คะแนนเต็ม</p>
          </div>
        </div>
        <Badge variant={grade.variant} className="text-sm">
          {percent}% · {grade.label}
        </Badge>
        <p className="mt-3 text-sm text-muted-foreground">
          ตอบถูก {correctCount} จาก {data.questions.length} ข้อ
        </p>
        <Button className="mt-5" asChild>
          <Link href={`/exams/${data.exam_id}/take`}>
            <RotateCcw className="size-4" /> ทำใหม่อีกครั้ง
          </Link>
        </Button>
      </Card>

      {/* Question review */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">เฉลยข้อสอบ</h2>
        <div className="space-y-4">
          {data.questions.map((q, idx) => (
            <Card key={q.id} className="p-5">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
                    q.is_correct
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-destructive/15 text-destructive"
                  )}
                >
                  {q.is_correct ? <Check className="size-4" /> : <X className="size-4" />}
                </span>
                <div className="flex-1 space-y-3">
                  <p>
                    <span className="text-muted-foreground">ข้อ {idx + 1}.</span>{" "}
                    {q.text}
                  </p>
                  {q.image_url && (
                    <div className="relative aspect-video max-w-md overflow-hidden rounded-lg border">
                      <Image
                        src={q.image_url.startsWith("http") ? q.image_url : `/api${q.image_url}`}
                        alt=""
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    {q.choices.map((c, ci) => {
                      const isChosen = c.id === q.chosen_choice_id;
                      const isCorrect = c.is_correct;
                      const letter = String.fromCharCode(65 + ci);

                      let style = "border bg-card";
                      let label: React.ReactNode = letter;
                      if (isCorrect) {
                        style = "border-emerald-500/40 bg-emerald-500/10";
                        label = <Check className="size-3.5 text-emerald-600" />;
                      } else if (isChosen) {
                        style = "border-destructive/40 bg-destructive/10";
                        label = <X className="size-3.5 text-destructive" />;
                      }

                      return (
                        <div
                          key={c.id}
                          className={cn("flex items-start gap-3 rounded-lg p-3 text-sm", style)}
                        >
                          <span
                            className={cn(
                              "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                              isCorrect
                                ? "bg-emerald-500 text-white"
                                : isChosen
                                ? "bg-destructive text-destructive-foreground"
                                : "bg-secondary text-muted-foreground"
                            )}
                          >
                            {label}
                          </span>
                          <span className="flex-1">{c.text}</span>
                          {isChosen && !isCorrect && (
                            <span className="text-xs font-medium text-destructive">คำตอบของคุณ</span>
                          )}
                          {isCorrect && (
                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                              เฉลย
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
