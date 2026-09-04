const express = require('express');
const router = express.Router();
const db = require('../db');
const gemini = require('../gemini');

// Lấy danh sách sự kiện
router.get('/', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const events = db.getEvents(startDate, endDate);
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Tạo sự kiện mới
router.post('/', (req, res) => {
  try {
    const { title, description, start_time, end_time, category, color, reminder_minutes } = req.body;
    if (!title || !start_time || !end_time) {
      return res.status(400).json({ success: false, error: 'Thiếu tiêu đề hoặc thời gian bắt đầu/kết thúc.' });
    }

    const newEvent = {
      id: req.body.id || 'evt-' + Date.now(),
      title,
      description: description || '',
      start_time,
      end_time,
      category: category || 'work',
      color: color || '#3B82F6',
      reminder_minutes: reminder_minutes !== undefined ? parseInt(reminder_minutes) : 15
    };

    const created = db.createEvent(newEvent);
    res.json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cập nhật sự kiện
router.put('/:id', (req, res) => {
  try {
    const updated = db.updateEvent(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Xóa sự kiện
router.delete('/:id', (req, res) => {
  try {
    db.deleteEvent(req.params.id);
    res.json({ success: true, message: 'Đã xóa sự kiện thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Bóc tách sự kiện từ ngôn ngữ tự nhiên
router.post('/parse-natural', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Thiếu nội dung văn bản cần phân tích.' });
    }

    const parsed = await gemini.parseNaturalEvent(text);
    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
