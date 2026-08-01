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
import { LEVELS, SUBJECTS, getSubject, levelLabel, subjectLabel } from '@/config/subjects';
import type { LevelId, SubjectId } from '@/config/subjects';
import { courses as coursesApi } from '@/lib/api/endpoints';
import type { Course } from '@/lib/api/types';
import { baht, duration } from '@/lib/format';

type SubjectFilter = SubjectId | 'all';
type LevelFilter = LevelId | 'all';
type SortKey = 'rec' | 'popular' | 'priceasc' | 'pricedesc' | 'newest';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'rec', label: 'แนะนำ' },
  { key: 'newest', label: 'ใหม่ล่าสุด' },
  { key: 'popular', label: 'ยอดนิยม' },
  { key: 'priceasc', label: 'ราคาน้อยไปมาก' },
  { key: 'pricedesc', label: 'ราคามากไปน้อย' },
];

/** ข้อความบนป้าย — คีย์ (hot/new/…) ไม่เอาขึ้นจอ */
const RIBBON_LABEL: Record<NonNullable<Course['ribbon']>, string> = {
  hot: 'ขายดี',
  new: 'มาใหม่',
  rec: 'แนะนำ',
  free: 'ฟรี',
};

/* ไอคอนเล็กในแถบสถิติ — ยกมาจาก IC ใน Browse Courses.html */
const IconBook = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
  </svg>
);
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 12 0v1" />
  </svg>
);

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
      case 'popular': r.sort((a, b) => b.student_count - a.student_count); break;
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
    /* display:contents ทำให้ div นี้หายไปจาก layout — ลูก ๆ กลายเป็นลูกของ
       .page โดยตรง จะได้ gap 32px ตามดีไซน์
       ถ้าไม่ทำแบบนี้ div จะกลายเป็นลูกตัวเดียวของ .page แล้ว gap ไม่ทำงาน
       ทุกส่วนในหน้าจะชิดติดกันหมด */
    <div style={{ display: 'contents', ...bleed }}>
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
  /* ชื่อวิชาที่เป็นภาษาไทยต้องเล็กกว่าอังกฤษ 2px ให้ดูสมดุลกัน */
  const isThai = /[฀-๿]/.test(label);
  return (
    <button
      type="button"
      className={`subj ${id}`}
      role="radio"
      aria-checked={active}
      aria-pressed={active}
      onClick={onClick}
    >
      {/* 4 วิชามีโลโก้เป็นลายน้ำ ส่วนการ์ด "ทั้งหมด" ไม่มีโลโก้ */}
      {id !== 'all' ? (
        <span className="subj-wm" aria-hidden="true"><SubjectIcon id={id} /></span>
      ) : null}
      <div className="check">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      {/* จำนวนคอร์ส — เป็นลูกโดยตรงของ .subj เพื่อให้ position:absolute
          อ้างอิงตัวการ์ด ถ้าซ้อนอยู่ใน div ข้างล่างจะไปเกาะ div นั้นแทน
          แล้วลอยไปอยู่กลาง ๆ ล่างการ์ด (บั๊กที่หมิงทัก) */}
      <span className="subj-count">{count}</span>
      <div className="subj-text">
        {/* ชื่อไทย (คณิต/ฟิสิกส์/ทั้งหมด) เล็กกว่าชื่ออังกฤษ 2px
            เพราะฟอนต์ไทยตัวโตกว่าที่ขนาดเท่ากัน */}
        <div className="subj-name" data-script={isThai ? 'thai' : undefined}>{label}</div>
        <div className="subj-meta"><span>{en}</span></div>
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
  /* ป้ายระดับ: เอาแค่ ม.4 / ม.5 / ม.6 / TCAS
     ไม่เอา "ในเทอม" "เตรียมสอบ" ที่ติดมากับ target_audience */
  const levelTag = c.level
    ? c.level === 'alevel' ? 'TCAS' : levelLabel(c.level)
    : (c.subject === 'tpat3' || c.subject === 'tgat2' ? 'TCAS' : null);

  return (
    <Link
      href={`/courses/${c.id}`}
      className="cc"
      data-subject={c.subject ?? undefined}
      style={{ animationDelay: `${Math.min(index, 9) * 35}ms` }}
    >
      <div className="cc-thumb">
        <div className={`cc-thumb-inner t-${c.subject ?? 'math'}`}>
          {/* โลโก้วิชาเป็นลายน้ำ — ชุดเดียวกับการ์ดเลือกวิชา */}
          <span className="cc-wm" aria-hidden="true">
            <SubjectIcon id={c.subject ?? 'math'} />
          </span>
          {/* ป้ายระดับมุมซ้ายบน — ตัวอักษรลอย ไม่มีกล่อง มีขีดสั้นคั่น */}
          {levelTag ? (
            <span className="lvl-mark">
              <i aria-hidden="true" />
              {levelTag}
            </span>
          ) : null}
          {c.ribbon ? (
            <span className={`ribbon-flag ${c.ribbon}`}>{RIBBON_LABEL[c.ribbon]}</span>
          ) : null}
        </div>
        <div className="meta">
          <div className="name">{c.title}</div>
          {subj ? <div className="sub">{subj.label}</div> : null}
        </div>
      </div>

      <div className="cc-body">
        {/* แสดงเฉพาะค่าที่มีจริง — ค่าที่ยังเป็น 0 แปลว่ายังไม่มีข้อมูล
            ซ่อนไว้ดีกว่าโชว์ "0 บท" หรือ "0 คน" ที่ดูเหมือนคอร์สร้าง */}
        <div className="stats">
          {c.total_lessons > 0 ? (
            <div className="item">
              <IconBook />
              {c.total_lessons} บท
            </div>
          ) : null}
          {c.total_minutes > 0 ? (
            <div className="item">
              <IconClock />
              {duration(c.total_minutes)}
            </div>
          ) : null}
          {c.student_count > 0 ? (
            <div className="item">
              <IconUser />
              {c.student_count.toLocaleString('en-US')}
            </div>
          ) : null}
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
