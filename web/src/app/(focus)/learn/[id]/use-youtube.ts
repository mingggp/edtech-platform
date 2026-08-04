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
  /** ใส่ ref นี้ให้ <div> ที่จะกลายเป็นตัวเล่นวิดีโอ */
  containerRef: React.RefObject<HTMLDivElement | null>;
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
  const containerRef = useRef<HTMLDivElement>(null);
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

  /* ---------------- สร้าง player ครั้งเดียว ---------------- */
  useEffect(() => {
    let cancelled = false;
    const el = containerRef.current;
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
          host: 'https://www.youtube-nocookie.com',   // ไม่ให้ YouTube ตามนักเรียน
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
            onError: () => {
              if (!cancelled) setError('เล่นวิดีโอนี้ไม่ได้ — อาจถูกลบหรือตั้งเป็นส่วนตัว');
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
  }, []);

  /* ---------------- เปลี่ยนบทเรียน = เปลี่ยนวิดีโอในตัวเดิม ---------------- */
  useEffect(() => {
    const p = playerRef.current;
    if (!ready || !p || !videoId) return;
    // cue ไม่ใช่ load — ไม่เล่นเองทันที ให้นักเรียนกดเล่นเอง
    // (เบราว์เซอร์ส่วนใหญ่บล็อกการเล่นอัตโนมัติที่มีเสียงอยู่แล้ว)
    p.cueVideoById(videoId, startAtRef.current);
    setState('idle');
    setCurrentTime(startAtRef.current);
    setBuffered(0);
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

  const setVolume = useCallback((v: number) => {
    const p = playerRef.current;
    if (!p) return;
    const vol = Math.round(Math.max(0, Math.min(100, v)));
    p.setVolume(vol);
    setVolumeState(vol);
    // ลากเสียงขึ้นจาก 0 ต้องเลิกปิดเสียงให้เอง ไม่งั้นลากแล้วยังเงียบอยู่
    if (vol > 0 && p.isMuted()) {
      p.unMute();
      setMuted(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (p.isMuted()) {
      p.unMute();
      setMuted(false);
      // เคยปิดเสียงไว้ตอนระดับเป็น 0 — เปิดกลับมาต้องมีเสียงจริง
      if (p.getVolume() === 0) setVolume(50);
    } else {
      p.mute();
      setMuted(true);
    }
  }, [setVolume]);

  const setRate = useCallback((r: number) => {
    const p = playerRef.current;
    if (!p) return;
    p.setPlaybackRate(r);
    setRateState(r);
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
