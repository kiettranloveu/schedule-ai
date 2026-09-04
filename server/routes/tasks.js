const express = require('express');
const router = express.Router();
const db = require('../db');
const gemini = require('../gemini');

// Lấy danh sách công việc
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    const tasks = db.getTasks(status);
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Tạo công việc mới
router.post('/', (req, res) => {
  try {
    const { title, description, priority, deadline, estimated_minutes } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, error: 'Tiêu đề công việc không được để trống.' });
    }

    const newTask = {
      id: req.body.id || 'tsk-' + Date.now(),
      title,
      description: description || '',
      priority: priority || 'medium',
      deadline: deadline || null,
      status: req.body.status || 'todo',
      estimated_minutes: estimated_minutes ? parseInt(estimated_minutes) : 30
    };

    const created = db.createTask(newTask);
    res.json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cập nhật công việc (đổi trạng thái, deadline, sửa thông tin)
router.put('/:id', (req, res) => {
  try {
    const existing = db.getTaskById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy công việc.' });
    }

    const merged = { ...existing, ...req.body };
    const updated = db.updateTask(req.params.id, merged);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Xóa công việc
router.delete('/:id', (req, res) => {
  try {
    db.deleteTask(req.params.id);
    res.json({ success: true, message: 'Đã xóa công việc thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Auto-Scheduler: Xếp lịch thông minh cho danh sách việc
router.post('/auto-schedule', async (req, res) => {
  try {
    const { taskIds, targetDate } = req.body;
    const dateStr = targetDate || new Date().toISOString().split('T')[0];

    // Lấy các việc cần xếp
    let tasksToSchedule = [];
    if (taskIds && Array.isArray(taskIds) && taskIds.length > 0) {
      tasksToSchedule = taskIds.map(id => db.getTaskById(id)).filter(Boolean);
    } else {
      tasksToSchedule = db.getTasks('todo');
    }

    if (tasksToSchedule.length === 0) {
      return res.status(400).json({ success: false, error: 'Không có công việc nào để xếp lịch.' });
    }

    // Lấy các sự kiện hiện có trong ngày
    const allEvents = db.getEvents();
    const dayEvents = allEvents.filter(e => e.start_time.startsWith(dateStr));

    // Gọi Gemini AI tính toán
    const schedulePlan = await gemini.autoScheduleTasks(tasksToSchedule, dayEvents, dateStr);

    res.json({
      success: true,
      data: {
        date: dateStr,
        plan: schedulePlan
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Xác nhận lưu các sự kiện đã được AI auto-schedule vào Calendar
router.post('/apply-schedule', (req, res) => {
  try {
    const { items } = req.body; // Mảng các sự kiện được xếp
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'Danh sách sự kiện không hợp lệ.' });
    }

    const createdEvents = [];
    for (const item of items) {
      const evtId = 'evt-sched-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      const newEvt = db.createEvent({
        id: evtId,
        title: item.title,
        description: item.reason ? `AI Auto-Scheduled: ${item.reason}` : 'Xếp lịch bởi AI',
        start_time: item.start_time,
        end_time: item.end_time,
        category: item.category || 'work',
        color: item.color || '#10B981',
        reminder_minutes: 15
      });

      if (item.taskId) {
        const t = db.getTaskById(item.taskId);
        if (t) {
          db.updateTask(item.taskId, { ...t, scheduled_event_id: evtId, status: 'in_progress' });
        }
      }

      createdEvents.push(newEvt);
    }

    res.json({ success: true, data: createdEvents });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
