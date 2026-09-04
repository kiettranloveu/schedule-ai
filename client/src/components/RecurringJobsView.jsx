import React, { useState } from 'react';
import { Plus, Zap, Play, History, CheckCircle2, AlertCircle, Clock, Loader2, Sparkles, MoreVertical, Edit3, Trash2 } from 'lucide-react';

export default function RecurringJobsView({ jobs, onAddJob, onEditJob, onDeleteJob, onToggleJob, onRunJob, onOpenLogs }) {
  const [runningJobId, setRunningJobId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const handleTestRun = async (job) => {
    setRunningJobId(job.id);
    setFeedback(null);
    try {
      const res = await onRunJob(job.id);
      if (res.success) {
        setFeedback({ type: 'success', text: `Đã chạy tác vụ "${job.name}" và bắn thông báo sang Discord thành công!` });
      } else {
        setFeedback({ type: 'error', text: `Lỗi khi chạy tác vụ: ${res.error}` });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: `Lỗi kết nối: ${err.message}` });
    } finally {
      setRunningJobId(null);
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'gold':
        return <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">🪙 Giá Vàng</span>;
      case 'weather':
        return <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">⛅ Thời Tiết</span>;
      case 'daily_briefing':
        return <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">📋 Briefing Lịch</span>;
      case 'news':
        return <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">📰 Điểm Tin</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">🤖 AI Custom</span>;
    }
  };

  const formatCronText = (cron) => {
    const parts = (cron || '').split(' ');
    if (parts.length === 5 && parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
      const h = String(parts[1]).padStart(2, '0');
      const m = String(parts[0]).padStart(2, '0');
      return `Mỗi ngày lúc ${h}:${m}`;
    }
    return `Cron: ${cron}`;
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-extrabold uppercase tracking-wider">
              Autonomous Tasks
            </span>
            <span className="text-xs text-white/80 font-medium">Cron + Gemini + Discord</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight mt-1">
            Tự Động Hóa Định Kỳ & Nhắc Việc Không Bao Giờ Quên
          </h2>
          <p className="text-xs text-white/85 max-w-xl mt-0.5">
            Các tác vụ tự động cào dữ liệu thực tế (giá vàng SJC, thời tiết, tin tức), phân tích bằng AI và bắn thẳng vào kênh Discord cá nhân của bạn.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-center shrink-0">
          <button
            onClick={onOpenLogs}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur transition"
          >
            <History className="w-4 h-4" />
            <span>Lịch Sử Chạy</span>
          </button>
          <button
            onClick={onAddJob}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white text-orange-600 font-extrabold text-xs shadow-md hover:bg-slate-50 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Tác Vụ</span>
          </button>
        </div>
      </div>

      {/* Floating Feedback Alert */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center space-x-3 text-xs font-semibold animate-in slide-in-from-top duration-200 ${
          feedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((job) => {
          const isRunning = runningJobId === job.id;
          const isActive = job.is_active === 1;

          return (
            <div
              key={job.id}
              className={`p-5 rounded-2xl border transition-all bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between ${
                isActive
                  ? 'border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-600'
                  : 'border-slate-200/50 dark:border-slate-800/50 opacity-60'
              }`}
            >
              <div>
                {/* Header: Title & Type & Active Switch */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2 mb-1.5">
                      {getTypeBadge(job.type)}
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatCronText(job.cron_expr)}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {job.name}
                    </h3>
                  </div>

                  {/* Toggle Active */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => onToggleJob(job)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Prompt preview */}
                {job.prompt && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 italic">
                    "{job.prompt}"
                  </p>
                )}

                {/* Last execution info */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Lần chạy gần nhất:{' '}
                    <strong className="text-slate-600 dark:text-slate-300">
                      {job.last_run_at ? new Date(job.last_run_at).toLocaleString('vi-VN') : 'Chưa chạy'}
                    </strong>
                  </span>
                  {job.last_status && (
                    <span className={`px-1.5 py-0.5 rounded font-bold ${
                      job.last_status === 'success'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                    }`}>
                      {job.last_status === 'success' ? 'Thành công' : 'Lỗi'}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex space-x-1">
                  <button
                    onClick={() => onEditJob(job)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs flex items-center"
                    title="Chỉnh sửa tác vụ"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                    <span>Sửa</span>
                  </button>
                  <button
                    onClick={() => onDeleteJob(job.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition text-xs flex items-center"
                    title="Xóa tác vụ"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    <span>Xóa</span>
                  </button>
                </div>

                {/* TEST RUN BUTTON */}
                <button
                  type="button"
                  onClick={() => handleTestRun(job)}
                  disabled={isRunning}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-sm shadow-orange-500/20 transition disabled:opacity-50"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      <span>Đang Gửi Discord...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Chạy Thử Ngay</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
