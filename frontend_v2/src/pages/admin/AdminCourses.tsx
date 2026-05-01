import React, { useEffect, useState, useRef } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Navigate, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Video, Eye, EyeOff, Upload, Link } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ["Mathematics", "Science", "English", "Physics", "Chemistry", "Biology", "Coding", "General"];

export default function AdminCourses() {
  const { isAdmin } = useAuthStore();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [thumbMode, setThumbMode] = useState<'url' | 'upload'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '', description: '', price: 0, category: 'General',
    thumbnail: '', target_audience: '', highlights: '', is_active: false
  });

  const handleThumbnailUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFormData(prev => ({ ...prev, thumbnail: `http://localhost:8000${res.data.url}` }));
    } catch (err) {
      alert('Upload failed!');
    } finally {
      setUploading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get('/admin/courses');
      setCourses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchCourses();
  }, [isAdmin]);

  if (!isAdmin) return <Navigate to="/" />;

  const handleOpenModal = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setFormData(course);
    } else {
      setEditingCourse(null);
      setFormData({
        title: '', description: '', price: 0, category: 'General',
        thumbnail: '', target_audience: '', highlights: '', is_active: false
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await api.patch(`/admin/courses/${editingCourse.id}`, formData);
      } else {
        await api.post('/admin/courses', formData);
      }
      setShowModal(false);
      fetchCourses();
    } catch (err) {
      alert("Failed to save course.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this course? Everything inside it will be lost!")) return;
    try {
      await api.delete(`/admin/courses/${id}`);
      fetchCourses();
    } catch (err) {
      alert("Failed to delete.");
    }
  };

  const toggleActive = async (course: any) => {
    try {
      await api.patch(`/admin/courses/${course.id}`, { is_active: !course.is_active });
      fetchCourses();
    } catch (err) {
      alert("Failed to toggle status");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-bgCard p-6 rounded-2xl border border-gray-800 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Course Management</h1>
          <p className="text-sm text-gray-400">Add or edit published courses and modules.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-brand-500/20"
        >
          <Plus size={18} /> New Course
        </button>
      </div>

      <div className="bg-bgCard border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/80 border-b border-gray-800">
              <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Course</th>
              <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Price</th>
              <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {loading ? (
              <tr><td colSpan={4} className="p-12 text-center text-gray-500 font-medium">Loading courses...</td></tr>
            ) : courses.length === 0 ? (
              <tr><td colSpan={4} className="p-12 text-center text-gray-500 font-medium">No courses found. Create one above!</td></tr>
            ) : courses.map(c => (
              <tr key={c.id} className="hover:bg-white/[0.03] transition-colors group">
                <td className="p-5 flex items-center gap-4">
                  <div className="w-16 h-12 rounded-lg bg-gray-800 overflow-hidden border border-gray-700 shrink-0">
                    {c.thumbnail ? <img src={c.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No Img</div>}
                  </div>
                  <div>
                    <div className="font-bold text-white text-base mb-1">{c.title}</div>
                    <div className="flex gap-2 items-center text-xs text-gray-400">
                      <span className="bg-gray-800 px-2 py-0.5 rounded text-gray-300 font-medium">{c.category}</span>
                      <span className="truncate max-w-[200px]">{c.description}</span>
                    </div>
                  </div>
                </td>
                <td className="p-5">
                  <button onClick={() => toggleActive(c)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${c.is_active ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                    {c.is_active ? <><Eye size={14} /> Active</> : <><EyeOff size={14} /> Hidden</>}
                  </button>
                </td>
                <td className="p-5 text-brand-400 font-bold">฿{c.price.toLocaleString()}</td>
                <td className="p-5 text-right space-x-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => navigate(`/admin/courses/${c.id}`)} className="p-2.5 text-purple-400 hover:text-white bg-purple-500/10 hover:bg-purple-500/40 rounded-xl transition-all" title="Manage Curriculum"><Video size={18} /></button>
                  <button onClick={() => handleOpenModal(c)} className="p-2.5 text-gray-300 hover:text-white bg-gray-800 rounded-xl hover:bg-gray-700 transition-all"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-2.5 text-red-400 hover:text-white bg-red-500/10 rounded-xl hover:bg-red-500/80 transition-all"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-bgCard border border-gray-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/30">
                <h2 className="text-xl font-bold text-white">{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">&times;</button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-5">
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
                  <div>
                    <div className="font-bold text-white">Publish Course</div>
                    <div className="text-xs text-gray-400">If active, students will be able to see and enroll in this course.</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                    <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:border-brand-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:border-brand-500 focus:outline-none">
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Price (THB)</label>
                  <input type="number" min="0" required value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:border-brand-500 focus:outline-none" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-400">Thumbnail</label>
                    <div className="flex gap-1 bg-gray-900 border border-gray-700 rounded-lg p-1">
                      <button type="button" onClick={() => setThumbMode('upload')} className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${thumbMode === 'upload' ? 'bg-brand-600 text-white' : 'text-gray-400'}`}><Upload size={12} /> Upload</button>
                      <button type="button" onClick={() => setThumbMode('url')} className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${thumbMode === 'url' ? 'bg-brand-600 text-white' : 'text-gray-400'}`}><Link size={12} /> URL</button>
                    </div>
                  </div>
                  {thumbMode === 'url' ? (
                    <input type="text" value={formData.thumbnail} onChange={e => setFormData({...formData, thumbnail: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:border-brand-500 focus:outline-none" placeholder="https://..." />
                  ) : (
                    <div
                      className={`relative group border-2 border-dashed rounded-xl transition-all cursor-pointer ${ formData.thumbnail ? 'border-brand-500/50 bg-brand-500/5' : 'border-gray-700 bg-gray-900 hover:border-brand-500/50'}`}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); }}
                      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if(f) handleThumbnailUpload(f); }}
                    >
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if(f) handleThumbnailUpload(f); }} />
                      {formData.thumbnail ? (
                        <div className="relative p-2">
                          <img src={formData.thumbnail} alt="preview" className="w-full h-28 object-cover rounded-lg" />
                          <div className="absolute inset-2 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-bold">Click to change</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          {uploading ? (
                            <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto" />
                          ) : (
                            <><Upload size={24} className="mx-auto text-gray-500 mb-2" /><p className="text-sm text-gray-500">Drop image here or <span className="text-brand-400">click to browse</span></p></>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                  <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:border-brand-500 focus:outline-none min-h-[100px]" />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-gray-400 hover:text-white transition-colors font-medium">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-500/20">{editingCourse ? 'Save Changes' : 'Create Course'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
