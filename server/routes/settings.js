const express = require('express');
const router = express.Router();
const db = require('../db');
const discordBot = require('../discordBot');
const gemini = require('../gemini');
const scheduler = require('../scheduler');

// Lấy toàn bộ cấu hình
router.get('/', (req, res) => {
  try {
    const settings = db.getAllSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Lưu cấu hình
router.post('/', async (req, res) => {
  try {
    const {
      ai_provider,
      gemini_api_key,
      groq_api_key,
      groq_model,
      openrouter_api_key,
      openrouter_model,
      xkiro_api_key,
      xkiro_base_url,
      xkiro_model,
      discord_bot_token,
      discord_channel_id,
      weather_city,
      notification_reminders
    } = req.body;

    const currentToken = db.getSetting('discord_bot_token');
    const tokenChanged = discord_bot_token && discord_bot_token !== currentToken;

    db.saveSettings({
      ai_provider: ai_provider || 'groq',
      gemini_api_key: gemini_api_key || '',
      groq_api_key: groq_api_key || '',
      groq_model: groq_model || 'llama-3.3-70b-versatile',
      openrouter_api_key: openrouter_api_key || '',
      openrouter_model: openrouter_model || 'meta-llama/llama-3.3-70b-instruct:free',
      xkiro_api_key: xkiro_api_key || '',
      xkiro_base_url: xkiro_base_url || 'https://api.xkiro.com/v1',
      xkiro_model: xkiro_model || 'deepseek-chat',
      discord_bot_token: discord_bot_token || '',
      discord_channel_id: discord_channel_id || '',
      weather_city: weather_city || 'Hà Nội',
      notification_reminders: notification_reminders !== undefined ? (notification_reminders ? '1' : '0') : '1'
    });

    // Nếu token hoặc channel ID thay đổi, khởi động lại Discord Bot
    if (tokenChanged || discord_channel_id) {
      discordBot.initDiscordBot().catch(e => console.error('[Settings] Reconnect bot error:', e.message));
    }

    scheduler.reloadScheduler();

    res.json({ success: true, message: 'Đã lưu cấu hình thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Trạng thái hệ thống
router.get('/status', (req, res) => {
  try {
    const botStatus = discordBot.getBotStatus();
    const provider = db.getSetting('ai_provider') || 'groq';
    const hasGemini = Boolean(db.getSetting('gemini_api_key') || process.env.GEMINI_API_KEY);
    const hasGroq = Boolean(db.getSetting('groq_api_key') || process.env.GROQ_API_KEY);
    const hasOpenRouter = Boolean(db.getSetting('openrouter_api_key') || process.env.OPENROUTER_API_KEY);
    const hasXKiro = Boolean(db.getSetting('xkiro_api_key') || process.env.XKIRO_API_KEY);
    
    let isAiReady = false;
    let currentModel = 'Chưa chọn';

    if (provider === 'groq') {
      isAiReady = hasGroq;
      currentModel = db.getSetting('groq_model') || 'Llama 3.3 70B (Groq)';
    } else if (provider === 'openrouter') {
      isAiReady = hasOpenRouter;
      currentModel = db.getSetting('openrouter_model') || 'Llama 3.3 Free (OpenRouter)';
    } else if (provider === 'xkiro') {
      isAiReady = hasXKiro;
      currentModel = db.getSetting('xkiro_model') || 'DeepSeek V3';
    } else {
      isAiReady = hasGemini;
      currentModel = 'Google Gemini';
    }

    const channelId = db.getSetting('discord_channel_id');

    res.json({
      success: true,
      data: {
        discord: {
          connected: botStatus.connected,
          username: botStatus.username,
          channelId: channelId,
          error: botStatus.lastError
        },
        ai: {
          ready: isAiReady,
          provider: provider,
          model: currentModel
        },
        gemini: {
          ready: isAiReady
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Kiểm tra kết nối Gemini API
router.post('/test-gemini', async (req, res) => {
  try {
    const { apiKey } = req.body;
    const testKey = (apiKey || db.getSetting('gemini_api_key') || process.env.GEMINI_API_KEY || '').trim();

    if (!testKey) {
      return res.status(400).json({ success: false, error: 'Chưa có Gemini API Key để kiểm tra.' });
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const ai = new GoogleGenerativeAI(testKey);

    const candidates = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro',
      'gemini-pro'
    ];

    // Làm sạch key (bỏ khoảng trắng, dấu ngoặc kép nếu có)
    const cleanKey = testKey.trim().replace(/^["']|["']$/g, '');

    const axios = require('axios');
    let listModelsError = null;
    let availableModels = [];

    // 1. Kiểm tra danh sách models qua endpoint v1beta và v1
    for (const apiVer of ['v1beta', 'v1']) {
      try {
        const listRes = await axios.get(`https://generativelanguage.googleapis.com/${apiVer}/models?key=${cleanKey}`, { timeout: 8000 });
        if (listRes.data && Array.isArray(listRes.data.models)) {
          const matched = listRes.data.models
            .filter(m => !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent'))
            .map(m => m.name.replace(/^models\//, ''));

          if (matched.length > 0) {
            availableModels = matched;
            console.log(`[Gemini] Tìm thấy ${matched.length} models từ ${apiVer}:`, matched.slice(0, 5));
            break;
          }
        }
      } catch (err) {
        listModelsError = err.response?.data || err.message;
        console.warn(`[Gemini] Lỗi kiểm tra ${apiVer}/models:`, listModelsError);
      }
    }

    // Nếu không lấy được model nào và có lỗi từ Google API
    if (availableModels.length === 0 && listModelsError) {
      const errDetail = typeof listModelsError === 'object' ? JSON.stringify(listModelsError) : String(listModelsError);
      return res.status(400).json({
        success: false,
        error: `Google API trả về lỗi: ${errDetail}. Vui lòng kiểm tra lại xem API Key có đúng lấy từ Google AI Studio (aistudio.google.com) và dịch vụ Generative Language API đã được bật chưa.`
      });
    }

    const testCandidates = [
      ...availableModels,
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'gemini-2.5-flash',
      'gemini-1.5-pro',
      'gemini-pro'
    ];

    const uniqueCandidates = [...new Set(testCandidates)];
    let successResponse = null;
    let usedModel = null;
    let lastError = null;

    for (const modelName of uniqueCandidates) {
      try {
        const model = ai.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Xin chào! Hãy phản hồi: Kết nối thành công.');
        successResponse = result.response.text().trim();
        usedModel = modelName;
        break;
      } catch (err) {
        lastError = err;
        console.warn(`[Gemini] Thử model ${modelName} thất bại:`, err.message);
      }
    }

    if (successResponse) {
      res.json({
        success: true,
        message: `Kết nối Gemini API thành công! (Model: ${usedModel})`,
        response: successResponse
      });
    } else {
      res.status(500).json({
        success: false,
        error: `Lỗi kết nối Gemini: ${lastError?.message || 'Không tìm thấy model phù hợp cho API Key này'}`
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: `Lỗi kết nối Gemini: ${err.message}` });
  }
});

// Kiểm tra kết nối Discord Bot & gửi tin nhắn thử nghiệm
router.post('/test-discord', async (req, res) => {
  try {
    const { token, channelId } = req.body;
    const testToken = token || db.getSetting('discord_bot_token') || process.env.DISCORD_BOT_TOKEN;
    const testChannelId = channelId || db.getSetting('discord_channel_id') || process.env.DISCORD_CHANNEL_ID;

    if (!testToken || !testChannelId) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập đầy đủ Discord Bot Token và Channel ID.'
      });
    }

    const testResult = await discordBot.testDiscordConnection(testToken, testChannelId);
    if (testResult.success) {
      res.json({ success: true, message: testResult.message });
    } else {
      res.status(400).json({ success: false, error: testResult.error });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Kiểm tra kết nối AI (Groq, OpenRouter, xKiro, OpenAI-compatible)
router.post('/test-xkiro', async (req, res) => {
  try {
    const { apiKey, baseUrl, model, provider } = req.body;
    let testKey = (apiKey || '').trim();
    let testUrl = (baseUrl || '').trim();
    let testModel = (model || '').trim();

    if (!testUrl) {
      if (provider === 'groq') testUrl = 'https://api.groq.com/openai/v1';
      else if (provider === 'openrouter') testUrl = 'https://openrouter.ai/api/v1';
      else testUrl = db.getSetting('xkiro_base_url') || 'https://api.xkiro.com/v1';
    }
    testUrl = testUrl.replace(/\/+$/, '');

    if (!testKey) {
      if (provider === 'groq') testKey = (db.getSetting('groq_api_key') || process.env.GROQ_API_KEY || '').trim();
      else if (provider === 'openrouter') testKey = (db.getSetting('openrouter_api_key') || process.env.OPENROUTER_API_KEY || '').trim();
      else testKey = (db.getSetting('xkiro_api_key') || process.env.XKIRO_API_KEY || '').trim();
    }

    if (!testKey) {
      const provName = provider ? provider.toUpperCase() : 'AI';
      return res.status(400).json({
        success: false,
        error: `Chưa có ${provName} API Key để kiểm tra. Vui lòng dán key của bạn vào ô bên dưới.`
      });
    }

    // Cảnh báo nếu key Groq không đúng định dạng
    if ((provider === 'groq' || testUrl.includes('groq.com')) && !testKey.startsWith('gsk_')) {
      return res.status(400).json({
        success: false,
        error: 'API Key của Groq Cloud phải bắt đầu bằng "gsk_". Key bạn vừa nhập có vẻ không phải của Groq (hãy vào https://console.groq.com/keys để tạo và copy key miễn phí).'
      });
    }

    const axios = require('axios');

    // 1. Tự động truy vấn danh sách models khả dụng từ nhà cung cấp
    let availableModels = [];
    try {
      const modelsRes = await axios.get(`${testUrl}/models`, {
        headers: { 'Authorization': `Bearer ${testKey}` },
        timeout: 10000
      });
      if (modelsRes.data && Array.isArray(modelsRes.data.data)) {
        availableModels = modelsRes.data.data.map(m => m.id);
        console.log(`[test-ai] Tìm thấy ${availableModels.length} models từ ${testUrl}:`, availableModels.slice(0, 10));
      }
    } catch (e) {
      console.warn('[test-ai] Không thể lấy danh sách /models:', e.message);
    }

    // 2. Tạo danh sách các model ứng viên để thử
    let candidateModels = [];
    if (testModel) candidateModels.push(testModel);

    if (availableModels.length > 0) {
      // Ưu tiên các model chat/instruct tốt nhất
      const preferred = [
        'llama-3.3-70b-versatile',
        'llama-3.3-70b-specdec',
        'llama-3.1-70b-versatile',
        'llama-3.1-8b-instant',
        'llama3-70b-8192',
        'llama3-8b-8192',
        'deepseek-r1-distill-llama-70b',
        'deepseek-r1-distill-qwen-32b',
        'qwen-2.5-32b',
        'qwen-2.5-coder-32b',
        'mixtral-8x7b-32768',
        'meta-llama/llama-3.3-70b-instruct:free',
        'deepseek/deepseek-r1:free',
        'qwen/qwen-2.5-72b-instruct:free'
      ];
      for (const pref of preferred) {
        if (availableModels.includes(pref) && !candidateModels.includes(pref)) {
          candidateModels.push(pref);
        }
      }
      // Thêm các model còn lại (bỏ các model whisper/audio hoặc embed hoặc guard)
      for (const m of availableModels) {
        if (!candidateModels.includes(m) && !m.includes('whisper') && !m.includes('embed') && !m.includes('guard')) {
          candidateModels.push(m);
        }
      }
    } else {
      // Fallback danh sách mặc định nếu /models không truy cập được
      const fallbackList = [
        testModel,
        'llama-3.3-70b-versatile',
        'llama-3.3-70b-specdec',
        'llama-3.1-70b-versatile',
        'llama-3.1-8b-instant',
        'llama3-70b-8192',
        'llama3-8b-8192',
        'deepseek-r1-distill-llama-70b',
        'mixtral-8x7b-32768',
        'deepseek-chat',
        'meta-llama/llama-3.3-70b-instruct:free'
      ].filter(Boolean);
      for (const m of fallbackList) {
        if (!candidateModels.includes(m)) candidateModels.push(m);
      }
    }

    let successResponse = null;
    let workingModel = null;
    let lastError = null;

    for (const curModel of candidateModels) {
      try {
        console.log(`[test-ai] Đang thử model: ${curModel}...`);
        const response = await axios.post(`${testUrl}/chat/completions`, {
          model: curModel,
          messages: [
            { role: 'user', content: 'Xin chào! Hãy phản hồi ngắn gọn dưới 15 từ: Kết nối ScheduleAI thành công.' }
          ],
          temperature: 0.7
        }, {
          headers: {
            'Authorization': `Bearer ${testKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        const reply = response.data?.choices?.[0]?.message?.content;
        if (reply) {
          successResponse = reply.trim();
          workingModel = curModel;
          break;
        }
      } catch (err) {
        lastError = err;
        const errCode = err.response?.status;
        const errMsg = err.response?.data?.error?.message || err.message;
        console.warn(`[test-ai] Model ${curModel} không thành công (${errCode}): ${errMsg}`);

        // Nếu lỗi 401 (Invalid Key), không cần thử tiếp các model khác
        if (errCode === 401 || (errMsg && errMsg.toLowerCase().includes('invalid api key'))) {
          break;
        }

        // Nếu lỗi 429 (Rate Limit), ngưng thử nghiệm để tránh treo trang
        if (errCode === 429) {
          console.warn(`[test-ai] Bị Rate Limit ở model ${curModel}, dừng test để tránh treo.`);
          break;
        }
      }
    }

    if (workingModel && successResponse) {
      // Tự động lưu model hoạt động vào DB
      if (provider === 'groq') {
        db.setSetting('groq_model', workingModel);
      } else if (provider === 'openrouter') {
        db.setSetting('openrouter_model', workingModel);
      } else if (provider === 'xkiro') {
        db.setSetting('xkiro_model', workingModel);
      }

      res.json({
        success: true,
        message: `Kết nối AI thành công! (Model hoạt động: ${workingModel})`,
        response: successResponse,
        model: workingModel,
        availableModels: availableModels.filter(m => !m.includes('whisper') && !m.includes('embed') && !m.includes('guard')).slice(0, 15)
      });
    } else {
      const errDetail = lastError?.response?.data?.error?.message || lastError?.response?.data?.message || lastError?.message;
      res.status(500).json({
        success: false,
        error: `Lỗi kết nối AI: ${errDetail || 'Không tìm thấy model phù hợp'}`
      });
    }
  } catch (err) {
    const errDetail = err.response?.data?.error?.message || err.response?.data?.message || err.message;
    res.status(500).json({ success: false, error: `Lỗi kết nối: ${errDetail}` });
  }
});

module.exports = router;
