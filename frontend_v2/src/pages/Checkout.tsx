import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, UploadCloud, CreditCard, ShieldCheck } from 'lucide-react';
import api from '../lib/api';

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('course_id', id || '');
      formData.append('slip_file', file);
      
      await api.post('/payments/upload-slip', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      setTimeout(() => navigate('/courses'), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to upload slip. Make sure backend supports this endpoint or file size is small.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col text-center">
        <ShieldCheck size={64} className="text-green-500 mb-6" />
        <h2 className="text-3xl font-bold text-white mb-2">Payment Submitted</h2>
        <p className="text-gray-400 max-w-md">Your payment slip has been uploaded successfully. Please wait for an admin to verify your transaction. You will be redirected shortly.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-brand-400 flex items-center text-sm font-medium transition-colors">
        <ArrowLeft size={16} className="mr-2" /> Back
      </button>

      <div className="bg-bgCard border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        {/* QR Section */}
        <div className="bg-gray-900 border-b md:border-b-0 md:border-r border-gray-800 p-8 flex flex-col items-center justify-center w-full md:w-2/5">
          <CreditCard size={48} className="text-brand-500 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">PromptPay / Bank Transfer</h3>
          <p className="text-gray-400 text-sm text-center mb-6">Scan QR code or transfer to<br/><span className="text-white font-mono mt-1 block">012-3-45678-9</span></p>
          <div className="bg-white p-4 rounded-xl">
             <div className="w-40 h-40 bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-500">
               QR Mock
             </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="p-8 w-full md:w-3/5 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-white mb-2">Upload Bank Slip</h2>
          <p className="text-gray-400 mb-8 text-sm">After transferring the exact amount, please upload the transaction slip for verification.</p>
          
          <div className="border-2 border-dashed border-gray-700 rounded-2xl p-8 text-center hover:border-brand-500 hover:bg-brand-500/5 transition-colors cursor-pointer group relative">
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              accept="image/*"
              onChange={handleFileChange}
            />
            <UploadCloud size={48} className="mx-auto text-gray-600 group-hover:text-brand-400 transition-colors mb-4" />
            
            {file ? (
              <div>
                <p className="text-brand-400 font-medium">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div>
                <p className="text-white font-medium">Click to browse or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full mt-6 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-brand-500/30 disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? 'Submitting...' : 'Submit Payment Validation'}
          </button>
        </div>
      </div>
    </div>
  );
}
