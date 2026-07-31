"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Circle,
  Menu,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoPlayer } from "@/components/learn/video-player";
import { getCourse, getCourseChapters } from "@/lib/api/courses";
import { getProgress, toggleLessonComplete } from "@/lib/api/learning";
import type { Lesson } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function LearnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const courseQ = useQuery({ queryKey: ["course", id], queryFn: () => getCourse(id) });
  const chaptersQ = useQuery({
    queryKey: ["course-chapters", id],
    queryFn: () => getCourseChapters(id),
  });
  const progressQ = useQuery({
    queryKey: ["progress", id],
    queryFn: () => getProgress(id),
  });

  // เลือก lesson แรกที่ยังไม่ทำเป็น default
  const lessons = useMemo<Lesson[]>(
    () => chaptersQ.data?.flatMap((c) => c.lessons) ?? [],
    [chaptersQ.data]
  );
  const completedSet = useMemo(
    () => new Set(progressQ.data?.completed_ids ?? []),
    [progressQ.data]
  );

  const totalLessons = lessons.length;
  const completedCount = lessons.filter((l) => completedSet.has(l.id)).length;
  const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const currentLesson = useMemo(() => {
    if (activeLessonId) return lessons.find((l) => l.id === activeLessonId) ?? null;
    return lessons.find((l) => !completedSet.has(l.id)) ?? lessons[0] ?? null;
  }, [activeLessonId, lessons, completedSet]);

  const toggleMutation = useMutation({
    mutationFn: (lessonId: number) => toggleLessonComplete(id, lessonId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["progress", id] }),
  });

  return (
    <div className="grid h-screen grid-cols-1 lg:grid-cols-[1fr_360px]">
      {/* Main */}
      <div className="flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-3 border-b bg-background px-4 py-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/courses/${id}`}>
              <ArrowLeft className="size-4" />
              ออก
            </Link>
          </Button>
          <div className="flex-1 truncate text-sm text-muted-foreground">
            {courseQ.data?.title}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
          {!currentLesson ? (
            <Skeleton className="aspect-video w-full" />
          ) : (
            <div className="mx-auto max-w-4xl space-y-5">
              <VideoPlayer source={currentLesson.youtube_id} title={currentLesson.title} />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-xl font-semibold sm:text-2xl">{currentLesson.title}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {currentLesson.duration} นาที
                  </p>
                </div>
                <Button
                  variant={completedSet.has(currentLesson.id) ? "secondary" : "default"}
                  onClick={() => toggleMutation.mutate(currentLesson.id)}
                  disabled={toggleMutation.isPending}
                >
                  {completedSet.has(currentLesson.id) ? (
                    <>
                      <CheckCircle2 className="size-4" /> ทำเครื่องหมายแล้ว
                    </>
                  ) : (
                    <>
                      <Circle className="size-4" /> ทำเครื่องหมายว่าเรียนแล้ว
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-30 flex w-[88vw] max-w-sm flex-col border-l bg-card transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        <div className="border-b p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            ความก้าวหน้า
          </p>
          <div className="mt-2">
            <Progress value={percent} />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {completedCount} / {totalLessons} บท ({percent}%)
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chaptersQ.data?.map((chapter, idx) => (
            <ChapterAccordion
              key={chapter.id}
              chapter={chapter}
              order={idx + 1}
              currentLessonId={currentLesson?.id ?? null}
              completedSet={completedSet}
              onSelect={(lessonId) => {
                setActiveLessonId(lessonId);
                setSidebarOpen(false);
              }}
            />
          ))}
        </div>
      </aside>
    </div>
  );
}

function ChapterAccordion({
  chapter,
  order,
  currentLessonId,
  completedSet,
  onSelect,
}: {
  chapter: import("@/lib/types").Chapter;
  order: number;
  currentLessonId: number | null;
  completedSet: Set<number>;
  onSelect: (lessonId: number) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 p-4 text-left hover:bg-secondary/40"
      >
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">บทที่ {order}</p>
          <p className="truncate text-sm font-semibold">{chapter.title}</p>
        </div>
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <ul>
          {chapter.lessons.map((lesson) => {
            const isCurrent = lesson.id === currentLessonId;
            const isDone = completedSet.has(lesson.id);
            return (
              <li key={lesson.id}>
                <button
                  onClick={() => onSelect(lesson.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm transition-colors hover:bg-secondary/40",
                    isCurrent && "bg-primary/10 font-medium text-primary"
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="flex-1 truncate">{lesson.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {lesson.duration}m
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
