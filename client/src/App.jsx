import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CalendarView from './components/CalendarView';
import EventModal from './components/EventModal';
import TodoView from './components/TodoView';
import TaskModal from './components/TaskModal';
import AutoSchedulerModal from './components/AutoSchedulerModal';
import RecurringJobsView from './components/RecurringJobsView';
import JobModal from './components/JobModal';
import LogsModal from './components/LogsModal';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import { api } from './services/api';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => api.isAuthenticated());
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [activeTab, setActiveTab] = useState('calendar');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [status, setStatus] = useState(null);

  // Modals state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [defaultEventDate, setDefaultEventDate] = useState(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [isAutoSchedulerOpen, setIsAutoSchedulerOpen] = useState(false);

  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  // Theme synchronization
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Initial Data Load
  const fetchAllData = async () => {
    try {
      const [evts, tsks, jbs, st] = await Promise.all([
        api.getEvents(),
        api.getTasks(),
        api.getRecurringJobs(),
        api.getStatus()
      ]);
      setEvents(evts || []);
      setTasks(tsks || []);
      setJobs(jbs || []);
      setStatus(st || null);
    } catch (err) {
      console.error('Data fetch error:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (api.isAuthenticated()) {
        const ok = await api.verifyAuth();
        if (ok) {
          setIsAuthenticated(true);
          fetchAllData();
        } else {
          api.logout();
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsCheckingAuth(false);
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      api.getStatus().then(st => setStatus(st)).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Event Handlers
  const handleAddEvent = (date) => {
    setSelectedEvent(null);
    setDefaultEventDate(date || new Date());
    setIsEventModalOpen(true);
  };

  const handleEditEvent = (evt) => {
    setSelectedEvent(evt);
    setDefaultEventDate(null);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (eventData) => {
    try {
      if (eventData.id) {
        await api.updateEvent(eventData.id, eventData);
      } else {
        await api.createEvent(eventData);
      }
      setIsEventModalOpen(false);
      const updated = await api.getEvents();
      setEvents(updated);
    } catch (err) {
      alert('Lỗi lưu sự kiện: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) return;
    try {
      await api.deleteEvent(id);
      setIsEventModalOpen(false);
      const updated = await api.getEvents();
      setEvents(updated);
    } catch (err) {
      alert('Lỗi xóa sự kiện: ' + (err.response?.data?.error || err.message));
    }
  };

  // Task Handlers
  const handleAddTask = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (tsk) => {
    setSelectedTask(tsk);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (taskData) => {
    try {
      if (taskData.id) {
        await api.updateTask(taskData.id, taskData);
      } else {
        await api.createTask(taskData);
      }
      setIsTaskModalOpen(false);
      const updated = await api.getTasks();
      setTasks(updated);
    } catch (err) {
      alert('Lỗi lưu công việc: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteTask = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa công việc này?')) return;
    try {
      await api.deleteTask(id);
      setIsTaskModalOpen(false);
      const updated = await api.getTasks();
      setTasks(updated);
    } catch (err) {
      alert('Lỗi xóa công việc: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleToggleTaskStatus = async (task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await api.updateTask(task.id, { ...task, status: nextStatus });
      const updated = await api.getTasks();
      setTasks(updated);
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  };

  // Recurring Job Handlers
  const handleAddJob = () => {
    setSelectedJob(null);
    setIsJobModalOpen(true);
  };

  const handleEditJob = (jb) => {
    setSelectedJob(jb);
    setIsJobModalOpen(true);
  };

  const handleSaveJob = async (jobData) => {
    try {
      if (jobData.id) {
        await api.updateRecurringJob(jobData.id, jobData);
      } else {
        await api.createRecurringJob(jobData);
      }
      setIsJobModalOpen(false);
      const updated = await api.getRecurringJobs();
      setJobs(updated);
    } catch (err) {
      alert('Lỗi lưu tác vụ: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteJob = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tác vụ lặp lại này?')) return;
    try {
      await api.deleteRecurringJob(id);
      setIsJobModalOpen(false);
      const updated = await api.getRecurringJobs();
      setJobs(updated);
    } catch (err) {
      alert('Lỗi xóa tác vụ: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleToggleJob = async (job) => {
    const nextActive = job.is_active === 1 ? 0 : 1;
    try {
      await api.updateRecurringJob(job.id, { ...job, is_active: nextActive });
      const updated = await api.getRecurringJobs();
      setJobs(updated);
    } catch (err) {
      console.error('Toggle job active error:', err);
    }
  };

  const handleRunJob = async (jobId) => {
    const res = await api.runRecurringJob(jobId);
    const updated = await api.getRecurringJobs();
    setJobs(updated);
    return res;
  };

  const handleScheduleApplied = async () => {
    const [evts, tsks] = await Promise.all([api.getEvents(), api.getTasks()]);
    setEvents(evts);
    setTasks(tsks);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Đang kiểm tra bảo mật...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          fetchAllData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        status={status}
        theme={theme}
        toggleTheme={toggleTheme}
        onLogout={() => {
          api.logout();
          setIsAuthenticated(false);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'calendar' && (
          <CalendarView
            events={events}
            onAddEvent={handleAddEvent}
            onEditEvent={handleEditEvent}
          />
        )}

        {activeTab === 'todo' && (
          <TodoView
            tasks={tasks}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onToggleStatus={handleToggleTaskStatus}
            onOpenAutoScheduler={() => setIsAutoSchedulerOpen(true)}
          />
        )}

        {activeTab === 'recurring' && (
          <RecurringJobsView
            jobs={jobs}
            onAddJob={handleAddJob}
            onEditJob={handleEditJob}
            onDeleteJob={handleDeleteJob}
            onToggleJob={handleToggleJob}
            onRunJob={handleRunJob}
            onOpenLogs={() => setIsLogsModalOpen(true)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            onSettingsSaved={fetchAllData}
            onRefreshStatus={() => api.getStatus().then(setStatus)}
          />
        )}
      </main>

      {/* Modals */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        event={selectedEvent}
        defaultDate={defaultEventDate}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={selectedTask}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      <AutoSchedulerModal
        isOpen={isAutoSchedulerOpen}
        onClose={() => setIsAutoSchedulerOpen(false)}
        tasks={tasks.filter(t => t.status !== 'completed')}
        onScheduleApplied={handleScheduleApplied}
      />

      <JobModal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        job={selectedJob}
        onSave={handleSaveJob}
        onDelete={handleDeleteJob}
      />

      <LogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
      />
    </div>
  );
}
