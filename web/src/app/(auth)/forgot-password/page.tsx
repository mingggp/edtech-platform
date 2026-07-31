"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/api/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () => requestPasswordReset(email),
    onSuccess: () => setSubmitted(true),
    // ไม่ว่า email มีอยู่จริงหรือไม่ — แสดง success message เพื่อกัน user enumeration
    onError: () => setSubmitted(true),
  });

  if (submitted) {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
        <div>
          <h1 className="display text-2xl">ตรวจสอบอีเมลของคุณ</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            ถ้าอีเมลที่กรอกมีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/login">
            <ArrowLeft className="size-4" />
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="display text-3xl">ลืมรหัสผ่าน</h1>
        <p className="text-sm text-muted-foreground">
          กรอกอีเมลที่ใช้สมัคร เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="email">อีเมล</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending || !email}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          ส่งลิงก์รีเซ็ตรหัสผ่าน
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        จำรหัสผ่านได้แล้ว?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}
