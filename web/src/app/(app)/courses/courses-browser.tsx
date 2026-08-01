'use client';

/**
 * หน้ารายการคอร์ส — แปลงมาจาก 'Claude Design version 1.0/Browse Courses.html'
 *
 * หน้าตา/คลาส CSS ยกมาเหมือนเดิมทุกอย่าง (ดู courses.css)
 * สิ่งที่เปลี่ยนคือ "ข้อมูล": เดิมพิมพ์ค้างไว้ในไฟล์ ตอนนี้ดึงจาก GET /courses
 *
 * ฟิลด์ที่ดีไซน์มีแต่ฐานข้อมูลยังไม่มี (เรตติ้ง · รีวิว · จำนวนนักเรียน · ชั่วโมง
 * · ริบบิ้น HOT/NEW) จะ "ไม่แสดง" ไม่ใช่ใส่เลขปลอม — เลขปลอมบนหน้าเว็บจริง
 * อันตรายกว่าช่องว่าง เพราะเผลอปล่อยขึ้น production แล้วนักเรียนเชื่อ
 * ถ้าอยากได้ครบ ต้องเพิ่มคอลัมน์ในตาราง courses ก่อน
 */
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { PageHeader } from '@/components/layout/app-shell';
import { SubjectIcon } from '@/components/layout/subject-icons';
import { LEVELS, SUBJECTS, getSubject, subjectLabel } from '@/config/subjects';
import type { LevelId, SubjectId } from '@/config/subjects';
import { courses as coursesApi } from '@/lib/api/endpoints';
import type { Course } from '@/lib/api/types';
import { baht } from '@/lib/format';

type SubjectFilter = SubjectId | 'all';
type LevelFilter = LevelId | 'all';
type SortKey = 'rec' | 'priceasc' | 'pricedesc' | 'newest';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'rec', label: 'แนะนำ' },
  { key: 'newest', label: 'ใหม่ล่าสุด' },
  { key: 'priceasc', label: 'ราคาน้อยไปมาก' },
  { key: 'pricedesc', label: 'ราคามากไปน้อย' },
];

export function CoursesBrowser() {
  const [subject, setSubject] = useState<SubjectFilter>('all');
  const [level, setLevel] = useState<LevelFilter>('all');
  const [sort, setSort] = useState<SortKey>('rec');

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesApi.list(),
  });

  const all = useMemo(() => data ?? [], [data]);

  /** จำนวนคอร์สต่อวิชา — ใช้โชว์ตัวเลขบนการ์ดเลือกวิชา */
  const countBySubject = useMemo(() => {
    const n: Record<string, number> = { all: all.length };
    for (const c of all) if (c.subject) n[c.subject] = (n[c.subject] ?? 0) + 1;
    return n;
  }, [all]);

  const activeSubject = subject === 'all' ? undefined : getSubject(subject);
  const showLevels = activeSubject?.hasLevels ?? false;

  const inSubject = useMemo(
    () => (subject === 'all' ? all : all.filter((c) => c.subject === subject)),
    [all, subject],
  );

  const countByLevel = useMemo(() => {
    const n: Record<string, number> = { all: inSubject.length };
    for (const c of inSubject) if (c.level) n[c.level] = (n[c.level] ?? 0) + 1;
    return n;
  }, [inSubject]);

  const list = useMemo(() => {
    let r = showLevels && level !== 'all'
      ? inSubject.filter((c) => c.level === level)
      : inSubject;
    r = [...r];
    switch (sort) {
      case 'priceasc': r.sort((a, b) => a.price - b.price); break;
      case 'pricedesc': r.sort((a, b) => b.price - a.price); break;
      case 'newest':
        r.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
        break;
      default: break;   // 'rec' = ลำดับที่ backend ส่งมา
    }
    return r;
  }, [inSubject, showLevels, level, sort]);

  /* สีพื้นหลังจาง ๆ ของหน้า เปลี่ยนตามวิชาที่เลือก (ตามดีไซน์เดิม) */
  const bleed = activeSubject
    ? ({ ['--bleed-from' as string]: activeSubject.color } as React.CSSProperties)
    : undefined;

  function pickSubject(s: SubjectFilter) {
    setSubject(s);
    setLevel('all');          // เปลี่ยนวิชาแล้วรีเซ็ตระดับ ไม่งั้นกรองแล้วว่างเปล่า
  }

  return (
    <div style={bleed}>
      <PageHeader
        eyebrow="คอร์สเรียน"
        title="เลือกวิชาที่อยากเก่ง"
        meta="กดเลือกวิชาเพื่อกรอง — ค่าเริ่มต้นคือทั้งหมด"
      />

      {/* ---------- เลือกวิชา ---------- */}
      <section className="subject-grid" role="radiogroup" aria-label="หมวดวิชา">
        <SubjectCard
          id="all"
          label="ทั้งหมด"
          en="ALL SUBJECTS"
          count={countBySubject.all ?? 0}
          active={subject === 'all'}
          onClick={() => pickSubject('all')}
        />
        {SUBJECTS.map((s) => (
          <SubjectCard
            key={s.id}
            id={s.id}
            label={s.label}
            en={s.en}
            count={countBySubject[s.id] ?? 0}
            active={subject === s.id}
            onClick={() => pickSubject(s.id)}
          />
        ))}
      </section>

      {/* ---------- ระดับ (เฉพาะคณิต/ฟิสิกส์) ---------- */}
      {showLevels ? (
        <section className="level-bar" role="group" aria-label="กรองตามระดับ">
          <span className="lv-label">ระดับ</span>
          <LevelChip
            label="ทั้งหมด"
            count={countByLevel.all ?? 0}
            active={level === 'all'}
            onClick={() => setLevel('all')}
          />
          {LEVELS.map((l) => (
            <LevelChip
              key={l.id}
              label={l.label}
              count={countByLevel[l.id] ?? 0}
              active={level === l.id}
              onClick={() => setLevel(l.id)}
            />
          ))}
        </section>
      ) : null}

      {/* ---------- แถบเครื่องมือ ---------- */}
      <div className="catalog-toolbar">
        <div className="result-meta">
          {isPending ? 'กำลังโหลด…' : list.length ? (
            <>
              พบ <b>{list.length}</b> คอร์ส
              {subject !== 'all' ? ` · ${subjectLabel(subject)}` : ''}
            </>
          ) : null}
        </div>
        <select
          className="sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="เรียงตาม"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>เรียงตาม: {s.label}</option>
          ))}
        </select>
      </div>

      {/* ---------- รายการคอร์ส ---------- */}
      {isError ? (
        <div className="course-empty">
          โหลดคอร์สไม่สำเร็จ — {(error as Error)?.message ?? 'ไม่ทราบสาเหตุ'}
          <br />
          <button className="btn btn-secondary" onClick={() => refetch()} style={{ marginTop: 12 }}>
            ลองใหม่
          </button>
        </div>
      ) : isPending ? (
        <section className="course-grid" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="cc cc-skeleton" />)}
        </section>
      ) : list.length === 0 ? (
        <div className="course-empty">ยังไม่มีคอร์สในวิชานี้ — เร็วๆ นี้</div>
      ) : (
        <section className="course-grid">
          {list.map((c, i) => <CourseCard key={c.id} course={c} index={i} />)}
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ ย่อย */

function SubjectCard({
  id, label, en, count, active, onClick,
}: {
  id: SubjectId | 'all';
  label: string;
  en: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`subj ${id}`}
      role="radio"
      aria-checked={active}
      aria-pressed={active}
      onClick={onClick}
    >
      <div className="subj-ico"><SubjectIcon id={id} /></div>
      <div className="check">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div>
        <div className="subj-name">{label}</div>
        <div className="subj-meta">
          <span>{en}</span>
          <span className="count">{count}</span>
        </div>
      </div>
    </button>
  );
}

function LevelChip({
  label, count, active, onClick,
}: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className="level-chip"
      role="radio"
      aria-checked={active}
      aria-pressed={active}
      onClick={onClick}
    >
      {label} <span className="ct">{count}</span>
    </button>
  );
}

function CourseCard({ course: c, index }: { course: Course; index: number }) {
  const subj = c.subject ? getSubject(c.subject) : undefined;
  const isFree = c.price <= 0;
  const discount =
    !isFree && c.price_old ? Math.round((1 - c.price / c.price_old) * 100) : 0;

  return (
    <Link
      href={`/courses/${c.id}`}
      className="cc"
      data-subject={c.subject ?? undefined}
      style={{ animationDelay: `${Math.min(index, 9) * 35}ms` }}
    >
      <div className="cc-thumb">
        <div className={`cc-thumb-inner t-${c.subject ?? 'math'}`}>
          <span className="glyph">{subj?.glyph ?? '∫'}</span>
          {c.target_audience ? <span className="tag">{c.target_audience}</span> : null}
        </div>
        <div className="meta">
          <div className="name">{c.title}</div>
          {subj ? <div className="sub">{subj.label}</div> : null}
        </div>
      </div>

      <div className="cc-body">
        <div className="stats">
          {c.total_lessons > 0 ? <div className="item">{c.total_lessons} บท</div> : null}
        </div>
        <div className="cc-foot">
          {isFree ? (
            <div className="price free">ฟรี</div>
          ) : (
            <div className="price">
              {c.price_old ? <span className="strike">{baht(c.price_old)}</span> : null}
              {baht(c.price)}
            </div>
          )}
          {discount > 0 ? <span className="discount">-{discount}%</span> : null}
        </div>
      </div>
    </Link>
  );
}
