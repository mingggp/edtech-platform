import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { Plus, Coffee, Monitor, X, Send, UserMinus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FriendsStory() {
  const { user } = useAuthStore();
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [addingStatus, setAddingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const addFormRef = useRef<HTMLDivElement>(null);

  const fetchFriends = async () => {
    try {
      const res = await api.get('/users/me/friends');
      setFriends(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addFormRef.current && !addFormRef.current.contains(e.target as Node)) {
        if (addingStatus !== 'loading' && addingStatus !== 'success') {
          setShowAddForm(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [addingStatus]);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    
    setAddingStatus('loading');
    try {
      const formData = new FormData();
      formData.append('email', newEmail);
      await api.post('/users/me/friends', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAddingStatus('success');
      setNewEmail('');
      fetchFriends(); // refresh list instantly
      setTimeout(() => {
        setShowAddForm(false);
        setAddingStatus('idle');
      }, 1500);
    } catch (err) {
      console.error(err);
      setAddingStatus('error');
      setTimeout(() => setAddingStatus('idle'), 3000);
    }
  };

  const handleRemoveFriend = async (e: React.MouseEvent, friendId: number) => {
    e.stopPropagation();
    if (!window.confirm("Remove this friend?")) return;
    try {
      await api.delete(`/users/me/friends/${friendId}`);
      fetchFriends();
    } catch (err) {
      console.error(err);
      alert('Failed to remove friend');
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'online': return 'border-green-500';
      case 'afk': return 'border-yellow-500';
      case 'offline': default: return 'border-gray-700';
    }
  };

  if (loading) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide py-2 items-center min-h-[110px]">
      
      {/* Animated Add Friend Wrapper */}
      <motion.div 
        ref={addFormRef}
        layout
        initial={{ width: 64 }}
        animate={{ width: showAddForm ? 240 : 64 }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        className="shrink-0 flex items-center justify-center relative h-16 bg-gray-900 border-2 border-dashed border-gray-600 rounded-full group hover:border-brand-500 transition-colors cursor-pointer overflow-hidden"
        onClick={() => !showAddForm && setShowAddForm(true)}
      >
        <AnimatePresence mode="popLayout">
          {!showAddForm ? (
            <motion.div
              key="plus"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center w-full h-full text-gray-400 group-hover:text-brand-500"
            >
              <Plus size={24} />
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleAddFriend}
              className="w-full flex items-center px-1"
            >
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); setShowAddForm(false); }} 
                className="w-10 h-10 shrink-0 text-gray-400 hover:text-red-400 transition-colors flex items-center justify-center rounded-full hover:bg-white/5"
              >
                <X size={18} />
              </button>
              <input 
                type="email" 
                placeholder="Friend's email..." 
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                disabled={addingStatus === 'loading' || addingStatus === 'success'}
                className="bg-transparent border-none focus:outline-none text-sm text-white w-full px-1"
                autoFocus
              />
              <button 
                type="submit" 
                disabled={!newEmail || addingStatus === 'loading' || addingStatus === 'success'}
                className="w-10 h-10 shrink-0 bg-brand-600 hover:bg-brand-500 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 ml-1"
              >
                {addingStatus === 'loading' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Send size={14} />}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Status Overlays directly inside the container */}
        <AnimatePresence>
          {addingStatus === 'error' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-red-400 whitespace-nowrap bg-bgCard px-3 py-1 rounded-lg border border-red-500/20 z-10 w-auto">
              User not found
            </motion.div>
          )}
          {addingStatus === 'success' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-green-400 whitespace-nowrap bg-bgCard px-3 py-1 rounded-lg border border-green-500/20 z-10 w-auto">
              Sent!
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Friends Row */}
      {friends.map(friend => (
        <div key={friend.id} className="flex flex-col items-center gap-2 shrink-0 w-16 group" title={`${friend.full_name || friend.email} - ${friend.activity || friend.status}`}>
          <div className="relative cursor-pointer transition-transform group-hover:scale-105">
            <div className={`w-16 h-16 rounded-full border-2 p-0.5 ${getBorderColor(friend.status)} relative`}>
              <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center overflow-hidden shadow-inner">
                <span className="text-xl font-bold bg-gradient-to-br from-gray-200 to-gray-500 bg-clip-text text-transparent uppercase">
                  {friend.full_name?.charAt(0) || friend.email.charAt(0)}
                </span>
              </div>
              
              {/* Delete Overlay */}
              <div 
                onClick={(e) => handleRemoveFriend(e, friend.id)}
                className="absolute inset-0 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
              >
                <UserMinus size={20} className="text-white" />
              </div>
            </div>
            
            {friend.status === 'afk' && (
              <div className="absolute -bottom-1 right-0 w-6 h-6 bg-gray-900 border-2 border-bgDark rounded-full flex items-center justify-center text-yellow-500 shadow-md pointer-events-none">
                <Coffee size={10} />
              </div>
            )}
            {friend.activity && friend.status === 'online' && (
              <div className="absolute -bottom-1 right-0 w-6 h-6 bg-gray-900 border-2 border-bgDark rounded-full flex items-center justify-center text-green-500 shadow-md pointer-events-none">
                <Monitor size={10} />
              </div>
            )}
            {friend.status === 'online' && !friend.activity && (
              <div className="absolute bottom-0 right-1 w-3.5 h-3.5 bg-green-500 border-2 border-bgDark rounded-full shadow-md pointer-events-none"></div>
            )}
          </div>
          <span className="text-xs text-gray-300 truncate w-full text-center group-hover:text-brand-300 transition-colors">
            {friend.full_name?.split(' ')[0] || friend.email.split('@')[0]}
          </span>
        </div>
      ))}
    </div>
  );
}
