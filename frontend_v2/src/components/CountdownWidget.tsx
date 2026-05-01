import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Bell, ChevronRight, AlertCircle } from 'lucide-react';

const COUNTDOWNS = [
  { name: 'TGAT / TPAT', date: '2026-12-10', color: 'from-blue-500 to-cyan-400' },
  { name: 'A-Level', date: '2027-03-15', color: 'from-brand-500 to-purple-400' }
];

export default function CountdownWidget() {
  
  const calculateDaysLeft = (targetDate: string) => {
    const target = new Date(targetDate).getTime();
    const now = new Date().getTime();
    const diff = target - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="space-y-6">
      
      {/* Countdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {COUNTDOWNS.map((exam, i) => (
          <motion.div 
            key={exam.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + (i * 0.1) }}
            className={`bg-gradient-to-br ${exam.color} rounded-2xl p-0.5 shadow-lg relative overflow-hidden group`}
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="bg-bgCard/90 backdrop-blur-sm rounded-[14px] p-4 h-full flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1 mb-1">
                  <Calendar size={12} /> {exam.name}
                </span>
                <div className="text-xs text-gray-500">{new Date(exam.date).toLocaleDateString('en-GB')}</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-white leading-none mb-1">
                  {calculateDaysLeft(exam.date)}
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Days Left</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Actionable Announcements */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-bgCard/50 border border-white/10 rounded-3xl p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Bell className="text-brand-400" /> Notifications
          </h3>
        </div>
        
        <div className="space-y-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4 items-start group cursor-pointer hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
              <AlertCircle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Weekly Mock Exam Available</h4>
              <p className="text-xs text-gray-400 leading-relaxed">The new Mathematics mock exam is ready. Don't forget to test your skills before Sunday!</p>
            </div>
            <ChevronRight className="text-gray-600 group-hover:text-white shrink-0 my-auto transition-colors" size={20} />
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4 items-start group cursor-pointer hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
              <Bell size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">System Maintenance</h4>
              <p className="text-xs text-gray-400 leading-relaxed">Scheduled maintenance tonight from 02:00 AM to 03:00 AM.</p>
            </div>
            <ChevronRight className="text-gray-600 group-hover:text-white shrink-0 my-auto transition-colors" size={20} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
