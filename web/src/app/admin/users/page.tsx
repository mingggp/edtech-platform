"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { listUsers, updateUser } from "@/lib/api/admin";
import { getApiErrorMessage } from "@/lib/api/client";

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const usersQ = useQuery({ queryKey: ["admin-users"], queryFn: listUsers });

  const filtered = useMemo(() => {
    if (!usersQ.data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return usersQ.data;
    return usersQ.data.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.full_name ?? "").toLowerCase().includes(q)
    );
  }, [usersQ.data, search]);

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: "student" | "admin" }) =>
      updateUser(id, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ variant: "success", title: "อัพเดท role แล้ว" });
    },
    onError: (e) => toast({ variant: "error", title: "ผิดพลาด", description: getApiErrorMessage(e) }),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-3xl">ผู้ใช้</h1>
          <p className="mt-1 text-muted-foreground">{usersQ.data?.length ?? 0} คน</p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อหรืออีเมล..."
            className="pl-9"
          />
        </div>
      </header>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/30 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">ผู้ใช้</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">สมัครเมื่อ</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {usersQ.isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3"><Skeleton className="h-8 w-40" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="ml-auto h-8 w-24" /></td>
                  </tr>
                ))}

              {filtered.map((u) => {
                const initials = (u.full_name || u.email)
                  .split(" ")
                  .slice(0, 2)
                  .map((s) => s[0])
                  .join("")
                  .toUpperCase();
                return (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-secondary/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          {u.avatar_url && (
                            <AvatarImage
                              src={u.avatar_url.startsWith("http") ? u.avatar_url : `/api${u.avatar_url}`}
                              alt={u.full_name ?? ""}
                            />
                          )}
                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{u.full_name || "—"}</p>
                          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === "admin" ? "accent" : "secondary"}>
                        {u.role === "admin" ? "Admin" : "Student"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("th-TH")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role === "admin" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            confirm(`ลดสิทธิ์ ${u.email} เป็น student?`) &&
                            roleMutation.mutate({ id: u.id, role: "student" })
                          }
                          disabled={roleMutation.isPending}
                        >
                          ลดเป็น student
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            confirm(`เลื่อน ${u.email} เป็น admin?`) &&
                            roleMutation.mutate({ id: u.id, role: "admin" })
                          }
                          disabled={roleMutation.isPending}
                        >
                          เลื่อนเป็น admin
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!usersQ.isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    ไม่พบผู้ใช้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
