const express = require('express');
const router = express.Router();
const db = require('../db');
const scheduler = require('../scheduler');

// Lấy danh sách các tác vụ lặp lại
router.get('/', (req, res) => {
  try {
    const jobs = db.getRecurringJobs();
    res.json({ success: true, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Lấy lịch sử log thực thi
router.get('/logs', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 30;
    const logs = db.getJobLogs(limit);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Tạo tác vụ lặp lại mới
router.post('/', (req, res) => {
  try {
    const { name, type, cron_expr, prompt, is_active } = req.body;
    if (!name || !cron_expr) {
      return res.status(400).json({ success: false, error: 'Thiếu tên tác vụ hoặc biểu thức thời gian lặp (cron).' });
    }

    const newJob = {
      id: req.body.id || 'job-' + Date.now(),
      name,
      type: type || 'custom',
      cron_expr,
      prompt: prompt || '',
      is_active: is_active !== undefined ? (is_active ? 1 : 0) : 1
    };

    const created = db.createRecurringJob(newJob);
    scheduler.reloadScheduler(); // Cập nhật lại cron engine
    res.json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cập nhật tác vụ
router.put('/:id', (req, res) => {
  try {
    const existing = db.getRecurringJobById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tác vụ.' });
    }

    const merged = { ...existing, ...req.body };
    const updated = db.updateRecurringJob(req.params.id, merged);
    scheduler.reloadScheduler(); // Cập nhật lại cron engine
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Xóa tác vụ
router.delete('/:id', (req, res) => {
  try {
    db.deleteRecurringJob(req.params.id);
    scheduler.reloadScheduler();
    res.json({ success: true, message: 'Đã xóa tác vụ thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Nút "Chạy thử ngay" (Test Run)
router.post('/:id/run', async (req, res) => {
  try {
    const job = db.getRecurringJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tác vụ.' });
    }

    const result = await scheduler.executeJob(job);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
