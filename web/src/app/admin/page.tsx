"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, UserCheck, UserPlus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminMetrics, getPaymentStats } from "@/lib/api/admin";
import { formatTHB } from "@/lib/utils";

export default function AdminDashboardPage() {
  const metricsQ = useQuery({ queryKey: ["admin-metrics"], queryFn: getAdminMetrics });
  const statsQ = useQuery({ queryKey: ["admin-payment-stats"], queryFn: getPaymentStats });

  const total7Day = statsQ.data?.data.reduce((s, n) => s + n, 0) ?? 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="display text-3xl">ภาพรวม</h1>
        <p className="mt-1 text-muted-foreground">สถิติระบบและการชำระเงิน</p>
      </header>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="ผู้ใช้ทั้งหมด" value={metricsQ.data?.total_users} icon={Users} loading={metricsQ.isLoading} />
        <Stat label="แอดมิน" value={metricsQ.data?.admins} icon={UserCheck} loading={metricsQ.isLoading} />
        <Stat label="ใช้งานล่าสุด (5 นาที)" value={metricsQ.data?.active_users} icon={TrendingUp} loading={metricsQ.isLoading} />
        <Stat label="สมัครวันนี้" value={metricsQ.data?.new_users_today} icon={UserPlus} loading={metricsQ.isLoading} />
      </div>

      {/* Payments chart */}
      <Card>
        <CardHeader>
          <CardTitle>ยอดชำระเงิน 7 วันล่าสุด</CardTitle>
          <p className="text-sm text-muted-foreground">รวม {formatTHB(total7Day)}</p>
        </CardHeader>
        <CardContent>
          {statsQ.isLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <SimpleBarChart labels={statsQ.data?.labels ?? []} values={statsQ.data?.data ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value?: number;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-20" /> : <div className="display text-3xl">{value ?? 0}</div>}
      </CardContent>
    </Card>
  );
}

/** Simple SVG bar chart — ไม่ต้องโหลด chart library */
function SimpleBarChart({ labels, values }: { labels: string[]; values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-3 h-48">
        {values.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="relative flex-1 w-full">
              <div
                className="absolute bottom-0 w-full rounded-t-md gradient-brand transition-all"
                style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? "4px" : "0" }}
                title={formatTHB(v)}
              />
            </div>
            <span className="text-xs text-muted-foreground">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
