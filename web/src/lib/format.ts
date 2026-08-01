/**
 * ฟังก์ชันจัดรูปแบบข้อความที่ใช้ทั้งเว็บ
 *
 * รวมไว้ที่เดียวเพื่อให้ราคา/วันที่หน้าตาเหมือนกันทุกหน้า
 * (โปรเจกต์เดิมแต่ละหน้าเขียน baht() ของตัวเอง)
 */

/** ราคา — '฿2,490'  (ตรงกับ baht() ในโฟลเดอร์ดีไซน์) */
export function baht(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '';
  return '฿' + Math.round(n).toLocaleString('en-US');
}

const TH_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

/**
 * วันที่แบบไทย — '28 ก.ค. 69' (พ.ศ. 2 หลัก)
 * รับค่าที่ backend ส่งมาเป็น ISO string
 */
export function thaiDate(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';
  const be = d.getFullYear() + 543;
  return `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${String(be).slice(-2)}`;
}

/** นาที → '2 ชม. 14 น.' */
export function duration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '0 น.';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} น.`;
  return m ? `${h} ชม. ${m} น.` : `${h} ชม.`;
}

/** นับถอยหลังเป็น 'mm:ss' — ใช้กับนาฬิกา QR หน้า Checkout */
export function countdown(msLeft: number): string {
  const s = Math.max(0, Math.floor(msLeft / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
