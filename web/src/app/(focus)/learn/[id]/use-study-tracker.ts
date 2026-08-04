'use client';

/**
 * นับเวลาเรียนจริง แล้วส่งเข้าระบบสตรีค/XP
 *
 * "เวลาเรียน" ของเว็บนี้ไปขยับสตรีครายวัน เป้าหมายรายวัน XP และเหรียญ
 * ถ้านับผิดจะกระทบทุกอย่างพร้อมกัน จึงต้องระวังเป็นพิเศษ
 *
 * กติกาที่ยึด:
 *
 * 1. นับเฉพาะตอนวิดีโอ "กำลังเล่นจริง" เท่านั้น
 *    หยุด/โหลดค้าง/ยังไม่กดเล่น = ไม่นับ
 *
 * 2. ใช้เวลานาฬิกาจริง (Date.now) ไม่ใช่การนับรอบของ setInterval
 *    เพราะเบราว์เซอร์จะหรี่ timer ของแท็บที่ไม่ได้อยู่ข้างหน้าเหลือ 1 ครั้ง/นาที
 *    ถ้านับรอบจะได้เวลาน้อยกว่าความจริงมาก
 *
 * 3. สลับไปแท็บอื่น = หยุดนับ
 *    YouTube เล่นต่อได้ก็จริง แต่ "เปิดทิ้งไว้" ไม่ใช่การเรียน
 *    ถ้านับให้ นักเรียนจะเปิดคลิปทิ้งไว้ข้ามคืนเพื่อปั่นสตรีค
 *
 * 4. ส่งเป็นนาทีเต็มเท่านั้น และเก็บเศษวินาทีไว้รอบถัดไป
 *    backend รับหน่วยนาที ถ้าปัดทิ้งทุกครั้งที่ส่ง นักเรียนที่ดู 50 วินาที
 *    สิบรอบจะได้ 0 นาที ทั้งที่เรียนไปแล้ว 8 นาทีกว่า
 */
import { useCallback, useEffect, useRef } from 'react';

import { gamification } from '@/lib/api/endpoints';

/** ส่งเข้าเซิร์ฟเวอร์ทุก ๆ เท่าไหร่ (มิลลิวินาที) */
const FLUSH_EVERY_MS = 60_000;

/** ดูสั้นกว่านี้ไม่ต้องส่ง — กันยิง API ถี่โดยไม่จำเป็น */
const MIN_MINUTES = 1;

interface Options {
  /** ตอนนี้กำลังเล่นวิดีโออยู่ไหม */
  playing: boolean;
  /** ได้ XP หรือเหรียญใหม่ — เอาไปแสดงให้นักเรียนเห็น */
  onReward?: (r: { xp_total: number; level: number; new_badges: string[] }) => void;
}

export function useStudyTracker({ playing, onReward }: Options) {
  /** เวลาที่เริ่มนับรอบปัจจุบัน (null = ไม่ได้นับอยู่) */
  const startedAt = useRef<number | null>(null);
  /** วินาทีที่สะสมไว้แต่ยังไม่ได้ส่ง (รวมเศษจากรอบก่อน) */
  const pending = useRef(0);
  const onRewardRef = useRef(onReward);
  onRewardRef.current = onReward;

  /** ปิดรอบการนับปัจจุบัน แล้วโยนวินาทีที่ได้เข้ากอง pending */
  const collect = useCallback(() => {
    if (startedAt.current === null) return;
    pending.current += (Date.now() - startedAt.current) / 1000;
    startedAt.current = null;
  }, []);

  const startCounting = useCallback(() => {
    if (startedAt.current === null) startedAt.current = Date.now();
  }, []);

  /** ส่งนาทีเต็มที่สะสมได้ให้เซิร์ฟเวอร์ */
  const flush = useCallback(
    async (opts: { final?: boolean } = {}) => {
      collect();
      const minutes = Math.floor(pending.current / 60);
      if (minutes < MIN_MINUTES) {
        if (!opts.final) startCounting();     // ยังเล่นอยู่ก็นับต่อ
        return;
      }
      // หักเฉพาะส่วนที่ส่งไป เศษวินาทีเก็บไว้รอบหน้า
      pending.current -= minutes * 60;
      try {
        const r = await gamification.logStudy(minutes);
        onRewardRef.current?.(r);
      } catch {
        // ส่งไม่สำเร็จ (เน็ตหลุด) — คืนเวลากลับกอง ไม่ทำให้นักเรียนเสียเวลาเรียนฟรี
        pending.current += minutes * 60;
      }
      if (!opts.final) startCounting();
    },
    [collect, startCounting],
  );

  /* เริ่ม/หยุดนับตามสถานะการเล่น */
  useEffect(() => {
    if (playing) startCounting();
    else collect();
  }, [playing, startCounting, collect]);

  /* สลับแท็บ = หยุดนับ (ดูข้อ 3 ด้านบน) */
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') collect();
      else if (playing) startCounting();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [playing, collect, startCounting]);

  /* ส่งเป็นระยะ */
  useEffect(() => {
    const t = setInterval(() => void flush(), FLUSH_EVERY_MS);
    return () => clearInterval(t);
  }, [flush]);

  /* ออกจากหน้า — ส่งครั้งสุดท้าย */
  useEffect(() => {
    const onLeave = () => void flush({ final: true });
    window.addEventListener('pagehide', onLeave);
    return () => {
      window.removeEventListener('pagehide', onLeave);
      onLeave();
    };
  }, [flush]);

  return { flush };
}
