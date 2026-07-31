import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles, TrendingUp, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Stats />
        <Features />
        <CallToAction />
      </main>
      <SiteFooter />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden gradient-hero">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-accent" />
            เปิดคอร์สใหม่สำหรับ TCAS รอบ 1 — ลงทะเบียนวันนี้ลด 30%
          </div>
          <h1 className="display text-balance text-4xl leading-tight sm:text-6xl">
            ติวเข้มทุกวิชา <span className="text-primary">เข้าใจจริง</span>
            <br />
            สอบติดมหาวิทยาลัยที่ใฝ่ฝัน
          </h1>
          <p className="mt-6 text-balance text-lg text-muted-foreground">
            คอร์สเรียนออนไลน์สำหรับนักเรียน ม.ปลาย เน้นความเข้าใจ ไม่ใช่ท่องจำ
            ติดตามความก้าวหน้าได้แบบ real-time พร้อมระบบเก็บคะแนนและ achievement
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="xl" asChild>
              <Link href="/courses">
                ดูคอร์สทั้งหมด <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/signup">สมัครสมาชิกฟรี</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">ไม่ต้องใช้บัตรเครดิต · เริ่มเรียนได้ทันที</p>
        </div>
      </div>
    </section>
  );
}

const STATS = [
  { value: "20+", label: "คอร์สเรียน", icon: BookOpen },
  { value: "1,200+", label: "นักเรียน", icon: Users },
  { value: "98%", label: "พึงพอใจ", icon: TrendingUp },
] as const;

function Stats() {
  return (
    <section className="border-y border-border/50 bg-secondary/30">
      <div className="mx-auto grid max-w-7xl grid-cols-3 gap-8 px-4 py-10 sm:px-6">
        {STATS.map(({ value, label, icon: Icon }) => (
          <div key={label} className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-center sm:gap-4 sm:text-left">
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="size-5" />
            </div>
            <div>
              <div className="display text-2xl">{value}</div>
              <div className="text-xs text-muted-foreground sm:text-sm">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: BookOpen,
    title: "เนื้อหาตรงตามหลักสูตร",
    body: "อัพเดตตามแนวข้อสอบล่าสุด ครอบคลุม TCAS / A-Level / TGAT / TPAT",
  },
  {
    icon: TrendingUp,
    title: "ติดตามความก้าวหน้าแบบ real-time",
    body: "Dashboard บอกชัดว่าเรียนถึงไหน เก็บสถิติเวลาดู เห็นจุดที่ต้องเสริม",
  },
  {
    icon: Sparkles,
    title: "ระบบ Achievement",
    body: "เก็บ badge สะสม EXP ทำให้การเรียนสนุกเหมือนเล่นเกม",
  },
] as const;

function Features() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="display text-3xl sm:text-4xl">ทำไมต้องเรียนกับเรา</h2>
        <p className="mt-3 text-muted-foreground">
          เราออกแบบประสบการณ์ทุกอย่างเพื่อให้คุณ <strong>เข้าใจจริง</strong> ไม่ใช่แค่เรียนผ่านๆ
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <Card key={title} className="p-6">
            <div className="mb-4 grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-6" />
            </div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

const CTA_POINTS = [
  "เข้าถึงทุกคอร์สที่ลงทะเบียนได้ตลอดอายุการใช้งาน",
  "ดาวน์โหลด workbook ประกอบทุกบท",
  "ระบบถาม-ตอบกับติวเตอร์ภายใน 24 ชม.",
];

function CallToAction() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <div className="overflow-hidden rounded-[var(--radius-2xl)] gradient-brand p-8 text-white shadow-xl sm:p-12">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="display text-3xl text-white sm:text-4xl">พร้อมเริ่มเรียนแล้วใช่ไหม?</h2>
            <p className="mt-3 text-white/80">
              สมัครฟรี — ทดลองบทเรียนตัวอย่างได้ทุกคอร์สก่อนตัดสินใจ
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" variant="accent" asChild>
                <Link href="/signup">เริ่มต้นฟรี</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20" asChild>
                <Link href="/courses">ดูคอร์สทั้งหมด</Link>
              </Button>
            </div>
          </div>

          <ul className="space-y-3">
            {CTA_POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-white/90">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
