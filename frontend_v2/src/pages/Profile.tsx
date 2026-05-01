import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { User, Settings, Shield } from 'lucide-react';

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get('/users/me');
        setProfile(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
        <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium">
          <Settings size={18} />
          Edit Profile
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bgCard border border-gray-800 rounded-3xl p-8"
      >
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-32 h-32 bg-gray-800 rounded-2xl overflow-hidden border-2 border-border shrink-0 flex items-center justify-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={64} className="text-gray-500" />
            )}
          </div>
          <div className="flex-1 space-y-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-semibold">Full Name</label>
                <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl text-white">
                  {profile?.full_name || 'N/A'}
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-semibold">Email</label>
                <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl text-gray-400">
                  {profile?.email}
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-semibold">Nickname</label>
                <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl text-white">
                  {profile?.nickname || '-'}
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-semibold">Grade Level</label>
                <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl text-white">
                  {profile?.grade_level || '-'}
                </div>
              </div>
            </div>

            {profile?.role === 'admin' && (
              <div className="mt-8 p-4 bg-brand-900/20 border border-brand-500/30 rounded-xl flex items-center gap-4">
                <Shield className="text-brand-400" size={24} />
                <div>
                  <h3 className="font-semibold text-brand-300">Administrator Account</h3>
                  <p className="text-brand-400/70 text-sm">You have full access to management features.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
