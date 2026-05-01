import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { KeyRound, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, new_password: password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to reset password. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-bgDark flex items-center justify-center p-4 text-center">
        <div className="bg-bgCard p-8 rounded-2xl border border-red-500/30">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Invalid or Missing Token</h2>
          <p className="text-gray-400 mb-6">Please use a valid password reset link.</p>
          <button onClick={() => navigate('/login')} className="text-brand-400 font-medium">Return to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgDark flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-bgCard p-8 rounded-2xl shadow-xl shadow-brand-500/10 border border-gray-800"
      >
        <button 
          onClick={() => navigate('/login')}
          className="text-gray-400 hover:text-brand-400 mb-6 flex items-center text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to Login
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-600/20 text-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-500/30">
            <KeyRound size={32} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Create New Password</h2>
          <p className="text-gray-400">Your new password must be different from previous used passwords.</p>
        </div>

        {success ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
            <CheckCircle className="text-green-500 mx-auto mb-3" size={32} />
            <h3 className="text-white font-semibold mb-2">Password Reset Successful</h3>
            <p className="text-gray-400 text-sm">Redirecting you to the login page...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center text-red-500 text-sm">
                <AlertCircle size={20} className="mr-2 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
              <input
                type="password"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Must be at least 8 characters"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Must match the new password"
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 active:scale-[0.98] mt-2 disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
