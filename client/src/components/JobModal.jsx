import React, { useState, useEffect } from 'react';
import { X, Zap, Clock, Sparkles, Trash2 } from 'lucide-react';

const PRESET_TYPES = [
  {
    id: 'gold',
    name: 'Báo Giá Vàng SJC & 9999 Hàng Ngày',
    cron: '30 7 * * *',
    prompt: 'Tổng hợp và tóm tắt biến động giá vàng SJC, Doji, PNJ và vàng nhẫn 9999 trong ngày. Đưa ra nhận định ngắn gọn.',
    description: 'Tự động cào dữ liệu giá vàng và gửi bảng giá kèm nhận định vào Discord'
  },
  {
    id: 'weather',
    name: 'Bản Tin Thời Tiết & Gợi Ý Ngày Mới',
    cron: '45 6 * * *',
    prompt: 'Dự báo thời tiết hôm nay (nhiệt độ, khả năng mưa, độ ẩm, UV) và đưa ra lời khuyên trang phục, lưu ý khi ra ngoài.',
    description: 'Báo cáo thời tiết địa phương và gợi ý trang phục trước khi đi làm'
  },
  {
    id: 'daily_briefing',
    name: 'Briefing Lịch Trình & Công Việc Đầu Ngày',
    cron: '0 7 * * *',
    prompt: 'Tổng hợp tất cả sự kiện, cuộc hẹn và công việc to-do cần hoàn thành trong hôm nay theo thứ tự thời gian và độ ưu tiên.',
    description: 'Tóm lược chương trình nghị sự và các deadline quan trọng trong ngày'
  },
  {
    id: 'news',
    name: 'Điểm Tin Công Nghệ & AI Buổi Sáng',
    cron: '0 8 * * *',
    prompt: 'Tóm tắt 3 tin tức công nghệ và trí tuệ nhân tạo (AI) đáng chú ý nhất trong 24h qua.',
    description: 'Gemini chọn lọc 3 tin tức công nghệ nóng nhất để bắt đầu ngày mới'
  },
  {
    id: 'custom',
    name: 'Tác Vụ AI Tự Động Tùy Chỉnh',
    cron: '0 9 * * *',
    prompt: '',
    description: 'Tự do thiết lập câu lệnh prompt và lịch hẹn theo ý muốn'
  }
];

export default function JobModal({ isOpen, onClose, job, onSave, onDelete }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'gold',
    cron_expr: '30 7 * * *',
    prompt: '',
    is_active: 1
  });

  const [scheduleMode, setScheduleMode] = useState('daily'); // 'daily' | 'cron'
  const [dailyTime, setDailyTime] = useState('07:30');
  const [error, setError] = useState('');

  useEffect(() => {
    if (job) {
      setFormData({
        name: job.name || '',
        type: job.type || 'custom',
        cron_expr: job.cron_expr || '30 7 * * *',
        prompt: job.prompt || '',
        is_active: job.is_active ? 1 : 0
      });

      // Check if cron matches daily format: "M H * * *"
      const parts = (job.cron_expr || '').split(' ');
      if (parts.length === 5 && parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
        setScheduleMode('daily');
        const h = String(parts[1]).padStart(2, '0');
        const m = String(parts[0]).padStart(2, '0');
        setDailyTime(`${h}:${m}`);
      } else {
        setScheduleMode('cron');
      }
    } else {
      const preset = PRESET_TYPES[0];
      setFormData({
        name: preset.name,
        type: preset.id,
        cron_expr: preset.cron,
        prompt: preset.prompt,
        is_active: 1
      });
      setScheduleMode('daily');
      setDailyTime('07:30');
    }
    setError('');
  }, [job, isOpen]);

  if (!isOpen) return null;

  const handlePresetSelect = (presetId) => {
    const preset = PRESET_TYPES.find(p => p.id === presetId);
    if (!preset) return;

    setFormData(prev => ({
      ...prev,
      type: preset.id,
      name: prev.name && job ? prev.name : preset.name,
      cron_expr: preset.cron,
      prompt: preset.prompt
    }));

    const parts = preset.cron.split(' ');
    if (parts.length === 5 && parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
      setScheduleMode('daily');
      setDailyTime(`${String(parts[1]).padStart(2, '0')}:${String(parts[0]).padStart(2, '0')}`);
    }
  };

  const handleDailyTimeChange = (timeStr) => {
    setDailyTime(timeStr);
    const [h, m] = timeStr.split(':');
    setFormData(prev => ({
      ...prev,
      cron_expr: `${parseInt(m)} ${parseInt(h)} * * *`
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên tác vụ.');
      return;
    }
    if (!formData.cron_expr.trim()) {
      setError('Biểu thức cron không được để trống.');
      return;
    }

    onSave({
      ...(job ? { id: job.id } : {}),
      ...formData
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {job ? 'Chỉnh Sửa Tác Vụ Lặp Lại' : 'Tạo Tác Vụ Tự Động Định Kỳ'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-lg bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900">
              {error}
            </div>
          )}

          {/* Template Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Mẫu tác vụ thông minh
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_TYPES.map(p => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => handlePresetSelect(p.id)}
                  className={`p-2.5 text-left rounded-xl border text-xs font-medium transition ${
                    formData.type === p.id
                      ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-bold truncate">{p.name}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{p.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Job Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Tên tác vụ *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Schedule Configuration */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Lịch trình chạy tự động
              </label>
              <div className="flex text-xs space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setScheduleMode('daily');
                    handleDailyTimeChange(dailyTime);
                  }}
                  className={`font-semibold ${scheduleMode === 'daily' ? 'text-brand-600 dark:text-brand-400 underline' : 'text-slate-400'}`}
                >
                  Theo giờ mỗi ngày
                </button>
                <span className="text-slate-400">•</span>
                <button
                  type="button"
                  onClick={() => setScheduleMode('cron')}
                  className={`font-semibold ${scheduleMode === 'cron' ? 'text-brand-600 dark:text-brand-400 underline' : 'text-slate-400'}`}
                >
                  Cú pháp Cron
                </button>
              </div>
            </div>

            {scheduleMode === 'daily' ? (
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <Clock className="w-5 h-5 text-brand-500" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Gửi vào Discord mỗi sáng lúc:
                </span>
                <input
                  type="time"
                  value={dailyTime}
                  onChange={(e) => handleDailyTimeChange(e.target.value)}
                  className="text-sm font-bold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={formData.cron_expr}
                  onChange={(e) => setFormData({ ...formData, cron_expr: e.target.value })}
                  placeholder="* * * * * (Phút Giờ Ngày Tháng Thứ)"
                  className="w-full text-sm font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Ví dụ: <code className="text-brand-600 dark:text-brand-400">30 7 * * *</code> (07:30 mỗi sáng), <code className="text-brand-600 dark:text-brand-400">0 8 * * 1-5</code> (08:00 các ngày trong tuần).
                </p>
              </div>
            )}
          </div>

          {/* AI Prompt / Instruction */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Câu lệnh hướng dẫn cho Gemini AI (Prompt)
            </label>
            <textarea
              rows={3}
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              placeholder="Yêu cầu cụ thể của bạn cho AI khi thực hiện tác vụ này..."
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Active Checkbox */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="job-active"
              checked={formData.is_active === 1}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
            />
            <label htmlFor="job-active" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Kích hoạt tác vụ này tự động chạy theo lịch
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            {job && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(job.id)}
                className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Xóa tác vụ
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
                {job ? 'Lưu Thay Đổi' : 'Tạo Tác Vụ'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
