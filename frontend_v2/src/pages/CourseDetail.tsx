import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { ArrowLeft, Clock, MonitorPlay, Award, CheckCircle } from 'lucide-react';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await api.get(`/courses/${id}`);
        setCourse(res.data);
      } catch (err) {
        console.error(err);
        // Fallback UI mock
        setCourse({
          id, title: "Mock Course Details", description: "Comprehensive React from start to finish.", category: "Programming", price: 1500, thumbnail: null
        });
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [id]);

  if (loading) return <div className="flex h-full items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <button onClick={() => navigate('/courses')} className="text-gray-400 hover:text-brand-400 flex items-center text-sm font-medium transition-colors">
        <ArrowLeft size={16} className="mr-2" /> Back to Courses
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-bgCard border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="h-64 bg-gray-900 w-full relative flex items-center justify-center overflow-hidden">
          {course?.thumbnail ? (
            <img src={course.thumbnail} alt="course" className="w-full h-full object-cover opacity-60" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-brand-900 to-purple-900 opacity-50"></div>
          )}
          <h1 className="relative z-10 text-4xl md:text-5xl font-bold text-white text-center px-4 mix-blend-screen">{course?.title}</h1>
        </div>

        <div className="p-8 md:p-12 flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div>
              <span className="text-brand-400 text-xs font-bold uppercase tracking-wider bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">{course?.category}</span>
              <h2 className="text-2xl font-bold text-white mt-4 mb-2">About this course</h2>
              <p className="text-gray-400 leading-relaxed">{course?.description}</p>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-gray-800">
              <h3 className="text-lg font-semibold text-white">What you will learn</h3>
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-start text-gray-400">
                  <CheckCircle size={20} className="text-green-500 mr-3 shrink-0 mt-0.5" />
                  <span>Master the core concepts of this framework with real-world projects and interactive coding exercises.</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="w-full md:w-80 shrink-0">
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md sticky top-8">
              <div className="text-3xl font-bold text-white mb-6">฿{(course?.price || 0).toLocaleString()}</div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-sm text-gray-300"><MonitorPlay size={18} className="text-gray-500 mr-3" /> 15 hours on-demand video</li>
                <li className="flex items-center text-sm text-gray-300"><Clock size={18} className="text-gray-500 mr-3" /> Full lifetime access</li>
                <li className="flex items-center text-sm text-gray-300"><Award size={18} className="text-gray-500 mr-3" /> Certificate of completion</li>
              </ul>
              
              <button 
                onClick={async () => {
                  setLoading(true);
                  try {
                    await api.post(`/users/me/courses?course_id=${course?.id}`);
                    navigate(`/courses/${course?.id}/learn`);
                  } catch (err: any) {
                    if (err.response?.status === 400 && err.response?.data?.detail === "Already enrolled") {
                        navigate(`/courses/${course?.id}/learn`);
                    } else {
                        alert("Failed to enroll! " + (err.response?.data?.detail || ""));
                        setLoading(false);
                    }
                  }
                }}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-brand-500/30 text-lg"
              >
                Enroll Now (Free)
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
