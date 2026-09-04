const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('./db');

let cachedWorkingModel = null;

function getGeminiClient() {
  const apiKey = db.getSetting('gemini_api_key') || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

async function callGemini(prompt, systemPrompt = '') {
  const apiKey = (db.getSetting('gemini_api_key') || process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return {
      success: false,
      error: 'Chưa cấu hình Google Gemini API Key. Vui lòng vào Cài đặt (Settings) trên Web để nhập key.',
      text: null
    };
  }

  const ai = new GoogleGenerativeAI(apiKey);

  const candidates = [
    cachedWorkingModel,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-2.0-flash-exp',
    'gemini-1.5-pro',
    'gemini-pro'
  ].filter(Boolean);

  // Nếu chưa có cached model, thử truy vấn danh sách model qua REST API
  if (!cachedWorkingModel) {
    try {
      const listRes = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, { timeout: 6000 });
      if (listRes.data && Array.isArray(listRes.data.models)) {
        const available = listRes.data.models
          .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
          .map(m => m.name.replace(/^models\//, ''));

        if (available.length > 0) {
          for (const m of available.reverse()) {
            candidates.unshift(m);
          }
        }
      }
    } catch (e) {
      // Bỏ qua lỗi list models nếu có
    }
  }

  const uniqueCandidates = [...new Set(candidates)];
  let lastError = null;

  for (const modelName of uniqueCandidates) {
    try {
      const model = ai.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt || undefined
      });
      const response = await model.generateContent(prompt);
      cachedWorkingModel = modelName;
      return {
        success: true,
        text: response.response.text(),
        model: modelName
      };
    } catch (err) {
      lastError = err;
      if (err.message && (err.message.includes('404') || err.message.includes('not found') || err.message.includes('not supported'))) {
        console.warn(`[Gemini] Model ${modelName} không khả dụng (404), đang thử model tiếp theo...`);
        continue;
      }
      if (err.message && (err.message.includes('API_KEY_INVALID') || err.message.includes('PERMISSION_DENIED'))) {
        break;
      }
    }
  }

  console.error('[Gemini] Toàn bộ model đều thất bại:', lastError?.message);
  return {
    success: false,
    error: `Lỗi kết nối Gemini API: ${lastError?.message || 'Không tìm thấy model phù hợp'}`,
    text: null
  };
}

async function callOpenAICompatible(prompt, systemPrompt = '') {
  const provider = db.getSetting('ai_provider') || 'groq';
  let apiKey = '';
  let baseUrl = '';
  let model = '';

  if (provider === 'groq') {
    apiKey = (db.getSetting('groq_api_key') || process.env.GROQ_API_KEY || '').trim();
    baseUrl = (db.getSetting('groq_base_url') || 'https://api.groq.com/openai/v1').trim();
    model = (db.getSetting('groq_model') || 'llama-3.3-70b-versatile').trim();
  } else if (provider === 'openrouter') {
    apiKey = (db.getSetting('openrouter_api_key') || process.env.OPENROUTER_API_KEY || '').trim();
    baseUrl = (db.getSetting('openrouter_base_url') || 'https://openrouter.ai/api/v1').trim();
    model = (db.getSetting('openrouter_model') || 'meta-llama/llama-3.3-70b-instruct:free').trim();
  } else {
    // xKiro / custom OpenAI proxy
    apiKey = (db.getSetting('xkiro_api_key') || db.getSetting('openai_api_key') || process.env.XKIRO_API_KEY || '').trim();
    baseUrl = (db.getSetting('xkiro_base_url') || 'https://api.xkiro.com/v1').trim();
    model = (db.getSetting('xkiro_model') || 'deepseek-chat').trim();
  }

  baseUrl = baseUrl.replace(/\/+$/, '');

  if (!apiKey) {
    return {
      success: false,
      error: `Chưa cấu hình API Key cho ${provider.toUpperCase()}. Vui lòng vào Cài đặt (Settings) trên Web để nhập key.`,
      text: null
    };
  }

  const candidateModels = [
    model,
    provider === 'groq' ? 'openai/gpt-oss-120b' : null,
    provider === 'groq' ? 'openai/gpt-oss-20b' : null,
    provider === 'groq' ? 'qwen/qwen3.8-27b' : null,
    provider === 'groq' ? 'qwen/qwen3.6-27b' : null,
    provider === 'groq' ? 'groq/compound' : null,
    provider === 'openrouter' ? 'meta-llama/llama-3.3-70b-instruct:free' : null,
    provider === 'openrouter' ? 'deepseek/deepseek-r1:free' : null,
    provider === 'openrouter' ? 'qwen/qwen-2.5-72b-instruct:free' : null
  ].filter(Boolean);

  const uniqueCandidates = [...new Set(candidateModels)];
  let lastError = null;

  for (const curModel of uniqueCandidates) {
    try {
      const messages = [];
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
      messages.push({ role: 'user', content: prompt });

      const response = await axios.post(`${baseUrl}/chat/completions`, {
        model: curModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: 850
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000 // Giảm xuống 15s để tránh Render timeout 100s
      });

      const content = response.data?.choices?.[0]?.message?.content;
      if (content) {
        return { success: true, text: content.trim(), model: curModel };
      }
    } catch (err) {
      lastError = err;
      const errMessage = err.response?.data?.error?.message || err.response?.data?.message || err.message;
      console.warn(`[${provider.toUpperCase()}] Model ${curModel} error: ${errMessage}`);
      
      // Nếu lỗi 401 Unauthorized, ngắt ngay lập tức
      if (err.response?.status === 401) break;
      
      // Nếu lỗi 429 Rate Limit (thường do dùng Free tier), chỉ thử tối đa 2 model để tránh treo quá lâu
      if (err.response?.status === 429) {
         if (uniqueCandidates.indexOf(curModel) >= 1) {
            console.warn(`[${provider.toUpperCase()}] Đã thử 2 models đều bị Rate Limit. Dừng lại để tránh treo.`);
            break; 
         }
      }
    }
  }

  const finalErrMsg = lastError?.response?.data?.error?.message || lastError?.response?.data?.message || lastError?.message;
  return { success: false, error: `Lỗi ${provider.toUpperCase()} API: ${finalErrMsg}`, text: null };
}

/**
 * Điều hướng thông minh giữa Google Gemini và OpenAI-compatible (Groq, OpenRouter, xKiro)
 */
async function callAI(prompt, systemPrompt = '') {
  const provider = db.getSetting('ai_provider') || 'groq';
  if (provider === 'gemini') {
    return callGemini(prompt, systemPrompt);
  }
  return callOpenAICompatible(prompt, systemPrompt);
}

/**
 * Phân tích và tóm tắt bảng giá vàng
 */
async function analyzeGoldPrices(goldData, customPrompt = '') {
  const defaultPrompt = `Bạn là trợ lý tài chính thông minh ScheduleAI. 
Hãy xem dữ liệu giá vàng hôm nay tại Việt Nam:
${goldData.summaryText}
Nguồn: ${goldData.source} (Cập nhật: ${goldData.updated_at})

Yêu cầu thêm từ người dùng: ${customPrompt || 'Đưa ra nhận định xu hướng ngắn gọn, chênh lệch mua bán và lời khuyên theo dõi.'}

Hãy viết một bản phân tích ngắn gọn, súc tích (khoảng 3-5 câu), dùng tiếng Việt thân thiện, chuyên nghiệp, có bullet points nổi bật và emoji bắt mắt.`;

  const res = await callAI(defaultPrompt);
  if (res.success) return res.text;

  // Graceful fallback text if Gemini key not set
  return `📊 **Nhận định thị trường**: Giá vàng miếng SJC và vàng nhẫn 9999 duy trì ổn định quanh vùng giá cao. Chênh lệch mua - bán ở mức khoảng 2 triệu đồng/lượng. Người mua tích sản nên theo dõi các nhịp điều chỉnh trong phiên giao dịch.`;
}

/**
 * Phân tích thời tiết và đưa ra lời khuyên ngày mới
 */
async function analyzeWeather(weatherData, customPrompt = '') {
  const prompt = `Bạn là trợ lý cá nhân ScheduleAI. 
Thông tin thời tiết thực tế hôm nay:
${weatherData.summaryText}

Yêu cầu: ${customPrompt || 'Hãy gửi lời chào buổi sáng, tóm tắt thời tiết ngắn gọn và đưa ra lời khuyên trang phục/vận động phù hợp.'}
Viết ngắn gọn 3-4 câu, thân thiện, tràn đầy năng lượng tích cực với các emoji phù hợp.`;

  const res = await callAI(prompt);
  if (res.success) return res.text;

  return `Chào buổi sáng! Thời tiết tại ${weatherData.city} hôm nay ${weatherData.condition.toLowerCase()}, nhiệt độ dao động ${weatherData.min_temp || 24}°C - ${weatherData.max_temp || 32}°C. Hãy chuẩn bị trang phục thoáng mát và đừng quên mang theo ô/áo mưa khi ra ngoài! ☀️`;
}

/**
 * Điểm tin chi tiết, chuyên sâu buổi sáng
 */
async function generateNewsBriefing(articles = [], customPrompt = '') {
  let articlesContext = '';
  if (Array.isArray(articles) && articles.length > 0) {
    articlesContext = articles.map((a, i) => 
      `Tin ${i + 1}:
- Tiêu đề: ${a.title}
- Nguồn: ${a.source}
- Tóm tắt gốc: ${a.description}
- Đường link: ${a.link}`
    ).join('\n\n');
  }

  const prompt = `Bạn là biên tập viên tin tức công nghệ & tài chính cao cấp của hệ thống ScheduleAI.
${articlesContext ? `Dưới đây là các tin tức thời sự NÓNG HỔI và MỚI NHẤT vừa thu thập từ các báo uy tín (VnExpress, Tuổi Trẻ...):
${articlesContext}` : 'Hãy chọn lọc 3-4 chủ đề công nghệ và trí tuệ nhân tạo (AI) quan trọng nhất hiện nay.'}

Nhiệm vụ: Hãy biên tập thành một bản TIN TỨC CHUYÊN SÂU, CHI TIẾT VÀ HẤP DẪN cho người dùng (được hiển thị trên Discord).

Yêu cầu cụ thể:
1. Độ chi tiết cao: Tuyệt đối KHÔNG viết chung chung, không tóm tắt cụt lủn 1 câu. Cần phân tích rõ bối cảnh, sự kiện diễn ra như thế nào, số liệu cụ thể (nếu có), các nhân vật hoặc tổ chức công nghệ liên quan.
2. Cấu trúc từng mục tin (chọn 3-4 tin ấn tượng nhất):
   - 📌 **[CHỦ ĐỀ] Tiêu đề tin chi tiết & ấn tượng**
   - 🔍 **Chi tiết sự kiện & Phân tích chuyên sâu**: Viết từ 2-4 câu đầy đủ thông tin, diễn giải rõ ràng điều gì đang diễn ra, bản chất công nghệ hoặc diễn biến thực tế.
   - 💡 **Ý nghĩa & Đánh giá tác động**: 1 câu nhận định tại sao tin này quan trọng và xu hướng sắp tới.
   ${articlesContext ? '- 🔗 **Nguồn bài viết**: [Tên nguồn](link_bài_viết)' : ''}
3. Thêm phần mở đầu "🌐 **TỔNG QUAN XU HƯỚNG CÔNG NGHỆ HÔM NAY**" (1-2 câu nhận định toàn cảnh ngắn gọn).
4. Kết bài: Một câu chúc ngày mới giàu năng lượng.
${customPrompt ? `Lưu ý thêm từ người dùng: ${customPrompt}` : ''}

Quy định: Dùng tiếng Việt chuẩn mực, chuyên nghiệp, dùng emoji bắt mắt, định dạng Markdown rõ ràng, dễ đọc trên giao diện Discord.`;

  const res = await callAI(prompt);
  if (res.success && res.text) return res.text;

  // Fallback thông minh: Dùng trực tiếp dữ liệu tin tức thật vừa cào được
  if (Array.isArray(articles) && articles.length > 0) {
    let fallbackText = `🌐 **TỔNG HỢP TIN TỨC CÔNG NGHỆ NỔI BẬT HÔM NAY**\n\n`;
    articles.slice(0, 4).forEach((a, i) => {
      fallbackText += `📌 **${i + 1}. ${a.title}**\n`;
      fallbackText += `🔍 **Chi tiết:** ${a.description || 'Thông tin chi tiết đang được cập nhật.'}\n`;
      fallbackText += `🔗 **Nguồn:** [${a.source}](${a.link})\n\n`;
    });
    fallbackText += `✨ *Chúc bạn một ngày làm việc tràn đầy năng lượng và hiệu quả!*`;
    return fallbackText;
  }

  return `📰 **Điểm tin sáng hôm nay:**
• **Trí tuệ nhân tạo (AI)**: Các mô hình ngôn ngữ lớn tiếp tục được tích hợp sâu vào quy trình tự động hóa cá nhân và doanh nghiệp.
• **Thị trường công nghệ**: Cuộc đua chip bán dẫn và thiết bị thông minh thế hệ mới đang diễn ra sôi động.
• **Xu hướng làm việc số**: Ứng dụng quản lý lịch trình và trợ lý AI giúp người dùng tối ưu năng suất cá nhân tới 40%.
✨ Chúc bạn một ngày làm việc tràn đầy năng lượng và hiệu quả!`;
}

/**
 * Bóc tách ngôn ngữ tự nhiên từ tin nhắn Discord thành sự kiện Lịch
 * Ví dụ: "Chiều mai 15h đi họp với sếp ở quán cà phê Highland khoảng 1 tiếng"
 */
async function parseNaturalEvent(text) {
  const now = new Date();
  const prompt = `Hiện tại là: ${now.toISOString()} (${now.toLocaleString('vi-VN')}).
Người dùng vừa nhắn: "${text}"

Nhiệm vụ của bạn: Bóc tách thông tin để tạo sự kiện lịch trình. Trả về DUY NHẤT một JSON hợp lệ (không có code block markdown hay giải thích thêm):
{
  "title": "Tiêu đề ngắn gọn của sự kiện",
  "description": "Mô tả chi tiết hoặc địa điểm nếu có",
  "start_time": "YYYY-MM-DDTHH:mm:ss",
  "end_time": "YYYY-MM-DDTHH:mm:ss",
  "category": "work | meeting | personal | study | important",
  "color": "#3B82F6",
  "reminder_minutes": 15
}
Lưu ý:
- Nếu người dùng không nói rõ thời lượng, mặc định sự kiện kéo dài 60 phút.
- Nếu người dùng nói "chiều mai", "tối nay", "thứ 2 tuần sau", hãy tính toán đúng mốc ngày và giờ tương ứng với thời điểm hiện tại.
- Định dạng start_time và end_time phải là ISO 8601 địa phương (ví dụ 2026-09-05T15:00:00).`;

  const res = await callAI(prompt);
  if (res.success && res.text) {
    try {
      const cleaned = res.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.warn('[AI] Failed to parse JSON from natural event:', res.text);
    }
  }

  // Heuristic fallback if no API key or parsing error
  const start = new Date(Date.now() + 2 * 3600 * 1000); // 2 hours from now
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    title: text.length > 50 ? text.substring(0, 50) + '...' : text,
    description: text,
    start_time: start.toISOString().substring(0, 19),
    end_time: end.toISOString().substring(0, 19),
    category: 'work',
    color: '#3B82F6',
    reminder_minutes: 15
  };
}

/**
 * AI Auto-scheduler: Xếp lịch thông minh cho danh sách việc cần làm
 */
async function autoScheduleTasks(tasks, existingEvents, targetDate = new Date().toISOString().split('T')[0]) {
  const prompt = `Bạn là trợ lý quy hoạch thời gian ScheduleAI.
Ngày cần xếp lịch: ${targetDate}
Danh sách sự kiện ĐÃ CÓ trong ngày (không được xếp trùng vào các khung giờ này):
${JSON.stringify(existingEvents.map(e => ({ title: e.title, start: e.start_time, end: e.end_time })))}

Danh sách CÔNG VIỆC CẦN XẾP LỊCH:
${JSON.stringify(tasks.map(t => ({ id: t.id, title: t.title, priority: t.priority, est_minutes: t.estimated_minutes || 45 })))}

Quy tắc:
1. Xếp các việc ưu tiên cao (urgent, high) vào các khung giờ vàng buổi sáng (08:30 - 11:30) hoặc đầu giờ chiều (13:30 - 15:30).
2. Tránh khung giờ nghỉ trưa (12:00 - 13:30).
3. Không để sự kiện đè lên các lịch đã có.
4. Trả về DUY NHẤT một mảng JSON các khung giờ xếp lịch:
[
  {
    "taskId": "id của task",
    "title": "Tiêu đề sự kiện",
    "start_time": "${targetDate}THH:mm:00",
    "end_time": "${targetDate}THH:mm:00",
    "category": "work",
    "color": "#10B981",
    "reason": "Lý do chọn khung giờ này"
  }
]`;

  const res = await callAI(prompt);
  if (res.success && res.text) {
    try {
      const cleaned = res.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.warn('[AI] Parse auto schedule error:', e.message);
    }
  }

  // Fallback simple auto-scheduler
  let currentHour = 9;
  const scheduled = [];
  for (const task of tasks) {
    if (currentHour === 12) currentHour = 14;
    if (currentHour >= 18) break;

    const startH = currentHour < 10 ? `0${currentHour}` : `${currentHour}`;
    const endH = currentHour + 1 < 10 ? `0${currentHour + 1}` : `${currentHour + 1}`;

    scheduled.push({
      taskId: task.id,
      title: task.title,
      start_time: `${targetDate}T${startH}:00:00`,
      end_time: `${targetDate}T${endH}:00:00`,
      category: 'work',
      color: '#10B981',
      reason: 'Khung giờ làm việc tập trung'
    });
    currentHour++;
  }
  return scheduled;
}

module.exports = {
  callAI,
  callGemini,
  callOpenAICompatible,
  analyzeGoldPrices,
  analyzeWeather,
  generateNewsBriefing,
  parseNaturalEvent,
  autoScheduleTasks
};
