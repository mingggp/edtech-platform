"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { listCoupons, createCoupon, deleteCoupon } from "@/lib/api/admin";
import { getApiErrorMessage } from "@/lib/api/client";

export default function AdminCouponsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discount_type: "percent" as "percent" | "amount",
    discount_value: 10,
    max_usage: 0,
    expires_at: "",
  });

  const couponsQ = useQuery({ queryKey: ["admin-coupons"], queryFn: listCoupons });

  const createMut = useMutation({
    mutationFn: () =>
      createCoupon({
        code: form.code.toUpperCase(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        max_usage: Number(form.max_usage),
        expires_at: form.expires_at || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({ variant: "success", title: "สร้างคูปองแล้ว" });
      setOpen(false);
      setForm({ code: "", discount_type: "percent", discount_value: 10, max_usage: 0, expires_at: "" });
    },
    onError: (e) => toast({ variant: "error", title: "ผิดพลาด", description: getApiErrorMessage(e) }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({ variant: "success", title: "ลบคูปองแล้ว" });
    },
    onError: (e) => toast({ variant: "error", title: "ผิดพลาด", description: getApiErrorMessage(e) }),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-3xl">คูปอง</h1>
          <p className="mt-1 text-muted-foreground">{couponsQ.data?.length ?? 0} โค้ด</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> สร้างคูปองใหม่
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>สร้างคูปองใหม่</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">โค้ด</Label>
                <Input
                  id="code"
                  placeholder="EDTECH30"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="dtype">ประเภท</Label>
                  <select
                    id="dtype"
                    className="flex h-11 w-full rounded-[var(--radius)] border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.discount_type}
                    onChange={(e) =>
                      setForm({ ...form, discount_type: e.target.value as "percent" | "amount" })
                    }
                  >
                    <option value="percent">เปอร์เซ็นต์ (%)</option>
                    <option value="amount">บาท (THB)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">
                    ค่า ({form.discount_type === "percent" ? "%" : "บาท"})
                  </Label>
                  <Input
                    id="discount"
                    type="number"
                    min={1}
                    max={form.discount_type === "percent" ? 100 : 99999}
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_usage">จำกัดการใช้ (0 = ไม่จำกัด)</Label>
                <Input
                  id="max_usage"
                  type="number"
                  min={0}
                  value={form.max_usage}
                  onChange={(e) => setForm({ ...form, max_usage: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires">หมดอายุ (เว้นว่าง = ไม่หมดอายุ)</Label>
                <Input
                  id="expires"
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
              <Button onClick={() => createMut.mutate()} disabled={createMut.isPending || !form.code}>
                {createMut.isPending && <Loader2 className="size-4 animate-spin" />}
                สร้าง
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/30 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">โค้ด</th>
                <th className="px-4 py-3">ส่วนลด</th>
                <th className="px-4 py-3">หมดอายุ</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {couponsQ.isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                    ))}
                  </tr>
                ))}

              {couponsQ.data?.map((c) => {
                const expired = c.expires_at && new Date(c.expires_at) < new Date();
                const exhausted = c.max_usage > 0 && c.current_usage >= c.max_usage;
                const usable = !expired && !exhausted;
                return (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                  <td className="px-4 py-3">
                    {c.discount_type === "percent"
                      ? `${c.discount_value}%`
                      : `${c.discount_value} บาท`}
                    {c.max_usage > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({c.current_usage}/{c.max_usage})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString("th-TH") : "ไม่หมดอายุ"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={usable ? "success" : "secondary"}>
                      {expired ? "หมดอายุ" : exhausted ? "เต็มแล้ว" : "ใช้งานได้"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        confirm(`ลบโค้ด ${c.code}?`) && deleteMut.mutate(c.id)
                      }
                      disabled={deleteMut.isPending}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              );
              })}

              {!couponsQ.isLoading && couponsQ.data?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    ยังไม่มีคูปอง
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
