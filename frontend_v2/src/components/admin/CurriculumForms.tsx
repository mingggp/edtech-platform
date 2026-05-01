import React, { useState, useRef } from 'react';
import { Video, Clock, FileText, Loader2, Save, AlertTriangle, ExternalLink, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ---- Types ----
export interface Lesson {
  id: number;
  title: string;
  youtube_id: string;
  duration: number;
  order: number;
  doc_url?: string;
}

export interface Chapter {
  id: number;
  title: string;
  order: number;
  lessons: Lesson[];
}

export type PanelMode =
  | null
  | 'add-chapter'
  | 'edit-chapter'
  | 'add-lesson'
  | 'edit-lesson'
  | 'confirm-delete';

export interface PanelTarget {
  chapter?: Chapter;
  lesson?: Lesson;
  chapterId?: number;
  type?: 'chapter' | 'lesson';
}

// ---- Panel Components ----

export function ChapterForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: { title: string; order: number };
  onSave: (data: { title: string; order: number }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(initial?.title || '');

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSave({ title, order: initial?.order ?? 1 }); }}
      className="space-y-5"
    >
      <div>
        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
          Chapter Title
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          autoFocus
          placeholder="e.g. Introduction to Calculus"
          className="w-full bg-gray-950 border border-gray-700 text-white rounded-xl px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition-all placeholder-gray-600"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 rounded-xl transition-all font-semibold text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-brand-500/20"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Chapter'}
        </button>
      </div>
    </form>
  );
}

export function LessonForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<Lesson>;
  onSave: (data: Omit<Lesson, 'id'>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [youtubeId, setYoutubeId] = useState(initial?.youtube_id || '');
  const [duration, setDuration] = useState(initial?.duration ?? 0);
  const [docUrl, setDocUrl] = useState(initial?.doc_url || '');
  const [previewId, setPreviewId] = useState(initial?.youtube_id || '');
  const debounceRef = useRef<any>(null);

  const handleYoutubeChange = (val: string) => {
    setYoutubeId(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPreviewId(val), 600);
  };

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        onSave({ title, youtube_id: youtubeId, duration, order: initial?.order ?? 99, doc_url: docUrl || undefined });
      }}
      className="space-y-5"
    >
      <div>
        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Lesson Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          autoFocus
          placeholder="e.g. Limits and Continuity"
          className="w-full bg-gray-950 border border-gray-700 text-white rounded-xl px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition-all placeholder-gray-600"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
          <Video size={12} className="text-red-400" /> YouTube Video ID
        </label>
        <input
          type="text"
          value={youtubeId}
          onChange={e => handleYoutubeChange(e.target.value)}
          required
          placeholder="e.g. dQw4w9WgXcQ"
          className="w-full bg-gray-950 border border-gray-700 text-white rounded-xl px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all placeholder-gray-600 font-mono text-sm"
        />
      </div>

      {/* YouTube Preview */}
      <AnimatePresence>
        {previewId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl border border-gray-700"
          >
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                key={previewId}
                src={`https://www.youtube.com/embed/${previewId}`}
                title="Preview"
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="bg-gray-900 px-3 py-1.5 flex items-center justify-between">
              <span className="text-xs text-gray-500">Preview</span>
              <a
                href={`https://youtu.be/${previewId}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-brand-400 flex items-center gap-1 hover:text-brand-300"
              >
                Open <ExternalLink size={10} />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
          <Clock size={12} /> Duration Override (seconds)
        </label>
        <input
          type="number"
          min={0}
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
          placeholder="0 = auto-detect from YouTube"
          className="w-full bg-gray-950 border border-gray-700 text-white rounded-xl px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition-all placeholder-gray-600"
        />
        <p className="text-xs text-gray-600 mt-1">ปล่อยเป็น 0 ระบบจะดึง duration จาก YouTube API อัตโนมัติ</p>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
          <FileText size={12} /> Document URL <span className="text-gray-600 normal-case font-normal">(optional)</span>
        </label>
        <input
          type="url"
          value={docUrl}
          onChange={e => setDocUrl(e.target.value)}
          placeholder="https://docs.google.com/..."
          className="w-full bg-gray-950 border border-gray-700 text-white rounded-xl px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition-all placeholder-gray-600 text-sm"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 rounded-xl transition-all font-semibold text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim() || !youtubeId.trim()}
          className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-brand-500/20"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Lesson'}
        </button>
      </div>
    </form>
  );
}

export function DeleteConfirm({
  target,
  onConfirm,
  onCancel,
  saving,
}: {
  target: PanelTarget;
  onConfirm: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const isLesson = target.type === 'lesson';
  const name = isLesson ? target.lesson?.title : target.chapter?.title;
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center gap-4 py-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <AlertTriangle size={32} className="text-red-400" />
        </div>
        <div>
          <p className="text-white font-bold text-lg mb-1">ยืนยันการลบ</p>
          <p className="text-gray-400 text-sm">
            {isLesson ? 'ลบบทเรียน' : 'ลบ Chapter'}{' '}
            <span className="text-white font-semibold">"{name}"</span>?
          </p>
          {!isLesson && (
            <p className="text-red-400 text-xs mt-2">⚠ บทเรียนทั้งหมดภายใน Chapter นี้จะถูกลบด้วย</p>
          )}
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 border border-gray-700 text-gray-400 hover:text-white rounded-xl transition-all font-semibold text-sm"
        >
          ยกเลิก
        </button>
        <button
          onClick={onConfirm}
          disabled={saving}
          className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          {saving ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
