import React from 'react';
import { Calendar, CheckSquare, Zap, Settings, Sun, Moon, Radio, Bot, Sparkles, LogOut } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, status, theme, toggleTheme, onLogout }) {
  const isDiscordConnected = status?.discord?.connected;
  const isGeminiReady = status?.gemini?.ready;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('calendar')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-600 via-indigo-500 to-purple-500 dark:from-brand-400 dark:to-purple-400">
                ScheduleAI
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                Agentic
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Lịch Trình & Tự Động Hóa Discord
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'calendar'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden md:inline">Lịch Trình</span>
          </button>

          <button
            onClick={() => setActiveTab('todo')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'todo'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span className="hidden md:inline">Việc Cần Làm</span>
          </button>

          <button
            onClick={() => setActiveTab('recurring')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'recurring'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span className="hidden md:inline">Tác Vụ AI Lặp Lại</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">Cài Đặt</span>
          </button>
        </nav>

        {/* Right side: Live Badges & Theme Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Discord Status Indicator */}
          <div
            title={isDiscordConnected ? `Discord Bot: ${status.discord.username}` : (status?.discord?.error || 'Discord Bot chưa kết nối')}
            className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isDiscordConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isDiscordConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span>Discord: {isDiscordConnected ? 'Online' : 'Chưa bật'}</span>
          </div>

          {/* Gemini Status Indicator */}
          <div
            title={isGeminiReady ? 'Gemini AI sẵn sàng' : 'Chưa cấu hình Gemini API Key'}
            className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isGeminiReady
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI: {isGeminiReady ? 'Sẵn sàng' : 'Chưa nhập Key'}</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Chuyển chế độ sáng/tối"
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Đăng xuất khỏi hệ thống"
              className="p-2 px-3 rounded-xl text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Thoát</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
