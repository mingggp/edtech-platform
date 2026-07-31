"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import { login, loginSchema, type LoginInput } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth/store";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        user: data.user,
      });
      const next = params.get("next") || "/dashboard";
      router.push(next);
    },
    onError: (err) => {
      toast({ variant: "error", title: "เข้าสู่ระบบไม่สำเร็จ", description: getApiErrorMessage(err) });
    },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="display text-3xl">ยินดีต้อนรับกลับมา</h1>
        <p className="text-sm text-muted-foreground">เข้าสู่ระบบเพื่อเรียนต่อจากที่ค้างไว้</p>
      </header>

      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">อีเมล</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              ลืมรหัสผ่าน?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          เข้าสู่ระบบ
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ยังไม่มีบัญชี?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          สมัครสมาชิก
        </Link>
      </p>
    </div>
  );
}
