'use client';

/**
 * ครอบ YouTube IFrame Player ให้เรียกใช้แบบ React ได้
 *
 * ทำไมต้องเขียนเอง แทนที่จะฝัง <iframe> เฉย ๆ:
 * เราต้องรู้ว่า "ตอนนี้เล่นอยู่ไหม" และ "ถึงวินาทีที่เท่าไหร่" เพื่อบันทึก
 * ตำแหน่งที่ดูค้าง และนับเวลาเรียนเข้าสตรีค/XP ซึ่ง iframe ธรรมดาบอกไม่ได้เลย
 *
 * กับดักที่กันไว้แล้ว (เจอบ่อยเวลาต่อ YouTube กับ React):
 *
 * 1. สคริปต์ของ YouTube ต้องโหลดครั้งเดียวต่อทั้งหน้า
 *    ถ้าใส่ <script> ซ้ำทุกครั้งที่ component เกิด จะได้ player ซ้อนกัน
 *
 * 2. YouTube เรียก global `onYouTubeIframeAPIReady` แค่ครั้งเดียวเท่านั้น
 *    ถ้าเข้าหน้านี้รอบสอง callback จะไม่ถูกเรียกอีก -> จอดำค้าง
 *    แก้ด้วยการเก็บ promise ไว้ ใครมาทีหลังก็ได้ของเดิม
 *
 * 3. React 18 โหมด dev เรียก effect สองรอบ (StrictMode)
 *    ถ้าไม่ destroy ให้ถูก จะมี player 2 ตัวเล่นเสียงซ้อนกัน
 *
 * 4. เปลี่ยนบทเรียน = สั่ง loadVideoById ไม่ใช่สร้าง player ใหม่
 *    สร้างใหม่ทุกครั้งจะกระพริบและกินหน่วยความจำ
 */
import { useCallback, useEffect, useRef, useState } from 'react';

/* ---------------------------------------------- ชนิดของ YouTube API (เท่าที่ใช้) */

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getVideoLoadedFraction(): number;
  getPlayerState(): number;
  setVolume(v: number): void;
  getVolume(): number;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  setPlaybackRate(r: number): void;
  loadVideoById(id: string, start?: number): void;
  cueVideoById(id: string, start?: number): void;
  /** บอกขนาดใหม่ให้ตัวเล่นจัดผังภายในใหม่ — ต้องเรียกเอง ไม่ทำให้อัตโนมัติ */
  setSize(width: number, height: number): void;
  destroy(): void;
}

interface YTNamespace {
  Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer;
  PlayerState: { ENDED: 0; PLAYING: 1; PAUSED: 2; BUFFERING: 3; CUED: 5 };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** สถานะที่หน้าเว็บสนใจ */
export type PlayState = 'idle' | 'playing' | 'paused' | 'ended';

/**
 * ช่วงความเร็วที่ YouTube รองรับจริง
 *
 * เอกสารทางการระบุว่า getAvailablePlaybackRates() คืน
 *   [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
 * ส่งค่าเกิน 2 ไป setPlaybackRate จะไม่มีผล (ปัดลงให้เงียบ ๆ)
 * ถ้าปล่อยให้สไลเดอร์เลื่อนถึง 3 ได้ ตัวเลขบนจอจะโกหกผู้ใช้
 */
export const MIN_RATE = 0.5;
export const MAX_RATE = 2;

/**
 * แปลงรหัส error ของ YouTube เป็นข้อความที่บอกได้ว่าต้องไปแก้ตรงไหน
 *
 * สำคัญมากเพราะสาเหตุแต่ละอย่างแก้คนละทาง:
 *   101/150 = เจ้าของคลิปปิดการฝังในเว็บอื่น -> ต้องไปแก้ที่ YouTube Studio
 *   100     = คลิปถูกลบหรือตั้งเป็นส่วนตัว
 *   2       = ไอดีผิด
 * ถ้าขึ้นข้อความรวม ๆ ว่า "เล่นไม่ได้" จะไล่หาสาเหตุไม่ถูก
 * (รหัสตามเอกสาร YouTube IFrame API — onError)
 */
function errorText(code: number | undefined): string {
  switch (code) {
    case 2:
      return 'ไอดีคลิปไม่ถูกต้อง — ตรวจลิงก์ YouTube ที่ใส่ไว้อีกที';
    case 5:
      return 'เบราว์เซอร์เล่นคลิปนี้ไม่ได้ — ลองเปลี่ยนเบราว์เซอร์ดู';
    case 100:
      return 'ไม่พบคลิปนี้ — อาจถูกลบไปแล้วหรือตั้งเป็นส่วนตัว';
    case 101:
    case 150:
      return 'เจ้าของคลิปปิดการฝังในเว็บอื่นไว้ — ต้องเข้า YouTube Studio แล้วเปิด "อนุญาตให้ฝัง"';
    default:
      return `เล่นคลิปนี้ไม่ได้${code ? ` (รหัส ${code})` : ''}`;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

/** โหลดสคริปต์ YouTube ครั้งเดียวต่อหนึ่งหน้าเว็บ */
function loadApi(): Promise<YTNamespace> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    if (typeof window === 'undefined') return;
    if (window.YT?.Player) return resolve(window.YT);

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (window.YT) resolve(window.YT);
    };

    const existing = document.getElementById('youtube-iframe-api');
    if (!existing) {
      const s = document.createElement('script');
      s.id = 'youtube-iframe-api';
      s.src = 'https://www.youtube.com/iframe_api';
      s.async = true;
      s.onerror = () => {
        apiPromise = null;       // ให้ลองใหม่ได้ถ้าเน็ตหลุดตอนโหลด
        reject(new Error('โหลดตัวเล่นวิดีโอไม่สำเร็จ'));
      };
      document.head.appendChild(s);
    }
  });
  return apiPromise;
}

export interface UseYouTube {
  /**
   * ใส่ ref นี้ให้ <div> ที่จะกลายเป็นตัวเล่นวิดีโอ
   *
   * เป็น "callback ref" ไม่ใช่ useRef ธรรมดา — จำเป็นจริง ๆ ดูเหตุผลใน
   * คอมเมนต์ของ effect ที่สร้าง player (บั๊กจอดำที่หาอยู่นาน)
   */
  containerRef: (node: HTMLDivElement | null) => void;
  ready: boolean;
  error: string | null;
  state: PlayState;
  /** วินาทีปัจจุบัน — อัปเดตประมาณ 4 ครั้ง/วินาที ตอนกำลังเล่น */
  currentTime: number;
  duration: number;
  /** สัดส่วนที่โหลดไว้ล่วงหน้าแล้ว 0–1 */
  buffered: number;
  volume: number;
  muted: boolean;
  rate: number;
  play(): void;
  pause(): void;
  toggle(): void;
  seekTo(seconds: number): void;
  seekBy(delta: number): void;
  setVolume(v: number): void;
  toggleMute(): void;
  setRate(r: number): void;
  /** อ่านเวลาปัจจุบันตรง ๆ จากตัวเล่น — ใช้ตอนจะบันทึกก่อนปิดหน้า */
  readTime(): number;
}

interface Options {
  videoId: string | null;
  /** เริ่มเล่นที่วินาทีนี้ (ตำแหน่งที่ดูค้างไว้) */
  startAt?: number;
  onEnded?: () => void;
}

export function useYouTube({ videoId, startAt = 0, onEnded }: Options): UseYouTube {
  /**
   * ⚠️ ต้องเป็น callback ref + state ห้ามใช้ useRef ธรรมดา
   *
   * บั๊กที่ทำให้จอดำตลอด ไม่ว่าจะเปลี่ยนคลิปกี่รอบ:
   *
   * หน้าห้องเรียนมี early return หลายอัน (กำลังโหลด / ยังไม่ล็อกอิน /
   * ยังไม่ซื้อ / ไม่มีบทเรียน) กว่าจะ render <div> ของตัวเล่นจริง ๆ
   * แต่ hook ต้องถูกเรียกก่อน early return เสมอตามกฎของ React
   *
   * ผลคือรอบแรกที่ effect ทำงาน containerRef.current ยังเป็น null
   * (เพราะ React คืนหน้า "กำลังโหลด…" ไปแทน) effect เลย return ทิ้ง
   * แล้วเพราะ deps เป็น [] มันจะ **ไม่ทำงานอีกเลยตลอดชีวิตของหน้า**
   * -> ตัวเล่นไม่เคยถูกสร้าง -> จอดำ -> ปุ่มควบคุมตายหมด
   *
   * useRef ไม่ทำให้ component render ใหม่ตอน node โผล่ เลยไม่มีอะไรมาปลุก effect
   * callback ref + useState แก้ตรงจุดนี้: พอ <div> ถูก mount จริง
   * setState จะทำให้ effect ที่พึ่ง containerEl ทำงานทันที
   */
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setContainerEl(node);
  }, []);
  const playerRef = useRef<YTPlayer | null>(null);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<PlayState>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolumeState] = useState(100);
  const [muted, setMuted] = useState(false);
  const [rate, setRateState] = useState(1);

  /* onEnded เก็บใน ref เพื่อไม่ให้ effect สร้าง player ใหม่ทุกครั้งที่ parent วาดใหม่ */
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  /* วินาทีเริ่มต้นของ "บทเรียนนี้" — เก็บใน ref ไม่ให้ effect ผูกกับค่านี้
     ไม่งั้นพอโหลดตำแหน่งเสร็จ ค่าจะเปลี่ยน แล้ว player จะถูกสร้างใหม่ทั้งตัว */
  const startAtRef = useRef(startAt);
  startAtRef.current = startAt;

  /* ---------------- สร้าง player เมื่อ <div> โผล่จริง ---------------- */
  useEffect(() => {
    let cancelled = false;
    const el = containerEl;
    if (!el) return;

    /* สำคัญ: YouTube จะ "แทนที่" element ที่เราส่งให้ ด้วย <iframe> ของมัน
     *
     * ถ้าส่ง element ที่ React เป็นคนสร้าง (เช่น <div ref={...} />) React จะยัง
     * จำว่า node นั้นเป็นลูกของตัวเองอยู่ พอถึงตอน unmount React จะสั่ง
     * removeChild กับ node ที่ถูกแทนที่ไปแล้ว -> พังทั้งหน้าด้วย
     *     NotFoundError: Failed to execute 'removeChild' on 'Node'
     *
     * ทางแก้: สร้าง div ขึ้นมาเองด้วย JS แล้วให้ YouTube แทนที่ตัวนั้น
     * React ไม่เคยรู้จัก node นี้ จึงไม่ไปยุ่งด้วยตอนเก็บกวาด
     */
    const host = document.createElement('div');
    el.appendChild(host);

    loadApi()
      .then((YT) => {
        if (cancelled || !host.isConnected) return;

        const p = new YT.Player(host, {
          /* ⚠️ ต้องบอกขนาดตั้งแต่ตอนสร้าง
           *
           * ถ้าไม่ส่ง YouTube จะใส่ width="640" height="360" ให้เอง แล้ววาง
           * layout ภายในตามขนาดนั้น  ต่อให้เรายืด iframe ด้วย CSS ทีหลัง
           * ตัวเล่นข้างในก็ยังคิดว่าตัวเองกว้าง 640 อยู่ -> ภาพไปกองมุมบน
           * และคำบรรยายไปโผล่ผิดที่ (อาการที่หมิงเจอ)
           */
          width: '100%',
          height: '100%',
          /* ใช้โฮสต์มาตรฐานของ YouTube
             เคยตั้งเป็น youtube-nocookie.com เพื่อความเป็นส่วนตัวของนักเรียน
             แต่เอาออกก่อนเพราะเป็นจุดที่ทำให้ onReady ไม่ยิงในบางเครื่อง
             แล้วจะกลายเป็นจอดำที่หาสาเหตุยาก — ความถูกต้องมาก่อน
             (ถ้าย้ายไปโฮสต์คลิปเองในอนาคต เรื่องนี้จะหมดไปเอง) */
          playerVars: {
            controls: 0,          // เราวาดแถบควบคุมเอง
            modestbranding: 1,
            rel: 0,               // จบคลิปแล้วไม่เด้งคลิปคนอื่น
            playsinline: 1,       // iPhone เล่นในหน้าไม่เด้งเต็มจอ
            disablekb: 1,         // จัดการคีย์บอร์ดเอง กันชนกัน
            iv_load_policy: 3,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              if (cancelled) return;
              playerRef.current = p;
              setVolumeState(p.getVolume());
              setMuted(p.isMuted());
              setReady(true);
            },
            onStateChange: (e: { data: number }) => {
              if (cancelled) return;
              const S = YT.PlayerState;
              if (e.data === S.PLAYING) setState('playing');
              else if (e.data === S.PAUSED) setState('paused');
              else if (e.data === S.ENDED) {
                setState('ended');
                onEndedRef.current?.();
              }
              // BUFFERING/CUED ไม่เปลี่ยนสถานะ — ไม่งั้นแถบจะกระพริบตอนโหลด
              const d = p.getDuration();
              if (d > 0) setDuration(d);
            },
            onError: (e: { data: number }) => {
              if (!cancelled) setError(errorText(e?.data));
            },
          },
        });
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        /* บางครั้ง iframe หายไปก่อนแล้ว */
      }
      playerRef.current = null;
      // เก็บกวาดเองทั้งหมด — ทั้ง host เดิมและ iframe ที่ YouTube ใส่แทน
      el.replaceChildren();
      setReady(false);
    };
  }, [containerEl]);

  /* ---------------- บอกขนาดใหม่ให้ตัวเล่นทุกครั้งที่กรอบเปลี่ยน ----------------
   *
   * อาการที่เจอ: ภาพวิดีโอไปกองเล็ก ๆ อยู่ตรงกลางด้านบน ไม่เต็มกรอบ
   * และคำบรรยายไปโผล่ลอยอยู่ทางซ้ายคนละที่กับภาพ
   *
   * สาเหตุ: ตัวเล่นของ YouTube คำนวณผังภายในตอนโหลดครั้งเดียว
   * แล้ว **ไม่จัดใหม่เอง** เมื่อ iframe ถูกเปลี่ยนขนาดด้วย CSS ทีหลัง
   * (เช่นตอนกดเต็มจอ หรือพับสารบัญ) — การส่ง width/height ตอนสร้าง
   * จึงยังไม่พอ เพราะขนาดตอนนั้นกับตอนแสดงผลจริงคนละค่า
   *
   * ทางที่ถูกคือเรียก player.setSize() เองทุกครั้งที่กรอบเปลี่ยนขนาด
   * ใช้ ResizeObserver จับ ครอบคลุมทั้งเต็มจอ ย่อ/ขยายหน้าต่าง และพับสารบัญ
   */
  useEffect(() => {
    if (!ready || !containerEl) return;
    const apply = () => {
      const p = playerRef.current;
      if (!p) return;
      const r = containerEl.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      try {
        p.setSize(Math.round(r.width), Math.round(r.height));
      } catch {
        /* ตัวเล่นถูกทำลายไปแล้วระหว่างนี้ */
      }
    };
    apply();                                   // ครั้งแรกทันทีที่พร้อม
    const ro = new ResizeObserver(apply);
    ro.observe(containerEl);
    // เข้า/ออกเต็มจอบางเบราว์เซอร์ไม่ยิง resize ให้ ต้องฟังเพิ่ม
    document.addEventListener('fullscreenchange', apply);
    return () => {
      ro.disconnect();
      document.removeEventListener('fullscreenchange', apply);
    };
  }, [ready, containerEl]);

  /* ---------------- ตัวเล่นไม่พร้อมสักที = บอกให้รู้ ----------------
   * ถ้า YouTube โหลดไม่ขึ้น (เน็ตองค์กรบล็อก / ส่วนขยายบล็อกโฆษณา / เน็ตหลุด)
   * onReady จะไม่ยิงและ onError ก็ไม่ยิง — เหลือแค่จอดำเงียบ ๆ
   * ตั้งเวลาไว้ 10 วินาที ถ้ายังไม่พร้อมให้ขึ้นข้อความบอกสาเหตุที่เป็นไปได้ */
  useEffect(() => {
    if (ready || !videoId) return;
    const t = setTimeout(() => {
      if (!playerRef.current) {
        setError('โหลดตัวเล่นวิดีโอไม่สำเร็จ — ลองปิดส่วนขยายบล็อกโฆษณา หรือเช็คว่าเน็ตเข้า youtube.com ได้ไหม');
      }
    }, 6_000);   // 6 วิพอ — รอนานกว่านี้ผู้ใช้นั่งงงว่าเว็บค้างหรือเปล่า
    return () => clearTimeout(t);
  }, [ready, videoId]);

  /* ---------------- เปลี่ยนบทเรียน = เปลี่ยนวิดีโอในตัวเดิม ----------------
   *
   * ⚠️ effect นี้ห้ามทำงานพร่ำเพรื่อ — ทุกครั้งที่ทำงาน วิดีโอจะถูกโหลดใหม่
   * และหยุดเล่นทันที (อาการ "จู่ ๆ คลิปก็หยุดเอง" ที่หมิงเจอ)
   *
   * สาเหตุเดิม: หน้าเว็บส่ง videoId เป็น null ชั่วขณะทุกครั้งที่ต้องไปอ่าน
   * ตำแหน่งที่ดูค้างใหม่ ซึ่งเกิดขึ้นเมื่อ react-query โหลดสารบัญซ้ำ
   * (โดยปริยายมันโหลดใหม่ทุกครั้งที่สลับกลับมาที่แท็บ)
   * -> videoId เปลี่ยน null แล้วกลับมา -> cueVideoById -> คลิปหยุด
   *
   * กันด้วยการจำไอดีล่าสุดไว้ ถ้าค่าที่ส่งมาเหมือนเดิมก็ไม่ต้องทำอะไร
   */
  const cuedIdRef = useRef<string | null>(null);
  useEffect(() => {
    const p = playerRef.current;
    if (!ready || !p || !videoId) return;
    if (cuedIdRef.current === videoId) return;    // คลิปเดิม ไม่ต้องโหลดซ้ำ
    cuedIdRef.current = videoId;
    // cue ไม่ใช่ load — ไม่เล่นเองทันที ให้นักเรียนกดเล่นเอง
    // (เบราว์เซอร์ส่วนใหญ่บล็อกการเล่นอัตโนมัติที่มีเสียงอยู่แล้ว)
    p.cueVideoById(videoId, startAtRef.current);
    setState('idle');
    setCurrentTime(startAtRef.current);
    setBuffered(0);
  }, [ready, videoId]);

  /* ---------------- ส่งค่าที่ค้างไว้ให้ตัวเล่นเมื่อพร้อม ----------------
   * ผู้ใช้อาจกดปรับความเร็ว/เสียงตั้งแต่ตัวเล่นยังโหลดไม่เสร็จ
   * หรือปรับไว้ที่บทเรียนก่อนหน้าแล้วเปลี่ยนบท — ต้องยกค่ามาด้วย
   * ไม่ใช่รีเซ็ตเป็น 1× ทุกครั้งที่เปลี่ยนคลิป */
  useEffect(() => {
    const p = playerRef.current;
    if (!ready || !p) return;
    p.setPlaybackRate(rate);
    p.setVolume(volume);
    if (muted) p.mute();
    else p.unMute();
    // ตั้งใจไม่ใส่ rate/volume/muted ใน deps — effect นี้มีหน้าที่ "ยกค่าไปให้"
    // ตอนตัวเล่นพร้อมหรือเปลี่ยนคลิปเท่านั้น ส่วนตอนผู้ใช้กดปุ่ม
    // ฟังก์ชัน setRate/setVolume ส่งให้ตัวเล่นเองอยู่แล้ว
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, videoId]);

  /* ---------------- อัปเดตเวลา เฉพาะตอนกำลังเล่น ---------------- */
  useEffect(() => {
    if (!ready || state !== 'playing') return;
    const t = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      setCurrentTime(p.getCurrentTime());
      const d = p.getDuration();
      if (d > 0) setDuration(d);
      setBuffered(p.getVideoLoadedFraction());
    }, 250);
    return () => clearInterval(t);
  }, [ready, state]);

  /* ---------------- คำสั่งควบคุม ---------------- */
  const play = useCallback(() => playerRef.current?.playVideo(), []);
  const pause = useCallback(() => playerRef.current?.pauseVideo(), []);
  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (state === 'playing') p.pauseVideo();
    else p.playVideo();
  }, [state]);

  const seekTo = useCallback((seconds: number) => {
    const p = playerRef.current;
    if (!p) return;
    const d = p.getDuration() || 0;
    const target = Math.max(0, d ? Math.min(seconds, d) : seconds);
    p.seekTo(target, true);
    setCurrentTime(target);      // อัปเดตทันที ไม่ต้องรอรอบ interval ถัดไป
  }, []);

  const seekBy = useCallback((delta: number) => {
    const p = playerRef.current;
    if (!p) return;
    seekTo(p.getCurrentTime() + delta);
  }, [seekTo]);

  /* ⚠️ ตัวควบคุมพวกนี้ต้องขยับหน้าจอได้เสมอ แม้ตัวเล่นยังไม่พร้อม
   *
   * บั๊กที่เจอ: เดิมทุกฟังก์ชันเริ่มด้วย `if (!playerRef.current) return;`
   * พอบทเรียนไม่มีคลิป (หรือคลิปฝังไม่ได้) ตัวเล่นจะไม่มีวันพร้อม
   * -> กดปุ่มความเร็ว/ลากสไลเดอร์แล้วไม่มีอะไรขยับเลย ดูเหมือน UI พัง
   *
   * ตอนนี้เก็บค่าที่ผู้ใช้เลือกไว้ใน state เสมอ แล้วค่อยส่งให้ตัวเล่น
   * เมื่อพร้อม (ดู effect "ส่งค่าที่ค้างไว้ให้ตัวเล่น" ด้านล่าง)
   */
  const setVolume = useCallback((v: number) => {
    const vol = Math.round(Math.max(0, Math.min(100, v)));
    setVolumeState(vol);
    if (vol > 0) setMuted(false);
    const p = playerRef.current;
    if (!p) return;
    p.setVolume(vol);
    // ลากเสียงขึ้นจาก 0 ต้องเลิกปิดเสียงให้เอง ไม่งั้นลากแล้วยังเงียบอยู่
    if (vol > 0 && p.isMuted()) p.unMute();
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((wasMuted) => {
      const p = playerRef.current;
      if (wasMuted) {
        p?.unMute();
        // เคยปิดเสียงไว้ตอนระดับเป็น 0 — เปิดกลับมาต้องมีเสียงจริง
        setVolumeState((vol) => {
          if (vol > 0) return vol;
          p?.setVolume(50);
          return 50;
        });
      } else {
        p?.mute();
      }
      return !wasMuted;
    });
  }, []);

  /**
   * ปรับความเร็ว
   *
   * YouTube รองรับสูงสุด 2 เท่า (เอกสารทางการ: getAvailablePlaybackRates คืน
   * [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]) ส่งค่าเกินไปจะถูกปัดลงเงียบ ๆ
   * จึงจำกัดไว้ที่นี่เลย เพื่อให้ตัวเลขบนหน้าจอตรงกับความเร็วจริงเสมอ
   *
   * ปัดเป็นขั้นละ 0.05 เพราะ YouTube รับเฉพาะบางค่า ถ้าส่งค่าละเอียดกว่านั้น
   * มันจะเลือกค่าใกล้เคียงให้เอง แล้วเลขบนจอกับของจริงจะไม่ตรงกัน
   */
  const setRate = useCallback((r: number) => {
    const clamped = Math.max(MIN_RATE, Math.min(MAX_RATE, Math.round(r * 20) / 20));
    setRateState(clamped);                    // ขยับหน้าจอก่อนเสมอ
    playerRef.current?.setPlaybackRate(clamped);
  }, []);

  const readTime = useCallback(() => {
    try {
      return playerRef.current?.getCurrentTime() ?? 0;
    } catch {
      return 0;
    }
  }, []);

  return {
    containerRef, ready, error, state,
    currentTime, duration, buffered, volume, muted, rate,
    play, pause, toggle, seekTo, seekBy, setVolume, toggleMute, setRate, readTime,
  };
}

/** 3725 -> "1:02:05" */
export function fmtTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const s = Math.floor(sec % 60);
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor(sec / 3600);
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}
