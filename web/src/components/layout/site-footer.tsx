import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-lg gradient-brand text-white">
                <GraduationCap className="size-4" />
              </div>
              <span className="display">EdTech</span>
            </div>
            <p className="text-sm text-muted-foreground">
              คอร์สออนไลน์สำหรับนักเรียนมัธยมปลาย ติวเข้มทุกวิชา ราคาเข้าถึงได้
            </p>
          </div>

          <FooterCol title="คอร์สเรียน">
            <FooterLink href="/courses?category=math">คณิตศาสตร์</FooterLink>
            <FooterLink href="/courses?category=physics">ฟิสิกส์</FooterLink>
            <FooterLink href="/courses?category=chemistry">เคมี</FooterLink>
            <FooterLink href="/courses?category=tcas">ติว TCAS</FooterLink>
          </FooterCol>

          <FooterCol title="เกี่ยวกับเรา">
            <FooterLink href="/about">ผู้สอน</FooterLink>
            <FooterLink href="/blog">บทความ</FooterLink>
            <FooterLink href="/contact">ติดต่อ</FooterLink>
          </FooterCol>

          <FooterCol title="กฎหมาย">
            <FooterLink href="/terms">เงื่อนไขการใช้งาน</FooterLink>
            <FooterLink href="/privacy">นโยบายความเป็นส่วนตัว</FooterLink>
          </FooterCol>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">© {year} EdTech. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Made with care for Thai students</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
        {children}
      </Link>
    </li>
  );
}
