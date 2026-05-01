import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function DashboardCourseCarousel() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = window.innerWidth >= 1024 ? 2 : 1; // 2 on desktop, 1 on mobile
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchMyCourses() {
      try {
        const res = await api.get('/users/me/courses');
        setCourses(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMyCourses();
  }, []);

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(prev + 1, courses.length - itemsPerPage));
  };

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500"></div></div>;
  }

  if (courses.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center flex flex-col items-center justify-center">
        <BookOpen size={48} className="text-gray-600 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Courses Yet</h3>
        <p className="text-gray-400 mb-6">Explore our catalog and start learning today!</p>
        <button onClick={() => navigate('/courses')} className="bg-brand-600 hover:bg-brand-500 px-6 py-2 rounded-full font-bold transition-colors">
          Browse Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex justify-between items-end mb-6 pl-2">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Your Courses</h3>
          <p className="text-gray-400 text-sm">Jump back in to your lessons</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handlePrev} 
            disabled={currentIndex === 0}
            className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={handleNext} 
            disabled={currentIndex >= courses.length - itemsPerPage}
            className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl pb-4 -mx-4 px-4">
        <motion.div 
          className="flex gap-4"
          initial={false}
          animate={{ x: `calc(-${currentIndex * (100 / itemsPerPage)}% - ${currentIndex * (16 / itemsPerPage)}px)` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {courses.map((course, idx) => (
            <div 
              key={course.id} 
              className={`shrink-0 ${itemsPerPage === 2 ? 'w-[calc(50%-8px)]' : 'w-full'}`}
            >
              <div 
                onClick={() => navigate(`/courses/${course.id}/learn`)}
                className="group relative h-64 rounded-3xl overflow-hidden cursor-pointer isolate border border-white/10 shadow-xl"
              >
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent z-10"></div>
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                
                {/* Content */}
                <div className="relative z-20 h-full p-6 flex flex-col justify-end">
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                     <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20">
                       <PlayCircle size={32} className="text-whtie ml-1" />
                     </div>
                  </div>

                  <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h4 className="text-xl font-bold text-white mb-3 line-clamp-2">{course.title}</h4>
                    
                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-gray-300">Progress</span>
                        <span className="text-brand-300">{course.progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full ${course.color} rounded-full`} style={{ width: `${course.progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
