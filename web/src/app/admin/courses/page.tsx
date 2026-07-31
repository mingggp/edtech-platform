"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminListCourses } from "@/lib/api/admin";
import { formatTHB } from "@/lib/utils";

export default function AdminCoursesPage() {
  const coursesQ = useQuery({ queryKey: ["admin-courses"], queryFn: adminListCourses });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-3xl">คอร์ส</h1>
          <p className="mt-1 text-muted-foreground">{coursesQ.data?.length ?? 0} คอร์ส</p>
        </div>
        <Button asChild>
          <Link href="/admin/courses/new">
            <Plus className="size-4" /> สร้างคอร์สใหม่
          </Link>
        </Button>
      </header>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/30 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">ชื่อคอร์ส</th>
                <th className="px-4 py-3">หมวด</th>
                <th className="px-4 py-3">ราคา</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {coursesQ.isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3"><Skeleton className="h-5 w-48" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="ml-auto h-8 w-24" /></td>
                  </tr>
                ))}

              {coursesQ.data?.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-secondary/20">
                  <td className="px-4 py-3">
                    <Link href={`/courses/${c.id}`} className="font-medium hover:text-primary">
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.category || "—"}</td>
                  <td className="px-4 py-3">{c.price === 0 ? "ฟรี" : formatTHB(c.price)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.is_active ? "success" : "secondary"}>
                      {c.is_active ? "เผยแพร่" : "ร่าง"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/courses/${c.id}`}>แก้ไข</Link>
                    </Button>
                  </td>
                </tr>
              ))}

              {!coursesQ.isLoading && coursesQ.data?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    ยังไม่มีคอร์ส — กดปุ่มสร้างเพื่อเริ่มต้น
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
