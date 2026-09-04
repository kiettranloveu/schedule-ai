import React, { useState } from 'react';
import { Plus, CheckSquare, Sparkles, Clock, AlertTriangle, Search, CheckCircle2, Circle } from 'lucide-react';

export default function TodoView({ tasks, onAddTask, onEditTask, onToggleStatus, onOpenAutoScheduler }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = tasks.filter(t => {
    if (filterStatus === 'todo' && t.status !== 'todo') return false;
    if (filterStatus === 'in_progress' && t.status !== 'in_progress') return false;
    if (filterStatus === 'completed' && t.status !== 'completed') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q));
    }
    return true;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900">🔴 Khẩn cấp</span>;
      case 'high':
        return <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900">🟠 Cao</span>;
      case 'medium':
        return <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">🔵 Trung bình</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">⚪ Thấp</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner with AI Auto-Scheduler */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-brand-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-extrabold uppercase tracking-wider">
              Gemini Powered
            </span>
            <span className="text-xs text-white/80 font-medium">Tự Động Quy Hoạch Lịch</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight mt-1">
            Không Còn Lo Xếp Trùng Giờ Hay Quá Tải
          </h2>
          <p className="text-xs text-white/85 max-w-xl mt-0.5">
            Nhập danh sách việc cần làm, AI sẽ tự động phân tích khoảng trống trong ngày và xếp lịch làm việc tối ưu nhất.
          </p>
        </div>

        <button
          onClick={onOpenAutoScheduler}
          className="self-start sm:self-center flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white text-brand-600 font-extrabold text-xs shadow-md hover:bg-slate-50 transition transform hover:-translate-y-0.5 active:translate-y-0 shrink-0"
        >
          <Sparkles className="w-4 h-4 text-brand-500" />
          <span>AI Tự Xếp Lịch Ngay</span>
        </button>
      </div>

      {/* Filter & Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Status Tabs */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterStatus === 'all'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tất cả ({tasks.length})
          </button>
          <button
            onClick={() => setFilterStatus('todo')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterStatus === 'todo'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Cần làm ({tasks.filter(t => t.status === 'todo').length})
          </button>
          <button
            onClick={() => setFilterStatus('in_progress')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterStatus === 'in_progress'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Đang làm ({tasks.filter(t => t.status === 'in_progress').length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterStatus === 'completed'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Đã xong ({tasks.filter(t => t.status === 'completed').length})
          </button>
        </div>

        {/* Search & Add Button */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-52">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm công việc..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            onClick={onAddTask}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/25 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Việc</span>
          </button>
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
          <CheckSquare className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Không tìm thấy công việc nào
          </h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery ? 'Không có việc nào khớp với từ khóa tìm kiếm.' : 'Hãy tạo công việc mới để bắt đầu theo dõi tiến độ và xếp lịch.'}
          </p>
          <button
            onClick={onAddTask}
            className="mt-4 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition shadow-md shadow-brand-500/20"
          >
            + Thêm Công Việc Mới
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const isDone = task.status === 'completed';
            const isDeadlinePassed = task.deadline && new Date(task.deadline) < new Date() && !isDone;

            return (
              <div
                key={task.id}
                onClick={() => onEditTask(task)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 bg-white dark:bg-slate-900 shadow-sm hover:border-brand-400 dark:hover:border-brand-700 ${
                  isDone ? 'opacity-60' : ''
                }`}
              >
                {/* Left: Checkbox & Info */}
                <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStatus(task);
                    }}
                    className="mt-0.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition shrink-0"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h4 className={`text-sm font-bold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        {task.title}
                      </h4>
                      {getPriorityBadge(task.priority)}
                      {task.scheduled_event_id && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          ✓ Đã xếp lịch
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Metadata footer */}
                    <div className="flex items-center space-x-4 mt-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex-wrap gap-y-1">
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {task.estimated_minutes} phút
                      </span>

                      {task.deadline && (
                        <span className={`flex items-center ${isDeadlinePassed ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}`}>
                          {isDeadlinePassed && <AlertTriangle className="w-3.5 h-3.5 mr-1" />}
                          Hạn: {new Date(task.deadline).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
