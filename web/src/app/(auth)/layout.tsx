import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col p-6 sm:p-10">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
          <div className="grid size-8 place-items-center rounded-lg gradient-brand text-white">
            <GraduationCap className="size-4" />
          </div>
          EdTech
        </Link>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>

      {/* Visual side — hidden on mobile */}
      <div className="relative hidden overflow-hidden gradient-brand lg:block">
        <div className="absolute inset-0 gradient-hero opacity-50" />
        <div className="relative z-10 flex h-full flex-col justify-end p-12 text-white">
          <blockquote className="space-y-4">
            <p className="text-2xl font-medium leading-relaxed">
              &ldquo;เรียนแล้วเข้าใจจริง สอบเข้าคณะที่อยากเรียนได้สำเร็จ
              ติวเตอร์อธิบายชัด ตอบคำถามไว&rdquo;
            </p>
            <footer className="text-sm text-white/80">— นักเรียน ม.6 ที่สอบติด TCAS รอบ 1</footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
