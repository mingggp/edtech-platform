"use client";

import { useRef, useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toaster";
import { changePassword, updateMe, uploadAvatar } from "@/lib/api/users";
import { getApiErrorMessage } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth/store";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    full_name: user?.full_name ?? "",
    nickname: user?.nickname ?? "",
    grade_level: user?.grade_level ?? "",
  });
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });

  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.full_name ?? "",
        nickname: user.nickname ?? "",
        grade_level: user.grade_level ?? "",
      });
    }
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: () => updateMe(profile),
    onSuccess: (u) => {
      setUser(u);
      toast({ variant: "success", title: "บันทึกข้อมูลแล้ว" });
    },
    onError: (e) => toast({ variant: "error", title: "ผิดพลาด", description: getApiErrorMessage(e) }),
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: ({ avatar_url }) => {
      if (user) setUser({ ...user, avatar_url });
      toast({ variant: "success", title: "เปลี่ยนรูปโปรไฟล์แล้ว" });
    },
    onError: (e) => toast({ variant: "error", title: "อัพโหลดไม่สำเร็จ", description: getApiErrorMessage(e) }),
  });

  const passwordMutation = useMutation({
    mutationFn: () => {
      if (pwd.next !== pwd.confirm) throw new Error("รหัสใหม่และยืนยันไม่ตรงกัน");
      if (pwd.next.length < 8) throw new Error("รหัสใหม่ต้องอย่างน้อย 8 ตัว");
      return changePassword({ current_password: pwd.current, new_password: pwd.next });
    },
    onSuccess: () => {
      setPwd({ current: "", next: "", confirm: "" });
      toast({ variant: "success", title: "เปลี่ยนรหัสผ่านสำเร็จ" });
    },
    onError: (e) => toast({ variant: "error", title: "ผิดพลาด", description: getApiErrorMessage(e) }),
  });

  const initials = user?.full_name
    ?.split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase() ?? "U";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="display text-3xl">โปรไฟล์ของฉัน</h1>
        <p className="mt-1 text-muted-foreground">จัดการข้อมูลส่วนตัวและความปลอดภัย</p>
      </header>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">ข้อมูลทั่วไป</TabsTrigger>
          <TabsTrigger value="security">ความปลอดภัย</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>รูปโปรไฟล์</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-5">
                <Avatar className="size-20">
                  {user?.avatar_url && (
                    <AvatarImage
                      src={
                        user.avatar_url.startsWith("http")
                          ? user.avatar_url
                          : `/api${user.avatar_url}`
                      }
                      alt={user.full_name ?? ""}
                    />
                  )}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) avatarMutation.mutate(f);
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    disabled={avatarMutation.isPending}
                  >
                    {avatarMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Camera className="size-4" />
                    )}
                    เปลี่ยนรูป
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">JPG, PNG ขนาดไม่เกิน 2MB</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลทั่วไป</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <Input id="email" value={user?.email ?? ""} disabled />
                <p className="text-xs text-muted-foreground">อีเมลแก้ไขไม่ได้</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">ชื่อ-นามสกุล</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nickname">ชื่อเล่น</Label>
                  <Input
                    id="nickname"
                    value={profile.nickname}
                    onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade_level">ระดับชั้น</Label>
                  <select
                    id="grade_level"
                    className="flex h-11 w-full rounded-[var(--radius)] border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={profile.grade_level}
                    onChange={(e) => setProfile({ ...profile, grade_level: e.target.value })}
                  >
                    <option value="">— เลือก —</option>
                    <option value="ม.4">ม.4</option>
                    <option value="ม.5">ม.5</option>
                    <option value="ม.6">ม.6</option>
                    <option value="other">อื่นๆ</option>
                  </select>
                </div>
              </div>
              <Button
                onClick={() => profileMutation.mutate()}
                disabled={profileMutation.isPending}
              >
                {profileMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                บันทึก
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>เปลี่ยนรหัสผ่าน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">รหัสผ่านปัจจุบัน</Label>
                <Input
                  id="current"
                  type="password"
                  value={pwd.current}
                  onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="next">รหัสผ่านใหม่</Label>
                <Input
                  id="next"
                  type="password"
                  value={pwd.next}
                  onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">อย่างน้อย 8 ตัว มีตัวเลขและตัวอักษรพิมพ์ใหญ่</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">ยืนยันรหัสผ่านใหม่</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={pwd.confirm}
                  onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                />
              </div>
              <Button
                onClick={() => passwordMutation.mutate()}
                disabled={passwordMutation.isPending || !pwd.current || !pwd.next}
              >
                {passwordMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                เปลี่ยนรหัสผ่าน
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
