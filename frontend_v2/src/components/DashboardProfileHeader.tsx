import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCircle, Pen, Check, X, Camera, Medal } from 'lucide-react';
import api from '../lib/api';

export default function DashboardProfileHeader({ profile, onProfileUpdate }: { profile: any, onProfileUpdate: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nickname: profile?.nickname || '',
    dek_code: profile?.dek_code || ''
  });
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/users/me', editForm);
      onProfileUpdate();
      setIsEditing(false);
    } catch (err) {
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check size limit (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
       alert("File too large. Maximum size is 5MB.");
       return;
    }

    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post('/users/me/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onProfileUpdate();
    } catch (err) {
      alert("Failed to upload image. Make sure it is jpg, png, or webp.");
    }
  };

  // Mock mini badges (Would come from profile.showcase_badges in reality)
  const miniBadges = ['🔥', '📚', '🎯'];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-brand-900/40 to-bgCard border border-brand-500/20 shadow-2xl shadow-brand-500/10"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
        
        {/* Avatar Section */}
        <div className="relative group shrink-0">
          <div className="w-28 h-28 bg-gray-800 rounded-full flex items-center justify-center border-4 border-brand-500/50 shadow-xl overflow-hidden transition-transform group-hover:scale-105">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <UserCircle size={56} className="text-gray-400" />
            )}
            
            {/* Hover overlay for upload */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="text-white mb-1" size={20} />
              <span className="text-[10px] text-white font-bold uppercase tracking-wider">Change</span>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/png, image/jpeg, image/webp" 
              onChange={handleAvatarUpload}
            />
          </div>
        </div>

        {/* Info Section */}
        <div className="flex-1 text-center md:text-left flex flex-col justify-center">
          
          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.div 
                key="display"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <h1 className="text-3xl font-bold text-white flex items-center justify-center md:justify-start gap-3 flex-wrap">
                  Hello, <span className="bg-gradient-to-r from-brand-400 to-brand-300 bg-clip-text text-transparent">{profile?.full_name || 'Student'}</span>!
                  
                  {/* Badges inline */}
                  <div className="flex gap-1 bg-black/30 px-2 py-1 rounded-full border border-white/5 ml-2">
                     {miniBadges.map((badge, i) => (
                        <span key={i} className="text-sm" title="Achievement unlocked">{badge}</span>
                     ))}
                     <button className="text-[10px] text-brand-400 font-bold ml-1 hover:text-brand-300 transition-colors uppercase flex items-center">
                       <Medal size={12} className="mr-0.5" /> All
                     </button>
                  </div>
                </h1>
                
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <span className="text-gray-300 text-lg font-medium">{profile?.nickname ? `"${profile.nickname}"` : '(No Nickname)'}</span>
                  {profile?.dek_code && (
                    <span className="px-3 py-1 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 text-sm font-bold shadow-inner">
                      {profile.dek_code}
                    </span>
                  )}
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 rounded-full text-gray-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                    title="Edit Profile"
                  >
                    <Pen size={14} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="edit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-black/20 p-4 rounded-xl border border-white/10 max-w-md w-full"
              >
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-brand-400 font-bold uppercase tracking-wider mb-1 block">Nickname (ชื่อเล่น)</label>
                    <input 
                      type="text" 
                      value={editForm.nickname}
                      onChange={e => setEditForm({...editForm, nickname: e.target.value})}
                      className="w-full bg-bgDark border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                      placeholder="e.g. Ming"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-brand-400 font-bold uppercase tracking-wider mb-1 block">Dek Code (ระดับชั้น)</label>
                    <input 
                      type="text" 
                      value={editForm.dek_code}
                      onChange={e => setEditForm({...editForm, dek_code: e.target.value})}
                      className="w-full bg-bgDark border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                      placeholder="e.g. #dek70"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">For example, #dek70 for M.6, #dek71 for M.5</p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Check size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      disabled={saving}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </motion.div>
  );
}
