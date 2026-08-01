/**
 * โหมดโฟกัส — ไม่มี sidebar ไม่มี topbar ของแอป
 *
 * ใช้กับหน้าที่ต้องการให้ผู้ใช้จดจ่ออย่างเดียว: จ่ายเงิน · ทำข้อสอบ · เรียน
 * (ตามดีไซน์เดิม Checkout.html / Exam Take.html / Learn.html ก็เป็นแบบนี้)
 */
export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
