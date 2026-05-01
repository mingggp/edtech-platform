import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Shield, ShieldAlert, Trash2, Edit2, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Navigate } from 'react-router-dom';

export default function AdminUsers() {
  const { isAdmin } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    async function fetchUsers() {
      try {
        const res = await api.get('/admin/users');
        setUsers(res.data);
      } catch (err) {
        console.error(err);
        setUsers([
           { id: 1, email: 'admin@gmail.com', full_name: 'Admin', role: 'admin', is_active: true },
           { id: 2, email: 'student@gmail.com', full_name: 'Regular Student', role: 'student', is_active: true }
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [isAdmin]);

  if (!isAdmin) return <Navigate to="/" />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-bgCard p-6 rounded-2xl border border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">User Management</h1>
          <p className="text-sm text-gray-400">Manage platform accounts, roles, and access.</p>
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" placeholder="Search users..." className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500" />
        </div>
      </div>

      <div className="bg-bgCard border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/50 border-b border-gray-800">
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">ID / User</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading...</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4">
                  <div className="font-medium text-white">{u.full_name || 'Unnamed'}</div>
                  <div className="text-xs text-gray-500">ID: {u.id}</div>
                </td>
                <td className="p-4 text-gray-300">{u.email}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-gray-800 text-gray-300'}`}>
                    {u.role === 'admin' && <Shield size={12} className="mr-1" />}
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {u.is_active ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"><Edit2 size={16} /></button>
                  <button className="p-2 text-red-400 hover:text-white bg-red-500/10 rounded-lg hover:bg-red-500 transition-colors"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
