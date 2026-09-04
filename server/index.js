require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const eventsRouter = require('./routes/events');
const tasksRouter = require('./routes/tasks');
const recurringRouter = require('./routes/recurring');
const settingsRouter = require('./routes/settings');

const discordBot = require('./discordBot');
const scheduler = require('./scheduler');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/events', eventsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/recurring', recurringRouter);
app.use('/api/settings', settingsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'ScheduleAI Backend', time: new Date().toISOString() });
});

// Phục vụ frontend nếu đã build
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Khởi động Server
app.listen(PORT, async () => {
  console.log(`================================================`);
  console.log(`🚀 ScheduleAI Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`================================================`);

  // Khởi động Discord Bot
  try {
    await discordBot.initDiscordBot();
  } catch (err) {
    console.error('[DiscordBot] Khởi động thất bại:', err.message);
  }

  // Khởi động Cron Scheduler
  try {
    scheduler.initScheduler();
  } catch (err) {
    console.error('[Scheduler] Khởi động thất bại:', err.message);
  }
});
