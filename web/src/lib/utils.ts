import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * รวม classnames + ตัด conflict ของ Tailwind ให้
 * ตัวอย่าง: cn("px-2", condition && "px-4") -> "px-4"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format ตัวเลขเป็นเงินบาท (ไม่มีทศนิยมถ้าจำนวนเต็ม) */
export function formatTHB(amount: number): string {
  const hasFraction = amount % 1 !== 0;
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** "5 นาทีที่แล้ว", "2 ชั่วโมงที่แล้ว" ฯลฯ */
export function timeAgo(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const intervals: [number, string][] = [
    [60, "วินาที"],
    [60, "นาที"],
    [24, "ชั่วโมง"],
    [30, "วัน"],
    [12, "เดือน"],
    [Number.POSITIVE_INFINITY, "ปี"],
  ];
  let value = seconds;
  let label = "วินาที";
  for (const [div, name] of intervals) {
    if (Math.abs(value) < div) {
      label = name;
      break;
    }
    value = Math.floor(value / div);
    label = name;
  }
  return `${value} ${label}ที่แล้ว`;
}
