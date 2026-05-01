import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import {
  Plus, Trash2, ArrowLeft, Video, Clock, Edit2,
  BookOpen, ChevronRight, X, ExternalLink, FileText, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChapterForm,
  LessonForm,
  DeleteConfirm
} from '../../components/admin/CurriculumForms';
import type {
  Lesson,
  Chapter,
  PanelMode,
  PanelTarget
} from '../../components/admin/CurriculumForms';

// ---- Duration helpers ----
const fmtDuration = (secs: number) => {
  if (!secs) return '0:00';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const totalChapterDuration = (ch: Chapter) =>
  ch.lessons.reduce((sum, l) => sum + (l.duration || 0), 0);

// ---- Panel Title Map ----
const PANEL_TITLES: Record<string, string> = {
  'add-chapter': 'Add New Chapter',
  'edit-chapter': 'Edit Chapter',
  'add-lesson': 'Add Video Lesson',
  'edit-lesson': 'Edit Lesson',
  'confirm-delete': 'Confirm Deletion',
};

// ---- Main Page ----
export default function AdminCourseEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [panelTarget, setPanelTarget] = useState<PanelTarget>({});
  const [saving, setSaving] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());

  const fetchData = async () => {
    try {
      const [cr, ch] = await Promise.all([
        api.get(`/courses/${id}`),
        api.get(`/courses/${id}/chapters`),
      ]);
      setCourse(cr.data);
      const chData: Chapter[] = ch.data;
      setChapters(chData);
      // Expand all chapters by default
      setExpandedChapters(new Set(chData.map((c: Chapter) => c.id)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const openPanel = (mode: PanelMode, target: PanelTarget = {}) => {
    setPanelMode(mode);
    setPanelTarget(target);
  };

  const closePanel = () => { setPanelMode(null); setPanelTarget({}); };

  const toggleChapter = (chId: number) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      next.has(chId) ? next.delete(chId) : next.add(chId);
      return next;
    });
  };

  // ---- Save Handlers ----
  const handleSaveChapter = async (data: { title: string; order: number }) => {
    setSaving(true);
    try {
      if (panelMode === 'edit-chapter' && panelTarget.chapter) {
        await api.patch(`/admin/chapters/${panelTarget.chapter.id}`, { title: data.title });
      } else {
        await api.post(`/admin/courses/${id}/chapters`, { title: data.title, order: chapters.length + 1 });
      }
      await fetchData();
      closePanel();
    } catch {
      // inline error state handled by saving flag reset
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLesson = async (data: Omit<Lesson, 'id'>) => {
    setSaving(true);
    try {
      if (panelMode === 'edit-lesson' && panelTarget.lesson) {
        await api.patch(`/admin/lessons/${panelTarget.lesson.id}`, data);
      } else {
        await api.post(`/admin/chapters/${panelTarget.chapterId}/lessons`, data);
      }
      await fetchData();
      closePanel();
    } catch {
      // inline error handling
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      if (panelTarget.type === 'lesson' && panelTarget.lesson) {
        await api.delete(`/admin/lessons/${panelTarget.lesson.id}`);
      } else if (panelTarget.type === 'chapter' && panelTarget.chapter) {
        await api.delete(`/admin/chapters/${panelTarget.chapter.id}`);
      }
      await fetchData();
      closePanel();
    } catch {
      // inline
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={40} className="animate-spin text-brand-500" />
    </div>
  );
  if (!course) return (
    <div className="text-center py-20 text-red-400">Course not found.</div>
  );

  const totalLessons = chapters.reduce((s, c) => s + c.lessons.length, 0);
  const totalSeconds = chapters.reduce((s, c) => s + totalChapterDuration(c), 0);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/courses')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to Courses
        </button>
        <div className="bg-bgCard border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-white">{course.title}</h1>
              <a 
                href={`/courses/${course.id}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1 bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 rounded-lg text-xs font-bold transition-colors"
              >
                View Course <ExternalLink size={12} />
              </a>
            </div>
            <p className="text-gray-400 text-sm max-w-xl line-clamp-2">{course.description}</p>
          </div>
          <div className="flex gap-4 text-center shrink-0">
            <div className="bg-gray-900 rounded-xl px-4 py-2">
              <div className="text-lg font-bold text-brand-400">{chapters.length}</div>
              <div className="text-xs text-gray-500">Chapters</div>
            </div>
            <div className="bg-gray-900 rounded-xl px-4 py-2">
              <div className="text-lg font-bold text-brand-400">{totalLessons}</div>
              <div className="text-xs text-gray-500">Lessons</div>
            </div>
            <div className="bg-gray-900 rounded-xl px-4 py-2">
              <div className="text-lg font-bold text-brand-400">{fmtDuration(totalSeconds)}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex gap-6 items-start">

        {/* ---- LEFT: Chapter List ---- */}
        <div className={`flex-1 min-w-0 space-y-4 transition-all duration-300 ${panelMode ? 'md:max-w-[56%]' : ''}`}>
          {/* Add Chapter Button */}
          <button
            onClick={() => openPanel('add-chapter')}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-700 hover:border-brand-500/60 text-gray-500 hover:text-brand-400 rounded-2xl transition-all font-semibold text-sm group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            Add New Chapter
          </button>

          {chapters.length === 0 ? (
            <div className="text-center py-20 bg-bgCard border border-gray-800 border-dashed rounded-3xl">
              <BookOpen size={40} className="mx-auto text-gray-700 mb-3" />
              <p className="text-gray-500 font-medium">No curriculum yet.</p>
              <p className="text-gray-600 text-sm mt-1">Click "Add New Chapter" to get started.</p>
            </div>
          ) : chapters.map((ch, i) => (
            <motion.div
              key={ch.id}
              layout
              className="bg-bgCard border border-gray-800 rounded-2xl overflow-hidden shadow-lg"
            >
              {/* Chapter Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer group hover:bg-white/[0.02] transition-colors"
                onClick={() => toggleChapter(ch.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-brand-600/10 text-brand-400 text-xs font-black flex items-center justify-center shrink-0 border border-brand-500/20">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white text-sm truncate">{ch.title}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span>{ch.lessons.length} lessons</span>
                      <span>·</span>
                      <Clock size={10} />
                      <span>{fmtDuration(totalChapterDuration(ch))}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={e => { e.stopPropagation(); openPanel('edit-chapter', { chapter: ch }); }}
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    title="Edit Chapter"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); openPanel('confirm-delete', { chapter: ch, type: 'chapter' }); }}
                    className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Delete Chapter"
                  >
                    <Trash2 size={13} />
                  </button>
                  <ChevronRight
                    size={16}
                    className={`text-gray-600 transition-transform ml-1 ${expandedChapters.has(ch.id) ? 'rotate-90' : ''}`}
                  />
                </div>
              </div>

              {/* Lessons */}
              <AnimatePresence initial={false}>
                {expandedChapters.has(ch.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-gray-800/80 divide-y divide-gray-800/40">
                      {ch.lessons.length === 0 ? (
                        <div className="p-4 text-center text-gray-600 text-xs italic">No lessons yet</div>
                      ) : ch.lessons.map((lesson, j) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between px-4 py-3 group hover:bg-white/[0.015] transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                              <Video size={13} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-white text-sm font-medium truncate">
                                <span className="text-gray-500 mr-1.5 font-mono text-xs">{j + 1}.</span>
                                {lesson.title}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                <Clock size={10} />
                                <span>{fmtDuration(lesson.duration)}</span>
                                {lesson.doc_url && (
                                  <>
                                    <span>·</span>
                                    <a href={lesson.doc_url} target="_blank" rel="noreferrer" className="text-brand-400 hover:underline flex items-center gap-0.5">
                                      <FileText size={9} /> Docs
                                    </a>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                            <a
                              href={`https://youtu.be/${lesson.youtube_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                              title="Preview on YouTube"
                            >
                              <ExternalLink size={13} />
                            </a>
                            <button
                              onClick={() => openPanel('edit-lesson', { lesson, chapterId: ch.id })}
                              className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                              title="Edit Lesson"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => openPanel('confirm-delete', { lesson, type: 'lesson' })}
                              className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Delete Lesson"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add Lesson Button */}
                      <button
                        onClick={() => openPanel('add-lesson', { chapterId: ch.id })}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-brand-400 hover:text-brand-300 hover:bg-brand-500/5 transition-colors"
                      >
                        <Plus size={13} /> Add Video Lesson
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* ---- RIGHT: Editor Panel ---- */}
        <AnimatePresence>
          {panelMode && (
            <motion.div
              initial={{ opacity: 0, x: 40, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 'auto' }}
              exit={{ opacity: 0, x: 40, width: 0 }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
              className="shrink-0 w-full md:w-[380px] sticky top-8"
            >
              <div className="bg-bgCard border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                {/* Panel Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-gray-900/60 border-b border-gray-800">
                  <h3 className="font-bold text-white text-sm">{PANEL_TITLES[panelMode]}</h3>
                  <button
                    onClick={closePanel}
                    className="text-gray-500 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Panel Body */}
                <div className="p-5">
                  {(panelMode === 'add-chapter' || panelMode === 'edit-chapter') && (
                    <ChapterForm
                      initial={panelMode === 'edit-chapter' ? panelTarget.chapter : undefined}
                      onSave={handleSaveChapter}
                      onCancel={closePanel}
                      saving={saving}
                    />
                  )}
                  {(panelMode === 'add-lesson' || panelMode === 'edit-lesson') && (
                    <LessonForm
                      initial={panelMode === 'edit-lesson' ? panelTarget.lesson : undefined}
                      onSave={handleSaveLesson}
                      onCancel={closePanel}
                      saving={saving}
                    />
                  )}
                  {panelMode === 'confirm-delete' && (
                    <DeleteConfirm
                      target={panelTarget}
                      onConfirm={handleDelete}
                      onCancel={closePanel}
                      saving={saving}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
