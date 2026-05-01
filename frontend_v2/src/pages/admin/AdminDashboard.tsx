import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { Users, DollarSign, Activity, ShoppingCart } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function AdminDashboard() {
  const { isAdmin } = useAuthStore();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const [usersRes, paymentsRes] = await Promise.all([
          api.get('/admin/metrics'),
          api.get('/admin/payment-stats')
        ]);
        
        setMetrics({
          userMetrics: usersRes.data,
          paymentMetrics: paymentsRes.data
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    if (isAdmin) {
      fetchMetrics();
    }
  }, [isAdmin]);

  if (!isAdmin) return <Navigate to="/" />;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const userMetrics = metrics?.userMetrics || {};

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Admin Overview</h1>
        <p className="text-gray-400">High-level metrics and platform health</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Users" value={userMetrics?.total_users || 0} icon={Users} color="text-blue-400" bgColor="bg-blue-500/10" borderColor="border-blue-500/30" />
        <MetricCard title="Active Users" value={userMetrics?.active_users || 0} icon={Activity} color="text-green-400" bgColor="bg-green-500/10" borderColor="border-green-500/30" />
        <MetricCard title="New Signups (Today)" value={userMetrics?.new_users_today || 0} icon={UserPlus} color="text-purple-400" bgColor="bg-purple-500/10" borderColor="border-purple-500/30" />
        <MetricCard title="Admins" value={userMetrics?.admins || 0} icon={Shield} color="text-rose-400" bgColor="bg-rose-500/10" borderColor="border-rose-500/30" />
      </div>

      {/* Chart visualization placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bgCard border border-gray-800 rounded-2xl p-6">
           <h3 className="text-lg font-bold text-white mb-4">Revenue over Time (7 Days)</h3>
           <div className="h-64 flex items-center justify-center border border-dashed border-gray-800 rounded-xl text-gray-500 bg-gray-900/50">
             Chart.js Component Here
           </div>
        </div>
        <div className="bg-bgCard border border-gray-800 rounded-2xl p-6">
           <h3 className="text-lg font-bold text-white mb-4">Recent Transactions</h3>
           <div className="h-64 flex items-center justify-center border border-dashed border-gray-800 rounded-xl text-gray-500 bg-gray-900/50">
             Transactions List Native UI Here
           </div>
        </div>
      </div>
    </div>
  );
}

function UserPlus(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  );
}

function Shield(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function MetricCard({ title, value, icon: Icon, color, bgColor, borderColor }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-bgCard border ${borderColor} p-6 rounded-2xl flex items-center gap-4`}
    >
      <div className={`w-14 h-14 ${bgColor} ${color} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
    </motion.div>
  );
}
