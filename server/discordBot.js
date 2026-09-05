const { Client, GatewayIntentBits, EmbedBuilder, Partials } = require('discord.js');
const axios = require('axios');
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
  const token = (db.getSetting('discord_bot_token') || process.env.DISCORD_BOT_TOKEN || '').trim();
  const channelId = (db.getSetting('discord_channel_id') || process.env.DISCORD_CHANNEL_ID || '').trim();

  botStatus.channelId = channelId || null;

  if (!token) {
    botStatus.connected = false;
    botStatus.username = null;
    botStatus.lastError = 'Chưa cấu hình Discord Bot Token trong Cài đặt.';
    console.log('[DiscordBot] Chưa có token. Chờ người dùng cấu hình.');
    return;
  }

  // 1. Kiểm tra nhanh tính hợp lệ của token qua REST API trước khi kết nối Gateway
  try {
    const userRes = await axios.get('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bot ${token}` },
      timeout: 5000
    });
    botStatus.username = `${userRes.data.username}#${userRes.data.discriminator || '0'}`;
  } catch (err) {
    botStatus.connected = false;
    botStatus.username = null;
    if (err.response?.status === 401) {
      botStatus.lastError = 'Token Discord không hợp lệ hoặc đã bị Reset trên Discord Developer Portal.';
    } else {
      botStatus.lastError = `Lỗi xác thực Bot Token: ${err.message}`;
    }
    console.warn('[DiscordBot] Token không hợp lệ:', botStatus.lastError);
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
    if (err.message && err.message.includes('DisallowedIntents')) {
      botStatus.lastError = 'Cần bật "MESSAGE CONTENT INTENT" trên Discord Developer Portal (mục Bot).';
    } else {
      botStatus.lastError = err.message;
    }
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
 * Gửi thông báo Rich Embed tới Channel mặc định (hỗ trợ WebSocket & REST API Fallback)
 */
async function sendDiscordNotification(embedOptions) {
  const token = (db.getSetting('discord_bot_token') || process.env.DISCORD_BOT_TOKEN || '').trim();
  const channelId = (db.getSetting('discord_channel_id') || process.env.DISCORD_CHANNEL_ID || '').trim();

  if (!token || !channelId) {
    throw new Error('Chưa cấu hình Discord Bot Token hoặc Channel ID.');
  }

  // 1. Gửi qua WebSocket Client nếu đang ready
  if (client && client.isReady()) {
    try {
      const channel = await client.channels.fetch(channelId);
      if (channel && channel.isTextBased()) {
        const embed = new EmbedBuilder()
          .setColor(embedOptions.color || '#3B82F6')
          .setTitle(embedOptions.title || 'ScheduleAI Thông Báo')
          .setDescription(embedOptions.description || '')
          .setTimestamp();

        if (embedOptions.fields && Array.isArray(embedOptions.fields)) {
          embed.addFields(embedOptions.fields);
        }

        if (embedOptions.footer) {
          const footerText = typeof embedOptions.footer === 'object' ? embedOptions.footer.text : embedOptions.footer;
          embed.setFooter({ text: footerText });
        }

        return await channel.send({ embeds: [embed] });
      }
    } catch (e) {
      console.warn('[DiscordBot] Gửi qua WebSocket gặp lỗi, chuyển sang REST API:', e.message);
    }
  }

  // 2. Fallback gửi trực tiếp qua Discord REST API (cực kỳ ổn định)
  let colorInt = 0x3B82F6;
  if (embedOptions.color) {
    const hex = embedOptions.color.replace('#', '');
    colorInt = parseInt(hex, 16) || 0x3B82F6;
  }

  const embed = {
    color: colorInt,
    title: embedOptions.title || 'ScheduleAI Thông Báo',
    description: embedOptions.description || '',
    fields: embedOptions.fields || [],
    footer: embedOptions.footer ? (typeof embedOptions.footer === 'object' ? embedOptions.footer : { text: embedOptions.footer }) : undefined,
    timestamp: new Date().toISOString()
  };

  const res = await axios.post(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    embeds: [embed]
  }, {
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json'
    },
    timeout: 8000
  });

  return res.data;
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
 * Test kết nối Discord & gửi tin nhắn thử nghiệm (Dùng REST API: phản hồi tức thì < 300ms, không treo Timeout)
 */
async function testDiscordConnection(token, channelId) {
  const cleanToken = (token || '').trim();
  const cleanChannelId = (channelId || '').trim();

  if (!cleanToken || !cleanChannelId) {
    return { success: false, error: 'Vui lòng nhập đầy đủ Discord Bot Token và Channel ID.' };
  }

  // 1. Kiểm tra Token qua REST API
  let botUser = null;
  try {
    const userRes = await axios.get('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bot ${cleanToken}` },
      timeout: 6000
    });
    botUser = userRes.data;
  } catch (err) {
    const status = err.response?.status;
    if (status === 401) {
      return {
        success: false,
        error: 'Token Discord không hợp lệ hoặc đã bị Reset trên Discord Developer Portal. Vui lòng vào Developer Portal (mục Bot) bấm Copy Token mới và dán lại.'
      };
    }
    if (status === 429) {
      const retryAfter = err.response?.data?.retry_after || err.response?.headers?.['retry-after'];
      const waitSeconds = retryAfter ? Math.ceil(Number(retryAfter)) : 'vài chục';
      return {
        success: false,
        error: `Discord đang tạm thời giới hạn IP (Rate Limit 429) do gửi nhiều lần thử liên tiếp. Vui lòng đợi khoảng ${waitSeconds} giây (hoặc đổi sang mạng 4G) rồi thử lại.`
      };
    }
    return {
      success: false,
      error: `Lỗi xác thực Bot Token (${status || 'Mạng'}): ${err.response?.data?.message || err.message}`
    };
  }

  // 2. Gửi tin nhắn thử nghiệm trực tiếp qua REST API
  try {
    const embed = {
      color: 0x10B981,
      title: '🎉 KẾT NỐI SCHEDULEAI THÀNH CÔNG!',
      description: `Discord Bot (**${botUser.username}#${botUser.discriminator || '0'}**) đã kết nối thành công với ứng dụng ScheduleAI!\n\nCác thông báo tự động (giá vàng, thời tiết, sự kiện) sẽ được gửi đến kênh này.`,
      footer: { text: 'ScheduleAI by Antigravity' },
      timestamp: new Date().toISOString()
    };

    await axios.post(`https://discord.com/api/v10/channels/${cleanChannelId}/messages`, {
      embeds: [embed]
    }, {
      headers: {
        Authorization: `Bot ${cleanToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 8000
    });

    return {
      success: true,
      message: `Đã kết nối thành công với Bot "${botUser.username}" và bắn tin nhắn thử nghiệm lên Discord!`
    };
  } catch (err) {
    const status = err.response?.status;
    const msg = err.response?.data?.message || err.message;
    if (status === 429) {
      const retryAfter = err.response?.data?.retry_after || err.response?.headers?.['retry-after'];
      const waitSeconds = retryAfter ? Math.ceil(Number(retryAfter)) : 'vài chục';
      return {
        success: false,
        error: `Discord đang tạm thời giới hạn IP gửi tin (Rate Limit 429). Vui lòng đợi khoảng ${waitSeconds} giây rồi thử lại.`
      };
    }
    if (status === 403) {
      return {
        success: false,
        error: `Bot "${botUser.username}" chưa có quyền gửi tin trong kênh này (Missing Permissions: Send Messages / Embed Links). Vui lòng cấp quyền cho Bot trong Discord Server.`
      };
    }
    if (status === 404) {
      return {
        success: false,
        error: `Không tìm thấy kênh với ID: ${cleanChannelId}. Vui lòng kiểm tra lại Channel ID (đảm bảo Bot đã được mời vào Server).`
      };
    }
    return {
      success: false,
      error: `Lỗi gửi tin tới kênh (${status}): ${msg}`
    };
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
