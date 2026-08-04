'use client';

/**
 * คอมเมนต์ใต้บทเรียน — ถามได้ ตอบได้ ลบของตัวเองได้
 *
 * ย้ายจาก 'Learn.html' ส่วน COMMENTS (ตัดอิโมจิ/GIF ออกก่อน จะทำทีหลัง)
 *
 * เรื่องที่ตั้งใจให้เป็นแบบนี้:
 *   - ปุ่มลบขึ้นตามที่ backend บอกมา (can_delete) ไม่ใช่หน้าเว็บเทียบ user_id เอง
 *     กติกาจะได้อยู่ที่เดียว และปลอมจากฝั่งเบราว์เซอร์ไม่ได้
 *   - ตอบกลับได้ชั้นเดียว ใต้คลิปเรียนต้องกวาดตาเจอคำตอบของพี่หมิงเร็ว ๆ
 *   - คำตอบของแอดมิน (พี่หมิง) มีป้ายกำกับ นักเรียนจะได้รู้ว่าอันไหนคำตอบจริง
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';

import { Avatar } from '@/components/avatar';
import { comments as commentsApi } from '@/lib/api/endpoints';
import type { Comment } from '@/lib/api/types';

/** ต้องตรงกับ COMMENT_MAX_LEN ใน backend/app/schemas.py */
const MAX_LEN = 1000;

/** "2 นาทีที่แล้ว" — ไม่ต้องพึ่งไลบรารีเพิ่มเพื่อของเท่านี้ */
function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const sec = Math.max(0, (Date.now() - then) / 1000);
  if (sec < 60) return 'เมื่อสักครู่';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชั่วโมงที่แล้ว`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} วันที่แล้ว`;
  return new Date(then).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

function displayName(c: Comment): string {
  return c.user.nickname || c.user.full_name || 'นักเรียน';
}

interface Props { lessonId: number | null }

export function Comments({ lessonId }: Props) {
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const listQ = useQuery({
    queryKey: ['comments', lessonId],
    queryFn: () => commentsApi.list(lessonId!),
    enabled: !!lessonId,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['comments', lessonId] });

  const createMut = useMutation({
    mutationFn: () => commentsApi.create(lessonId!, text.trim(), replyTo?.id),
    onSuccess: () => {
      setText('');
      setReplyTo(null);
      setError(null);
      void refresh();
    },
    onError: (e: Error) => setError(e.message || 'ส่งคอมเมนต์ไม่สำเร็จ'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => commentsApi.remove(id),
    onSuccess: () => void refresh(),
    onError: (e: Error) => setError(e.message || 'ลบไม่สำเร็จ'),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || createMut.isPending || !lessonId) return;
    createMut.mutate();
  }

  const roots = listQ.data ?? [];
  const total = roots.reduce((n, c) => n + 1 + c.replies.length, 0);

  if (!lessonId) return null;

  return (
    <section className="cmt-wrap">
      <div className="comments-head">
        <h3>ความคิดเห็น <b>{total}</b></h3>
      </div>

      {/* ---------- ช่องพิมพ์ ---------- */}
      <form className="composer" onSubmit={onSubmit}>
        {replyTo ? (
          <div className="replying">
            กำลังตอบ <b>{displayName(replyTo)}</b>
            <button type="button" onClick={() => setReplyTo(null)} aria-label="ยกเลิกการตอบกลับ">
              ยกเลิก
            </button>
          </div>
        ) : null}

        <textarea
          value={text}
          maxLength={MAX_LEN}
          rows={2}
          placeholder={replyTo ? `ตอบ ${displayName(replyTo)}…` : 'ถามคำถาม หรือแชร์สิ่งที่เข้าใจได้เลย'}
          onChange={(e) => { setText(e.target.value); setError(null); }}
          onKeyDown={(e) => {
            // Ctrl/⌘ + Enter = ส่ง — Enter เฉย ๆ ยังขึ้นบรรทัดใหม่ได้
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') onSubmit(e);
          }}
        />

        <div className="composer-bar">
          <span className="counter">
            {text.length}/{MAX_LEN}
          </span>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={!text.trim() || createMut.isPending}
          >
            {createMut.isPending ? 'กำลังส่ง…' : replyTo ? 'ตอบกลับ' : 'ส่ง'}
          </button>
        </div>

        {error ? <p className="cmt-error" role="alert">{error}</p> : null}
      </form>

      {/* ---------- รายการ ---------- */}
      {listQ.isPending ? (
        <p className="cmt-empty">กำลังโหลด…</p>
      ) : roots.length === 0 ? (
        <p className="cmt-empty">ยังไม่มีใครคอมเมนต์ — เป็นคนแรกเลยสิ</p>
      ) : (
        <div className="cmt-list">
          {roots.map((c) => (
            <CommentItem
              key={c.id}
              c={c}
              onReply={setReplyTo}
              onDelete={(id) => deleteMut.mutate(id)}
              deleting={deleteMut.isPending}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CommentItem({
  c, onReply, onDelete, deleting, isReply = false,
}: {
  c: Comment;
  onReply: (c: Comment) => void;
  onDelete: (id: number) => void;
  deleting: boolean;
  isReply?: boolean;
}) {
  const isTeacher = c.user.role === 'admin';
  return (
    <article className={`cmt${isReply ? ' is-reply' : ''}`}>
      <Avatar person={c.user} size={isReply ? 30 : 36} />
      <div className="cmt-body">
        <div className="cmt-head">
          <b>{displayName(c)}</b>
          {isTeacher ? <span className="cmt-badge">ผู้สอน</span> : null}
          <time dateTime={c.created_at}>{timeAgo(c.created_at)}</time>
        </div>

        {/* ข้อความของผู้ใช้ — React หนีอักขระพิเศษให้อยู่แล้ว
            white-space: pre-wrap ใน CSS ทำให้ขึ้นบรรทัดใหม่ตามที่พิมพ์ */}
        <p className="cmt-text">{c.text}</p>

        <div className="cmt-actions">
          {!isReply ? (
            <button type="button" onClick={() => onReply(c)}>ตอบกลับ</button>
          ) : null}
          {c.can_delete ? (
            <button
              type="button"
              className="danger"
              disabled={deleting}
              onClick={() => {
                // ลบคอมเมนต์หลักจะพาคำตอบใต้มันหายไปด้วย ต้องเตือนก่อน
                const msg = c.replies.length
                  ? `ลบคอมเมนต์นี้พร้อมคำตอบอีก ${c.replies.length} อัน?`
                  : 'ลบคอมเมนต์นี้?';
                if (window.confirm(msg)) onDelete(c.id);
              }}
            >
              ลบ
            </button>
          ) : null}
        </div>

        {c.replies.length ? (
          <div className="cmt-replies">
            {c.replies.map((r) => (
              <CommentItem
                key={r.id}
                c={r}
                onReply={onReply}
                onDelete={onDelete}
                deleting={deleting}
                isReply
              />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
