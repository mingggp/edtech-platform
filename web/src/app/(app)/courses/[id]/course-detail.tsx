'use client';

/**
 * หน้ารายละเอียดคอร์ส — แปลงจาก 'Claude Design version 1.0/Course Detail.html'
 * แล้วปรับตามที่หมิงสั่ง (ดูบล็อกท้าย course-detail.css)
 *
 *   • พื้นหลังไล่สีใช้สีประจำวิชา คลุมทั้งหน้า (เดิมฮาร์ดโค้ดม่วงและเว้นขอบ)
 *   • ป้ายหัวเรื่องเหลือแค่ริบบิ้นอันเดียว ตัดแถวสถิติใต้หัวเรื่องออก
 *   • ตัดส่วน "สิ่งที่จะได้" แบบรายการยาวออก ย้ายไปเป็นกล่องในการ์ดลงทะเบียน
 *   • สารบัญกดเปิด/ปิดได้ มีจังหวะไล่โผล่
 *   • การ์ดผู้สอนเล็กลง
 *
 * ยังไม่แสดง: เรตติ้ง · รีวิว · ตัวอย่างวิดีโอ (ฐานข้อมูลยังไม่มี)
 */
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { SubjectIcon } from '@/components/layout/subject-icons';
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

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

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

  /* สีทั้งหน้าผูกกับวิชา — พื้นหลัง สารบัญ การ์ดผู้สอน ใช้ตัวแปรเดียวกัน */
  const shellStyle = subj
    ? ({ ['--subj-c' as string]: subj.color } as React.CSSProperties)
    : undefined;

  return (
    <div className="detail-shell" style={shellStyle}>
      <div className="hero-bg" aria-hidden="true" />

      {/* ---------------- ซ้าย: หัวเรื่อง + เนื้อหา ---------------- */}
      <div className="left-col">
        <Link href="/courses" className="back-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="m15 18-6-6 6-6" />
          </svg>
          กลับไปยังคอร์สทั้งหมด
        </Link>

        <div className="hero-text">
          {/* ป้ายเดียว — อันเดียวกับที่ขึ้นบนการ์ดในหน้าค้นหาคอร์ส */}
          {c.ribbon ? (
            <div className="hero-tags">
              <span className="hero-tag solid">{RIBBON_LABEL[c.ribbon]}</span>
            </div>
          ) : null}

          <h1>{c.title}</h1>
          {c.description ? <p className="tagline">{c.description}</p> : null}
        </div>

        <div className="body">
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
                            <div className={`icon${l.kind === 'quiz' ? ' quiz' : ''}`}>
                              {l.kind === 'quiz' ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                     strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"
                                     aria-hidden="true">
                                  <path d="M9 11l2 2 4-4" /><rect x="3" y="4" width="18" height="16" rx="2.5" />
                                </svg>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                  <path d="M8 5v14l11-7L8 5z" />
                                </svg>
                              )}
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
                <p>สอน ม.ปลายและเตรียมสอบเข้ามหาวิทยาลัย เน้นให้เข้าใจที่มา ไม่ใช่ท่องสูตร</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ---------------- ขวา: การ์ดลงทะเบียน ---------------- */}
      <aside className="right-col">
        <div className="enroll">
          <div className="enroll-cover">
            <span className="cc-wm" aria-hidden="true">
              <SubjectIcon id={c.subject ?? 'math'} />
            </span>
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
              <div className="st-head">สิ่งที่จะได้</div>
              <Stat value={c.total_lessons} unit="บทเรียน" />
              <Stat value={c.total_videos} unit="คลิปวิดีโอ" />
              <Stat value={c.total_minutes} unit="นาทีเรียน" />
              <Stat value={c.total_exercises} unit="แบบฝึกหัด" />
            </div>

            <div className="enroll-guarantees">
              <div className="item"><Check />เข้าเรียนได้ทันทีหลังชำระเงิน</div>
              <div className="item"><Check />ยืนยันการชำระอัตโนมัติ ไม่ต้องส่งสลิป</div>
              <div className="item"><Check />ดูซ้ำได้ไม่จำกัดจำนวนครั้ง</div>
              {c.level ? (
                <div className="item"><Check />ตรงหลักสูตร {levelLabel(c.level)}</div>
              ) : null}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

/** กล่องตัวเลขในส่วน "สิ่งที่จะได้" — 0 ก็ยังแสดง เพราะเป็นตารางเทียบ 4 ช่อง */
function Stat({ value, unit }: { value: number; unit: string }) {
  return (
    <div className="item">
      <div className="val">{value.toLocaleString('en-US')}</div>
      <div className="lab">{unit}</div>
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
