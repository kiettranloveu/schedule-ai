import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Gắn token tự động vào mỗi request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('scheduleai_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Auth
  login: async (username, password) => {
    const res = await client.post('/auth/login', { username, password });
    if (res.data.success && res.data.token) {
      localStorage.setItem('scheduleai_token', res.data.token);
    }
    return res.data;
  },
  verifyAuth: async () => {
    try {
      const res = await client.get('/auth/me');
      return res.data.success;
    } catch (e) {
      return false;
    }
  },
  logout: () => {
    localStorage.removeItem('scheduleai_token');
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('scheduleai_token');
  },

  // Events
  getEvents: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await client.get('/events', { params });
    return res.data.data;
  },
  createEvent: async (data) => {
    const res = await client.post('/events', data);
    return res.data.data;
  },
  updateEvent: async (id, data) => {
    const res = await client.put(`/events/${id}`, data);
    return res.data.data;
  },
  deleteEvent: async (id) => {
    const res = await client.delete(`/events/${id}`);
    return res.data;
  },
  parseNaturalEvent: async (text) => {
    const res = await client.post('/events/parse-natural', { text });
    return res.data.data;
  },

  // Tasks
  getTasks: async (status) => {
    const params = status ? { status } : {};
    const res = await client.get('/tasks', { params });
    return res.data.data;
  },
  createTask: async (data) => {
    const res = await client.post('/tasks', data);
    return res.data.data;
  },
  updateTask: async (id, data) => {
    const res = await client.put(`/tasks/${id}`, data);
    return res.data.data;
  },
  deleteTask: async (id) => {
    const res = await client.delete(`/tasks/${id}`);
    return res.data;
  },
  autoSchedule: async (taskIds, targetDate) => {
    const res = await client.post('/tasks/auto-schedule', { taskIds, targetDate });
    return res.data.data;
  },
  applySchedule: async (items) => {
    const res = await client.post('/tasks/apply-schedule', { items });
    return res.data.data;
  },

  // Recurring Jobs
  getRecurringJobs: async () => {
    const res = await client.get('/recurring');
    return res.data.data;
  },
  createRecurringJob: async (data) => {
    const res = await client.post('/recurring', data);
    return res.data.data;
  },
  updateRecurringJob: async (id, data) => {
    const res = await client.put(`/recurring/${id}`, data);
    return res.data.data;
  },
  deleteRecurringJob: async (id) => {
    const res = await client.delete(`/recurring/${id}`);
    return res.data;
  },
  runRecurringJob: async (id) => {
    const res = await client.post(`/recurring/${id}/run`);
    return res.data;
  },
  getRecurringLogs: async (limit = 30) => {
    const res = await client.get('/recurring/logs', { params: { limit } });
    return res.data.data;
  },

  // Settings
  getSettings: async () => {
    const res = await client.get('/settings');
    return res.data.data;
  },
  saveSettings: async (data) => {
    const res = await client.post('/settings', data);
    return res.data;
  },
  getStatus: async () => {
    const res = await client.get('/settings/status');
    return res.data.data;
  },
  testGemini: async (apiKey) => {
    const res = await client.post('/settings/test-gemini', { apiKey });
    return res.data;
  },
  testXkiro: async (apiKey, baseUrl, model, provider) => {
    const res = await client.post('/settings/test-xkiro', { apiKey, baseUrl, model, provider });
    return res.data;
  },
  testDiscord: async (token, channelId) => {
    const res = await client.post('/settings/test-discord', { token, channelId });
    return res.data;
  }
};
