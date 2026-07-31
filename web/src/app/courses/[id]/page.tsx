"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Lock,
  Play,
  Star,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getCourse, getCourseChapters, getMyEnrollments } from "@/lib/api/courses";
import { useAuthStore } from "@/lib/auth/store";
import { formatTHB } from "@/lib/utils";

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const isAuthed = !!useAuthStore((s) => s.accessToken);

  const courseQ = useQuery({ queryKey: ["course", id], queryFn: () => getCourse(id) });
  const chaptersQ = useQuery({
    queryKey: ["course-chapters", id],
    queryFn: () => getCourseChapters(id),
  });
  const enrolledQ = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: getMyEnrollments,
    enabled: isAuthed,
  });

  const isEnrolled = enrolledQ.data?.some((e) => e.id === Number(id));
  const course = courseQ.data;

  if (courseQ.isLoading || !course) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <Skeleton className="aspect-video w-full" />
          <div className="mt-6 space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </div>
        </main>
      </>
    );
  }

  const totalLessons = chaptersQ.data?.reduce((sum, ch) => sum + ch.lessons.length, 0) ?? 0;
  const totalMinutes =
    chaptersQ.data?.reduce(
      (sum, ch) => sum + ch.lessons.reduce((s, l) => s + (l.duration || 0), 0),
      0
    ) ?? 0;

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="border-b bg-gradient-to-b from-secondary/30 to-background">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {course.category && <Badge variant="secondary">{course.category}</Badge>}
                {course.target_audience && <Badge variant="outline">{course.target_audience}</Badge>}
              </div>
              <h1 className="display text-3xl sm:text-4xl">{course.title}</h1>
              {course.description && (
                <p className="text-muted-foreground">{course.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {course.rating != null && (
                  <span className="flex items-center gap-1">
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    {course.rating.toFixed(1)}
                  </span>
                )}
                {course.enrolled_count != null && (
                  <span className="flex items-center gap-1">
                    <Users className="size-4" />
                    {course.enrolled_count.toLocaleString()} คนเรียนแล้ว
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <BookOpen className="size-4" />
                  {totalLessons} บทเรียน
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-4" />
                  {Math.round(totalMinutes / 60)} ชม. รวม
                </span>
              </div>
            </div>

            {/* Pricing card */}
            <Card className="overflow-hidden p-0">
              <div className="relative aspect-video bg-muted">
                {course.thumbnail ? (
                  <Image
                    src={
                      course.thumbnail.startsWith("http")
                        ? course.thumbnail
                        : `/api${course.thumbnail}`
                    }
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center gradient-brand text-white">
                    <Play className="size-12" />
                  </div>
                )}
              </div>
              <div className="space-y-4 p-6">
                <div className="display text-3xl text-primary">
                  {course.price === 0 ? "ฟรี" : formatTHB(course.price)}
                </div>

                {isEnrolled ? (
                  <Button size="lg" className="w-full" asChild>
                    <Link href={`/learn/${id}`}>
                      <Play className="size-4" />
                      เรียนต่อ
                    </Link>
                  </Button>
                ) : isAuthed ? (
                  <Button size="lg" className="w-full" asChild>
                    <Link href={`/checkout/${id}`}>ลงทะเบียนเรียน</Link>
                  </Button>
                ) : (
                  <Button size="lg" className="w-full" asChild>
                    <Link href={`/login?next=/courses/${id}`}>เข้าสู่ระบบเพื่อเรียน</Link>
                  </Button>
                )}

                <ul className="space-y-2 text-sm">
                  {[
                    "เข้าถึงตลอดอายุการใช้งาน",
                    "ดูได้ทุกอุปกรณ์",
                    "Workbook ดาวน์โหลดได้",
                    "ถาม-ตอบกับติวเตอร์",
                  ].map((p) => (
                    <li key={p} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>
        </section>

        {/* Curriculum */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 className="mb-6 text-2xl font-semibold">เนื้อหาในคอร์ส</h2>

          {chaptersQ.isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}

          {chaptersQ.data && chaptersQ.data.length === 0 && (
            <p className="text-muted-foreground">ยังไม่มีเนื้อหา</p>
          )}

          {chaptersQ.data && chaptersQ.data.length > 0 && (
            <div className="space-y-3">
              {chaptersQ.data.map((chapter, idx) => (
                <Card key={chapter.id} className="overflow-hidden">
                  <div className="border-b bg-secondary/40 px-5 py-3">
                    <h3 className="font-semibold">
                      <span className="text-muted-foreground">บทที่ {idx + 1}:</span>{" "}
                      {chapter.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {chapter.lessons.length} บทเรียน
                    </p>
                  </div>
                  <ul className="divide-y">
                    {chapter.lessons.map((lesson) => {
                      const accessible = !!isEnrolled;
                      return (
                        <li
                          key={lesson.id}
                          className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
                        >
                          <div className="flex items-center gap-3">
                            {accessible ? (
                              <Play className="size-4 text-primary" />
                            ) : (
                              <Lock className="size-4 text-muted-foreground" />
                            )}
                            <span className={accessible ? "" : "text-muted-foreground"}>
                              {lesson.title}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {lesson.duration} นาที
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
