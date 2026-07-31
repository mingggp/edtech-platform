"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadImage, type CourseInput } from "@/lib/api/admin-courses";

interface Props {
  initial?: Partial<CourseInput>;
  submitLabel?: string;
  loading?: boolean;
  onSubmit: (values: CourseInput) => void;
}

export function CourseForm({ initial, submitLabel = "บันทึก", loading, onSubmit }: Props) {
  const [form, setForm] = useState<CourseInput>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    price: initial?.price ?? 0,
    category: initial?.category ?? "",
    thumbnail: initial?.thumbnail ?? null,
    target_audience: initial?.target_audience ?? "",
    highlights: initial?.highlights ?? "",
    is_active: initial?.is_active ?? false,
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      setForm((f) => ({ ...f, thumbnail: url }));
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลคอร์ส</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">ชื่อคอร์ส *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">คำอธิบาย *</Label>
            <Textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="highlights">ไฮไลท์ของคอร์ส</Label>
            <Textarea
              id="highlights"
              rows={3}
              placeholder="• ครอบคลุม TCAS รอบ 1-3&#10;• มี workbook พร้อมเฉลย&#10;• ติวสด live เดือนละ 1 ครั้ง"
              value={form.highlights ?? ""}
              onChange={(e) => setForm({ ...form, highlights: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="category">หมวด *</Label>
              <Input
                id="category"
                placeholder="คณิตศาสตร์"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_audience">เหมาะกับ</Label>
              <Input
                id="target_audience"
                placeholder="ม.4 / ม.5 / ม.6"
                value={form.target_audience ?? ""}
                onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">ราคา (บาท)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รูปปก</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
          />
          {form.thumbnail ? (
            <div className="space-y-3">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                <Image
                  src={form.thumbnail.startsWith("http") ? form.thumbnail : `/api${form.thumbnail}`}
                  alt="cover"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  เปลี่ยนรูป
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setForm({ ...form, thumbnail: null })}
                >
                  ลบ
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="grid cursor-pointer place-items-center rounded-lg border-2 border-dashed p-12 text-center hover:bg-secondary/30"
            >
              {uploading ? (
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Upload className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">คลิกเพื่ออัพโหลด</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG ขนาดไม่เกิน 5MB</p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="font-medium">เผยแพร่คอร์ส</p>
            <p className="text-xs text-muted-foreground">
              {form.is_active ? "นักเรียนเห็นและซื้อได้" : "ซ่อนจากนักเรียน (ใช้สำหรับร่าง)"}
            </p>
          </div>
          <input
            type="checkbox"
            checked={!!form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="size-5"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" size="lg" disabled={loading || !form.title || !form.description || !form.category}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
