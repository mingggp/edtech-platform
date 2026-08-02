'use client';

/**
 * หน้าจ่ายเงิน — แปลงจาก 'Claude Design version 1.0/Checkout.html'
 *
 * สถานะของหน้า (ตรงกับ .checkout[data-state] ในดีไซน์เดิม):
 *   qr      แสดง QR + นับถอยหลัง 15 นาที + ถาม backend เป็นระยะว่าจ่ายรึยัง
 *   verify  ได้สัญญาณว่าจ่ายแล้ว กำลังยืนยัน
 *   success จ่ายสำเร็จ เปิดคอร์สให้แล้ว
 *   expired QR หมดอายุก่อนจ่าย
 *
 * เรื่องที่ระวังไว้:
 *   • คอร์สฟรีไม่ต้องผ่าน QR เลย -> ลงทะเบียนตรงแล้วเด้งไป success
 *   • ยังไม่ล็อกอิน -> พาไปหน้าล็อกอินพร้อมจำ path เดิมไว้
 *   • ซื้อไปแล้ว -> backend ตอบ 400 จึงบอกผู้ใช้ตรง ๆ ไม่ปล่อยให้จ่ายซ้ำ
 *   • นาฬิกาใช้ expires_at จาก backend เป็นหลัก ไม่นับถอยหลังฝั่ง client เอง
 *     (ถ้านับเองแล้วผู้ใช้สลับแท็บไป เวลาจะเพี้ยน)
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { SubjectIcon } from '@/components/layout/subject-icons';
import { getSubject } from '@/config/subjects';
import { ApiError } from '@/lib/api/client';
import { courses as coursesApi, payments as paymentsApi } from '@/lib/api/endpoints';
import type { Checkout } from '@/lib/api/types';
import { useAuth } from '@/lib/auth-context';
import { baht, countdown, duration } from '@/lib/format';

type Stage = 'loading' | 'qr' | 'verify' | 'success' | 'expired' | 'error';

const POLL_MS = 3000;

export function CheckoutView({ courseId }: { courseId: number }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [stage, setStage] = useState<Stage>('loading');
  const [intent, setIntent] = useState<Checkout | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [msLeft, setMsLeft] = useState(0);
  const [coupon, setCoupon] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const course = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.get(courseId),
    enabled: Number.isFinite(courseId),
    retry: false,
  });

  const c = course.data;
  const subj = c?.subject ? getSubject(c.subject) : undefined;
  const isFree = !!c && c.price <= 0;

  /* ---------------- ยังไม่ล็อกอิน -> ไปหน้าล็อกอินก่อน ---------------- */
  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(`/checkout/${courseId}`)}`);
  }, [authLoading, user, courseId, router]);

  /* ---------------- เริ่มรายการชำระเงิน ---------------- */
  const start = useCallback(
    async (couponCode?: string) => {
      if (!c) return;
      setErrorMsg(null);
      setBusy(true);
      try {
        if (c.price <= 0) {
          await paymentsApi.enrollFree(c.id);
          setStage('success');
          return;
        }
        const r = await paymentsApi.checkout(c.id, couponCode);
        setIntent(r);
        setStage('qr');
      } catch (err) {
        const e = err as ApiError;
        setErrorMsg(e?.message ?? 'เริ่มรายการชำระเงินไม่สำเร็จ');
        setStage('error');
      } finally {
        setBusy(false);
      }
    },
    [c],
  );

  const started = useRef(false);
  useEffect(() => {
    if (!user || !c || started.current) return;
    started.current = true;
    void start();
  }, [user, c, start]);

  /* ---------------- นาฬิกานับถอยหลัง ---------------- */
  useEffect(() => {
    if (stage !== 'qr' || !intent) return;
    const end = new Date(intent.expires_at).getTime();
    const tick = () => setMsLeft(Math.max(0, end - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [stage, intent]);

  /* ---------------- ถาม backend เป็นระยะว่าจ่ายรึยัง ---------------- */
  useEffect(() => {
    if (stage !== 'qr' || !intent) return;
    let alive = true;
    const t = setInterval(async () => {
      try {
        const p = await paymentsApi.status(intent.ref);
        if (!alive) return;
        if (p.status === 'paid') {
          setStage('verify');
          // หน่วงสั้น ๆ ให้ผู้ใช้เห็นขั้นตอนยืนยัน ตามดีไซน์เดิม
          setTimeout(() => alive && setStage('success'), 1400);
        } else if (p.status === 'expired') {
          setStage('expired');
        }
      } catch {
        /* เน็ตสะดุดชั่วคราว — รอบหน้าค่อยถามใหม่ ไม่ต้องทำอะไร */
      }
    }, POLL_MS);
    return () => { alive = false; clearInterval(t); };
  }, [stage, intent]);

  /* นาฬิกาบนจอเดินหมด -> ถาม backend ทันที ไม่ตัดสินเอง
   *
   * เดิมตรงนี้สั่ง setStage('expired') จากนาฬิกาในเครื่องผู้ใช้ ซึ่งอันตราย:
   * ถ้านาฬิกาเครื่องเดินผิด (หรือ backend ส่งเวลามาโดยไม่บอก timezone แบบที่
   * เคยเป็นบั๊กมาแล้ว) หน้าจะขึ้น "QR หมดอายุ" ทั้งที่ยังจ่ายได้อยู่
   * -> นักเรียนจ่ายเงินไม่ได้เลย และเราจะไม่รู้ด้วยซ้ำว่าเสียลูกค้าไป
   *
   * ตอนนี้คนที่ตัดสินว่าหมดอายุคือ backend ที่เดียว (status === 'expired')
   * นาฬิกาบนจอมีหน้าที่แค่แสดงผลให้ผู้ใช้ดู
   */
  useEffect(() => {
    if (stage !== 'qr' || !intent || msLeft !== 0) return;
    let alive = true;
    void paymentsApi
      .status(intent.ref)
      .then((p) => {
        if (!alive) return;
        if (p.status === 'expired') setStage('expired');
        else if (p.status === 'paid') {
          setStage('verify');
          setTimeout(() => alive && setStage('success'), 1400);
        }
      })
      .catch(() => {/* ถามไม่ได้ก็ปล่อยไว้ รอบ poll ปกติจะถามให้เอง */});
    return () => { alive = false; };
  }, [stage, intent, msLeft]);

  /* ---------------- คูปอง ---------------- */
  async function applyCoupon() {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    setBusy(true);
    setCouponMsg(null);
    try {
      const r = await paymentsApi.validateCoupon(code);
      setAppliedCoupon(r.code);
      setCouponMsg({ ok: true, text: `ใช้โค้ด ${r.code} แล้ว` });
      started.current = true;
      await start(r.code);          // สร้าง QR ใหม่ตามยอดหลังหักส่วนลด
    } catch (err) {
      setCouponMsg({ ok: false, text: (err as Error)?.message ?? 'โค้ดไม่ถูกต้อง' });
    } finally {
      setBusy(false);
    }
  }

  async function simulatePaid() {
    if (!intent) return;
    setBusy(true);
    try {
      await paymentsApi.simulatePaid(intent.ref);
      setStage('verify');
      setTimeout(() => setStage('success'), 1400);
    } catch (err) {
      setErrorMsg((err as Error)?.message ?? 'จำลองไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  const priceOriginal = c?.price ?? 0;
  const amountNow = intent?.amount ?? priceOriginal;
  const discount = Math.max(0, priceOriginal - amountNow);

  const pipelineStep = useMemo(() => {
    if (stage === 'success') return 3;
    if (stage === 'verify') return 2;
    return 1;
  }, [stage]);

  /* ---------------- เคสที่ยังไม่ต้องแสดงหน้าเต็ม ---------------- */
  if (authLoading || !user) return <Shell><Center>กำลังตรวจสอบสิทธิ์…</Center></Shell>;
  if (course.isPending) return <Shell><Center>กำลังโหลดคอร์ส…</Center></Shell>;
  if (course.isError || !c) {
    const status = (course.error as ApiError)?.status;
    return (
      <Shell>
        <Center>
          {status === 404 ? 'ไม่พบคอร์สนี้' : (course.error as Error)?.message ?? 'โหลดคอร์สไม่สำเร็จ'}
          <div style={{ marginTop: 16 }}>
            <Link href="/courses" className="btn btn-secondary">กลับไปหน้าคอร์ส</Link>
          </div>
        </Center>
      </Shell>
    );
  }

  const dataState: string =
    stage === 'success' ? 'success'
      : stage === 'verify' ? 'verify'
        : stage === 'expired' ? 'expired'
          : 'qr';

  return (
    <div className="checkout" data-state={dataState}>
      {/* ---------- แถบบน ---------- */}
      <header className="co-top">
        <Link href={`/courses/${c.id}`} className="co-exit">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span className="lbl-full">ออกจากการชำระเงิน</span>
        </Link>
        <div className="co-brand">
          <span className="mark" aria-hidden="true">
            <svg viewBox="0 0 120 120" fill="none">
              <path d="M40 50 Q40 38 50 38 Q60 38 60 50" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
              <path d="M68 50 Q68 38 78 38 Q88 38 88 50" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
              <path d="M34 72 Q60 100 94 72" stroke="#fff" strokeWidth={10} strokeLinecap="round" />
            </svg>
          </span>
          <b>ชำระเงิน</b>
        </div>
        <span className="co-secure">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="lbl-full">ชำระปลอดภัยผ่าน</span> <span className="gw">PromptPay</span>
        </span>
      </header>

      {/* ---------- 3 ขั้นตอน ---------- */}
      <div className="pipeline">
        <div className={`pl-step${pipelineStep >= 1 ? ' active' : ''}`}>
          <span className="num">1</span><span className="lab">สแกนจ่าย<small>Scan</small></span>
        </div>
        <span className={`pl-line${pipelineStep >= 2 ? ' on' : ''}`} />
        <div className={`pl-step${pipelineStep >= 2 ? ' active' : ''}`}>
          <span className="num">2</span><span className="lab">ยืนยันอัตโนมัติ<small>Verify</small></span>
        </div>
        <span className={`pl-line${pipelineStep >= 3 ? ' on' : ''}`} />
        <div className={`pl-step${pipelineStep >= 3 ? ' active' : ''}`}>
          <span className="num">3</span><span className="lab">เริ่มเรียน<small>Start</small></span>
        </div>
      </div>

      {/* ---------- QR + สรุปคำสั่งซื้อ ---------- */}
      <div className="co-body">
        <div className="co-main">
          <div className="pay-card">
            <div className="pay-head">
              <div>
                <h2>สแกนเพื่อชำระเงิน</h2>
                <p>เปิดแอปธนาคารหรือแอปที่มีพร้อมเพย์ แล้วสแกน QR ด้านล่าง</p>
              </div>
              <div className="timer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
                </svg>
                <span className="tt"><small>QR หมดอายุใน</small><b>{countdown(msLeft)}</b></span>
              </div>
            </div>

            <div className="qr-wrap">
              <div className="qr-promptpay">
                <span className="pp">PromptPay</span> · ชำระให้{' '}
                <span style={{ color: 'var(--fg-0)', fontWeight: 600 }}>Mingsmileyface</span>
              </div>
              <div className="qr-frame">
                <span className="qr-corner tl" /><span className="qr-corner tr" />
                <span className="qr-corner bl" /><span className="qr-corner br" />
                {intent ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={paymentsApi.qrUrl(intent.amount, intent.ref)}
                    alt="QR พร้อมเพย์สำหรับชำระเงิน"
                    width={232}
                    height={232}
                  />
                ) : (
                  <div style={{ width: 232, height: 232 }} />
                )}
              </div>
              <div className="qr-amount">
                <span className="cur">฿</span>{Math.round(amountNow).toLocaleString('en-US')}.00
              </div>

              <div className="poll">
                <span className="poll-pill">
                  <span className="spin" /><b>กำลังรอการชำระเงิน<span className="dots" /></b>
                </span>
                <span className="poll-sub">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}
                       strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  ระบบจะยืนยันให้อัตโนมัติทันทีที่ชำระสำเร็จ ไม่ต้องส่งสลิป
                </span>
              </div>

              {errorMsg ? (
                <p style={{ color: 'var(--danger, oklch(.68 .2 25))', fontSize: 13, marginTop: 12 }}>
                  {errorMsg}
                </p>
              ) : null}

              {process.env.NODE_ENV !== 'production' ? (
                <div className="demo-row">
                  <span className="dlabel">เดโม · ยังไม่ได้ต่อเกตเวย์จริง</span>
                  <button className="btn btn-secondary btn-demo" onClick={simulatePaid} disabled={busy || !intent}>
                    จำลองชำระสำเร็จ
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="summary">
          <div className="sm-title">สรุปคำสั่งซื้อ</div>
          <div className="sm-course">
            <div className="sm-thumb">
              <span className="glow" />
              <SubjectIcon id={c.subject ?? 'math'} />
            </div>
            <div className="sm-cinfo">
              <h3>{c.title}</h3>
              <div className="inst">
                <span className="av">M</span> พี่หมิง
                {c.total_lessons > 0 ? ` · ${c.total_lessons} บทเรียน` : ''}
                {c.total_minutes > 0 ? ` · ${duration(c.total_minutes)}` : ''}
              </div>
            </div>
          </div>

          <div className="coupon">
            <input
              type="text" value={coupon} placeholder="กรอกโค้ดส่วนลด"
              onChange={(e) => setCoupon(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void applyCoupon(); } }}
              disabled={busy || isFree}
            />
            <button className="btn btn-secondary" onClick={applyCoupon} disabled={busy || isFree}>
              ใช้โค้ด
            </button>
          </div>
          {couponMsg ? (
            <div className={`coupon-msg${couponMsg.ok ? ' ok' : ' err'}`}>{couponMsg.text}</div>
          ) : null}

          <div className="sm-lines">
            <div className="sm-line"><span>ราคาคอร์ส</span><span className="v">{baht(priceOriginal)}</span></div>
            {discount > 0 ? (
              <div className="sm-line discount">
                <span>ส่วนลด{appliedCoupon ? ` · ${appliedCoupon}` : ''}</span>
                <span className="v">−{baht(discount)}</span>
              </div>
            ) : null}
          </div>

          <div className="sm-total">
            <span className="lbl">ยอดสุทธิ</span>
            <span className="amt">
              <span className="cur">฿</span>{Math.round(amountNow).toLocaleString('en-US')}.00
            </span>
          </div>

          <div className="trust">
            <div className="trust-item s">ยืนยันการชำระอัตโนมัติ ไม่ต้องส่งสลิป</div>
            <div className="trust-item i">จ่ายครั้งเดียว เข้าเรียนได้ตลอดชีพ</div>
            <div className="trust-item l">ติดปัญหา? ทักแอดมินได้เลย</div>
          </div>
        </aside>
      </div>

      {/* ---------- ขั้นยืนยัน / สำเร็จ / หมดอายุ ---------- */}
      <div className="co-stage">
        <div className="stage-card stage-verify">
          <div className="stage-inner">
            <div className="big-ring verify"><span className="ring-spin" aria-hidden="true" /></div>
            <h1>กำลังยืนยันการชำระเงิน<span className="dots" /></h1>
            <p>ระบบได้รับสัญญาณการชำระแล้ว กำลังตรวจสอบยอดและปลดล็อกคอร์สให้อัตโนมัติ</p>
          </div>
        </div>

        <div className="stage-card stage-success">
          <div className="stage-inner">
            <div className="big-ring ok">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}
                   strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1>{isFree ? 'เปิดคอร์สให้แล้ว 🎉' : 'ชำระเงินสำเร็จ 🎉'}</h1>
            <p>ขอบคุณที่ไว้วางใจ Mingsmileyface — ปลดล็อกคอร์สให้เรียบร้อยแล้ว</p>
            {!isFree && intent ? (
              <div className="paid-pill">
                ชำระแล้ว {baht(intent.amount)} <span className="ref">REF · {intent.ref.slice(-8)}</span>
              </div>
            ) : null}
            <div className="stage-actions">
              {/* หน้าห้องเรียนยังไม่ได้ทำ — ขั้นถัดไปของ flow */}
              <Link href={`/courses/${c.id}`} className="btn btn-primary btn-lg">
                ไปที่คอร์ส
              </Link>
              <Link href="/courses" className="btn btn-secondary">ดูคอร์สอื่น</Link>
            </div>
          </div>
        </div>

        <div className="stage-card stage-expired">
          <div className="stage-inner">
            <div className="big-ring">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
                <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
              </svg>
            </div>
            <h1>QR หมดอายุแล้ว</h1>
            <p>
              QR พร้อมเพย์ใช้ได้ภายใน 15 นาทีเพื่อความปลอดภัย
              ยังไม่มีการตัดเงินจากบัญชีของคุณ — สร้าง QR ใหม่เพื่อชำระต่อได้เลย
            </p>
            <div className="stage-actions">
              <button
                className="btn btn-primary btn-lg"
                disabled={busy}
                onClick={() => { started.current = true; void start(appliedCoupon); }}
              >
                สร้าง QR ใหม่
              </button>
              <Link href={`/courses/${c.id}`} className="btn btn-secondary">กลับไปหน้าคอร์ส</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- ย่อย */

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="checkout" data-state="qr">{children}</div>;
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '70vh',
                  textAlign: 'center', color: 'var(--fg-2)', padding: 24 }}>
      <div>{children}</div>
    </div>
  );
}
