const { Client, GatewayIntentBits, EmbedBuilder, Partials } = require('discord.js');
const db = require('./db');
const { getGoldPrices } = require('./scrapers/goldPrice');
const { getWeather } = require('./scrapers/weather');
const { getLatestNews } = require('./scrapers/news');
const gemini = require('./gemini');

let client = null;
let botStatus = {
  connected: false,
  username: null,
  channelId: null,
  lastError: null
};

/**
 * Khởi tạo hoặc khởi động lại Discord Bot
 */
async function initDiscordBot() {
  const token = db.getSetting('discord_bot_token') || process.env.DISCORD_BOT_TOKEN;
  const channelId = db.getSetting('discord_channel_id') || process.env.DISCORD_CHANNEL_ID;

  botStatus.channelId = channelId || null;

  if (!token) {
    botStatus.connected = false;
    botStatus.username = null;
    botStatus.lastError = 'Chưa cấu hình Discord Bot Token trong Cài đặt.';
    console.log('[DiscordBot] Chưa có token. Chờ người dùng cấu hình.');
    return;
  }

  // If client already exists, destroy first
  if (client) {
    try {
      await client.destroy();
    } catch (e) {
      // ignore
    }
  }

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel]
  });

  client.on('ready', () => {
    botStatus.connected = true;
    botStatus.username = client.user.tag;
    botStatus.lastError = null;
    console.log(`[DiscordBot] Đã kết nối thành công: ${client.user.tag}`);
  });

  client.on('error', (err) => {
    console.error('[DiscordBot] Lỗi kết nối:', err.message);
    botStatus.lastError = err.message;
  });

  // Lắng nghe tin nhắn 2 chiều
  client.on('messageCreate', async (message) => {
    // Không phản hồi bot khác
    if (message.author.bot) return;

    const content = message.content.trim();
    const lower = content.toLowerCase();

    // Kiểm tra xem tin nhắn có gửi trong channel cấu hình hoặc tag bot hoặc nhắn DM
    const targetChannel = db.getSetting('discord_channel_id');
    const isTargetChannel = targetChannel && message.channel.id === targetChannel;
    const isMentioned = client.user && message.mentions.has(client.user);

    if (!isTargetChannel && !isMentioned) {
      return;
    }

    try {
      // 1. Lệnh xem lịch hôm nay
      if (lower.startsWith('/today') || lower === '!today' || lower.includes('lịch hôm nay') || lower.includes('hôm nay có việc gì')) {
        await handleTodaySchedule(message);
        return;
      }

      // 2. Lệnh tra giá vàng tức thì
      if (lower.startsWith('/gold') || lower === '!gold' || lower.includes('giá vàng')) {
        await message.channel.sendTyping();
        const goldData = await getGoldPrices();
        const commentary = await gemini.analyzeGoldPrices(goldData);

        const embed = new EmbedBuilder()
          .setColor('#F59E0B')
          .setTitle('🪙 BẢNG GIÁ VÀNG VIỆT NAM HÔM NAY')
          .setDescription(goldData.summaryText)
          .addFields({ name: '💡 Nhận định từ AI', value: commentary || 'Thị trường vàng duy trì biến động theo xu hướng thế giới.' })
          .setFooter({ text: `Nguồn: ${goldData.source} • ScheduleAI` })
          .setTimestamp();

        await message.reply({ embeds: [embed] });
        return;
      }

      // 3. Lệnh tra thời tiết tức thì
      if (lower.startsWith('/weather') || lower === '!weather' || lower.includes('thời tiết')) {
        await message.channel.sendTyping();
        const city = db.getSetting('weather_city') || 'Hà Nội';
        const weatherData = await getWeather(city);
        const commentary = await gemini.analyzeWeather(weatherData);

        const embed = new EmbedBuilder()
          .setColor('#0EA5E9')
          .setTitle(`⛅ BẢN TIN THỜI TIẾT - ${weatherData.city.toUpperCase()}`)
          .setDescription(weatherData.summaryText)
          .addFields({ name: '✨ Lời khuyên ScheduleAI', value: commentary })
          .setTimestamp();

        await message.reply({ embeds: [embed] });
        return;
      }

      // 3.5. Lệnh điểm tin công nghệ tức thì
      if (lower.startsWith('/news') || lower === '!news' || lower.includes('điểm tin') || lower.includes('tin tức')) {
        await message.channel.sendTyping();
        const articles = await getLatestNews();
        const newsContent = await gemini.generateNewsBriefing(articles);

        const embed = new EmbedBuilder()
          .setColor('#10B981')
          .setTitle('📰 BẢN TIN CÔNG NGHỆ & AI CHUYÊN SÂU')
          .setDescription(newsContent.substring(0, 4000))
          .setFooter({ text: 'ScheduleAI • Điểm Tin Tự Động' })
          .setTimestamp();

        await message.reply({ embeds: [embed] });
        return;
      }

      // 4. Lệnh thêm sự kiện bằng ngôn ngữ tự nhiên
      // Ví dụ: "thêm lịch chiều mai 15h họp với khách hàng" hoặc "nhắc tôi tối nay 8h tập gym"
      if (lower.startsWith('thêm lịch') || lower.startsWith('tạo lịch') || lower.startsWith('hẹn') || lower.startsWith('nhắc tôi') || lower.startsWith('/add')) {
        await message.channel.sendTyping();
        const cleanText = content.replace(/^(\/add|thêm lịch|tạo lịch|hẹn|nhắc tôi)\s*/i, '');
        const parsed = await gemini.parseNaturalEvent(cleanText);

        const newId = 'evt-' + Date.now();
        const savedEvent = db.createEvent({
          id: newId,
          title: parsed.title,
          description: parsed.description || 'Thêm qua Discord Bot',
          start_time: parsed.start_time,
          end_time: parsed.end_time,
          category: parsed.category || 'work',
          color: parsed.color || '#3B82F6',
          reminder_minutes: parsed.reminder_minutes || 15
        });

        const embed = new EmbedBuilder()
          .setColor('#10B981')
          .setTitle('✅ ĐÃ THÊM SỰ KIỆN VÀO LỊCH CỦA BẠN')
          .addFields(
            { name: '📌 Tiêu đề', value: savedEvent.title, inline: true },
            { name: '🏷️ Phân loại', value: savedEvent.category, inline: true },
            { name: '⏰ Bắt đầu', value: new Date(savedEvent.start_time).toLocaleString('vi-VN'), inline: false },
            { name: '🏁 Kết thúc', value: new Date(savedEvent.end_time).toLocaleString('vi-VN'), inline: false },
            { name: '🔔 Nhắc trước', value: `${savedEvent.reminder_minutes} phút`, inline: true }
          )
          .setFooter({ text: 'Xem chi tiết trên ứng dụng Web ScheduleAI' })
          .setTimestamp();

        await message.reply({ embeds: [embed] });
        return;
      }

      // 5. Trả lời đối thoại thông minh chung
      if (isMentioned || isTargetChannel) {
        await message.channel.sendTyping();
        const aiPrompt = `Người dùng hỏi trên Discord: "${content}". Hãy trả lời ngắn gọn, thân thiện và hữu ích bằng tiếng Việt với vai trò là trợ lý ScheduleAI.`;
        const res = await gemini.callGemini(aiPrompt);
        if (res.success && res.text) {
          await message.reply(res.text);
        }
      }
    } catch (err) {
      console.error('[DiscordBot] Message handling error:', err);
      await message.reply(`⚠️ Đã xảy ra lỗi khi xử lý yêu cầu: ${err.message}`).catch(() => {});
    }
  });

  try {
    await client.login(token);
  } catch (err) {
    console.error('[DiscordBot] Login error:', err.message);
    botStatus.connected = false;
    botStatus.lastError = err.message;
  }
}

/**
 * Xử lý xem lịch trình hôm nay
 */
async function handleTodaySchedule(message) {
  const todayStr = new Date().toISOString().split('T')[0];
  const allEvents = db.getEvents();
  const todayEvents = allEvents.filter(e => e.start_time.startsWith(todayStr));
  const tasks = db.getTasks('todo');

  let desc = `📅 **Hôm nay (${new Date().toLocaleDateString('vi-VN')}):**\n\n`;

  if (todayEvents.length === 0) {
    desc += '✨ Không có sự kiện cố định nào trong ngày hôm nay. Bạn có thời gian tự do!\n';
  } else {
    desc += '**Các sự kiện trong ngày:**\n';
    todayEvents.forEach(e => {
      const timeStr = new Date(e.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      desc += `• ⏰ **${timeStr}**: ${e.title} *(${e.category})*\n`;
    });
  }

  if (tasks.length > 0) {
    desc += '\n**📋 Việc cần làm ưu tiên:**\n';
    tasks.slice(0, 5).forEach(t => {
      const pEmoji = t.priority === 'urgent' ? '🔴' : t.priority === 'high' ? '🟠' : '🔵';
      desc += `• ${pEmoji} [${t.priority.toUpperCase()}] ${t.title}\n`;
    });
  }

  const embed = new EmbedBuilder()
    .setColor('#6366F1')
    .setTitle('📋 LỊCH TRÌNH VÀ CÔNG VIỆC HÔM NAY')
    .setDescription(desc)
    .setFooter({ text: 'ScheduleAI • Quản lý công việc thông minh' })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}

/**
 * Gửi thông báo Rich Embed tới Channel mặc định
 */
async function sendDiscordNotification(embedOptions) {
  if (!client || !client.isReady()) {
    throw new Error('Discord Bot chưa kết nối. Vui lòng kiểm tra Token trong Cài đặt.');
  }

  const channelId = db.getSetting('discord_channel_id') || process.env.DISCORD_CHANNEL_ID;
  if (!channelId) {
    throw new Error('Chưa cấu hình Discord Channel ID.');
  }

  const channel = await client.channels.fetch(channelId).catch(err => {
    throw new Error(`Không tìm thấy kênh Discord (${channelId}): ${err.message}`);
  });

  const embed = new EmbedBuilder()
    .setColor(embedOptions.color || '#3B82F6')
    .setTitle(embedOptions.title || 'ScheduleAI Thông Báo')
    .setDescription(embedOptions.description || '')
    .setTimestamp();

  if (embedOptions.fields && Array.isArray(embedOptions.fields)) {
    embed.addFields(embedOptions.fields);
  }

  if (embedOptions.footer) {
    embed.setFooter({ text: embedOptions.footer });
  }

  return await channel.send({ embeds: [embed] });
}

/**
 * Gửi nhắc nhở sự kiện trước 15 phút
 */
async function sendEventReminder(event) {
  const timeStr = new Date(event.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return sendDiscordNotification({
    color: '#EF4444',
    title: `🔔 NHẮC NHỞ LỊCH TRÌNH SẮP DIỄN RA!`,
    description: `Sự kiện **${event.title}** sẽ bắt đầu trong ít phút nữa!`,
    fields: [
      { name: '⏰ Thời gian', value: timeStr, inline: true },
      { name: '🏷️ Phân loại', value: event.category || 'Công việc', inline: true },
      { name: '📝 Chi tiết', value: event.description || 'Không có mô tả thêm' }
    ],
    footer: 'ScheduleAI Tự Động Nhắc Việc'
  });
}

/**
 * Test gửi tin nhắn thử nghiệm
 */
async function testDiscordConnection(token, channelId) {
  if (!token || !channelId) {
    return { success: false, error: 'Thiếu Token hoặc Channel ID.' };
  }

  const testClient = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
  });

  try {
    await testClient.login(token);
    const channel = await testClient.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      await testClient.destroy();
      return { success: false, error: 'Channel ID không hợp lệ hoặc không phải là kênh text.' };
    }

    const embed = new EmbedBuilder()
      .setColor('#10B981')
      .setTitle('🎉 KẾT NỐI SCHEDULEAI THÀNH CÔNG!')
      .setDescription('Discord Bot đã kết nối thành công với ứng dụng ScheduleAI của bạn. Các báo cáo định kỳ (giá vàng, thời tiết, nhắc việc) sẽ được gửi tại kênh này.')
      .setFooter({ text: 'ScheduleAI by Antigravity' })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    await testClient.destroy();
    return { success: true, message: 'Đã gửi tin nhắn thử nghiệm thành công!' };
  } catch (err) {
    try { await testClient.destroy(); } catch (e) {}
    return { success: false, error: err.message };
  }
}

function getBotStatus() {
  if (client) {
    botStatus.connected = client.isReady();
  }
  return botStatus;
}

module.exports = {
  initDiscordBot,
  sendDiscordNotification,
  sendEventReminder,
  testDiscordConnection,
  getBotStatus
};
