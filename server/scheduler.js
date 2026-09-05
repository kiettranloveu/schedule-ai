const cron = require('node-cron');
const db = require('./db');
const { getGoldPrices } = require('./scrapers/goldPrice');
const { getWeather } = require('./scrapers/weather');
const { getLatestNews } = require('./scrapers/news');
const gemini = require('./gemini');
const discordBot = require('./discordBot');
const pushNotification = require('./pushNotification');

let activeCronTasks = [];

/**
 * Thực thi một tác vụ lặp lại (dùng cho cả cron tự động và nút Test Run)
 */
async function executeJob(job) {
  const runId = 'log-' + Date.now();
  console.log(`[Scheduler] Đang thực thi tác vụ: "${job.name}" (Loại: ${job.type})`);

  try {
    let embedOptions = {};
    let preview = '';
    let pushTitle = `🔔 ${job.name}`;
    let pushBody = '';

    if (job.type === 'gold') {
      const goldData = await getGoldPrices();
      const commentary = await gemini.analyzeGoldPrices(goldData, job.prompt);

      embedOptions = {
        color: '#F59E0B',
        title: `🪙 ${job.name.toUpperCase()}`,
        description: goldData.summaryText,
        fields: [
          { name: '💡 Phân tích & Nhận định từ AI', value: commentary },
          { name: '📊 Nguồn dữ liệu', value: `${goldData.source} • Cập nhật: ${goldData.updated_at}`, inline: true }
        ],
        footer: 'ScheduleAI • Báo Cáo Giá Vàng Tự Động'
      };
      preview = `Giá vàng ${goldData.updated_at}: ${goldData.data[0]?.type} Mua ${goldData.data[0]?.buy} / Bán ${goldData.data[0]?.sell}`;
      pushTitle = '🪙 BẢNG GIÁ VÀNG HÔM NAY';
      pushBody = preview + (commentary ? ` • AI: ${commentary.slice(0, 100)}...` : '');
    } else if (job.type === 'weather') {
      const city = db.getSetting('weather_city') || 'Hà Nội';
      const weatherData = await getWeather(city);
      const advice = await gemini.analyzeWeather(weatherData, job.prompt);

      embedOptions = {
        color: '#0EA5E9',
        title: `⛅ ${job.name.toUpperCase()} - ${weatherData.city}`,
        description: weatherData.summaryText,
        fields: [
          { name: '✨ Khuyến nghị ngày mới từ AI', value: advice }
        ],
        footer: 'ScheduleAI • Bản Tin Thời Tiết Tự Động'
      };
      preview = `${weatherData.city}: ${weatherData.temp}°C, ${weatherData.condition}`;
      pushTitle = `⛅ BẢN TIN THỜI TIẾT - ${weatherData.city.toUpperCase()}`;
      pushBody = `${preview}. ${advice ? advice.slice(0, 120) : ''}`;
    } else if (job.type === 'daily_briefing') {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayEvents = db.getEvents().filter(e => e.start_time.startsWith(todayStr));
      const pendingTasks = db.getTasks('todo');

      let scheduleText = '';
      if (todayEvents.length === 0) {
        scheduleText = '• Hôm nay không có sự kiện cố định nào trên lịch.\n';
      } else {
        todayEvents.forEach(e => {
          const t = new Date(e.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          scheduleText += `• ⏰ **${t}**: ${e.title} *(${e.category})*\n`;
        });
      }

      let tasksText = '';
      if (pendingTasks.length === 0) {
        tasksText = '• Danh sách công việc đang trống. Bạn đã hoàn thành hết mục tiêu!\n';
      } else {
        pendingTasks.slice(0, 6).forEach(t => {
          const pEmoji = t.priority === 'urgent' ? '🔴' : t.priority === 'high' ? '🟠' : '🔵';
          tasksText += `• ${pEmoji} [${t.priority.toUpperCase()}] ${t.title}\n`;
        });
      }

      embedOptions = {
        color: '#8B5CF6',
        title: `📋 ${job.name.toUpperCase()} (${new Date().toLocaleDateString('vi-VN')})`,
        description: `Chúc bạn một ngày mới ngập tràn năng lượng và làm việc năng suất! Dưới đây là chương trình nghị sự của bạn:`,
        fields: [
          { name: '📅 Sự kiện trên lịch hôm nay', value: scheduleText },
          { name: '✅ Công việc ưu tiên cần xử lý', value: tasksText }
        ],
        footer: 'ScheduleAI • Trợ Lý Kế Hoạch Cá Nhân'
      };
      preview = `Hôm nay: ${todayEvents.length} sự kiện, ${pendingTasks.length} việc cần làm`;
      pushTitle = '📋 LỊCH TRÌNH VÀ CÔNG VIỆC HÔM NAY';
      pushBody = preview;
    } else if (job.type === 'news') {
      const articles = await getLatestNews();
      const newsContent = await gemini.generateNewsBriefing(articles, job.prompt);
      embedOptions = {
        color: '#10B981',
        title: `📰 ${job.name.toUpperCase()}`,
        description: newsContent,
        footer: 'ScheduleAI • Điểm Tin Chuyên Sâu Tự Động'
      };
      preview = `Đã phân tích ${articles.length} tin tức nóng`;
      pushTitle = '📰 ĐIỂM TIN CÔNG NGHỆ BUỔI SÁNG';
      pushBody = newsContent.slice(0, 150) + '...';
    } else {
      // Custom AI task
      const res = await gemini.callGemini(job.prompt || 'Hãy tạo một thông điệp ý nghĩa cho ngày hôm nay.');
      embedOptions = {
        color: '#6366F1',
        title: `🤖 ${job.name}`,
        description: res.success ? res.text : (res.error || 'Nội dung tạo từ AI'),
        footer: 'ScheduleAI Custom AI Task'
      };
      preview = res.success ? res.text.substring(0, 100) + '...' : 'Thực thi tùy chỉnh';
      pushTitle = `🤖 ${job.name}`;
      pushBody = preview;
    }

    // 1. Gửi thông báo Push Notification tới iPhone
    try {
      await pushNotification.sendPushNotification({
        title: pushTitle,
        body: pushBody || preview,
        data: { type: job.type, jobId: job.id }
      });
    } catch (e) {
      console.warn('[Scheduler] Lỗi gửi push notification tới iPhone:', e.message);
    }

    // 2. Gửi thông báo sang Discord (nếu có cấu hình)
    try {
      await discordBot.sendDiscordNotification(embedOptions);
    } catch (e) {
      console.warn('[Scheduler] Gửi Discord không thành công (có thể chưa cấu hình):', e.message);
    }

    // Ghi log thành công
    db.addJobLog({
      id: runId,
      job_id: job.id,
      job_name: job.name,
      status: 'success',
      message: 'Đã thực thi và gửi thông báo thành công (iPhone & Discord).',
      preview
    });
    db.updateJobRunStatus(job.id, 'success', preview);
    return { success: true, message: 'Đã thực thi tác vụ thành công!' };
  } catch (err) {
    console.error(`[Scheduler] Lỗi khi chạy job "${job.name}":`, err.message);
    db.addJobLog({
      id: runId,
      job_id: job.id,
      job_name: job.name,
      status: 'error',
      message: err.message,
      preview: 'Thực thi thất bại'
    });
    db.updateJobRunStatus(job.id, 'error', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Kiểm tra các sự kiện sắp diễn ra trước 15 phút và gửi thông báo nhắc nhở
 */
async function checkUpcomingEvents() {
  const enabled = db.getSetting('notification_reminders');
  if (enabled === '0' || enabled === 'false') return;

  try {
    const allEvents = db.getEvents();
    const now = new Date();

    for (const event of allEvents) {
      if (event.reminded === 1) continue;

      const eventStart = new Date(event.start_time);
      const diffMinutes = (eventStart.getTime() - now.getTime()) / (1000 * 60);

      const reminderWindow = event.reminder_minutes || 15;

      // Nếu sự kiện sắp diễn ra trong khoảng [0, reminderWindow] phút
      if (diffMinutes > 0 && diffMinutes <= reminderWindow) {
        console.log(`[Scheduler] Gửi nhắc nhở cho sự kiện: "${event.title}" (còn ${Math.round(diffMinutes)} phút)`);
        
        // 1. Gửi Push Notification tới iPhone
        await pushNotification.sendPushNotification({
          title: '⏰ NHẮC LỊCH SẮP DIỄN RA!',
          body: `"${event.title}" sẽ bắt đầu trong ${Math.round(diffMinutes)} phút nữa!`,
          data: { type: 'event_reminder', eventId: event.id }
        }).catch(() => {});

        // 2. Gửi Discord (nếu có)
        await discordBot.sendEventReminder(event).catch(() => {});
        
        db.markEventReminded(event.id);
      }
    }
  } catch (err) {
    // Không làm gián đoạn nếu chưa cấu hình
  }
}

/**
 * Nạp lại toàn bộ cron jobs
 */
function reloadScheduler() {
  // Hủy các cron job cũ
  activeCronTasks.forEach(t => t.stop());
  activeCronTasks = [];

  const jobs = db.getRecurringJobs();
  jobs.forEach(job => {
    if (!job.is_active) return;
    if (!cron.validate(job.cron_expr)) {
      console.warn(`[Scheduler] Biểu thức cron không hợp lệ cho job "${job.name}": ${job.cron_expr}`);
      return;
    }

    const task = cron.schedule(job.cron_expr, () => {
      executeJob(job);
    }, {
      timezone: 'Asia/Bangkok'
    });

    activeCronTasks.push(task);
  });

  console.log(`[Scheduler] Đã kích hoạt ${activeCronTasks.length} tác vụ định kỳ tự động.`);
}

/**
 * Khởi động scheduler engine
 */
function initScheduler() {
  reloadScheduler();

  // Chạy kiểm tra nhắc nhở sự kiện mỗi phút 1 lần
  cron.schedule('* * * * *', () => {
    checkUpcomingEvents();
  });
}

module.exports = {
  initScheduler,
  reloadScheduler,
  executeJob
};
