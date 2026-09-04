import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Tag, Bell, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { api } from '../services/api';

const CATEGORIES = [
  { id: 'work', label: 'Công việc', color: '#3B82F6' },
  { id: 'meeting', label: 'Cuộc họp', color: '#8B5CF6' },
  { id: 'personal', label: 'Cá nhân', color: '#10B981' },
  { id: 'study', label: 'Học tập', color: '#F59E0B' },
  { id: 'important', label: 'Quan trọng', color: '#EF4444' }
];

export default function EventModal({ isOpen, onClose, event, onSave, onDelete, defaultDate }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'work',
    color: '#3B82F6',
    start_time: '',
    end_time: '',
    reminder_minutes: 15
  });

  const [naturalText, setNaturalText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        category: event.category || 'work',
        color: event.color || '#3B82F6',
        start_time: event.start_time ? event.start_time.substring(0, 16) : '',
        end_time: event.end_time ? event.end_time.substring(0, 16) : '',
        reminder_minutes: event.reminder_minutes !== undefined ? event.reminder_minutes : 15
      });
    } else {
      const baseDate = defaultDate ? new Date(defaultDate) : new Date();
      // Set to nearest next hour
      baseDate.setMinutes(0, 0, 0);
      baseDate.setHours(baseDate.getHours() + 1);

      const endDate = new Date(baseDate.getTime() + 60 * 60 * 1000);

      const toLocalISO = (d) => {
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };

      setFormData({
        title: '',
        description: '',
        category: 'work',
        color: '#3B82F6',
        start_time: toLocalISO(baseDate),
        end_time: toLocalISO(endDate),
        reminder_minutes: 15
      });
    }
    setNaturalText('');
    setError('');
  }, [event, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleParseNatural = async (e) => {
    e.preventDefault();
    if (!naturalText.trim()) return;
    setIsParsing(true);
    setError('');
    try {
      const result = await api.parseNaturalEvent(naturalText);
      setFormData(prev => ({
        ...prev,
        title: result.title || prev.title,
        description: result.description || prev.description,
        category: result.category || prev.category,
        color: result.color || prev.color,
        start_time: result.start_time ? result.start_time.substring(0, 16) : prev.start_time,
        end_time: result.end_time ? result.end_time.substring(0, 16) : prev.end_time,
        reminder_minutes: result.reminder_minutes !== undefined ? result.reminder_minutes : prev.reminder_minutes
      }));
    } catch (err) {
      setError('Không thể phân tích văn bản: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Vui lòng nhập tiêu đề sự kiện.');
      return;
    }
    if (!formData.start_time || !formData.end_time) {
      setError('Vui lòng chọn thời gian bắt đầu và kết thúc.');
      return;
    }
    if (new Date(formData.end_time) <= new Date(formData.start_time)) {
      setError('Thời gian kết thúc phải sau thời gian bắt đầu.');
      return;
    }

    onSave({
      ...(event ? { id: event.id } : {}),
      ...formData
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {event ? 'Chỉnh Sửa Sự Kiện' : 'Thêm Sự Kiện Mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Quick Fill Prompt */}
        <div className="p-5 pb-0">
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-brand-50/80 via-purple-50/60 to-indigo-50/80 dark:from-brand-950/40 dark:via-purple-950/30 dark:to-indigo-950/40 border border-brand-200/60 dark:border-brand-800/60">
            <label className="flex items-center text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-brand-500" />
              Điền nhanh thông minh bằng AI
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={naturalText}
                onChange={(e) => setNaturalText(e.target.value)}
                placeholder="VD: Chiều mai 15h họp với team tại phòng 3 khoảng 1 tiếng..."
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-brand-200 dark:border-brand-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={handleParseNatural}
                disabled={isParsing || !naturalText.trim()}
                className="flex items-center px-3 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition disabled:opacity-50"
              >
                {isParsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Phân Tích'}
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-lg bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Tiêu đề sự kiện *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="VD: Họp định kỳ dự án, Đi khám sức khỏe..."
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Category & Color */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Phân loại
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const cat = CATEGORIES.find(c => c.id === e.target.value);
                  setFormData({
                    ...formData,
                    category: e.target.value,
                    color: cat ? cat.color : formData.color
                  });
                }}
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Nhắc nhở Discord
              </label>
              <select
                value={formData.reminder_minutes}
                onChange={(e) => setFormData({ ...formData, reminder_minutes: parseInt(e.target.value) })}
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value={15}>Trước 15 phút</option>
                <option value={30}>Trước 30 phút</option>
                <option value={60}>Trước 1 tiếng</option>
                <option value={0}>Không nhắc nhở</option>
              </select>
            </div>
          </div>

          {/* Time Picker: Start & End */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Thời gian bắt đầu *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Thời gian kết thúc *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Ghi chú & Địa điểm
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ghi chú thêm thông tin, liên kết Zoom/Meet hoặc địa chỉ..."
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            {event && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(event.id)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa sự kiện</span>
              </button>
            ) : <div />}

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/25 transition"
              >
                {event ? 'Lưu Thay Đổi' : 'Tạo Sự Kiện'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
