import { PageHeader } from '@/components/layout/app-shell';
import { SUBJECTS } from '@/config/subjects';

export const metadata = { title: 'หน้าหลัก' };

/**
 * หน้าตัวอย่างเพื่อพิสูจน์ว่าโครงใช้งานได้จริง
 * ตัวเลขยังเป็นค่าคงที่ — ต่อ API จริงในขั้นถัดไป
 */
export default function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="ภาพรวมการเรียน"
        title="สวัสดีตอนบ่าย"
        meta="ยังไม่ได้ต่อ API — หน้านี้ไว้เช็คว่าโครงและ design token ทำงานถูก"
      />

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
        }}
      >
        {SUBJECTS.map((s) => (
          <article key={s.id} className="card" style={{ borderColor: s.color }}>
            <div
              aria-hidden="true"
              style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                background: s.grad,
                display: 'grid',
                placeItems: 'center',
                fontSize: 22,
                color: '#fff',
                marginBottom: 12,
              }}
            >
              {s.glyph}
            </div>
            <h2 style={{ margin: 0, fontSize: 17 }}>{s.label}</h2>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--fg-2)' }}>{s.tagline}</p>
          </article>
        ))}
      </section>
    </>
  );
}
