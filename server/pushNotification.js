const axios = require('axios');
const db = require('./db');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Gửi thông báo đẩy tới tất cả các thiết bị iPhone đã đăng ký
 * @param {Object} options
 * @param {string} options.title Tiêu đề thông báo
 * @param {string} options.body Nội dung thông báo
 * @param {Object} [options.data] Dữ liệu đính kèm
 * @param {string} [options.sound] Âm thanh thông báo (mặc định 'default')
 */
async function sendPushNotification({ title, body, data = {}, sound = 'default' }) {
  try {
    const tokens = db.getPushTokens();
    if (!tokens || tokens.length === 0) {
      console.log('[Push] Chưa có thiết bị iPhone nào đăng ký nhận thông báo.');
      return { success: false, reason: 'no_tokens', count: 0 };
    }

    const messages = tokens.map(t => ({
      to: t.token,
      sound: sound,
      title: title,
      body: body,
      data: data,
      priority: 'high',
      channelId: 'default'
    }));

    console.log(`[Push] Đang gửi thông báo tới ${messages.length} thiết bị: "${title}"`);

    const response = await axios.post(EXPO_PUSH_URL, messages, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('[Push] Kết quả gửi thành công:', response.data);
    return { success: true, count: messages.length, data: response.data };
  } catch (err) {
    console.error('[Push] Lỗi gửi Push Notification:', err.response?.data || err.message);
    return { success: false, error: err.response?.data || err.message };
  }
}

module.exports = {
  sendPushNotification
};
