"use client";

import { use, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, QrCode, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { getCourse } from "@/lib/api/courses";
import { getPromptPayQR, quoteCheckout, uploadSlip } from "@/lib/api/payments";
import { getApiErrorMessage } from "@/lib/api/client";
import { formatTHB } from "@/lib/utils";

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>();
  const [slipFile, setSlipFile] = useState<File | null>(null);

  const courseQ = useQuery({ queryKey: ["course", courseId], queryFn: () => getCourse(courseId) });
  const quoteQ = useQuery({
    queryKey: ["checkout-quote", courseId, appliedCoupon, courseQ.data?.price],
    queryFn: () => quoteCheckout(Number(courseId), courseQ.data?.price ?? 0, appliedCoupon),
    enabled: !!courseQ.data,
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!slipFile) throw new Error("กรุณาเลือกสลิป");
      return uploadSlip(courseId, slipFile, appliedCoupon);
    },
    onSuccess: () => {
      toast({
        variant: "success",
        title: "ส่งสลิปแล้ว",
        description: "เราจะตรวจสอบและอนุมัติภายใน 24 ชั่วโมง",
      });
      router.push("/dashboard");
    },
    onError: (err) => {
      toast({ variant: "error", title: "อัพโหลดไม่สำเร็จ", description: getApiErrorMessage(err) });
    },
  });

  const finalPrice = quoteQ.data?.final_price ?? courseQ.data?.price ?? 0;
  const qrUrl = courseQ.data && finalPrice > 0 ? getPromptPayQR(finalPrice) : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="display text-3xl">ชำระเงิน</h1>
        <p className="mt-1 text-muted-foreground">โอนเงินผ่าน PromptPay แล้วอัพโหลดสลิปยืนยัน</p>
      </header>

      {/* Order summary */}
      <Card>
        <CardHeader>
          <CardTitle>รายการสั่งซื้อ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {courseQ.isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <div className="flex items-start justify-between gap-4 border-b pb-4">
              <div>
                <p className="font-semibold">{courseQ.data?.title}</p>
                {courseQ.data?.category && (
                  <p className="text-xs text-muted-foreground">{courseQ.data.category}</p>
                )}
              </div>
              <p className="font-medium">{formatTHB(courseQ.data?.price ?? 0)}</p>
            </div>
          )}

          {/* Coupon */}
          <div className="space-y-2">
            <Label htmlFor="coupon">โค้ดส่วนลด (ถ้ามี)</Label>
            <div className="flex gap-2">
              <Input
                id="coupon"
                placeholder="EDTECH30"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              />
              <Button
                variant="outline"
                onClick={() => setAppliedCoupon(coupon || undefined)}
                disabled={!coupon || quoteQ.isFetching}
              >
                {quoteQ.isFetching ? <Loader2 className="size-4 animate-spin" /> : "ใช้โค้ด"}
              </Button>
            </div>
            {quoteQ.data?.coupon && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="mr-1 inline size-3" />
                ใช้โค้ด {quoteQ.data.coupon.code} ส่วนลด{" "}
                {quoteQ.data.coupon.discount_type === "percent"
                  ? `${quoteQ.data.coupon.discount_value}%`
                  : formatTHB(quoteQ.data.coupon.discount_value)}
              </p>
            )}
            {appliedCoupon && quoteQ.data && !quoteQ.data.coupon && (
              <p className="text-xs text-destructive">โค้ดไม่ถูกต้องหรือหมดอายุแล้ว</p>
            )}
          </div>

          {/* Total */}
          <div className="flex items-end justify-between border-t pt-4">
            {quoteQ.data && quoteQ.data.discount > 0 && (
              <p className="text-sm text-muted-foreground line-through">
                {formatTHB(quoteQ.data.base_price)}
              </p>
            )}
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">ยอดที่ต้องชำระ</p>
              <p className="display text-2xl text-primary">{formatTHB(finalPrice)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="size-5" />
            สแกนเพื่อจ่าย
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid place-items-center rounded-lg border bg-white p-6">
            {qrUrl ? (
              <Image
                src={qrUrl}
                alt="PromptPay QR"
                width={280}
                height={280}
                unoptimized
                className="size-72 object-contain"
              />
            ) : (
              <Skeleton className="size-72" />
            )}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            สแกน QR ผ่านแอปธนาคาร แล้วบันทึกสลิปไว้อัพโหลดด้านล่าง
          </p>
        </CardContent>
      </Card>

      {/* Slip upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="size-5" />
            อัพโหลดสลิป
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setSlipFile(e.target.files?.[0] ?? null)}
          />
          <div
            onClick={() => fileRef.current?.click()}
            className="grid cursor-pointer place-items-center rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary hover:bg-secondary/30"
          >
            {slipFile ? (
              <div className="space-y-2">
                <CheckCircle2 className="mx-auto size-8 text-emerald-500" />
                <p className="text-sm font-medium">{slipFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  คลิกอีกครั้งเพื่อเปลี่ยนไฟล์
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="mx-auto size-8 text-muted-foreground" />
                <p className="text-sm font-medium">คลิกเพื่อเลือกรูปสลิป</p>
                <p className="text-xs text-muted-foreground">รองรับ JPG, PNG ขนาดไม่เกิน 5MB</p>
              </div>
            )}
          </div>

          <Button
            size="lg"
            className="w-full"
            disabled={!slipFile || uploadMutation.isPending}
            onClick={() => uploadMutation.mutate()}
          >
            {uploadMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            ส่งสลิปยืนยันการชำระเงิน
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
