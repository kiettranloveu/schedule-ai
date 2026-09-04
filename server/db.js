const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'schedule_ai.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys for high performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      category TEXT DEFAULT 'work',
      color TEXT DEFAULT '#3B82F6',
      reminder_minutes INTEGER DEFAULT 15,
      reminded INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium',
      deadline TEXT,
      status TEXT DEFAULT 'todo',
      estimated_minutes INTEGER DEFAULT 30,
      scheduled_event_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recurring_jobs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      cron_expr TEXT NOT NULL,
      prompt TEXT,
      is_active INTEGER DEFAULT 1,
      last_run_at TEXT,
      last_status TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS job_logs (
      id TEXT PRIMARY KEY,
      job_id TEXT,
      job_name TEXT,
      run_at TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL,
      message TEXT,
      preview TEXT
    );
  `);

  // Seed default recurring jobs if table is empty
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM recurring_jobs');
  const countRow = countStmt.get();
  if (countRow.count === 0) {
    const insertJob = db.prepare(`
      INSERT INTO recurring_jobs (id, name, type, cron_expr, prompt, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // 07:30 sáng hàng ngày - Báo giá vàng SJC & 9999
    insertJob.run(
      'job-gold-daily',
      'Báo Giá Vàng SJC & 9999 Hàng Ngày',
      'gold',
      '30 7 * * *',
      'Tổng hợp và tóm tắt biến động giá vàng SJC, Doji, PNJ và vàng nhẫn 9999 trong ngày. Đưa ra nhận định ngắn gọn.',
      1
    );

    // 06:45 sáng hàng ngày - Dự báo thời tiết ngày mới
    insertJob.run(
      'job-weather-daily',
      'Bản Tin Thời Tiết & Gợi Ý Ngày Mới',
      'weather',
      '45 6 * * *',
      'Dự báo thời tiết hôm nay (nhiệt độ, khả năng mưa, độ ẩm, UV) và đưa ra lời khuyên trang phục, lưu ý khi ra ngoài.',
      1
    );

    // 07:00 sáng hàng ngày - Điểm danh lịch trình & Deadline
    insertJob.run(
      'job-briefing-daily',
      'Briefing Lịch Trình & Công Việc Đầu Ngày',
      'daily_briefing',
      '0 7 * * *',
      'Tổng hợp tất cả sự kiện, cuộc hẹn và công việc to-do cần hoàn thành trong hôm nay theo thứ tự thời gian và độ ưu tiên.',
      1
    );

    // 08:00 sáng hàng ngày - Điểm tin công nghệ nổi bật
    insertJob.run(
      'job-news-daily',
      'Điểm Tin Công Nghệ & AI Buổi Sáng',
      'news',
      '0 8 * * *',
      'Tóm tắt 3 tin tức công nghệ và trí tuệ nhân tạo (AI) đáng chú ý nhất trong 24h qua.',
      0 // Default inactive until user enables
    );
  }

  // Seed default settings if not exists
  const getSettingStmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const setSettingStmt = db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');

  if (!getSettingStmt.get('weather_city')) {
    setSettingStmt.run('weather_city', 'Hà Nội');
  }
  if (!getSettingStmt.get('notification_reminders')) {
    setSettingStmt.run('notification_reminders', '1');
  }
}

initSchema();

module.exports = {
  db,
  // Settings
  getSetting: (key) => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : null;
  },
  getAllSettings: () => {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const result = {};
    for (const r of rows) result[r.key] = r.value;
    return result;
  },
  setSetting: (key, value) => {
    db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)').run(key, value || '');
  },
  saveSetting: (key, value) => {
    db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)').run(key, value || '');
  },
  saveSettings: (settingsObj) => {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
    for (const [k, v] of Object.entries(settingsObj)) {
      stmt.run(k, v || '');
    }
  },

  // Events
  getEvents: (startDate, endDate) => {
    if (startDate && endDate) {
      return db.prepare('SELECT * FROM events WHERE start_time >= ? AND start_time <= ? ORDER BY start_time ASC').all(startDate, endDate);
    }
    return db.prepare('SELECT * FROM events ORDER BY start_time ASC').all();
  },
  getEventById: (id) => db.prepare('SELECT * FROM events WHERE id = ?').get(id),
  createEvent: (event) => {
    const stmt = db.prepare(`
      INSERT INTO events (id, title, description, start_time, end_time, category, color, reminder_minutes, reminded)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);
    stmt.run(
      event.id,
      event.title,
      event.description || '',
      event.start_time,
      event.end_time,
      event.category || 'work',
      event.color || '#3B82F6',
      event.reminder_minutes !== undefined ? event.reminder_minutes : 15
    );
    return db.prepare('SELECT * FROM events WHERE id = ?').get(event.id);
  },
  updateEvent: (id, event) => {
    const stmt = db.prepare(`
      UPDATE events
      SET title = ?, description = ?, start_time = ?, end_time = ?, category = ?, color = ?, reminder_minutes = ?
      WHERE id = ?
    `);
    stmt.run(
      event.title,
      event.description || '',
      event.start_time,
      event.end_time,
      event.category || 'work',
      event.color || '#3B82F6',
      event.reminder_minutes !== undefined ? event.reminder_minutes : 15,
      id
    );
    return db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  },
  deleteEvent: (id) => db.prepare('DELETE FROM events WHERE id = ?').run(id),
  markEventReminded: (id) => db.prepare('UPDATE events SET reminded = 1 WHERE id = ?').run(id),

  // Tasks
  getTasks: (status) => {
    if (status) {
      return db.prepare('SELECT * FROM tasks WHERE status = ? ORDER BY deadline ASC, created_at DESC').all(status);
    }
    return db.prepare('SELECT * FROM tasks ORDER BY deadline ASC, created_at DESC').all();
  },
  getTaskById: (id) => db.prepare('SELECT * FROM tasks WHERE id = ?').get(id),
  createTask: (task) => {
    const stmt = db.prepare(`
      INSERT INTO tasks (id, title, description, priority, deadline, status, estimated_minutes, scheduled_event_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      task.id,
      task.title,
      task.description || '',
      task.priority || 'medium',
      task.deadline || null,
      task.status || 'todo',
      task.estimated_minutes || 30,
      task.scheduled_event_id || null
    );
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id);
  },
  updateTask: (id, task) => {
    const stmt = db.prepare(`
      UPDATE tasks
      SET title = ?, description = ?, priority = ?, deadline = ?, status = ?, estimated_minutes = ?, scheduled_event_id = ?
      WHERE id = ?
    `);
    stmt.run(
      task.title,
      task.description || '',
      task.priority || 'medium',
      task.deadline || null,
      task.status || 'todo',
      task.estimated_minutes || 30,
      task.scheduled_event_id || null,
      id
    );
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  },
  deleteTask: (id) => db.prepare('DELETE FROM tasks WHERE id = ?').run(id),

  // Recurring Jobs
  getRecurringJobs: () => db.prepare('SELECT * FROM recurring_jobs ORDER BY created_at ASC').all(),
  getRecurringJobById: (id) => db.prepare('SELECT * FROM recurring_jobs WHERE id = ?').get(id),
  createRecurringJob: (job) => {
    const stmt = db.prepare(`
      INSERT INTO recurring_jobs (id, name, type, cron_expr, prompt, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(job.id, job.name, job.type || 'custom', job.cron_expr, job.prompt || '', job.is_active ? 1 : 0);
    return db.prepare('SELECT * FROM recurring_jobs WHERE id = ?').get(job.id);
  },
  updateRecurringJob: (id, job) => {
    const stmt = db.prepare(`
      UPDATE recurring_jobs
      SET name = ?, type = ?, cron_expr = ?, prompt = ?, is_active = ?
      WHERE id = ?
    `);
    stmt.run(job.name, job.type || 'custom', job.cron_expr, job.prompt || '', job.is_active ? 1 : 0, id);
    return db.prepare('SELECT * FROM recurring_jobs WHERE id = ?').get(id);
  },
  deleteRecurringJob: (id) => db.prepare('DELETE FROM recurring_jobs WHERE id = ?').run(id),
  updateJobRunStatus: (id, status, preview) => {
    db.prepare('UPDATE recurring_jobs SET last_run_at = CURRENT_TIMESTAMP, last_status = ? WHERE id = ?').run(status, id);
  },

  // Job Logs
  addJobLog: (log) => {
    const stmt = db.prepare(`
      INSERT INTO job_logs (id, job_id, job_name, status, message, preview)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(log.id, log.job_id, log.job_name, log.status, log.message || '', log.preview || '');
  },
  getJobLogs: (limit = 30) => {
    return db.prepare('SELECT * FROM job_logs ORDER BY run_at DESC LIMIT ?').all(limit);
  }
};
