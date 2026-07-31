import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "EdTech — คอร์สเรียนออนไลน์สำหรับ ม.ปลาย",
    template: "%s · EdTech",
  },
  description:
    "คอร์สเรียนออนไลน์คุณภาพสำหรับนักเรียนมัธยมปลาย ติวเข้มทุกวิชา พร้อมตามผลการเรียนได้แบบ real-time",
  keywords: ["ติวเตอร์", "ม.ปลาย", "TCAS", "A-Level", "คอร์สออนไลน์", "ติวเข้าม.", "TGAT", "TPAT"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" suppressHydrationWarning className={`${inter.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
