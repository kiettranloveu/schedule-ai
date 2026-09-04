import React, { useState } from 'react';
import { X, Sparkles, Calendar, Clock, ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function AutoSchedulerModal({ isOpen, onClose, tasks, onScheduleApplied }) {
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTaskIds, setSelectedTaskIds] = useState(tasks.map(t => t.id));
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [planResult, setPlanResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleTask = (id) => {
    setSelectedTaskIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleGeneratePlan = async () => {
    if (selectedTaskIds.length === 0) {
      setError('Vui lòng chọn ít nhất 1 công việc để xếp lịch.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await api.autoSchedule(selectedTaskIds, targetDate);
      setPlanResult(res.plan);
    } catch (err) {
      setError('Lỗi khi chạy AI Auto-Scheduler: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!planResult || planResult.length === 0) return;
    setIsApplying(true);
    setError('');
    try {
      await api.applySchedule(planResult);
      onScheduleApplied();
      onClose();
    } catch (err) {
      setError('Không thể lưu lịch vào Calendar: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-brand-50/50 via-purple-50/30 to-transparent dark:from-brand-950/30 dark:via-purple-950/20">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                AI Auto-Scheduler (Tự Động Xếp Lịch)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gemini AI phân tích các khung giờ trống và xếp lịch làm việc tối ưu năng suất
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!planResult ? (
            <>
              {/* Target Date Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Chọn ngày cần xếp lịch
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full sm:w-64 text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Task Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Chọn các công việc cần AI sắp xếp ({selectedTaskIds.length}/{tasks.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setSelectedTaskIds(selectedTaskIds.length === tasks.length ? [] : tasks.map(t => t.id))}
                    className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {selectedTaskIds.length === tasks.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>

                {tasks.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    Chưa có công việc nào trong danh sách. Hãy tạo việc mới trước khi xếp lịch.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {tasks.map(t => {
                      const isChecked = selectedTaskIds.includes(t.id);
                      return (
                        <div
                          key={t.id}
                          onClick={() => toggleTask(t.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isChecked
                              ? 'bg-brand-50/50 border-brand-300 dark:bg-brand-950/30 dark:border-brand-800'
                              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                            />
                            <div>
                              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                {t.title}
                              </span>
                              <div className="flex items-center space-x-2 mt-0.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                  Ưu tiên: {t.priority}
                                </span>
                                <span className="text-[11px] text-slate-400">•</span>
                                <span className="text-[11px] text-slate-500 flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {t.estimated_minutes} phút
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Plan Result Preview */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>AI đã xếp xong {planResult.length} khung giờ phù hợp cho ngày <strong>{targetDate}</strong>. Xem xét và bấm Áp dụng bên dưới:</span>
              </div>

              <div className="space-y-2.5">
                {planResult.map((item, idx) => {
                  const s = new Date(item.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                  const e = new Date(item.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      style={{ borderLeftWidth: '4px', borderLeftColor: item.color || '#10B981' }}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-extrabold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-2 py-0.5 rounded-md">
                            {s} - {e}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {item.title}
                          </h4>
                        </div>
                        {item.reason && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            💡 {item.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          {planResult ? (
            <button
              type="button"
              onClick={() => setPlanResult(null)}
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:underline"
            >
              ← Chọn lại danh sách
            </button>
          ) : <div />}

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Đóng
            </button>

            {!planResult ? (
              <button
                type="button"
                onClick={handleGeneratePlan}
                disabled={isLoading || tasks.length === 0}
                className="flex items-center space-x-1.5 px-5 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 shadow-md shadow-brand-500/25 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    <span>AI Đang Tính Toán...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1" />
                    <span>AI Xếp Lịch Tối Ưu</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApply}
                disabled={isApplying}
                className="flex items-center space-x-1.5 px-5 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/25 transition disabled:opacity-50"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    <span>Đang Lưu...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    <span>Áp Dụng Vào Lịch</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
