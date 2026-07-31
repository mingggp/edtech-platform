"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Clock, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { submitExam, takeExam } from "@/lib/api/exams";
import { getApiErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export default function TakeExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // answers: { question_id: choice_id }
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const examQ = useQuery({ queryKey: ["exam-take", id], queryFn: () => takeExam(id) });

  // เริ่ม countdown timer
  useEffect(() => {
    if (!examQ.data || examQ.data.time_limit <= 0) return;
    setSecondsLeft(examQ.data.time_limit * 60);
  }, [examQ.data]);

  useEffect(() => {
    if (secondsLeft == null || secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => (s == null ? null : Math.max(0, s - 1)));
    }, 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const submitMut = useMutation({
    mutationFn: () => submitExam(id, answers),
    onSuccess: (result) => {
      toast({
        variant: "success",
        title: "ส่งคำตอบแล้ว",
        description: `คะแนน ${result.score}/${result.total_score}`,
      });
      router.replace(`/exams/results/${result.id}`);
    },
    onError: (e) => toast({ variant: "error", title: "ส่งไม่สำเร็จ", description: getApiErrorMessage(e) }),
  });

  // auto-submit เมื่อหมดเวลา
  useEffect(() => {
    if (secondsLeft === 0 && !submitMut.isPending && !submitMut.isSuccess) {
      submitMut.mutate();
    }
  }, [secondsLeft, submitMut]);

  const totalQuestions = examQ.data?.questions.length ?? 0;
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const percent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  if (examQ.isLoading || !examQ.data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Skeleton className="h-12 w-2/3" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3 sm:px-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/exams">
              <ArrowLeft className="size-4" /> ออก
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{examQ.data.title}</p>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex-1">
                <Progress value={percent} className="h-1.5" />
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {answeredCount}/{totalQuestions}
              </span>
            </div>
          </div>
          {secondsLeft != null && (
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1 text-sm font-mono tabular-nums",
                secondsLeft < 60
                  ? "bg-destructive/10 text-destructive"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              <Clock className="size-4" />
              {formatTime(secondsLeft)}
            </div>
          )}
        </div>
      </header>

      {/* Questions */}
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:px-6">
        {examQ.data.questions.map((q, idx) => {
          const selected = answers[q.id];
          return (
            <Card key={q.id} className="p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {idx + 1}
                </span>
                <div className="flex-1 space-y-3">
                  <p className="leading-relaxed">{q.text}</p>
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
                  <div className="space-y-2 pt-1">
                    {q.choices.map((c, ci) => {
                      const isSel = selected === c.id;
                      const letter = String.fromCharCode(65 + ci); // A, B, C, D
                      return (
                        <button
                          key={c.id}
                          onClick={() => setAnswers((a) => ({ ...a, [q.id]: c.id }))}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition-all",
                            isSel
                              ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                              : "hover:border-foreground/30 hover:bg-secondary/40"
                          )}
                        >
                          <span
                            className={cn(
                              "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                              isSel
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-muted-foreground"
                            )}
                          >
                            {isSel ? <Check className="size-3.5" /> : letter}
                          </span>
                          <span className="flex-1">{c.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        <Card className="p-5">
          <p className="text-sm text-muted-foreground">
            ตอบครบ {answeredCount} จาก {totalQuestions} ข้อ
            {answeredCount < totalQuestions && " — ข้อที่เว้นจะนับเป็น 0 คะแนน"}
          </p>
          <Button
            size="lg"
            className="mt-4 w-full"
            onClick={() => {
              if (answeredCount < totalQuestions && !confirm("ยังตอบไม่ครบ ส่งคำตอบเลย?")) return;
              submitMut.mutate();
            }}
            disabled={submitMut.isPending || answeredCount === 0}
          >
            {submitMut.isPending && <Loader2 className="size-4 animate-spin" />}
            ส่งคำตอบ
          </Button>
        </Card>
      </main>
    </div>
  );
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
