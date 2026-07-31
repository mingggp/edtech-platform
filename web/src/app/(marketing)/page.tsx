import Link from 'next/link';

/** หน้าแรกชั่วคราว — ไว้ให้ build ผ่านและมีทางเข้าไปดูโครงฝั่งนักเรียน */
export default function LandingPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px' }}>
      <h1 style={{ fontSize: 40, letterSpacing: '-.03em', margin: 0 }}>mingsmileyface</h1>
      <p style={{ color: 'var(--fg-2)', fontSize: 17, lineHeight: 1.7, marginTop: 14 }}>
        โครงเว็บใหม่ตั้งต้นเสร็จแล้ว — design token, config วิชา, ชั้น API,
        app shell และ theme provider พร้อมใช้ ขั้นถัดไปคือย้ายหน้าจากโฟลเดอร์ดีไซน์เข้ามา
      </p>
      <Link
        href="/dashboard"
        style={{
          display: 'inline-block',
          marginTop: 24,
          padding: '12px 22px',
          borderRadius: 12,
          background: 'var(--grad-signature)',
          color: '#fff',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        ดูโครงฝั่งนักเรียน →
      </Link>
    </main>
  );
}
