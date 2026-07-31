"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, FileText, ImageIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listMyPayments } from "@/lib/api/payments";
import { formatTHB, timeAgo } from "@/lib/utils";

export default function PaymentHistoryPage() {
  const [previewSlip, setPreviewSlip] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["my-payments"],
    queryFn: listMyPayments,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="display text-3xl">ประวัติการชำระเงิน</h1>
        <p className="mt-1 text-muted-foreground">รายการชำระเงินทั้งหมดของคุณ</p>
      </header>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {data && data.length === 0 && (
        <Card className="p-12 text-center">
          <FileText className="mx-auto mb-3 size-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">ยังไม่มีประวัติการชำระเงิน</p>
          <Button className="mt-4" asChild>
            <Link href="/courses">ดูคอร์สทั้งหมด</Link>
          </Button>
        </Card>
      )}

      <div className="space-y-3">
        {data?.map((p) => {
          const slipUrl = p.slip_url?.startsWith("http") ? p.slip_url : `/api${p.slip_url ?? ""}`;
          return (
            <Card key={p.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
                <CreditCard className="size-5" />
              </div>

              <div className="flex-1 min-w-[200px]">
                <p className="font-semibold">{p.course_title || `Course #${p.course_id}`}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(p.created_at)}</p>
              </div>

              <div className="flex items-center gap-2">
                {p.slip_url && (
                  <Button size="sm" variant="ghost" onClick={() => setPreviewSlip(slipUrl)}>
                    <ImageIcon className="size-4" /> ดูสลิป
                  </Button>
                )}
              </div>

              <div className="text-right">
                <p className="display text-lg">{formatTHB(p.amount)}</p>
                <Badge
                  variant={
                    p.status === "approved"
                      ? "success"
                      : p.status === "rejected"
                      ? "destructive"
                      : "warning"
                  }
                >
                  {p.status === "approved" ? "อนุมัติแล้ว" : p.status === "rejected" ? "ปฏิเสธ" : "รออนุมัติ"}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!previewSlip} onOpenChange={(o) => !o && setPreviewSlip(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>สลิปการชำระเงิน</DialogTitle>
          </DialogHeader>
          {previewSlip && (
            <div className="relative aspect-[3/4] w-full">
              <Image src={previewSlip} alt="Slip" fill className="object-contain" unoptimized />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
