"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CourseForm } from "@/components/admin/course-form";
import { toast } from "@/components/ui/toaster";
import { createCourse } from "@/lib/api/admin-courses";
import { getApiErrorMessage } from "@/lib/api/client";

export default function NewCoursePage() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: createCourse,
    onSuccess: (course) => {
      toast({ variant: "success", title: "สร้างคอร์สแล้ว" });
      router.push(`/admin/courses/${course.id}`);
    },
    onError: (e) => toast({ variant: "error", title: "ผิดพลาด", description: getApiErrorMessage(e) }),
  });

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/courses">
            <ArrowLeft className="size-4" /> กลับ
          </Link>
        </Button>
        <h1 className="display text-3xl">สร้างคอร์สใหม่</h1>
      </div>

      <CourseForm
        submitLabel="สร้างคอร์ส"
        loading={mutation.isPending}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </div>
  );
}
