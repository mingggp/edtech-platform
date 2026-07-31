"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, GripVertical, Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { getCourseChapters } from "@/lib/api/courses";
import {
  addChapter,
  addLesson,
  deleteChapter,
  deleteLesson,
} from "@/lib/api/admin-courses";
import { getApiErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

/** ดึง YouTube ID จาก URL หรือคืน input ตรงๆ ถ้าเป็น ID อยู่แล้ว */
function extractYouTubeId(input: string): string {
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim();
  try {
    const url = new URL(input);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1);
    if (url.hostname.includes("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v) return v;
      const m = url.pathname.match(/\/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})/);
      if (m) return m[1];
    }
  } catch {
    /* not a URL */
  }
  return input;
}

export function CurriculumEditor({ courseId }: { courseId: number }) {
  const qc = useQueryClient();
  const [newChapterOpen, setNewChapterOpen] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newLessonFor, setNewLessonFor] = useState<number | null>(null);
  const [newLesson, setNewLesson] = useState({ title: "", youtube_id: "", duration: 0, order: 0 });

  const chaptersQ = useQuery({
    queryKey: ["course-chapters", courseId],
    queryFn: () => getCourseChapters(courseId),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["course-chapters", courseId] });

  const addChapterMut = useMutation({
    mutationFn: () => addChapter(courseId, { title: newChapterTitle }),
    onSuccess: () => {
      invalidate();
      setNewChapterOpen(false);
      setNewChapterTitle("");
    },
    onError: (e) => toast({ variant: "error", title: "ผิดพลาด", description: getApiErrorMessage(e) }),
  });

  const deleteChapterMut = useMutation({
    mutationFn: deleteChapter,
    onSuccess: () => invalidate(),
    onError: (e) => toast({ variant: "error", title: "ผิดพลาด", description: getApiErrorMessage(e) }),
  });

  const addLessonMut = useMutation({
    mutationFn: () => {
      if (!newLessonFor) throw new Error("เลือกบทก่อน");
      return addLesson(newLessonFor, newLesson);
    },
    onSuccess: () => {
      invalidate();
      setNewLessonFor(null);
      setNewLesson({ title: "", youtube_id: "", duration: 0, order: 0 });
    },
    onError: (e) => toast({ variant: "error", title: "ผิดพลาด", description: getApiErrorMessage(e) }),
  });

  const deleteLessonMut = useMutation({
    mutationFn: deleteLesson,
    onSuccess: () => invalidate(),
    onError: (e) => toast({ variant: "error", title: "ผิดพลาด", description: getApiErrorMessage(e) }),
  });

  return (
    <Card className="space-y-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">เนื้อหาในคอร์ส</h2>
          <p className="text-xs text-muted-foreground">
            จัดบทเรียนเป็นหมวด แล้วเพิ่มบทเรียนภายในแต่ละหมวด
          </p>
        </div>
        <Button onClick={() => setNewChapterOpen(true)}>
          <Plus className="size-4" /> เพิ่มบท
        </Button>
      </header>

      {chaptersQ.isLoading && <Skeleton className="h-20 w-full" />}
      {chaptersQ.data?.length === 0 && (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          ยังไม่มีบท — กดปุ่ม &ldquo;เพิ่มบท&rdquo; เพื่อเริ่ม
        </p>
      )}

      <div className="space-y-3">
        {chaptersQ.data?.map((chapter, i) => (
          <ChapterRow
            key={chapter.id}
            chapter={chapter}
            order={i + 1}
            onDelete={() => {
              if (confirm(`ลบบท "${chapter.title}" และบทเรียนทั้งหมดในนั้น?`))
                deleteChapterMut.mutate(chapter.id);
            }}
            onAddLesson={() => setNewLessonFor(chapter.id)}
            onDeleteLesson={(id) => deleteLessonMut.mutate(id)}
          />
        ))}
      </div>

      {/* New chapter dialog */}
      <Dialog open={newChapterOpen} onOpenChange={setNewChapterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มบทใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ch-title">ชื่อบท</Label>
            <Input
              id="ch-title"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder="บทที่ 1: บทนำ"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewChapterOpen(false)}>ยกเลิก</Button>
            <Button
              onClick={() => addChapterMut.mutate()}
              disabled={!newChapterTitle || addChapterMut.isPending}
            >
              {addChapterMut.isPending && <Loader2 className="size-4 animate-spin" />}
              เพิ่ม
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New lesson dialog */}
      <Dialog open={newLessonFor !== null} onOpenChange={(o) => !o && setNewLessonFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มบทเรียนใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="ls-title">ชื่อบทเรียน</Label>
              <Input
                id="ls-title"
                value={newLesson.title}
                onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ls-video">YouTube ID *</Label>
              <Input
                id="ls-video"
                placeholder="dQw4w9WgXcQ (11 ตัวจาก URL)"
                value={newLesson.youtube_id}
                onChange={(e) => setNewLesson({ ...newLesson, youtube_id: extractYouTubeId(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                วาง URL เต็มก็ได้ ระบบจะดึง ID ให้อัตโนมัติ
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ls-mins">ความยาว (นาที)</Label>
              <Input
                id="ls-mins"
                type="number"
                min={0}
                value={newLesson.duration}
                onChange={(e) =>
                  setNewLesson({ ...newLesson, duration: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewLessonFor(null)}>ยกเลิก</Button>
            <Button
              onClick={() => addLessonMut.mutate()}
              disabled={!newLesson.title || addLessonMut.isPending}
            >
              {addLessonMut.isPending && <Loader2 className="size-4 animate-spin" />}
              เพิ่ม
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ChapterRow({
  chapter,
  order,
  onDelete,
  onAddLesson,
  onDeleteLesson,
}: {
  chapter: import("@/lib/types").Chapter;
  order: number;
  onDelete: () => void;
  onAddLesson: () => void;
  onDeleteLesson: (id: number) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex items-center gap-2 border-b bg-secondary/30 p-3">
        <button
          onClick={() => setOpen(!open)}
          className="grid size-8 place-items-center rounded-md hover:bg-secondary"
        >
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </button>
        <GripVertical className="size-4 cursor-move text-muted-foreground" />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">บทที่ {order}</p>
          <p className="font-semibold">{chapter.title}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={onAddLesson}>
          <Plus className="size-4" /> เพิ่มบทเรียน
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
      {open && (
        <ul className="divide-y">
          {chapter.lessons.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">ยังไม่มีบทเรียน</li>
          ) : (
            chapter.lessons.map((lesson) => (
              <li key={lesson.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <GripVertical className="size-4 cursor-move text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{lesson.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {lesson.duration} นาที
                    {lesson.youtube_id ? "" : " · ไม่มีวิดีโอ"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => confirm(`ลบ "${lesson.title}"?`) && onDeleteLesson(lesson.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
