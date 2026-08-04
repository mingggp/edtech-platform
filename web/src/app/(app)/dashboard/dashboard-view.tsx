'use client';

/**
 * หน้าหลัก — ต่อข้อมูลจริงทั้งหมดแล้ว
 *
 * ก่อนหน้านี้หน้านี้เป็นของปลอม (ตัวเลข hardcode) ที่ผมเขียนไว้ตอนวาง
 * architecture เพื่อพิสูจน์ว่าโครงใช้ได้ — แต่มันคือสิ่งแรกที่นักเรียนเห็น
 * หลังล็อกอิน ปล่อยไว้เป็นของปลอมไม่ได้
 *
 * ทุกตัวเลขในหน้านี้มาจาก API จริง:
 *   /users/me                  ชื่อ · รูป
 *   /users/me/gamification     สตรีค · XP · เลเวล · เป้าหมายวันนี้
 *   /users/me/study-stats      เวลาเรียน 7 วัน (กราฟ)
 *   /users/me/courses          คอร์สของฉัน + ความคืบหน้า
 *   /leaderboard?period=week   อันดับสัปดาห์นี้
 */
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { Avatar } from '@/components/avatar';
import { PageHeader } from '@/components/layout/app-shell';
import { gradeLabel } from '@/config/grades';
import { levelLabel, subjectLabel, SUBJECTS } from '@/config/subjects';
import { courses as coursesApi, gamification as gmApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth-context';

/** ทักทายตามเวลาจริงบนเครื่องนักเรียน */
function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'ดึกแล้วนะ';
  if (h < 12) return 'สวัสดีตอนเช้า';
  if (h < 17) return 'สวัสดีตอนบ่าย';
  if (h < 21) return 'สวัสดีตอนเย็น';
  return 'สวัสดีตอนค่ำ';
}

/** 95 -> "1 ชม. 35 น." */
function fmtMinutes(m: number): string {
  const mins = Math.max(0, Math.round(m));
  if (mins < 60) return `${mins} น.`;
  const h = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest ? `${h} ชม. ${rest} น.` : `${h} ชม.`;
}

/** ไล่สีประจำวิชา — ใช้ token ชุดเดียวกับหน้าอื่น */
function subjectGrad(subject: string | null): string {
  return subject ? `var(--subj-${subject}-grad)` : 'var(--grad-signature)';
}

function subjectGlyph(subject: string | null): string {
  const s = SUBJECTS.find((x) => x.id === subject);
  return s ? s.en.slice(0, 2).toUpperCase() : '••';
}

export function DashboardView() {
  const { user } = useAuth();

  const gmQ = useQuery({ queryKey: ['gamification'], queryFn: () => gmApi.summary(), enabled: !!user });
  const statsQ = useQuery({ queryKey: ['study-stats'], queryFn: () => gmApi.weeklyStats(), enabled: !!user });
  const mineQ = useQuery({ queryKey: ['my-courses'], queryFn: () => coursesApi.mine(), enabled: !!user });
  const rankQ = useQuery({
    queryKey: ['leaderboard', 'week'],
    queryFn: () => gmApi.leaderboard('week'),
    enabled: !!user,
  });

  const gm = gmQ.data;
  const streak = gm?.streak;
  const minutesToday = streak?.minutes_today ?? 0;
  const goal = streak?.goal_minutes ?? 30;
  const goalPct = goal > 0 ? Math.min(100, Math.round((minutesToday / goal) * 100)) : 0;
  const metGoal = !!streak?.met_goal_today;

  const stats = statsQ.data;
  const weekData = stats?.data ?? [];
  const weekMax = Math.max(1, ...weekData);
  const weekTotal = weekData.reduce((a, b) => a + b, 0);

  const mine = mineQ.data ?? [];
  /* คอร์สที่ยังเรียนไม่จบขึ้นก่อน เพราะเข้ามาหน้านี้เพื่อ "เรียนต่อ"
     ถ้าเท่ากันให้อันที่คืบหน้ามากกว่าอยู่บน (ใกล้จบแล้ว อยากปิดให้จบ) */
  const sortedMine = [...mine].sort((a, b) => {
    const aDone = a.progress >= 100 ? 1 : 0;
    const bDone = b.progress >= 100 ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return b.progress - a.progress;
  });

  const ranks = rankQ.data ?? [];

  const name = user?.nickname || user?.full_name || '';

  return (
    <div className="dash">
      <PageHeader
        eyebrow="ภาพรวมการเรียน"
        title="หน้าหลัก"
        meta={user?.grade_level ? `${gradeLabel(user.grade_level)} · DEK${user.dek_code ?? '—'}` : undefined}
      />

      {/* ---------------- ทักทาย + ตัวเลขสำคัญ ---------------- */}
      <section className="dash-hero">
        <div className="eyebrow">{greeting()}</div>
        <h1>{name ? `${name} พร้อมเรียนหรือยัง?` : 'พร้อมเรียนหรือยัง?'}</h1>
        <p className="sub">
          {metGoal
            ? 'ทำครบเป้าหมายวันนี้แล้ว เก่งมาก 🎉'
            : minutesToday > 0
              ? `วันนี้เรียนไปแล้ว ${fmtMinutes(minutesToday)} อีกนิดเดียวก็ครบเป้า`
              : 'ยังไม่ได้เรียนวันนี้ เริ่มเลยดีกว่า'}
        </p>

        <div className="stat-row">
          <div className="stat">
            <span className="ic fire" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2s4 4.5 4 8a4 4 0 0 1-8 0c0-1 .5-2 .5-2S6 11 6 14a6 6 0 0 0 12 0c0-5-6-12-6-12z" />
              </svg>
            </span>
            <span className="tx">
              <b>{streak?.current ?? 0} วัน</b>
              <span>สตรีค · สูงสุด {streak?.best ?? 0}</span>
            </span>
          </div>

          <div className="stat">
            <span className="ic xp" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="m13 2-9 12h7l-1 8 9-12h-7z" />
              </svg>
            </span>
            <span className="tx">
              <b>LV {gm?.level ?? 1}</b>
              <span>{(gm?.xp_total ?? 0).toLocaleString('th-TH')} XP</span>
            </span>
          </div>

          <div className="stat">
            <span className="ic clock" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
              </svg>
            </span>
            <span className="tx">
              <b>{fmtMinutes(user?.total_minutes ?? 0)}</b>
              <span>เวลาเรียนรวม</span>
            </span>
          </div>

          <div className="stat">
            <span className="ic book" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </span>
            <span className="tx">
              <b>{mine.length} คอร์ส</b>
              <span>ที่ซื้อไว้</span>
            </span>
          </div>
        </div>

        {/* แถบเป้าหมายวันนี้ */}
        <div className="goal-bar">
          <div className="head">
            <span>เป้าหมายวันนี้</span>
            <span><b>{minutesToday}</b> / {goal} นาที</span>
          </div>
          <div className="track">
            <div className={`fill${metGoal ? ' done' : ''}`} style={{ width: `${goalPct}%` }} />
          </div>
          <p className="note">
            {metGoal
              ? 'ครบแล้ว! สตรีคของวันนี้ปลอดภัย'
              : `เรียนอีก ${Math.max(0, goal - minutesToday)} นาที ก็ครบเป้าและได้ XP`}
          </p>
        </div>
      </section>

      <div className="dash-grid">
        {/* ---------------- กราฟเวลาเรียน ---------------- */}
        <section className="dash-card">
          <header>
            <h2>เวลาเรียน 7 วันล่าสุด</h2>
          </header>

          {statsQ.isPending ? (
            <p className="dash-empty">กำลังโหลด…</p>
          ) : weekTotal === 0 ? (
            <p className="dash-empty">
              สัปดาห์นี้ยังไม่มีเวลาเรียนบันทึกไว้ — เปิดคลิปแล้วดูสักหน่อย
              เวลาจะถูกนับให้อัตโนมัติ
            </p>
          ) : (
            <>
              <div className="chart">
                {weekData.map((v, i) => {
                  const isToday = i === weekData.length - 1;   // ตัวสุดท้ายคือวันนี้
                  return (
                    <div className={`col${isToday ? ' today' : ''}`} key={`${stats?.labels[i]}-${i}`}>
                      <span className="val">{v > 0 ? v : ''}</span>
                      <div className="bar-wrap">
                        <div
                          className="bar"
                          style={{ height: `${Math.max(2, (v / weekMax) * 100)}%` }}
                          title={`${stats?.labels[i]} · ${fmtMinutes(v)}`}
                        />
                      </div>
                      <span className="lbl">{stats?.labels[i]}</span>
                    </div>
                  );
                })}
              </div>
              <div className="chart-foot">
                <span>รวมสัปดาห์นี้ <b>{fmtMinutes(weekTotal)}</b></span>
                <span>เฉลี่ย <b>{fmtMinutes(weekTotal / (weekData.length || 1))}</b>/วัน</span>
              </div>
            </>
          )}
        </section>

        {/* ---------------- อันดับ ---------------- */}
        <section className="dash-card">
          <header>
            <h2>อันดับสัปดาห์นี้</h2>
          </header>

          {rankQ.isPending ? (
            <p className="dash-empty">กำลังโหลด…</p>
          ) : ranks.length === 0 ? (
            <p className="dash-empty">ยังไม่มีใครเรียนสัปดาห์นี้ — เป็นคนแรกได้เลย</p>
          ) : (
            <div className="rank-list">
              {ranks.slice(0, 8).map((r) => (
                <div
                  key={r.user_id}
                  className={[
                    'rank-row',
                    r.user_id === user?.id ? 'me' : '',
                    // ใส่ top1/top2/top3 เฉพาะ 3 อันดับแรก
                    // ไม่ใส่ top0 ให้คนอื่น เพราะเป็นคลาสที่ไม่มี CSS รองรับ
                    r.rank <= 3 ? `top${r.rank}` : '',
                  ].filter(Boolean).join(' ')}
                >
                  <span className="no">{r.rank}</span>
                  <Avatar
                    person={{ avatar_url: r.avatar_url, nickname: r.name }}
                    size={30}
                  />
                  <span className="nm">
                    <b>{r.name || 'นักเรียน'}</b>
                    <span>
                      {gradeLabel(r.grade_level) || '—'} · LV {r.level}
                    </span>
                  </span>
                  <span className="mins">{fmtMinutes(r.minutes)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ---------------- คอร์สของฉัน ---------------- */}
      <section className="dash-card">
        <header>
          <h2>คอร์สของฉัน</h2>
          <Link href="/courses" className="more">ดูคอร์สทั้งหมด →</Link>
        </header>

        {mineQ.isPending ? (
          <p className="dash-empty">กำลังโหลด…</p>
        ) : sortedMine.length === 0 ? (
          <p className="dash-empty">
            ยังไม่มีคอร์สเลย — <Link href="/courses" className="more">เลือกคอร์สที่อยากเรียน</Link>
          </p>
        ) : (
          <div className="my-courses">
            {sortedMine.map((c) => (
              <Link
                key={c.id}
                href={`/learn/${c.id}`}
                className={`mc${c.progress >= 100 ? ' done' : ''}`}
                style={{ '--c': subjectGrad(c.subject) } as React.CSSProperties}
              >
                <span className="badge" aria-hidden="true">{subjectGlyph(c.subject)}</span>
                <span className="mid">
                  <b>{c.title}</b>
                  <span className="meta">
                    {[subjectLabel(c.subject), levelLabel(c.level)].filter(Boolean).join(' · ')}
                    {c.total_lessons > 0 ? ` · ${c.completed_lessons}/${c.total_lessons} บทเรียน` : ''}
                  </span>
                  <span className="track"><i style={{ width: `${c.progress}%` }} /></span>
                </span>
                <span className="pct">{c.progress}%</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
