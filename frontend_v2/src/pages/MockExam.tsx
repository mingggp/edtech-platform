import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MockExam() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Mock Questions
  const questions = [
    { id: 1, text: "Which React hook is used for side effects?", options: ["useState", "useEffect", "useContext", "useReducer"] },
    { id: 2, text: "What runs first in FastAPI?", options: ["Depends", "Middleware", "Router", "Uvicorn"] },
    { id: 3, text: "Which CSS framework is utility-first?", options: ["Bootstrap", "Material UI", "Tailwind CSS", "Bulma"] },
    { id: 4, text: "In SQL, what is the default join type?", options: ["LEFT", "RIGHT", "INNER", "OUTER"] },
    { id: 5, text: "What is the capital of Thailand?", options: ["Bangkok", "Chiang Mai", "Phuket", "Pattaya"] },
  ];

  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  const handleSelect = (option: string) => {
    setAnswers(prev => ({ ...prev, [currentQ]: option }));
  };

  const handleSubmit = () => {
    if (window.confirm("Are you sure you want to submit the exam?")) {
      setSubmitted(true);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  if (submitted) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col text-center">
        <CheckCircle size={64} className="text-brand-500 mb-6" />
        <h2 className="text-3xl font-bold text-white mb-2">Exam Submitted</h2>
        <p className="text-gray-400 max-w-md mb-8">Your answers have been securely submitted for grading. You will be able to review your score in the dashboard.</p>
        <button onClick={() => navigate('/')} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-medium border border-white/20">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-8 relative bg-black">
      {/* Top Bar */}
      <div className="h-16 bg-bgCard border-b border-gray-800 flex items-center justify-between px-8 shrink-0">
         <h1 className="text-lg font-bold text-white">Mock Exam: General Knowledge Test</h1>
         <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border font-mono font-bold ${timeLeft < 300 ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse' : 'bg-gray-900 border-gray-700 text-brand-400'}`}>
            <Clock size={16} /> {formatTime(timeLeft)}
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Exam Area */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 flex flex-col">
          <div className="max-w-3xl mx-auto w-full flex-1">
             <div className="mb-8">
               <span className="text-brand-500 font-bold uppercase tracking-widest text-sm">Question {currentQ + 1} of {questions.length}</span>
               <h2 className="text-2xl md:text-3xl font-medium text-white mt-4 leading-relaxed">
                 {questions[currentQ].text}
               </h2>
             </div>
             
             <div className="space-y-4">
               {questions[currentQ].options.map((option, idx) => {
                 const isSelected = answers[currentQ] === option;
                 return (
                   <motion.div
                     whileTap={{ scale: 0.99 }}
                     key={idx}
                     onClick={() => handleSelect(option)}
                     className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center ${
                       isSelected 
                       ? 'border-brand-500 bg-brand-500/10' 
                       : 'border-gray-800 bg-gray-900 hover:border-gray-600 hover:bg-gray-800'
                     }`}
                   >
                     <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center shrink-0 ${isSelected ? 'border-brand-500' : 'border-gray-600'}`}>
                       {isSelected && <div className="w-3 h-3 rounded-full bg-brand-500" />}
                     </div>
                     <span className={`text-lg ${isSelected ? 'text-white font-medium' : 'text-gray-300'}`}>{option}</span>
                   </motion.div>
                 );
               })}
             </div>
          </div>
          
          {/* Bottom Nav */}
          <div className="max-w-3xl mx-auto w-full pt-8 flex items-center justify-between mt-auto">
             <button 
               onClick={() => setCurrentQ(p => Math.max(0, p - 1))}
               disabled={currentQ === 0}
               className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white bg-gray-800 hover:bg-gray-700 disabled:opacity-30 transition-colors"
             >
               <ChevronLeft size={20} /> Previous
             </button>
             
             {currentQ === questions.length - 1 ? (
               <button 
                 onClick={handleSubmit} 
                 className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-500 transition-colors shadow-lg shadow-green-600/20"
               >
                 Submit Final Answers
               </button>
             ) : (
               <button 
                 onClick={() => setCurrentQ(p => Math.min(questions.length - 1, p + 1))}
                 className="flex items-center gap-2 px-8 py-3 rounded-xl font-medium text-white bg-brand-600 hover:bg-brand-500 transition-colors shadow-lg shadow-brand-500/20"
               >
                 Next Question <ChevronRight size={20} />
               </button>
             )}
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="w-64 bg-bgCard border-l border-gray-800 p-6 hidden md:block shrink-0 overflow-y-auto">
           <h3 className="text-white font-bold mb-6">Exam Overview</h3>
           <div className="grid grid-cols-4 gap-3">
             {questions.map((_, i) => (
               <button 
                 key={i}
                 onClick={() => setCurrentQ(i)}
                 className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium text-sm transition-colors border ${
                   currentQ === i 
                   ? 'bg-brand-600 text-white border-brand-500' 
                   : answers[i] 
                     ? 'bg-gray-800 text-gray-300 border-gray-600' 
                     : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-600'
                 }`}
               >
                 {i + 1}
               </button>
             ))}
           </div>
           
           <div className="mt-8 space-y-3">
             <div className="flex items-center text-xs text-gray-400 gap-2"><div className="w-3 h-3 bg-brand-600 rounded-sm"></div> Current</div>
             <div className="flex items-center text-xs text-gray-400 gap-2"><div className="w-3 h-3 bg-gray-800 border border-gray-600 rounded-sm"></div> Attempted</div>
             <div className="flex items-center text-xs text-gray-400 gap-2"><div className="w-3 h-3 bg-transparent border border-gray-800 rounded-sm"></div> Unanswered</div>
             <div className="flex items-center text-xs text-red-400 gap-2 mt-4"><AlertTriangle size={14}/> Auto-submit on 00:00:00</div>
           </div>
        </div>
      </div>
    </div>
  );
}
