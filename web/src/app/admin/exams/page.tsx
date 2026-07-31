"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Plus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { listExams } from "@/lib/api/exams";
import { createExam } from "@/lib/api/admin-exams";
import { getApiErrorMessage } from "@/lib/api/client";

export default function AdminExamsPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", time_limit: 0 });

  const examsQ = useQuery({ queryKey: ["exams"], queryFn: listExams });

  const createMut = useMutation({
    mutationFn: () =>
      createExam({
        title: form.title,
        description: form.description || null,
        time_limit: Number(form.time_limit),
      }),
    onSuccess: (exam) => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      toast({ variant: "success", title: "สร้างข้อสอบแล้ว" });
      setOpen(false);
      setForm({ title: "", description: "", time_limit: 0 });
      router.push(`/admin/exams/${exam.id}`);
    },
    onError: (e) => toast({ variant: "error", title: "ผิดพลาด", description: getApiErrorMessage(e) }),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-3xl">ข้อสอบ</h1>
          <p className="mt-1 text-muted-foreground">{examsQ.data?.length ?? 0} ชุด</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> สร้างข้อสอบใหม่
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>สร้างข้อสอบใหม่</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="t">ชื่อข้อสอบ *</Label>
                <Input
                  id="t"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="เช่น TGAT3 พิชิตคณิต A-Level"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="d">คำอธิบาย</Label>
                <Textarea
                  id="d"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tl">เวลาที่จำกัด (นาที — 0 = ไม่จำกัด)</Label>
                <Input
                  id="tl"
                  type="number"
                  min={0}
                  value={form.time_limit}
                  onChange={(e) => setForm({ ...form, time_limit: Number(e.target.value) })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
              <Button onClick={() => createMut.mutate()} disabled={!form.title || createMut.isPending}>
                {createMut.isPending && <Loader2 className="size-4 animate-spin" />}
                สร้าง
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {examsQ.isLoading && (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      )}

      {examsQ.data && examsQ.data.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">
          <FileText className="mx-auto mb-3 size-12 opacity-40" />
          ยังไม่มีข้อสอบ — กดสร้างใหม่เพื่อเริ่ม
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {examsQ.data?.map((exam) => (
          <Link key={exam.id} href={`/admin/exams/${exam.id}`}>
            <Card className="p-5 transition-colors hover:bg-secondary/40">
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{exam.title}</p>
                  {exam.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {exam.description}
                    </p>
                  )}
                  <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                    {exam.time_limit > 0 ? <span>{exam.time_limit} นาที</span> : <span>ไม่จำกัดเวลา</span>}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
