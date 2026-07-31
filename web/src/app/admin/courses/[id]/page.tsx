"use client";

import Link from "next/link";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseForm } from "@/components/admin/course-form";
import { CurriculumEditor } from "@/components/admin/curriculum-editor";
import { toast } from "@/components/ui/toaster";
import { getCourse } from "@/lib/api/courses";
import { deleteCourse, updateCourse } from "@/lib/api/admin-courses";
import { getApiErrorMessage } from "@/lib/api/client";

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const courseId = Number(id);
  const router = useRouter();
  const qc = useQueryClient();

  const courseQ = useQuery({ queryKey: ["course", id], queryFn: () => getCourse(id) });

  const updateMut = useMutation({
    mutationFn: (values: import("@/lib/api/admin-courses").CourseInput) =>
      updateCourse(courseId, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course", id] });
      toast({ variant: "success", title: "บันทึกแล้ว" });
    },
    onError: (e) => toast({ variant: "error", title: "ผิดพลาด", description: getApiErrorMessage(e) }),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteCourse(courseId),
    onSuccess: () => {
      toast({ variant: "success", title: "ลบคอร์สแล้ว" });
      router.push("/admin/courses");
    },
    onError: (e) => toast({ variant: "error", title: "ผิดพลาด", description: getApiErrorMessage(e) }),
  });

  if (courseQ.isLoading || !courseQ.data) {
    return <Skeleton className="h-48" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/courses">
              <ArrowLeft className="size-4" /> กลับ
            </Link>
          </Button>
          <h1 className="display text-3xl">{courseQ.data.title}</h1>
          <p className="text-sm text-muted-foreground">Course #{courseQ.data.id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/courses/${id}`} target="_blank">
              <ExternalLink className="size-4" /> ดูในหน้านักเรียน
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              confirm(`ลบคอร์ส "${courseQ.data.title}" และเนื้อหาทั้งหมด?`) && deleteMut.mutate()
            }
            disabled={deleteMut.isPending}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">ข้อมูลคอร์ส</TabsTrigger>
          <TabsTrigger value="curriculum">เนื้อหา</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <CourseForm
            initial={courseQ.data}
            submitLabel="บันทึกการเปลี่ยนแปลง"
            loading={updateMut.isPending}
            onSubmit={(values) => updateMut.mutate(values)}
          />
        </TabsContent>

        <TabsContent value="curriculum">
          <CurriculumEditor courseId={courseId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
