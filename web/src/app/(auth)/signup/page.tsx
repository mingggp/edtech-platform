"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import { signup, signupSchema, type SignupInput } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth/store";

export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      full_name: "",
      password: "",
      confirm_password: "",
      nickname: "",
      grade_level: "",
    },
  });

  const mutation = useMutation({
    mutationFn: signup,
    onSuccess: (data) => {
      setAuth({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        user: data.user,
      });
      toast({ variant: "success", title: "สมัครสมาชิกสำเร็จ", description: "ยินดีต้อนรับสู่ EdTech!" });
      router.push("/dashboard");
    },
    onError: (err) => {
      toast({ variant: "error", title: "สมัครไม่สำเร็จ", description: getApiErrorMessage(err) });
    },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="display text-3xl">สมัครสมาชิก</h1>
        <p className="text-sm text-muted-foreground">เริ่มต้นเรียนคอร์สแรกได้ใน 30 วินาที</p>
      </header>

      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="full_name">ชื่อ-นามสกุล</Label>
          <Input id="full_name" autoComplete="name" placeholder="ธนวัฒน์ สุขสันต์" {...form.register("full_name")} />
          {form.formState.errors.full_name && (
            <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">อีเมล</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nickname">ชื่อเล่น (ไม่บังคับ)</Label>
            <Input id="nickname" placeholder="แม็กซ์" {...form.register("nickname")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grade_level">ระดับชั้น</Label>
            <select
              id="grade_level"
              className="flex h-11 w-full rounded-[var(--radius)] border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register("grade_level")}
            >
              <option value="">— เลือก —</option>
              <option value="ม.4">ม.4</option>
              <option value="ม.5">ม.5</option>
              <option value="ม.6">ม.6</option>
              <option value="other">อื่นๆ</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">ยืนยันรหัสผ่าน</Label>
            <Input
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              {...form.register("confirm_password")}
            />
            {form.formState.errors.confirm_password && (
              <p className="text-xs text-destructive">{form.formState.errors.confirm_password.message}</p>
            )}
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          สร้างบัญชี
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          การสมัครหมายความว่าคุณยอมรับ{" "}
          <Link href="/terms" className="underline">เงื่อนไขการใช้งาน</Link> และ{" "}
          <Link href="/privacy" className="underline">นโยบายความเป็นส่วนตัว</Link>
        </p>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}
