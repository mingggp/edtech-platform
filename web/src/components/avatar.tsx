'use client';

/**
 * วงกลมรูปโปรไฟล์ — ใช้ที่เดียวกันทั้งเว็บ
 *
 * ลำดับที่แสดง:
 *   1. รูปที่ผู้ใช้อัปโหลด (avatar_url)
 *   2. ตัวอักษรย่อจากชื่อเล่น/ชื่อจริง/อีเมล
 *   3. พื้นสีไล่เปล่า ๆ (ยังไม่มีข้อมูลผู้ใช้ เช่นกำลังโหลดอยู่)
 *
 * เขียนไว้ที่เดียวเพราะจะมีวงกลมนี้อีกหลายที่ (แถบบน · ตารางอันดับ · เพื่อน
 * · โปรไฟล์สาธารณะ) ถ้าก๊อปวางไปทีละที่ เดี๋ยวจะมีที่ที่ลืมแสดงรูป
 */
import { useState } from 'react';

import { API_BASE } from '@/lib/api/client';

export interface AvatarPerson {
  avatar_url?: string | null;
  nickname?: string | null;
  full_name?: string | null;
  email?: string | null;
}

/** ตัวอักษรย่อ — ภาษาไทย 2 ตัวแรกกำลังดี */
export function initialsOf(p?: AvatarPerson | null): string {
  const src = (p?.nickname || p?.full_name || p?.email || '').trim();
  return src ? Array.from(src).slice(0, 2).join('') : '';
}

/**
 * รูปเก็บไว้ที่ backend (/static/uploads/...) ซึ่งคนละ origin กับหน้าเว็บ
 * ต้องเติม API_BASE ให้ ไม่งั้นเบราว์เซอร์จะไปหาที่ localhost:3000 แล้วไม่เจอ
 */
export function avatarSrc(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

interface Props {
  person?: AvatarPerson | null;
  /** ขนาดด้าน (px) */
  size?: number;
  className?: string;
}

export function Avatar({ person, size = 34, className }: Props) {
  /* รูปโหลดไม่ขึ้น (ไฟล์ถูกลบ / เซิร์ฟเวอร์ล่ม) -> ถอยไปใช้ตัวอักษรย่อ
     ไม่ปล่อยให้เห็นไอคอนรูปแตกซึ่งดูเหมือนเว็บพัง */
  const [broken, setBroken] = useState(false);
  const src = broken ? null : avatarSrc(person?.avatar_url);
  const text = initialsOf(person);

  return (
    <span
      className={`av${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      aria-hidden="true"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- รูปมาจาก backend คนละ origin
        <img src={src} alt="" onError={() => setBroken(true)} />
      ) : (
        text
      )}
    </span>
  );
}
