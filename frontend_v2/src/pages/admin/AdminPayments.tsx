import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Navigate } from 'react-router-dom';
import { Check, X, Eye, FileText } from 'lucide-react';

export default function AdminPayments() {
  const { isAdmin } = useAuthStore();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    async function fetchPayments() {
      try {
        const res = await api.get('/admin/payments');
        setPayments(res.data);
      } catch (err) {
        setPayments([
           { id: 101, user_id: 2, course_name: 'Advanced React', amount: 1500, status: 'pending', slip_url: '/mock-slip.jpg', date: '2026-04-19' }
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, [isAdmin]);

  if (!isAdmin) return <Navigate to="/" />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-bgCard p-6 rounded-2xl border border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Payment Verification</h1>
          <p className="text-sm text-gray-400">Review and approve student bank slips.</p>
        </div>
      </div>

      <div className="bg-bgCard border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/50 border-b border-gray-800">
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Transaction ID</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Course</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Amount</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Status</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading...</td></tr>
            ) : payments.map(p => (
              <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 text-gray-300 font-mono">#{p.id}</td>
                <td className="p-4 text-white font-medium">{p.course_name}</td>
                <td className="p-4 text-brand-400 font-semibold">฿{p.amount.toLocaleString()}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    p.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 
                    p.status === 'approved' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {p.status.toUpperCase()}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button className="p-2 text-blue-400 hover:text-white bg-blue-500/10 rounded-lg transition-colors" title="View Slip"><Eye size={16} /></button>
                  {p.status === 'pending' && (
                    <>
                      <button className="p-2 text-green-400 hover:text-white bg-green-500/10 rounded-lg transition-colors" title="Approve"><Check size={16} /></button>
                      <button className="p-2 text-red-400 hover:text-white bg-red-500/10 rounded-lg transition-colors" title="Reject"><X size={16} /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
