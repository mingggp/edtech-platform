import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { Trophy, Medal, Crown, Users, Clock, Globe } from 'lucide-react';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'global' | 'friends' | 'daily'>('global');

  useEffect(() => {
    async function fetchData() {
      try {
        const [leaderRes, friendsRes] = await Promise.all([
          api.get('/leaderboard'),
          api.get('/users/me/friends')
        ]);
        setLeaders(leaderRes.data);
        setFriends(friendsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getFilteredLeaders = () => {
    let list = [...leaders];
    if (activeTab === 'friends') {
      const friendIds = friends.map(f => f.id);
      // Ensure the current user is also in the "Friends" leaderboard if they were in global
      list = list.filter(l => friendIds.includes(l.id)); 
    } else if (activeTab === 'daily') {
      // Mock daily variation (just shuffling or adjusting for demo UI purposes)
      list = list.sort((a, b) => b.id - a.id).slice(0, 10);
    }
    return list;
  };

  const displayedLeaders = getFilteredLeaders();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4 mb-8">
        <div className="w-20 h-20 bg-brand-600/20 text-brand-500 rounded-full flex items-center justify-center mx-auto border-2 border-brand-500/30 shadow-[0_0_30px_rgba(14,165,233,0.3)]">
          <Trophy size={40} />
        </div>
        <h1 className="text-4xl font-bold text-white">Leaderboard</h1>
        <p className="text-gray-400">Compete, climb the ranks, and stay motivated</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-bgCard/80 backdrop-blur-xl border border-gray-800 p-1.5 rounded-full inline-flex shadow-xl">
          <button 
            onClick={() => setActiveTab('global')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold transition-all ${activeTab === 'global' ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <Globe size={18} /> Global
          </button>
          <button 
            onClick={() => setActiveTab('friends')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold transition-all ${activeTab === 'friends' ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <Users size={18} /> Friends
          </button>
          <button 
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold transition-all ${activeTab === 'daily' ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <Clock size={18} /> Daily
          </button>
        </div>
      </div>

      <div className="bg-bgCard/60 backdrop-blur-3xl border border-gray-800/80 rounded-3xl overflow-hidden shadow-xl shadow-brand-900/10">
        <div className="grid grid-cols-12 gap-4 border-b border-gray-800 p-6 text-xs font-bold text-gray-500 uppercase tracking-widest bg-black/20">
          <div className="col-span-2 text-center">Rank</div>
          <div className="col-span-6">Student</div>
          <div className="col-span-4 text-right">Study Time</div>
        </div>
        
        <div className="divide-y divide-gray-800/50 relative min-h-[300px]">
          <AnimatePresence mode="popLayout">
            {displayedLeaders.map((user, i) => (
              <motion.div 
                key={user.id + activeTab} // force re-animate on tab switch
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                className={`grid grid-cols-12 gap-4 p-6 items-center hover:bg-white/[0.02] transition-colors ${i < 3 ? 'bg-gradient-to-r from-brand-900/5 to-transparent' : ''}`}
              >
                <div className="col-span-2 flex justify-center">
                  {i === 0 ? <Crown className="text-yellow-400 animate-pulse drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" size={32} /> : 
                   i === 1 ? <Medal className="text-slate-300 drop-shadow-md" size={28} /> : 
                   i === 2 ? <Medal className="text-amber-700 drop-shadow-md" size={28} /> : 
                   <span className="text-xl font-bold text-gray-600">#{i + 1}</span>}
                </div>
                <div className="col-span-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-700/50 shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                        {user.full_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-white font-bold text-base">{user.full_name}</div>
                    <div className="text-xs text-brand-400/80 font-medium">{user.completed_count} courses completed</div>
                  </div>
                </div>
                <div className="col-span-4 flex justify-end text-right">
                  <div className="bg-brand-500/10 border border-brand-500/20 text-brand-400 font-mono font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-inner">
                    <span className="text-xl">{user.total_minutes}</span>
                    <span className="text-[10px] text-brand-400/70 tracking-widest mt-1">MINS</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {displayedLeaders.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center p-8 text-center text-gray-500 font-medium">
              {activeTab === 'friends' ? "Add some friends to compete together!" : "No learners on the board yet! Start studying to claim the #1 spot."}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
