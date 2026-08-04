'use client';

/**
 * ห้องเรียน — ย้ายจาก 'Claude Design version 1.0/Learn.html'
 *
 * ขั้นตอนที่ 4 (สุดท้าย) ของเส้นทางหลัก: ดูคอร์ส → ซื้อ → เข้าเรียน
 *
 * สิ่งที่หน้านี้ต้องทำให้ถูก:
 *   1. คนที่ยังไม่ซื้อต้องเข้าไม่ได้ และต้องบอกเหตุผลให้ชัด
 *   2. เปิดมาต้องเล่นต่อจากตำแหน่งที่ดูค้างไว้
 *   3. เวลาที่ดูต้องเข้าไปขยับสตรีค/XP อย่างถูกต้อง (ดู use-study-tracker.ts)
 *   4. ปิดหน้ากลางคันแล้วตำแหน่งต้องไม่หาย
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent,
} from 'react';

import { Avatar } from '@/components/avatar';
import { useTheme } from '@/components/theme-provider';
import { subjectLabel } from '@/config/subjects';
import { ApiError } from '@/lib/api/client';
import { courses as coursesApi, learning as learnApi } from '@/lib/api/endpoints';
import type { Chapter, Lesson } from '@/lib/api/types';
import { useAuth } from '@/lib/auth-context';
import { fmtTime, MAX_RATE, MIN_RATE, useYouTube } from './use-youtube';
import { useStudyTracker } from './use-study-tracker';

/** ปุ่มลัดความเร็ว 4 ระดับตามที่หมิงเลือก — ปรับละเอียดกว่านี้ใช้สไลเดอร์ */
const RATES = [0.5, 1, 1.5, 2];

/** บันทึกตำแหน่งทุกกี่วินาทีระหว่างดู */
const SAVE_POSITION_EVERY_MS = 10_000;

/** ดูถึงกี่ % ถือว่าเรียนจบ — 92% เพราะท้ายคลิปมักเป็นช่วงสรุป/ลาก่อน */
const COMPLETE_AT = 0.92;

interface Props { courseId: number }

export function LearnView({ courseId }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { theme, setPreference } = useTheme();
  const isDark = theme === 'petronas' || theme === 'dark' || theme === 'f1';

  /* ---------------- ข้อมูล ---------------- */
  const courseQ = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.get(courseId),
  });
  const chaptersQ = useQuery({
    queryKey: ['chapters', courseId, user?.id ?? null],
    queryFn: () => coursesApi.chapters(courseId),
    enabled: !authLoading,
    /* สารบัญคอร์สแทบไม่เปลี่ยนระหว่างที่นักเรียนกำลังดูคลิปอยู่
     * ถ้าปล่อยให้โหลดใหม่ (react-query โหลดซ้ำทุกครั้งที่สลับกลับมาที่แท็บ)
     * object ของบทเรียนจะเป็นชิ้นใหม่ -> effect ที่ผูกอยู่ทำงานใหม่ยกชุด
     * -> คลิปสะดุด/หยุดเอง  ตรึงไว้ 5 นาทีพอ */
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
  const progressQ = useQuery({
    queryKey: ['my-progress', courseId],
    queryFn: () => learnApi.myProgress(courseId),
    enabled: !!user,
    retry: false,
  });

  const chapters: Chapter[] = useMemo(() => chaptersQ.data ?? [], [chaptersQ.data]);

  /** บทเรียนทั้งหมดเรียงตามลำดับจริง — ใช้หาบทก่อน/บทถัดไป */
  const flat = useMemo(
    () =>
      chapters.flatMap((c) =>
        c.lessons.map((l) => ({ lesson: l, chapter: c })),
      ),
    [chapters],
  );

  /** ปลดล็อกแล้วหรือยัง — backend ส่ง locked มาให้ทุกบทเรียน */
  const unlocked = flat.length > 0 && !flat[0].lesson.locked;

  const completedIds = useMemo(
    () => new Set(progressQ.data?.completed_ids ?? []),
    [progressQ.data],
  );

  /* ---------------- บทเรียนที่กำลังดู ---------------- */
  const [activeId, setActiveId] = useState<number | null>(null);

  /* เลือกบทเรียนเริ่มต้น: บทแรกที่ยังไม่จบ ไม่งั้นเอาบทแรกสุด
     ทำครั้งเดียวตอนข้อมูลมาครบ — ไม่งั้นพอกดปุ่ม "เรียนจบ" แล้วจะเด้งไปบทอื่นเอง */
  const pickedInitial = useRef(false);
  useEffect(() => {
    if (pickedInitial.current || !flat.length) return;
    if (user && progressQ.isPending) return;      // รอรู้ก่อนว่าเรียนถึงไหนแล้ว
    pickedInitial.current = true;
    const next = flat.find((x) => !completedIds.has(x.lesson.id)) ?? flat[0];
    setActiveId(next.lesson.id);
  }, [flat, user, progressQ.isPending, completedIds]);

  const activeIdx = flat.findIndex((x) => x.lesson.id === activeId);
  const active = activeIdx >= 0 ? flat[activeIdx] : null;
  const activeLesson: Lesson | null = active?.lesson ?? null;

  /* ---------------- ตำแหน่งที่ดูค้างไว้ ---------------- */
  const [startAt, setStartAt] = useState(0);
  const [positionReady, setPositionReady] = useState(false);

  /* ผูกกับ "ไอดีบทเรียน" ไม่ใช่ object
     object ถูกสร้างใหม่ทุกครั้งที่สารบัญโหลดซ้ำ ถ้าผูกกับ object
     effect นี้จะทำงานใหม่แล้วสั่ง setPositionReady(false)
     ทำให้ videoId กลายเป็น null ชั่วขณะ -> คลิปโหลดใหม่ -> หยุดเล่น */
  const activeLessonId = activeLesson?.id ?? null;
  useEffect(() => {
    let alive = true;
    setPositionReady(false);
    setStartAt(0);
    if (!activeLessonId || !unlocked || !user) {
      setPositionReady(true);
      return;
    }
    learnApi
      .getPosition(courseId, activeLessonId)
      .then((r) => { if (alive) setStartAt(r.seconds); })
      .catch(() => { /* อ่านไม่ได้ก็เริ่มจากต้นคลิป ไม่ใช่เรื่องคอขาดบาดตาย */ })
      .finally(() => { if (alive) setPositionReady(true); });
    return () => { alive = false; };
  }, [courseId, activeLessonId, unlocked, user]);

  /* ---------------- เครื่องเล่น ---------------- */
  /* onEnded ต้องเรียกฟังก์ชันที่ประกาศอยู่ข้างล่าง — ใช้ ref กันปัญหาลำดับ
     และกันไม่ให้ hook สร้าง player ใหม่เมื่อฟังก์ชันเปลี่ยน identity */
  const markCompleteRef = useRef<(onlyIfNotDone: boolean) => void>(() => {});
  const goNextRef = useRef<() => void>(() => {});

  /* บทเรียนที่ยังไม่ได้ใส่คลิป — youtube_id เป็นสตริงว่าง ไม่ใช่ null
     ต้องเช็คด้วย .trim() ไม่ใช่ ?? เพราะ "" ไม่ใช่ null/undefined
     ถ้าปล่อยผ่านไป player จะสั่งโหลดวิดีโอชื่อ "" แล้วจอดำเงียบ ๆ
     ไม่มีอะไรบอกว่าเกิดอะไรขึ้น — เป็นสาเหตุที่หมิงเห็นว่า "คลิปไม่ขึ้น" */
  const videoId = activeLesson?.youtube_id?.trim() || null;

  const yt = useYouTube({
    // รอรู้ตำแหน่งก่อนค่อยโหลดวิดีโอ ไม่งั้นจะเริ่มที่ 0 แล้วค่อยกระโดด
    videoId: positionReady ? videoId : null,
    startAt,
    onEnded: () => { markCompleteRef.current(true); goNextRef.current(); },
  });

  const playing = yt.state === 'playing';

  const [reward, setReward] = useState<{ xp: number; badges: string[] } | null>(null);
  useStudyTracker({
    playing,
    onReward: (r) => {
      void qc.invalidateQueries({ queryKey: ['me'] });
      if (r.new_badges?.length) setReward({ xp: r.xp_total, badges: r.new_badges });
    },
  });

  /* ค่าที่เปลี่ยนบ่อยแต่ไม่อยากให้ effect ผูกอยู่ด้วย
   *
   * ⚠️ บทเรียนจากบั๊กที่เพิ่งแก้: object `yt` ถูกสร้างใหม่ทุกครั้งที่ render
   * และหน้านี้ render ประมาณ 4 ครั้ง/วินาที ตอนวิดีโอเล่น (เวลาเดิน)
   * ถ้าเอา `yt` ไปใส่ใน dependency ของ effect ที่ตั้ง setInterval 10 วินาที
   * interval จะถูกล้างแล้วตั้งใหม่ก่อนครบกำหนดทุกครั้ง -> **ไม่เคยทำงานเลย**
   * ผลคือตำแหน่งที่ดูค้างไม่เคยถูกบันทึกระหว่างดู
   */
  const lessonRef = useRef(activeLesson);
  lessonRef.current = activeLesson;
  const readTimeRef = useRef(yt.readTime);
  readTimeRef.current = yt.readTime;

  /* ---------------- บันทึกตำแหน่งระหว่างดู ---------------- */
  const savedAt = useRef(0);
  useEffect(() => {
    if (!playing || !unlocked) return;
    const t = setInterval(() => {
      const l = lessonRef.current;
      const sec = readTimeRef.current();
      if (!l || Math.abs(sec - savedAt.current) < 3) return;   // ยังไม่ขยับพอ
      savedAt.current = sec;
      void learnApi.savePosition(courseId, l.id, sec).catch(() => {});
    }, SAVE_POSITION_EVERY_MS);
    return () => clearInterval(t);
  }, [playing, unlocked, courseId]);

  /* ปิดหน้า — บันทึกตำแหน่งครั้งสุดท้าย
     ใช้ keepalive เพราะ fetch ธรรมดาจะถูกยกเลิกตอนหน้าปิด */

  useEffect(() => {
    if (!unlocked) return;
    const save = () => {
      const l = lessonRef.current;
      const sec = readTimeRef.current();
      if (l && sec > 0) learnApi.savePositionOnLeave(courseId, l.id, sec);
    };
    window.addEventListener('pagehide', save);
    return () => {
      window.removeEventListener('pagehide', save);
      save();
    };
  }, [courseId, unlocked]);

  /* ---------------- เรียนจบ ---------------- */
  const toggleMut = useMutation({
    mutationFn: (lessonId: number) => learnApi.toggleLesson(courseId, lessonId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-progress', courseId] }),
  });

  /* mutate ของ react-query เปลี่ยน identity ทุก render — เก็บใน ref
     เพื่อให้ markComplete คงตัว ไม่ไปรีเซ็ต effect ที่พึ่งพามัน */
  const toggleRef = useRef(toggleMut.mutate);
  toggleRef.current = toggleMut.mutate;
  const completedRef = useRef(completedIds);
  completedRef.current = completedIds;

  const markComplete = useCallback((onlyIfNotDone: boolean) => {
    const l = lessonRef.current;
    if (!l) return;
    if (onlyIfNotDone && completedRef.current.has(l.id)) return;
    toggleRef.current(l.id);
  }, []);

  /* ดูเกิน 92% ถือว่าจบเอง — นักเรียนไม่ต้องกดปุ่มทุกคลิป */
  const autoDone = useRef<number | null>(null);
  useEffect(() => {
    if (!activeLesson || !yt.duration || !unlocked) return;
    if (autoDone.current === activeLesson.id) return;
    if (completedIds.has(activeLesson.id)) return;
    if (yt.currentTime / yt.duration >= COMPLETE_AT) {
      autoDone.current = activeLesson.id;
      markComplete(true);
    }
  }, [yt.currentTime, yt.duration, activeLesson, completedIds, unlocked, markComplete]);

  /* ---------------- เปลี่ยนบทเรียน ---------------- */
  const goTo = useCallback(
    (lessonId: number) => {
      const l = lessonRef.current;
      const sec = readTimeRef.current();
      if (l && sec > 0 && unlocked) {
        void learnApi.savePosition(courseId, l.id, sec).catch(() => {});
      }
      autoDone.current = null;
      setActiveId(lessonId);
    },
    [courseId, unlocked],
  );

  const goNext = useCallback(() => {
    const i = flat.findIndex((x) => x.lesson.id === lessonRef.current?.id);
    if (i >= 0 && i + 1 < flat.length) goTo(flat[i + 1].lesson.id);
  }, [flat, goTo]);

  const goPrev = useCallback(() => {
    const i = flat.findIndex((x) => x.lesson.id === lessonRef.current?.id);
    if (i > 0) goTo(flat[i - 1].lesson.id);
  }, [flat, goTo]);

  markCompleteRef.current = markComplete;
  goNextRef.current = goNext;

  /* ---------------- แถบเลื่อน ---------------- */
  const scrubRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragPct, setDragPct] = useState(0);

  const pctFromEvent = useCallback((clientX: number) => {
    const el = scrubRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width));
  }, []);

  const onScrubDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (!yt.duration) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    setDragPct(pctFromEvent(e.clientX));
  };
  const onScrubMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragPct(pctFromEvent(e.clientX));
  };
  const onScrubUp = (e: RPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const p = pctFromEvent(e.clientX);
    setDragging(false);
    yt.seekTo(p * yt.duration);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ปล่อยไปแล้ว */ }
  };

  /* ระหว่างลาก แสดงตำแหน่งที่นิ้วอยู่ ไม่ใช่ตำแหน่งจริงของวิดีโอ
     ไม่งั้นหัวลากจะกระตุกกลับทุกครั้งที่ interval อัปเดต */
  const shownTime = dragging ? dragPct * yt.duration : yt.currentTime;
  const playedPct = yt.duration ? (shownTime / yt.duration) * 100 : 0;

  /* ---------------- คีย์ลัด ---------------- */
  /* เก็บ yt ไว้ใน ref — ถ้าใส่ yt ตรง ๆ ใน dependency จะถอด/ใส่ listener
     ใหม่ 4 ครั้งต่อวินาทีตอนวิดีโอเล่น (เวลาเดิน = render ใหม่) */
  const ytRef = useRef(yt);
  ytRef.current = yt;

  useEffect(() => {
    if (!unlocked) return;
    const onKey = (e: KeyboardEvent) => {
      const yt = ytRef.current;
      const el = e.target as HTMLElement | null;
      // กำลังพิมพ์อยู่ก็อย่าไปแย่งปุ่ม
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); yt.toggle(); break;
        case 'ArrowRight': e.preventDefault(); yt.seekBy(10); flashRipple('right'); break;
        case 'ArrowLeft': e.preventDefault(); yt.seekBy(-10); flashRipple('left'); break;
        case 'ArrowUp': e.preventDefault(); yt.setVolume(yt.volume + 10); break;
        case 'ArrowDown': e.preventDefault(); yt.setVolume(yt.volume - 10); break;
        case 'm': yt.toggleMute(); break;
        case 'f': toggleFullscreen(); break;
        default: break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [unlocked]);

  /* ---------------- เต็มจอ ---------------- */
  const playerRef = useRef<HTMLDivElement>(null);
  function toggleFullscreen() {
    const el = playerRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.().catch(() => {});
  }

  /* ---------------- เอฟเฟกต์ข้าม 10 วิ ---------------- */
  const [ripple, setRipple] = useState<'left' | 'right' | null>(null);
  const rippleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function flashRipple(side: 'left' | 'right') {
    setRipple(side);
    if (rippleTimer.current) clearTimeout(rippleTimer.current);
    rippleTimer.current = setTimeout(() => setRipple(null), 500);
  }
  useEffect(() => () => { if (rippleTimer.current) clearTimeout(rippleTimer.current); }, []);

  /* ---------------- ซ่อนแถบควบคุมตอนอยู่นิ่ง ---------------- */
  const [idle, setIdle] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wake = useCallback(() => {
    setIdle(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), 2600);
  }, []);
  useEffect(() => () => { if (idleTimer.current) clearTimeout(idleTimer.current); }, []);

  const [ratePop, setRatePop] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  /* แถบความเร็ว: ปิดเมื่อกดที่อื่น หรือกด Esc
     ผูกที่ pointerdown ระดับ document จะได้ปิดได้แม้กดนอกกรอบวิดีโอ */
  const popRef = useRef<HTMLDivElement>(null);
  const rateBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!ratePop) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t)) return;        // กดในแถบเอง ไม่ปิด
      if (rateBtnRef.current?.contains(t)) return;    // ปุ่มเปิด/ปิดจัดการเอง
      setRatePop(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setRatePop(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [ratePop]);

  /* ---------------- สถานะพิเศษ ---------------- */
  if (courseQ.isPending || chaptersQ.isPending || authLoading) {
    return <Notice title="กำลังโหลด…" />;
  }
  if (courseQ.error) {
    const notFound = courseQ.error instanceof ApiError && courseQ.error.status === 404;
    return (
      <Notice
        title={notFound ? 'ไม่พบคอร์สนี้' : 'โหลดคอร์สไม่สำเร็จ'}
        text={notFound ? 'ลิงก์อาจผิดหรือคอร์สถูกปิดไปแล้ว' : (courseQ.error as Error).message}
        actions={<Link href="/courses" className="btn btn-primary">ดูคอร์สทั้งหมด</Link>}
      />
    );
  }

  const course = courseQ.data!;

  if (!user) {
    return (
      <Notice
        title="เข้าสู่ระบบก่อนนะ"
        text="ต้องเข้าสู่ระบบเพื่อดูว่าคุณเรียนถึงไหนแล้ว"
        actions={
          <Link href={`/login?next=${encodeURIComponent(`/learn/${courseId}`)}`} className="btn btn-primary">
            เข้าสู่ระบบ
          </Link>
        }
      />
    );
  }
  if (!flat.length) {
    return (
      <Notice
        title="คอร์สนี้ยังไม่มีบทเรียน"
        text="พี่หมิงกำลังอัดคลิปอยู่ เดี๋ยวมาใหม่นะ"
        actions={<Link href={`/courses/${courseId}`} className="btn btn-secondary">กลับไปหน้าคอร์ส</Link>}
      />
    );
  }
  if (!unlocked) {
    return (
      <Notice
        title="ยังไม่ได้ซื้อคอร์สนี้"
        text="ซื้อคอร์สแล้วเข้าเรียนได้ทันที ดูได้ตลอดไม่มีหมดอายุ"
        actions={
          <>
            <Link href={`/checkout/${courseId}`} className="btn btn-primary">ซื้อคอร์สนี้</Link>
            <Link href={`/courses/${courseId}`} className="btn btn-secondary">ดูรายละเอียดก่อน</Link>
          </>
        }
      />
    );
  }

  /* ---------------- ตัวเลขความคืบหน้า ---------------- */
  const doneCount = flat.filter((x) => completedIds.has(x.lesson.id)).length;
  const pct = flat.length ? Math.round((doneCount / flat.length) * 100) : 0;
  const activeDone = activeLesson ? completedIds.has(activeLesson.id) : false;
  const watchPct = yt.duration ? Math.min(100, Math.round((yt.currentTime / yt.duration) * 100)) : 0;

  return (
    <div className="learn-page" data-subject={course.subject ?? 'math'}>
      <div className={`app${sidebarOpen ? '' : ' sidebar-collapsed'}`}>
        {/* ============== หัวหน้าจอ ============== */}
        <header className="lp-header">
          <button
            className="icon-btn lp-toggle-sidebar"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? 'พับสารบัญ' : 'เปิดสารบัญ'}
            aria-expanded={sidebarOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link href="/dashboard" className="lp-logo" title="หน้าหลัก">
            <span className="mark" aria-hidden="true">
              <svg viewBox="0 0 120 120" fill="none">
                <path d="M40 50 Q40 38 50 38 Q60 38 60 50" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
                <path d="M68 50 Q68 38 78 38 Q88 38 88 50" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
                <path d="M34 72 Q60 100 94 72" stroke="#fff" strokeWidth={10} strokeLinecap="round" />
              </svg>
            </span>
          </Link>

          <span className="lp-divider" />

          <Link href={`/courses/${courseId}`} className="lp-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            กลับ
          </Link>

          <div className="lp-course-info">
            <div className="crumb">{subjectLabel(course.subject)}</div>
            <div className="title">{course.title}</div>
          </div>

          <div className="lp-header-progress">
            <span className="ring" style={{ '--deg': `${pct * 3.6}deg` } as React.CSSProperties}>
              <span>{pct}%</span>
            </span>
            <span className="text"><b>{doneCount}</b> / {flat.length} บทเรียน</span>
          </div>

          <div className="lp-header-actions">
            {/* สลับสว่าง/มืด — สั่งผ่าน ThemeProvider ตัวเดียวกับทั้งเว็บ
                ถ้าเปลี่ยนที่นี่แล้วไปหน้าอื่น ธีมต้องตามไปด้วย */}
            <button
              className="icon-btn"
              onClick={() => setPreference(isDark ? 'petronas-light' : 'petronas')}
              aria-label={isDark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
              aria-pressed={isDark}
              title={isDark ? 'โหมดสว่าง' : 'โหมดมืด'}
            >
              {isDark ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
                </svg>
              )}
            </button>
            <Avatar person={user} size={32} />
          </div>
        </header>

        {/* ============== สารบัญ ============== */}
        <aside className="lp-sidebar">
          <div className="lp-sidebar-top">
            <div className="meta">เนื้อหาคอร์ส · {chapters.length} บท</div>
            <h2>{course.title}</h2>
            <div className="lp-progress-block">
              <div className="head">
                <span className="label">ความคืบหน้า</span>
                <span className="val">{pct}%</span>
              </div>
              <div className="lp-progress-bar"><div style={{ width: `${pct}%` }} /></div>
              <div className="lp-progress-meta">
                <span><b>{doneCount}</b> จาก {flat.length} บทเรียน</span>
              </div>
            </div>
          </div>

          <div className="lp-chapters">
            {chapters.map((ch, ci) => {
              const done = ch.lessons.length > 0 && ch.lessons.every((l) => completedIds.has(l.id));
              const hasActive = ch.lessons.some((l) => l.id === activeId);
              const doneHere = ch.lessons.filter((l) => completedIds.has(l.id)).length;
              return (
                <details
                  key={ch.id}
                  className={`chapter${done ? ' done' : ''}${hasActive ? ' active' : ''}`}
                  open={hasActive}
                >
                  <summary>
                    <span className="num-badge">
                      {done ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : String(ci + 1).padStart(2, '0')}
                    </span>
                    <span className="info">
                      <span className="ctitle">{ch.title}</span>
                      <span className="cmeta">
                        {hasActive ? 'กำลังเรียน · ' : ''}{doneHere}/{ch.lessons.length}
                        {done ? ' จบแล้ว' : ''}
                      </span>
                    </span>
                    <span className="chev">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </summary>
                  <div className="lessons">
                    {ch.lessons.map((l) => {
                      const isDone = completedIds.has(l.id);
                      const isActive = l.id === activeId;
                      return (
                        <button
                          key={l.id}
                          type="button"
                          className={`lesson${isDone ? ' done' : ''}${isActive ? ' active' : ''}`}
                          onClick={() => goTo(l.id)}
                          aria-current={isActive ? 'true' : undefined}
                        >
                          <span className="ico">
                            {isDone ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                            )}
                          </span>
                          <span className="name">{l.title}</span>
                          <span className="dur">{l.duration ? `${l.duration} น.` : ''}</span>
                        </button>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        </aside>

        {/* ============== พื้นที่หลัก ============== */}
        <main className="lp-main">
          <div className="lp-scroll">
            <div className="lp-container">
              {/* ---------- เครื่องเล่น ---------- */}
              <div
                ref={playerRef}
                className={`player${playing ? ' playing' : ''}${idle && playing ? ' idle' : ''}`}
                onPointerMove={wake}
                onPointerLeave={() => setIdle(true)}
              >
                <div className="yt-frame">
                  <div ref={yt.containerRef} />
                </div>

                {/* ภาพปกทับไว้ตอนยังไม่ได้กดเล่น
                    ก่อนเริ่มเล่น YouTube จะโชว์ชื่อคลิป ปุ่ม "ดูภายหลัง" "แชร์"
                    และ "ดูใน YouTube" เต็มไปหมด ซึ่งเอาออกจากตัว embed ไม่ได้
                    วิธีที่ได้ผลคือบังด้วยภาพปกของเราเอง แล้วค่อยเปิดให้เห็น
                    ตอนกดเล่น — ตอนเล่นอยู่ปุ่มพวกนั้นไม่โผล่เพราะเราปิดการรับ
                    เมาส์ของ iframe ไว้ (hover ไม่ติด) */}
                {yt.state === 'idle' && videoId && !yt.error ? (
                  // eslint-disable-next-line @next/next/no-img-element -- ภาพจาก YouTube คนละโดเมน
                  <img
                    className="yt-poster"
                    src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                    alt=""
                    aria-hidden="true"
                  />
                ) : null}

                {/* ชั้นรับคลิก — กดที่จอเพื่อเล่น/หยุด
                    ถ้าแถบความเร็วเปิดอยู่ ให้กดแล้วปิดแถบเฉย ๆ ไม่ต้องหยุดคลิป
                    (เดิมกดที่จอเพื่อปิดแถบ แล้วคลิปหยุดไปด้วย งงว่าทำไม) */}
                <div
                  className="stage"
                  onClick={() => {
                    if (ratePop) { setRatePop(false); return; }
                    yt.toggle();
                    wake();
                  }}
                  onDoubleClick={() => { if (!ratePop) toggleFullscreen(); }}
                />

                <div className={`seek-ripple left${ripple === 'left' ? ' flash' : ''}`}>
                  <div className="burst"><span>10 วิ</span></div>
                </div>
                <div className={`seek-ripple right${ripple === 'right' ? ' flash' : ''}`}>
                  <div className="burst"><span>10 วิ</span></div>
                </div>

                {!playing && videoId ? (
                  <button className="big-play" onClick={yt.play} aria-label="เล่น">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  </button>
                ) : null}

                {/* บทเรียนนี้ยังไม่ได้ใส่คลิป — บอกให้ชัด ดีกว่าปล่อยจอดำเฉย ๆ */}
                {!videoId ? (
                  <div className="player-msg">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="m22 8-6 4 6 4V8z" /><rect x="2" y="6" width="14" height="12" rx="2" />
                    </svg>
                    <b>บทเรียนนี้ยังไม่มีคลิป</b>
                    <span>พี่หมิงยังไม่ได้อัปโหลดวิดีโอของบทนี้</span>
                  </div>
                ) : null}

                {yt.error && videoId ? (
                  <div className="player-msg err">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" /><path d="M12 8v5M12 16h.01" />
                    </svg>
                    <b>เล่นคลิปนี้ไม่ได้</b>
                    <span>{yt.error}</span>
                    {/* บอกไอดีคลิปไว้ด้วย จะได้เอาไปเปิดตรวจบน YouTube ได้ทันที
                        ว่าเป็นที่คลิปเองหรือเป็นที่เว็บเรา */}
                    <a
                      className="player-msg-link"
                      href={`https://www.youtube.com/watch?v=${videoId}`}
                      target="_blank" rel="noreferrer"
                    >
                      เปิดคลิปนี้บน YouTube เพื่อตรวจสอบ ({videoId}) ↗
                    </a>
                  </div>
                ) : null}

                {/* ---------- แถบควบคุม ---------- */}
                <div className="ctrl">
                  <div
                    ref={scrubRef}
                    className={`scrub${dragging ? ' dragging' : ''}`}
                    onPointerDown={onScrubDown}
                    onPointerMove={onScrubMove}
                    onPointerUp={onScrubUp}
                    onPointerCancel={onScrubUp}
                    role="slider"
                    aria-label="ตำแหน่งในวิดีโอ"
                    aria-valuemin={0}
                    aria-valuemax={Math.round(yt.duration)}
                    aria-valuenow={Math.round(shownTime)}
                    tabIndex={0}
                  >
                    <div className="track">
                      <div className="buffered" style={{ width: `${yt.buffered * 100}%` }} />
                      <div className="filled" style={{ width: `${playedPct}%` }} />
                    </div>
                    <div className="knob" style={{ left: `${playedPct}%` }} />
                  </div>

                  <div className="ctrl-row">
                    <button className="cbtn" onClick={yt.toggle} aria-label={playing ? 'หยุด' : 'เล่น'}>
                      {playing ? (
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                      )}
                    </button>
                    {/* ปุ่มย้อน/เดินหน้า 10 วิ เอาออกตามที่หมิงสั่ง
                        ยังใช้ปุ่มลูกศรซ้าย/ขวาบนคีย์บอร์ดได้เหมือนเดิม
                        และดับเบิลคลิกซ้าย/ขวาบนจอก็ข้ามได้ */}

                    <div className="vol">
                      <button className="cbtn sm" onClick={yt.toggleMute} aria-label={yt.muted ? 'เปิดเสียง' : 'ปิดเสียง'}>
                        {yt.muted || yt.volume === 0 ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                            <path d="M11 5 6 9H2v6h4l5 4z" /><path d="m22 9-6 6M16 9l6 6" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                            <path d="M11 5 6 9H2v6h4l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" />
                          </svg>
                        )}
                      </button>
                      {/* --fill บอก CSS ว่าต้องระบายสีทึบถึงกี่ % — ทำให้แถบเสียง
                          มีสีทึบตามระดับ ไม่ใช่มีแค่วงกลมลอยอยู่บนเส้นจาง ๆ */}
                      <input
                        className="rng" type="range" min={0} max={100} step={1}
                        value={yt.muted ? 0 : yt.volume}
                        style={{ '--fill': `${yt.muted ? 0 : yt.volume}%` } as React.CSSProperties}
                        onChange={(e) => yt.setVolume(Number(e.target.value))}
                        aria-label="ระดับเสียง"
                      />
                    </div>

                    <span className="time">
                      <b>{fmtTime(shownTime)}</b> / {fmtTime(yt.duration)}
                    </span>

                    <span className="spacer" />

                    <button
                      ref={rateBtnRef}
                      className={`rate-btn${ratePop ? ' on' : ''}`}
                      onClick={() => setRatePop((v) => !v)}
                      aria-label="ความเร็วในการเล่น"
                      aria-expanded={ratePop}
                    >
                      {yt.rate}×
                    </button>
                    <button className="cbtn sm" onClick={toggleFullscreen} aria-label="เต็มจอ">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div ref={popRef} className={`pop${ratePop ? ' open' : ''}`}>
                  <div className="pop-sec">
                    <div className="lbl">ความเร็วในการเล่น <b>{yt.rate.toFixed(2)}×</b></div>

                    <div className="speed-presets">
                      {RATES.map((r) => (
                        <button
                          key={r}
                          className={Math.abs(yt.rate - r) < 0.001 ? 'on' : ''}
                          onClick={() => yt.setRate(r)}
                        >
                          {r.toFixed(1)}×
                        </button>
                      ))}
                    </div>

                    {/* สไลเดอร์ปรับละเอียดระหว่าง 0.5× ถึง 2×
                        ไม่มี 3× เพราะ YouTube รับสูงสุด 2 (ส่งเกินจะถูกปัดลงเงียบ ๆ
                        แล้วเลขบนจอจะไม่ตรงกับความเร็วจริง) */}
                    <div className="speed-slide">
                      <input
                        className="rng" type="range"
                        min={MIN_RATE} max={MAX_RATE} step={0.05}
                        value={yt.rate}
                        style={{
                          '--fill': `${((yt.rate - MIN_RATE) / (MAX_RATE - MIN_RATE)) * 100}%`,
                        } as React.CSSProperties}
                        onChange={(e) => yt.setRate(Number(e.target.value))}
                        aria-label="ปรับความเร็วละเอียด"
                      />
                      <span className="v">{yt.rate.toFixed(2)}×</span>
                    </div>
                    <div className="speed-scale" aria-hidden="true">
                      <span>0.5×</span><span>1×</span><span>1.5×</span><span>2×</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------- ข้อมูลบทเรียน ---------- */}
              <div className="lesson-info">
                <div className="top-row">
                  <span className="tag">
                    บทที่ {chapters.findIndex((c) => c.id === active?.chapter.id) + 1} · บทเรียนที่ {activeIdx + 1}
                  </span>
                  <span className="lmeta">
                    {activeLesson?.duration ? <span>{activeLesson.duration} นาที</span> : null}
                    <span className="dot-sep" />
                    <span>{activeIdx + 1} จาก {flat.length}</span>
                  </span>
                </div>

                <h1>{activeLesson?.title ?? ''}</h1>

                <div className="nav-row">
                  <button
                    type="button"
                    className={`watch-state${activeDone ? ' done' : ''}`}
                    style={{ '--deg': `${(activeDone ? 100 : watchPct) * 3.6}deg` } as React.CSSProperties}
                    onClick={() => activeLesson && toggleMut.mutate(activeLesson.id)}
                    disabled={toggleMut.isPending}
                    title={activeDone ? 'กดเพื่อยกเลิกว่าเรียนจบ' : 'กดเพื่อทำเครื่องหมายว่าเรียนจบ'}
                  >
                    <span className="ws-ring">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span>{activeDone ? <b>เรียนจบแล้ว</b> : <>ดูแล้ว <b>{watchPct}%</b></>}</span>
                  </button>

                  <div className="prev-next">
                    <button className="btn btn-ghost btn-sm" onClick={goPrev} disabled={activeIdx <= 0}>
                      ← บทก่อน
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={goNext}
                      disabled={activeIdx < 0 || activeIdx >= flat.length - 1}
                    >
                      บทถัดไป →
                    </button>
                  </div>
                </div>
              </div>

              {/* ---------- เอกสารประกอบ ---------- */}
              {activeLesson?.doc_url ? (
                <div className="doc-row">
                  <a className="doc-btn primary" href={activeLesson.doc_url} target="_blank" rel="noreferrer">
                    <span className="ic">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                      </svg>
                    </span>
                    <span className="tx"><b>โหลดเอกสารการเรียน</b><span>ชีทประกอบบทเรียนนี้</span></span>
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </main>
      </div>

      {reward ? (
        <div className="reward-toast" role="status" onClick={() => setReward(null)}>
          <span className="rt-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="6" /><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5" />
            </svg>
          </span>
          <span>
            <b>ได้เหรียญใหม่!</b>
            <small>{reward.badges.join(' · ')}</small>
          </span>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- ย่อย */

function Notice({
  title, text, actions,
}: { title: string; text?: string; actions?: React.ReactNode }) {
  return (
    <div className="learn-page">
      <div className="lp-notice">
        <span className="big-ring">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </span>
        <h1>{title}</h1>
        {text ? <p>{text}</p> : null}
        {actions ? <div className="acts">{actions}</div> : null}
      </div>
    </div>
  );
}
