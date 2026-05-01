import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Trophy, User, LogOut, Code, Shield, Medal } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Dashboard', hash: '' },
  { path: '/courses', icon: BookOpen, label: 'Courses', hash: '' },
  { path: '/mock-exam', icon: Code, label: 'Mock Exam', hash: '' },
  { path: '/#achievements', icon: Medal, label: 'Achievements', hash: 'achievements' },
  { path: '/#leaderboard', icon: Trophy, label: 'Leaderboard', hash: 'leaderboard' },
  { path: '/#profile', icon: User, label: 'Profile', hash: 'profile' }
];

const ADMIN_ITEMS = [
  { path: '/admin/dashboard', label: 'Overview' },
  { path: '/admin/users', label: 'Users' },
  { path: '/admin/payments', label: 'Payments' },
  { path: '/admin/courses', label: 'Courses' }
];

export default function AppLayout() {
  const navigate = useNavigate();
  const { user, setUser, isAdmin } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await api.get('/users/me');
        setUser(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [setUser]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  const handleNavClick = (e: React.MouseEvent, item: any) => {
    if (item.hash) {
      e.preventDefault();
      if (window.location.pathname !== '/') {
        navigate('/');
        setTimeout(() => document.getElementById(item.hash)?.scrollIntoView({ behavior: 'smooth' }), 100);
      } else {
        document.getElementById(item.hash)?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-bgDark items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-bgDark text-white overflow-hidden relative">
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-72 hidden md:flex flex-col bg-bgCard/50 backdrop-blur-xl border-r border-gray-800 p-6 z-20 shrink-0"
      >
        <div className="flex items-center gap-3 mb-10 pl-2">
          <div className="w-10 h-10 bg-brand-600/20 text-brand-500 rounded-xl flex items-center justify-center border border-brand-500/30 shrink-0">
            <Code size={20} />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-brand-400 to-blue-500 bg-clip-text text-transparent tracking-tight">
            mingsmileyface
          </span>
        </div>

        <nav className="flex-1 space-y-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={(e) => handleNavClick(e, item)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive && !item.hash
                    ? 'bg-brand-600/10 text-brand-400 border border-brand-500/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-gray-800">
              <span className="flex items-center text-xs uppercase font-semibold text-gray-500 pl-4 mb-2">
                <Shield size={14} className="mr-1" /> Management
              </span>
              {ADMIN_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 mt-1 rounded-xl transition-all text-sm ${
                      isActive 
                        ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20' 
                        : 'text-gray-400 hover:text-purple-300 hover:bg-white/5'
                    }`
                  }
                >
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all mt-auto"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-900/20 via-bgDark to-bgDark pointer-events-none" />
        <div className="relative z-10 p-8 flex-1">
            <Outlet />
        </div>

      </main>
    </div>
  );
}
