import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Sparkles } from 'lucide-react';

export default function CalendarView({ events, onAddEvent, onEditEvent }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day'

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Helper date formatters
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get days in month
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = lastDayOfMonth.getDate();

  const prevMonthLastDay = new Date(year, month, 0).getDate();

  const calendarDays = [];
  // Previous month padding
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false
    });
  }
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }
  // Next month padding
  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }

  const isToday = (d) => {
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  const getEventsForDate = (d) => {
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return events.filter(e => e.start_time && e.start_time.startsWith(dStr));
  };

  // Title string
  const getHeaderTitle = () => {
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    if (viewMode === 'month') {
      return `${monthNames[month]}, ${year}`;
    } else if (viewMode === 'week') {
      return `Tuần của ${currentDate.toLocaleDateString('vi-VN')}`;
    } else {
      return currentDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Navigation & Title */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white capitalize">
            {getHeaderTitle()}
          </h2>

          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Hôm nay
          </button>
        </div>

        {/* View Mode Toggle & Add Button */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tháng
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tuần
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Ngày
            </button>
          </div>

          <button
            onClick={() => onAddEvent(currentDate)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/25 transition"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Thêm Sự Kiện</span>
          </button>
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-center py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <div>Thứ 2</div>
            <div>Thứ 3</div>
            <div>Thứ 4</div>
            <div>Thứ 5</div>
            <div>Thứ 6</div>
            <div className="text-amber-600 dark:text-amber-400">Thứ 7</div>
            <div className="text-rose-600 dark:text-rose-400">Chủ Nhật</div>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
            {calendarDays.map((item, idx) => {
              const dayEvents = getEventsForDate(item.date);
              const todayFlag = isToday(item.date);

              return (
                <div
                  key={idx}
                  onClick={() => onAddEvent(item.date)}
                  className={`min-h-[105px] sm:min-h-[125px] p-2 transition-colors cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                    !item.isCurrentMonth ? 'opacity-40 bg-slate-50/30 dark:bg-slate-950/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        todayFlag
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.date.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                        {dayEvents.length} việc
                      </span>
                    )}
                  </div>

                  {/* Event Chips */}
                  <div className="space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 3).map((evt) => {
                      const timeStr = new Date(evt.start_time).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      return (
                        <div
                          key={evt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditEvent(evt);
                          }}
                          style={{ borderLeftColor: evt.color || '#3B82F6' }}
                          className="px-1.5 py-0.5 text-[11px] font-medium rounded bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border-l-2 truncate hover:brightness-110 shadow-xs transition"
                          title={`${timeStr} - ${evt.title}`}
                        >
                          <span className="text-[10px] font-semibold opacity-75 mr-1">{timeStr}</span>
                          {evt.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 pl-1">
                        +{dayEvents.length - 3} sự kiện khác...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK & DAY VIEWS */}
      {(viewMode === 'week' || viewMode === 'day') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Danh sách lịch trình {viewMode === 'week' ? 'tuần này' : 'trong ngày'}
            </h3>

            {events.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Chưa có sự kiện nào trong khoảng thời gian này.</p>
                <button
                  onClick={() => onAddEvent(currentDate)}
                  className="mt-3 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  + Tạo sự kiện đầu tiên
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {events.map((evt) => {
                  const s = new Date(evt.start_time);
                  const e = new Date(evt.end_time);
                  return (
                    <div
                      key={evt.id}
                      onClick={() => onEditEvent(evt)}
                      className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-brand-500 transition cursor-pointer flex flex-col justify-between"
                      style={{ borderLeftWidth: '4px', borderLeftColor: evt.color || '#3B82F6' }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {evt.category}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {s.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                          {evt.title}
                        </h4>
                        {evt.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {evt.description}
                          </p>
                        )}
                      </div>

                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
                        <span>
                          {s.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {e.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[11px] text-brand-600 dark:text-brand-400 font-bold">
                          Nhắc trước: {evt.reminder_minutes}p
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
