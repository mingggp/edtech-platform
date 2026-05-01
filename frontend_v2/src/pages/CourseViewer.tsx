import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { PlayCircle, CheckCircle, ArrowLeft, FileText, Lock, ChevronRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CourseViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch course detail
        const cRes = await api.get(`/courses/${id}`);
        setCourse(cRes.data);
        
        // 2. Fetch curriculum
        const chRes = await api.get(`/courses/${id}/chapters`);
        setChapters(chRes.data);
        
        // 3. Fetch user progress for this course
        const pRes = await api.get(`/users/me/courses/${id}/progress`);
        setCompleted(new Set(pRes.data));
        
        // Auto-select first lesson if available and none selected
        if (chRes.data.length > 0 && chRes.data[0].lessons.length > 0) {
           // Find first uncompleted lesson
           let target = chRes.data[0].lessons[0];
           let found = false;
           for (const ch of chRes.data) {
             const unauth = ch.lessons.find((l: any) => !pRes.data.includes(l.id));
             if (unauth) {
                target = unauth;
                found = true;
                break;
             }
           }
           setActiveLesson(target);
        }
      } catch (err) {
        console.error(err);
        // If 403 or course not found, maybe not enrolled.
        // navigate(`/courses/${id}`);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleMarkComplete = async () => {
    if (!activeLesson || marking) return;
    setMarking(true);
    try {
      await api.post(`/users/me/progress/${activeLesson.id}?completed=true`);
      setCompleted(prev => {
        const next = new Set(prev);
        next.add(activeLesson.id);
        return next;
      });
      
      // Attempt to jump to next uncompleted lesson
      let foundNext = false;
      let startSearching = false;
      for (const ch of chapters) {
        for (const l of ch.lessons) {
          if (startSearching && !completed.has(l.id) && l.id !== activeLesson.id) {
             setActiveLesson(l);
             foundNext = true;
             break;
          }
          if (l.id === activeLesson.id) {
             startSearching = true;
          }
        }
        if (foundNext) break;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMarking(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-bgDark"><div className="animate-spin rounded-full h-12 w-12 border-brand-500 border-t-2"></div></div>;

  // Calculate global progress
  const totalLessons = chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
  const compCount = completed.size;
  const progressPct = totalLessons > 0 ? Math.round((compCount / totalLessons) * 100) : 0;

  return (
    <div className="flex h-[calc(100vh-64px)] -m-8 border-t border-gray-800 flex-col md:flex-row bg-bgDark overflow-hidden">
      {/* Video & Info Area */}
      <div className="w-full md:w-3/4 flex flex-col relative border-r border-gray-800 overflow-y-auto">
        
        {/* Video Player */}
        <div className="w-full aspect-video bg-black flex items-center justify-center shrink-0 relative shadow-2xl">
           {activeLesson?.youtube_id ? (
             <iframe 
               key={activeLesson.id}
               src={`https://www.youtube.com/embed/${activeLesson.youtube_id}?rel=0&showinfo=0&autoplay=1`}
               className="w-full h-full absolute inset-0"
               allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
               allowFullScreen
             />
           ) : (
             <div className="text-center text-gray-500">
                <PlayCircle className="w-20 h-20 text-brand-500/50 mx-auto mb-4" />
                <p>No video available for this lesson.</p>
             </div>
           )}
        </div>

        {/* Lesson Details */}
        <div className="p-8 flex-1 bg-bgDark">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
               <div>
                 <h1 className="text-3xl font-bold text-white mb-2">{activeLesson?.title || 'Select a lesson'}</h1>
                 {activeLesson && (
                   <p className="text-gray-400 flex items-center text-sm gap-2 mt-3">
                     <span className="bg-gray-800 px-3 py-1 rounded-md font-medium text-white">{activeLesson.duration || 0} mins</span>
                     {activeLesson.doc_url && (
                        <a href={activeLesson.doc_url} target="_blank" rel="noreferrer" className="text-brand-400 font-semibold hover:text-brand-300 flex items-center gap-1 ml-2 bg-blue-500/10 px-3 py-1 rounded-md transition-colors">
                          <FileText size={14} /> View Document
                        </a>
                     )}
                   </p>
                 )}
               </div>

               {activeLesson && (
                 <button
                   onClick={handleMarkComplete}
                   disabled={completed.has(activeLesson.id) || marking}
                   className={`shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
                     completed.has(activeLesson.id)
                       ? 'bg-green-500/10 text-green-400 border border-green-500/30 cursor-default shadow-green-500/10'
                       : 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-500/30 font-bold'
                   }`}
                 >
                   {completed.has(activeLesson.id) ? (
                     <>
                       <CheckCircle size={20} />
                       Lesson Completed
                     </>
                   ) : (
                     <>
                       {marking ? <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div> : <Check size={20} />}
                       Mark as Complete
                     </>
                   )}
                 </button>
               )}
            </div>

            <div className="mt-8 prose prose-invert max-w-none border-t border-gray-800 pt-8">
              <h3 className="text-xl text-white font-semibold mb-4">Instructor Notes</h3>
              <p className="text-gray-400 leading-relaxed">
                Welcome to this lesson! Make sure to watch the video carefully. 
                If there are any attached documents, you can find the link above.
                Once you are done, click the "Mark as Complete" button to track your progress and advance to the next topic automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Playlist Sidebar */}
      <div className="w-full md:w-1/4 bg-bgCard flex flex-col z-10 shadow-2xl">
        <div className="p-6 border-b border-gray-800 bg-bgDark">
          <Link to="/courses" className="text-brand-400 hover:text-brand-300 flex items-center text-sm mb-6 font-medium transition-colors w-max">
            <ArrowLeft size={16} className="mr-2" /> Back to Courses
          </Link>
          <h2 className="text-xl font-bold text-white leading-tight mb-6">{course?.title}</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-semibold text-gray-400">
              <span>Course Progress</span>
              <span className="text-brand-400 text-sm">{progressPct}%</span>
            </div>
            <div className="w-full bg-gray-900 h-2.5 rounded-full overflow-hidden border border-gray-800">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                className="bg-gradient-to-r from-brand-600 to-blue-500 h-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
              />
            </div>
            <p className="text-xs text-gray-500 text-center uppercase tracking-wide font-bold">{compCount} / {totalLessons} modules</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
           {chapters.map((ch, cIndex) => (
             <div key={ch.id} className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Section {cIndex + 1}: {ch.title}</h3>
                <div className="space-y-1.5">
                  {ch.lessons.map((lesson: any, lIndex: number) => {
                    const isCompleted = completed.has(lesson.id);
                    const isActive = activeLesson?.id === lesson.id;
                    return (
                      <div 
                        key={lesson.id} 
                        onClick={() => setActiveLesson(lesson)}
                        className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                          isActive 
                            ? 'bg-brand-600/10 border-brand-500/30 transform scale-[1.02]' 
                            : 'bg-transparent border-transparent hover:bg-gray-800/50 hover:border-gray-700/50'
                        }`}
                      >
                        <div className="flex gap-3 items-start">
                          <div className="shrink-0 mt-0.5">
                            {isActive ? (
                               <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center backdrop-blur-sm">
                                  <PlayCircle size={14} className="fill-brand-500 text-bgDark" />
                               </div>
                            ) : isCompleted ? (
                               <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center backdrop-blur-sm">
                                  <Check size={14} strokeWidth={3} />
                               </div>
                            ) : (
                               <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-500 text-xs font-bold">
                                  {lIndex + 1}
                               </div>
                            )}
                          </div>
                          <div>
                            <h4 className={`font-semibold text-sm leading-snug ${isActive ? 'text-brand-400' : 'text-gray-300'}`}>
                              {lesson.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-2 font-medium">
                              <span>{lesson.duration || 0} mins</span>
                              {lesson.doc_url && <span className="text-blue-400/80 bg-blue-500/10 px-1.5 py-0.5 rounded text-[10px] uppercase">Doc</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
             </div>
           ))}
           {chapters.length === 0 && (
             <div className="text-center text-gray-500 text-sm mt-10">No chapters found for this course.</div>
           )}
        </div>
      </div>
    </div>
  );
}
