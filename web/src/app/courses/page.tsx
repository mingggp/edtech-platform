"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Users } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { listCourses } from "@/lib/api/courses";
import { formatTHB } from "@/lib/utils";

export default function CoursesPage() {
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ["courses"],
    queryFn: () => listCourses(),
  });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <header className="mb-10 max-w-2xl">
          <h1 className="display text-3xl sm:text-4xl">คอร์สเรียนทั้งหมด</h1>
          <p className="mt-2 text-muted-foreground">
            เลือกคอร์สที่ใช่สำหรับเป้าหมายของคุณ — ทดลองดูตัวอย่างได้ฟรีก่อนตัดสินใจ
          </p>
        </header>

        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-video animate-pulse bg-muted" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <Card className="p-8 text-center">
            <p className="text-destructive">โหลดคอร์สไม่สำเร็จ — ลองรีเฟรชอีกครั้ง</p>
          </Card>
        )}

        {courses && courses.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground">
            <BookOpen className="mx-auto mb-4 size-12 opacity-40" />
            <p>ยังไม่มีคอร์สเปิดสอน</p>
          </Card>
        )}

        {courses && courses.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function CourseCard({ course }: { course: import("@/lib/types").Course }) {
  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="group h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail.startsWith("http") ? course.thumbnail : `/api${course.thumbnail}`}
              alt={course.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="grid h-full place-items-center gradient-brand text-white">
              <BookOpen className="size-12 opacity-60" />
            </div>
          )}
          {course.category && (
            <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium backdrop-blur">
              {course.category}
            </span>
          )}
        </div>

        <div className="space-y-3 p-5">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug">{course.title}</h3>
          {course.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {course.total_lessons != null && (
              <span className="flex items-center gap-1">
                <BookOpen className="size-3.5" />
                {course.total_lessons} บท
              </span>
            )}
            {course.target_audience && (
              <span className="flex items-center gap-1">
                <Users className="size-3.5" />
                {course.target_audience}
              </span>
            )}
          </div>

          <div className="flex items-end justify-between border-t pt-4">
            <span className="display text-xl text-primary">
              {course.price === 0 ? "ฟรี" : formatTHB(course.price)}
            </span>
            <Button size="sm" variant="ghost" className="pointer-events-none">
              ดูรายละเอียด →
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
