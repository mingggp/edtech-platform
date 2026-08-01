'use client';

/**
 * หน้ารายละเอียดคอร์ส — แปลงจาก 'Claude Design version 1.0/Course Detail.html'
 *
 * โครง 2 คอลัมน์: เนื้อหาซ้าย + การ์ดลงทะเบียนขวา (ดู course-detail.css)
 *
 * ส่วนที่ยังไม่แสดงเพราะฐานข้อมูลยังไม่มีข้อมูล:
 *   ★ เรตติ้ง · จำนวนรีวิว   -> ตาราง Rating มีแล้วแต่ยังไม่มีหน้าให้รีวิว
 *   ตัวอย่างวิดีโอ 90 วินาที  -> ยังไม่มีฟิลด์เก็บคลิปตัวอย่าง
 *   "เหลือ 5 วัน ราคาขึ้น"   -> ยังไม่มีระบบโปรโมชันมีกำหนดเวลา
 * เลือกซ่อนแทนใส่ค่าปลอม — เหตุผลเดียวกับหน้ารายการคอร์ส
 */
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { getSubject, levelLabel } from '@/config/subjects';
import { courses as coursesApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { Course } from '@/lib/api/types';
import { baht, duration } from '@/lib/format';

const RIBBON_LABEL: Record<NonNullable<Course['ribbon']>, string> = {
  hot: 'ขายดี',
  new: 'มาใหม่',
  rec: 'แนะนำ',
  free: 'เรียนฟรี',
};

export function CourseDetail({ courseId }: { courseId: number }) {
  const course = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.get(courseId),
    enabled: Number.isFinite(courseId),
    retry: false,
  });

  const chapters = useQuery({
    queryKey: ['course-chapters', courseId],
    queryFn: () => coursesApi.chapters(courseId),
    enabled: course.isSuccess,
  });

  if (!Number.isFinite(courseId)) return <NotFound reason="ลิงก์ไม่ถูกต้อง" />;
  if (course.isPending) return <Loading />;
  if (course.isError || !course.data) {
    const status = (course.error as ApiError)?.status;
    return <NotFound reason={status === 404 ? 'ไม่พบคอร์สนี้' : (course.error as Error)?.message} />;
  }

  const c = course.data;
  const subj = c.subject ? getSubject(c.subject) : undefined;
  const isFree = c.price <= 0;
  const discount = !isFree && c.price_old ? Math.round((1 - c.price / c.price_old) * 100) : 0;
  /* highlights เก็บเป็นข้อความหลายบรรทัด บรรทัดละข้อ */
  const highlights = (c.highlights ?? '')
    .split('\n')
    .map((s) => s.replace(/^[✅✓•\-\s]+/, '').trim())
    .filter(Boolean);

  return (
    <div className="detail-shell">
      <div className="hero-bg" aria-hidden="true">
        <span className="glyph">{subj?.glyph ?? '∫'}</span>
      </div>

      {/* ---------------- ซ้าย: หัวเรื่อง + เนื้อหา ---------------- */}
      <div className="left-col">
        <Link href="/courses" className="back-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="m15 18-6-6 6-6" />
          </svg>
          กลับไปยังคอร์สทั้งหมด
        </Link>

        <div className="hero-text">
          <div className="hero-tags">
            {c.ribbon ? <span className="hero-tag solid">{RIBBON_LABEL[c.ribbon]}</span> : null}
            {subj ? (
              <span className="hero-tag">
                {subj.label}
                {c.level ? ` · ${levelLabel(c.level)}` : ''}
              </span>
            ) : null}
            {c.target_audience ? <span className="hero-tag">{c.target_audience}</span> : null}
          </div>

          <h1>{c.title}</h1>
          {c.description ? <p className="tagline">{c.description}</p> : null}

          <div className="meta-row">
            {c.student_count > 0 ? (
              <span><b>{c.student_count.toLocaleString('en-US')}</b> นักเรียน</span>
            ) : (
              <span>เปิดรับสมัครแล้ว</span>
            )}
            {c.total_lessons > 0 ? (
              <>
                <span className="dot-sep" />
                <span><b>{c.total_lessons}</b> บทเรียน</span>
              </>
            ) : null}
            {c.total_minutes > 0 ? (
              <>
                <span className="dot-sep" />
                <span>{duration(c.total_minutes)}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="body">
          {c.description ? (
            <section className="section">
              <h2>เกี่ยวกับคอร์ส</h2>
              <div className="about-text"><p>{c.description}</p></div>
            </section>
          ) : null}

          {highlights.length > 0 ? (
            <section className="section">
              <h2>สิ่งที่จะได้</h2>
              <div className="learn-grid">
                {highlights.map((h, i) => (
                  <div className="learn-item" key={i}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <div className="text">{h}</div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="section">
            <h2>เนื้อหา</h2>
            {chapters.isPending ? (
              <p style={{ color: 'var(--fg-2)' }}>กำลังโหลดสารบัญ…</p>
            ) : chapters.isError ? (
              <p style={{ color: 'var(--fg-2)' }}>โหลดสารบัญไม่สำเร็จ</p>
            ) : !chapters.data?.length ? (
              <p style={{ color: 'var(--fg-2)' }}>ยังไม่ได้เพิ่มบทเรียน</p>
            ) : (
              <div className="chapters">
                {chapters.data.map((ch, i) => {
                  const mins = ch.lessons.reduce((s, l) => s + (l.duration || 0), 0);
                  return (
                    <details className="chapter" key={ch.id} open={i === 0}>
                      <summary>
                        <span className="num">{String(i + 1).padStart(2, '0')}</span>
                        <span className="title">{ch.title}</span>
                        <span className="meta">
                          {ch.lessons.length} บทเรียน{mins > 0 ? ` · ${duration(mins)}` : ''}
                        </span>
                        <span className="chev">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                               stroke="currentColor" strokeWidth={2}><path d="m6 9 6 6 6-6" /></svg>
                        </span>
                      </summary>
                      <div className="lessons">
                        {ch.lessons.map((l) => (
                          <div className="lesson" key={l.id}>
                            <div className="icon">
                              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M8 5v14l11-7L8 5z" />
                              </svg>
                            </div>
                            <span className="name">{l.title}</span>
                            {l.duration ? <span className="duration">{duration(l.duration)}</span> : null}
                          </div>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </div>
            )}
          </section>

          <section className="section">
            <h2>ผู้สอน</h2>
            <div className="instr-block">
              <div className="instr-photo" aria-hidden="true" />
              <div className="instr-info">
                <h3>พี่หมิง (Mingsmileyface)</h3>
                <div className="instr-chip">ติวเตอร์คณิต · ฟิสิกส์ · TPAT3 · TGAT2</div>
                <p>
                  สอนคณิตและฟิสิกส์ระดับ ม.ปลาย พร้อมเตรียมสอบเข้ามหาวิทยาลัย
                  เน้นให้เข้าใจที่มา ไม่ใช่ท่องสูตร
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ---------------- ขวา: การ์ดลงทะเบียน ---------------- */}
      <aside className="right-col">
        <div className="enroll">
          <div className="enroll-cover">
            <span className="glyph">{subj?.glyph ?? '∫'}</span>
          </div>

          <div className="enroll-body">
            <div className="enroll-price">
              <div className="num">
                {isFree ? 'ฟรี' : (
                  <>
                    {c.price_old ? <span className="strike">{baht(c.price_old)}</span> : null}
                    {baht(c.price)}
                  </>
                )}
              </div>
              {discount > 0 ? <span className="discount">SAVE {discount}%</span> : null}
            </div>

            <div className="enroll-cta">
              {/* หน้าจ่ายเงินยังไม่ได้ทำ — ทำในขั้นถัดไปของ flow */}
              <Link href={`/checkout/${c.id}`} className="btn btn-primary btn-lg">
                {isFree ? 'เริ่มเรียนฟรี' : 'ลงทะเบียนเรียน'}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>

            <div className="enroll-stats">
              <Stat label="เนื้อหา" value={c.total_minutes > 0 ? duration(c.total_minutes) : '—'} />
              <Stat label="บทเรียน" value={c.total_lessons > 0 ? `${c.total_lessons} บท` : '—'} />
              <Stat label="ระดับ" value={c.level ? levelLabel(c.level) : (subj?.label ?? '—')} />
            </div>

            <div className="enroll-guarantees">
              <span>เข้าเรียนได้ทันทีหลังชำระเงิน</span>
              <span>ยืนยันการชำระอัตโนมัติ ไม่ต้องส่งสลิป</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="item">
      <div className="val">{value}</div>
      <div className="lab">{label}</div>
    </div>
  );
}

function Loading() {
  return (
    <div className="detail-shell">
      <div className="left-col">
        <div className="hero-text"><h1>กำลังโหลด…</h1></div>
      </div>
    </div>
  );
}

function NotFound({ reason }: { reason?: string }) {
  return (
    <div className="detail-shell">
      <div className="left-col">
        <Link href="/courses" className="back-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="m15 18-6-6 6-6" />
          </svg>
          กลับไปยังคอร์สทั้งหมด
        </Link>
        <div className="hero-text">
          <h1>ไม่พบคอร์สนี้</h1>
          <p className="tagline">{reason ?? 'คอร์สอาจถูกปิดหรือลบไปแล้ว'}</p>
        </div>
      </div>
    </div>
  );
}
