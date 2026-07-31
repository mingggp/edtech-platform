"use client";

import Image from "next/image";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { listPayments, processPayment } from "@/lib/api/admin";
import { getApiErrorMessage } from "@/lib/api/client";
import { formatTHB, timeAgo } from "@/lib/utils";
import type { Payment } from "@/lib/types";

type Filter = "pending" | "approved" | "rejected";

export default function AdminPaymentsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("pending");
  const [previewSlip, setPreviewSlip] = useState<string | null>(null);

  const paymentsQ = useQuery({
    queryKey: ["admin-payments", filter],
    queryFn: () => listPayments(filter),
  });

  const processMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "approve" | "reject" }) =>
      processPayment(id, action),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["admin-payments"] });
      toast({
        variant: "success",
        title: variables.action === "approve" ? "อนุมัติแล้ว" : "ปฏิเสธแล้ว",
      });
    },
    onError: (e) => toast({ variant: "error", title: "ผิดพลาด", description: getApiErrorMessage(e) }),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="display text-3xl">การชำระเงิน</h1>
        <p className="mt-1 text-muted-foreground">ตรวจสอบและอนุมัติสลิปจากผู้ใช้</p>
      </header>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="pending">รออนุมัติ</TabsTrigger>
          <TabsTrigger value="approved">อนุมัติแล้ว</TabsTrigger>
          <TabsTrigger value="rejected">ปฏิเสธแล้ว</TabsTrigger>
        </TabsList>
      </Tabs>

      {paymentsQ.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {paymentsQ.data && paymentsQ.data.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">ยังไม่มีรายการ</Card>
      )}

      <div className="space-y-3">
        {paymentsQ.data?.map((p) => (
          <PaymentRow
            key={p.id}
            payment={p}
            onView={(url) => setPreviewSlip(url)}
            onApprove={() => processMutation.mutate({ id: p.id, action: "approve" })}
            onReject={() => processMutation.mutate({ id: p.id, action: "reject" })}
            disabled={processMutation.isPending}
          />
        ))}
      </div>

      <Dialog open={!!previewSlip} onOpenChange={(open) => !open && setPreviewSlip(null)}>
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

function PaymentRow({
  payment,
  onView,
  onApprove,
  onReject,
  disabled,
}: {
  payment: Payment;
  onView: (url: string) => void;
  onApprove: () => void;
  onReject: () => void;
  disabled?: boolean;
}) {
  const slipUrl = payment.slip_url?.startsWith("http")
    ? payment.slip_url
    : `/api${payment.slip_url ?? ""}`;

  return (
    <Card className="flex flex-wrap items-center gap-4 p-4">
      {payment.slip_url && (
        <button
          onClick={() => onView(slipUrl)}
          className="relative size-20 shrink-0 overflow-hidden rounded-md border bg-muted"
        >
          <Image src={slipUrl} alt="slip" fill className="object-cover" unoptimized />
        </button>
      )}
      <div className="flex-1 min-w-[200px]">
        <p className="font-medium">{payment.user_full_name || payment.user_email || `User #${payment.user_id}`}</p>
        <p className="text-sm text-muted-foreground">
          {payment.course_title || `Course #${payment.course_id}`}
        </p>
        <p className="text-xs text-muted-foreground">
          {payment.user_email && payment.user_full_name ? `${payment.user_email} · ` : ""}
          {timeAgo(payment.created_at)}
        </p>
      </div>
      <div className="text-right">
        <p className="display text-lg">{formatTHB(payment.amount)}</p>
        <Badge
          variant={
            payment.status === "approved" ? "success" : payment.status === "rejected" ? "destructive" : "warning"
          }
        >
          {payment.status === "approved" ? "อนุมัติ" : payment.status === "rejected" ? "ปฏิเสธ" : "รออนุมัติ"}
        </Badge>
      </div>
      {payment.status === "pending" && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onReject} disabled={disabled}>
            <X className="size-4" /> ปฏิเสธ
          </Button>
          <Button size="sm" onClick={onApprove} disabled={disabled}>
            <Check className="size-4" /> อนุมัติ
          </Button>
        </div>
      )}
    </Card>
  );
}
