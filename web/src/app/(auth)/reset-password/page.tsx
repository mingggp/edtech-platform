"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import { api, getApiErrorMessage } from "@/lib/api/client";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");

  const [pwd, setPwd] = useState({ next: "", confirm: "" });
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("ลิงก์ไม่ถูกต้องหรือหมดอายุ");
      if (pwd.next !== pwd.confirm) throw new Error("รหัสผ่านไม่ตรงกัน");
      if (pwd.next.length < 8) throw new Error("รหัสผ่านต้องอย่างน้อย 8 ตัว");
      await api.post("/auth/reset-password", { token, new_password: pwd.next });
    },
    onSuccess: () => {
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    },
    onError: (err) => {
      toast({ variant: "error", title: "ไม่สำเร็จ", description: getApiErrorMessage(err) });
    },
  });

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="display text-2xl">ลิงก์ไม่ถูกต้อง</h1>
        <p className="text-sm text-muted-foreground">
          ลิงก์รีเซ็ตรหัสผ่านอาจหมดอายุหรือถูกใช้ไปแล้ว
        </p>
        <Button asChild>
          <Link href="/forgot-password">ขอลิงก์ใหม่</Link>
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
        <h1 className="display text-2xl">รีเซ็ตรหัสผ่านสำเร็จ</h1>
        <p className="text-sm text-muted-foreground">กำลังพาไปหน้าเข้าสู่ระบบ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="display text-3xl">ตั้งรหัสผ่านใหม่</h1>
        <p className="text-sm text-muted-foreground">เลือกรหัสผ่านที่จำง่าย แต่คนอื่นเดายาก</p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="next">รหัสผ่านใหม่</Label>
          <Input
            id="next"
            type="password"
            value={pwd.next}
            onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">ยืนยันรหัสผ่านใหม่</Label>
          <Input
            id="confirm"
            type="password"
            value={pwd.confirm}
            onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
            required
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          ตั้งรหัสผ่านใหม่
        </Button>
      </form>
    </div>
  );
}
