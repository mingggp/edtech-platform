"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  GripVertical,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import {
  addQuestion,
  deleteQuestion,
  getAdminExam,
  type AdminChoiceInput,
} from "@/lib/api/admin-exams";
import { getApiErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export default function AdminExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const examId = Number(id);
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [newQ, setNewQ] = useState<{
    text: string;
    image_url: string;
    choices: AdminChoiceInput[];
  }>({
    text: "",
    image_url: "",
    choices: [
      { text: "", is_correct: false },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
    ],
  });

  const examQ = useQuery({
    queryKey: ["admin-exam", id],
    queryFn: () => getAdminExam(id),
  });

  const addQuestionMut = useMutation({
    mutationFn: () =>
      addQuestion(examId, {
        text: newQ.text,
        image_url: newQ.image_url || null,
        question_type: "choice",
        order: (examQ.data?.questions.length ?? 0) + 1,
        choices: newQ.choices.filter((c) => c.text.trim()),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-exam", id] });
      toast({ variant: "success", title: "เพิ่มคำถามแล้ว" });
      setOpen(false);
      setNewQ({
        text: "",
        image_url: "",
        choices: [
          { text: "", is_correct: false },
          { text: "", is_correct: false },
          { text: "", is_correct: false },
          { text: "", is_correct: false },
        ],
      });
    },
    onError: (e) => toast({ variant: "error", title: "ผิดพลาด", description: getApiErrorMessage(e) }),
  });

  const deleteQuestionMut = useMutation({
    mutationFn: deleteQuestion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-exam", id] });
      toast({ variant: "success", title: "ลบคำถามแล้ว" });
    },
    onError: (e) => toast({ variant: "error", title: "ผิดพลาด", description: getApiErrorMessage(e) }),
  });

  const setChoiceCorrect = (idx: number) => {
    setNewQ((q) => ({
      ...q,
      choices: q.choices.map((c, i) => ({ ...c, is_correct: i === idx })),
    }));
  };

  const setChoiceText = (idx: number, text: string) => {
    setNewQ((q) => ({
      ...q,
      choices: q.choices.map((c, i) => (i === idx ? { ...c, text } : c)),
    }));
  };

  if (examQ.isLoading || !examQ.data) {
    return <Skeleton className="h-48" />;
  }

  const exam = examQ.data;
  const valid = newQ.text.trim() && newQ.choices.filter((c) => c.text.trim()).length >= 2 && newQ.choices.some((c) => c.is_correct);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/exams">
              <ArrowLeft className="size-4" /> กลับ
            </Link>
          </Button>
          <h1 className="display text-3xl">{exam.title}</h1>
          <p className="text-sm text-muted-foreground">
            Exam #{exam.id} · {exam.questions.length} คำถาม
            {exam.time_limit > 0 && ` · ${exam.time_limit} นาที`}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/exams/${exam.id}/take`} target="_blank">
            <ExternalLink className="size-4" /> ดูในหน้านักเรียน
          </Link>
        </Button>
      </div>

      {exam.description && (
        <Card className="p-4 text-sm text-muted-foreground">{exam.description}</Card>
      )}

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">คำถาม</h2>
            <p className="text-xs text-muted-foreground">{exam.questions.length} ข้อ</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" /> เพิ่มคำถาม
            </Button>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>เพิ่มคำถามใหม่</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qt">คำถาม *</Label>
                  <Textarea
                    id="qt"
                    rows={3}
                    value={newQ.text}
                    onChange={(e) => setNewQ({ ...newQ, text: e.target.value })}
                    placeholder="เช่น sin(30°) + cos(60°) มีค่าเท่าไร?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qi">รูปประกอบ URL (optional)</Label>
                  <Input
                    id="qi"
                    value={newQ.image_url}
                    onChange={(e) => setNewQ({ ...newQ, image_url: e.target.value })}
                    placeholder="/static/uploads/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>ตัวเลือก (กดวงกลมเพื่อเลือกข้อที่ถูก)</Label>
                  {newQ.choices.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <button
                        onClick={() => setChoiceCorrect(i)}
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-full border-2 transition-colors",
                          c.is_correct
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-input hover:border-foreground/30"
                        )}
                        title={c.is_correct ? "เป็นคำตอบที่ถูก" : "กดเพื่อเลือกว่าเป็นคำตอบที่ถูก"}
                      >
                        {c.is_correct ? <Check className="size-4" /> : String.fromCharCode(65 + i)}
                      </button>
                      <Input
                        value={c.text}
                        onChange={(e) => setChoiceText(i, e.target.value)}
                        placeholder={`ตัวเลือก ${String.fromCharCode(65 + i)}`}
                      />
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    ต้องมีตัวเลือกอย่างน้อย 2 ข้อ และเลือก 1 ข้อเป็นคำตอบที่ถูก
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
                <Button onClick={() => addQuestionMut.mutate()} disabled={!valid || addQuestionMut.isPending}>
                  {addQuestionMut.isPending && <Loader2 className="size-4 animate-spin" />}
                  เพิ่ม
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {exam.questions.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            ยังไม่มีคำถาม — กดเพิ่มเพื่อเริ่ม
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {exam.questions
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((q, idx) => (
                <li key={q.id} className="rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <GripVertical className="mt-1 size-4 cursor-move text-muted-foreground" />
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{q.text}</p>
                      <ul className="mt-2 space-y-1 text-sm">
                        {q.choices.map((c, ci) => (
                          <li
                            key={c.id}
                            className={cn(
                              "flex items-center gap-2",
                              c.is_correct ? "text-emerald-600 font-medium dark:text-emerald-400" : "text-muted-foreground"
                            )}
                          >
                            {c.is_correct ? <Check className="size-3.5" /> : <X className="size-3.5 opacity-30" />}
                            <span>
                              {String.fromCharCode(65 + ci)}. {c.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        confirm(`ลบคำถาม "${q.text.slice(0, 40)}..."?`) && deleteQuestionMut.mutate(q.id)
                      }
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
