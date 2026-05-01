import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { Medal, Star, Shield, Trophy, CheckCircle, Lock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Achievements() {
  const { user } = useAuthStore();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // In a real application, you'd fetch from backend.
  // We'll mock the UI rendering for the badges first based on what backend returns.
  
  useEffect(() => {
    async function fetchAchievements() {
      try {
        const res = await api.get('/users/me/achievements');
        setAchievements(res.data || []);
      } catch (err) {
        console.error(err);
        // Fallback mock data if endpoint returns error
        setAchievements([
          { id: 'first_login', name: 'Early Bird', description: 'Log in for the first time', is_unlocked: true, icon: '🌟' },
          { id: 'course_1', name: 'Knowledge Seeker', description: 'Complete your first course', is_unlocked: true, icon: '📚' },
          { id: 'marathon', name: 'Study Marathon', description: 'Study 5 hours in one day', is_unlocked: false, icon: '🏃‍♂️' },
          { id: 'perfect_score', name: 'Perfectionist', description: 'Get 100% on a mock exam', is_unlocked: false, icon: '💯' },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchAchievements();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  const unlockedCount = achievements.filter(a => a.is_unlocked).length;
  const progressPercentage = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row gap-8 items-center bg-gradient-to-br from-brand-900/30 to-bgCard p-8 rounded-3xl border border-brand-500/20 relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-yellow-500/10 blur-3xl rounded-full"></div>
        <div className="w-32 h-32 bg-gray-900 rounded-full border-4 border-gray-800 flex items-center justify-center relative shadow-2xl shrink-0">
          <Trophy size={56} className="text-yellow-500" />
          <div className="absolute -bottom-4 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-bgCard">
            Level {Math.floor(unlockedCount / 3) + 1}
          </div>
        </div>
        <div className="flex-1 text-center md:text-left relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">Your Trophy Cabinet</h1>
          <p className="text-gray-400 max-w-lg mb-6">Complete courses, achieve high scores, and participate in the community to unlock exclusive badges.</p>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-brand-400">{unlockedCount} / {achievements.length} Unlocked</span>
              <span className="text-gray-400">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="bg-brand-500 h-2.5 rounded-full"
              ></motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grid of Badges */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {achievements.map((achievement, i) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`relative p-6 rounded-2xl border transition-all ${
              achievement.is_unlocked 
                ? 'bg-white/5 border-yellow-500/30 hover:border-yellow-500/60 shadow-[0_0_15px_rgba(234,179,8,0.1)]' 
                : 'bg-gray-900/50 border-gray-800 opacity-60 grayscale'
            }`}
          >
            {achievement.is_unlocked && (
               <CheckCircle size={16} className="absolute top-4 right-4 text-green-400" />
            )}
            
            <div className="text-5xl text-center mb-4 filter drop-shadow-md">
              {achievement.is_unlocked ? achievement.icon : <Lock size={48} className="mx-auto text-gray-700" />}
            </div>
            <h3 className={`text-center font-bold mb-1 ${achievement.is_unlocked ? 'text-white' : 'text-gray-500'}`}>
              {achievement.name}
            </h3>
            <p className="text-center text-xs text-gray-400 leading-relaxed">
              {achievement.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
