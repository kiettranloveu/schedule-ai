import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Key, Bot, Radio, CheckCircle2, AlertCircle, Loader2, ExternalLink, HelpCircle, ChevronDown, ChevronUp, Bell, MapPin, Eye, EyeOff, Sparkles, Cpu, Zap, Globe } from 'lucide-react';
import { api } from '../services/api';

const CITIES = [
  'Hà Nội',
  'Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Nha Trang',
  'Đà Lạt',
  'Huế'
];

const PROVIDER_PRESETS = {
  groq: {
    id: 'groq',
    name: 'Groq Cloud',
    badge: '100% Miễn Phí • Siêu Tốc',
    desc: 'Tốc độ phản hồi tức thì (<1s), không cần thẻ tín dụng, dùng model Llama 3.3 70B của Meta.',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    keyLink: 'https://console.groq.com/keys',
    keyPlaceholder: 'gsk_... (Dán key từ Groq)',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', desc: 'Mạnh nhất của Meta (Khuyên dùng)' },
      { id: 'llama-3.3-70b-specdec', name: 'Llama 3.3 SpecDec', desc: 'Suy luận tốc độ cao' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', desc: 'Phản hồi tức thì' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 70B', desc: 'Suy luận logic cao cấp' },
      { id: 'llama3-70b-8192', name: 'Llama 3 70B', desc: 'Ổn định, tương thích cao' }
    ]
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter Free',
    badge: '100% Miễn Phí',
    desc: 'Hỗ trợ nhiều model miễn phí (:free) như Llama 3.3, DeepSeek R1, Qwen 2.5.',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    keyLink: 'https://openrouter.ai/keys',
    keyPlaceholder: 'sk-or-v1-... (Dán key từ OpenRouter)',
    models: [
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', desc: 'Miễn phí hoàn toàn' },
      { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)', desc: 'Tư duy logic cao cấp' },
      { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B (Free)', desc: 'Tiếng Việt và suy luận mạnh' }
    ]
  },
  xkiro: {
    id: 'xkiro',
    name: 'xKiro / OpenAI Proxy',
    badge: 'Cần nạp phí VNĐ',
    desc: 'Cổng thanh toán VNĐ cho DeepSeek, GPT-4o, Claude.',
    baseUrl: 'https://api.xkiro.com/v1',
    defaultModel: 'deepseek-chat',
    keyLink: 'https://xkiro.com',
    keyPlaceholder: 'Dán API Key từ xKiro...',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3', desc: 'Siêu rẻ (10k nạp dùng rất lâu)' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', desc: 'OpenAI chuẩn' }
    ]
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Google AI Studio',
    desc: 'API trực tiếp từ Google AI Studio.',
    baseUrl: '',
    defaultModel: 'gemini-1.5-flash',
    keyLink: 'https://aistudio.google.com/app/apikey',
    keyPlaceholder: 'AIzaSy... (Dán key từ Google AI Studio)',
    models: []
  }
};

export default function SettingsView({ onSettingsSaved, onRefreshStatus }) {
  const [formData, setFormData] = useState({
    ai_provider: 'groq', // 'groq' | 'openrouter' | 'gemini' | 'xkiro'
    gemini_api_key: '',
    groq_api_key: '',
    groq_model: 'llama-3.3-70b-versatile',
    openrouter_api_key: '',
    openrouter_model: 'meta-llama/llama-3.3-70b-instruct:free',
    xkiro_api_key: '',
    xkiro_base_url: 'https://api.xkiro.com/v1',
    xkiro_model: 'deepseek-chat',
    discord_bot_token: '',
    discord_channel_id: '',
    weather_city: 'Hà Nội',
    notification_reminders: true
  });

  const [showTokens, setShowTokens] = useState({ gemini: false, ai: false, discord: false });
  const [showGuide, setShowGuide] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Testing states
  const [testingAI, setTestingAI] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const [testingDiscord, setTestingDiscord] = useState(false);
  const [discordResult, setDiscordResult] = useState(null);

  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSettings();
      if (data) {
        const prov = data.ai_provider || 'groq';
        setFormData({
          ai_provider: prov,
          gemini_api_key: data.gemini_api_key || '',
          groq_api_key: data.groq_api_key || '',
          groq_model: data.groq_model || 'llama-3.3-70b-versatile',
          openrouter_api_key: data.openrouter_api_key || '',
          openrouter_model: data.openrouter_model || 'meta-llama/llama-3.3-70b-instruct:free',
          xkiro_api_key: data.xkiro_api_key || '',
          xkiro_base_url: data.xkiro_base_url || 'https://api.xkiro.com/v1',
          xkiro_model: data.xkiro_model || 'deepseek-chat',
          discord_bot_token: data.discord_bot_token || '',
          discord_channel_id: data.discord_channel_id || '',
          weather_city: data.weather_city || 'Hà Nội',
          notification_reminders: data.notification_reminders !== '0'
        });
      }
    } catch (err) {
      console.error('Fetch settings error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentKey = () => {
    if (formData.ai_provider === 'groq') return formData.groq_api_key;
    if (formData.ai_provider === 'openrouter') return formData.openrouter_api_key;
    if (formData.ai_provider === 'gemini') return formData.gemini_api_key;
    return formData.xkiro_api_key;
  };

  const setCurrentKey = (val) => {
    if (formData.ai_provider === 'groq') setFormData(prev => ({ ...prev, groq_api_key: val }));
    else if (formData.ai_provider === 'openrouter') setFormData(prev => ({ ...prev, openrouter_api_key: val }));
    else if (formData.ai_provider === 'gemini') setFormData(prev => ({ ...prev, gemini_api_key: val }));
    else setFormData(prev => ({ ...prev, xkiro_api_key: val }));
  };

  const getCurrentModel = () => {
    if (formData.ai_provider === 'groq') return formData.groq_model;
    if (formData.ai_provider === 'openrouter') return formData.openrouter_model;
    if (formData.ai_provider === 'gemini') return 'gemini-1.5-flash';
    return formData.xkiro_model;
  };

  const setCurrentModel = (val) => {
    if (formData.ai_provider === 'groq') setFormData(prev => ({ ...prev, groq_model: val }));
    else if (formData.ai_provider === 'openrouter') setFormData(prev => ({ ...prev, openrouter_model: val }));
    else setFormData(prev => ({ ...prev, xkiro_model: val }));
  };

  const handleSelectProvider = (provId) => {
    setFormData(prev => ({
      ...prev,
      ai_provider: provId
    }));
    setAiResult(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await api.saveSettings(formData);
      setSaveSuccess(true);
      if (onSettingsSaved) onSettingsSaved();
      if (onRefreshStatus) onRefreshStatus();
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      alert('Lỗi lưu cài đặt: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestAI = async () => {
    setTestingAI(true);
    setAiResult(null);
    try {
      if (formData.ai_provider === 'gemini') {
        const key = (formData.gemini_api_key || '').trim();
        if (!key) {
          setAiResult({ success: false, text: 'Vui lòng nhập Gemini API Key trước khi kiểm tra.' });
          setTestingAI(false);
          return;
        }
        const res = await api.testGemini(key);
        setAiResult({ success: true, text: res.response || res.message });
      } else {
        const key = getCurrentKey().trim();
        if (!key) {
          setAiResult({ success: false, text: `Vui lòng nhập API Key cho ${activePreset.name} trước khi kiểm tra.` });
          setTestingAI(false);
          return;
        }

        if (formData.ai_provider === 'groq' && !key.startsWith('gsk_')) {
          setAiResult({
            success: false,
            text: 'Key Groq Cloud phải bắt đầu bằng "gsk_". Vui lòng kiểm tra lại key bạn lấy từ console.groq.com.'
          });
          setTestingAI(false);
          return;
        }

        const model = getCurrentModel();
        const baseUrl = formData.ai_provider === 'groq'
          ? 'https://api.groq.com/openai/v1'
          : (formData.ai_provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : formData.xkiro_base_url);

        const res = await api.testXkiro(key, baseUrl, model, formData.ai_provider);
        if (res.model && res.model !== model) {
          setCurrentModel(res.model);
        }
        setAiResult({ success: true, text: res.message || res.response });
      }
    } catch (err) {
      const errDetail = err.response?.data?.error || err.message;
      setAiResult({ success: false, text: errDetail });
    } finally {
      setTestingAI(false);
    }
  };

  const handleTestDiscord = async () => {
    setTestingDiscord(true);
    setDiscordResult(null);
    try {
      const res = await api.testDiscord(formData.discord_bot_token, formData.discord_channel_id);
      setDiscordResult({ success: true, text: res.message });
      if (onRefreshStatus) onRefreshStatus();
    } catch (err) {
      setDiscordResult({ success: false, text: err.response?.data?.error || err.message });
    } finally {
      setTestingDiscord(false);
    }
  };

  const activePreset = PROVIDER_PRESETS[formData.ai_provider] || PROVIDER_PRESETS.groq;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Cấu Hình & Tích Hợp AI / Discord
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hỗ trợ các nền tảng AI miễn phí 100% (Groq Cloud, OpenRouter, Gemini)
            </p>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Đã lưu thành công! Dịch vụ Discord Bot và AI đã được cập nhật lại.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. AI Provider Selection */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Chọn Nền Tảng AI (AI Engine)
                </h3>
                <p className="text-xs text-slate-400">
                  Chọn nhà cung cấp AI bạn muốn sử dụng (Khuyên dùng Groq Cloud miễn phí 100%)
                </p>
              </div>
            </div>
          </div>

          {/* 4 Provider Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Groq Cloud */}
            <div
              onClick={() => handleSelectProvider('groq')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                formData.ai_provider === 'groq'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Groq Cloud
                  </span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Miễn Phí 100% • Khuyên Dùng
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Tốc độ nhanh nhất thế giới (<span className="text-emerald-600 dark:text-emerald-400 font-bold">0.5s</span>), không cần thẻ tín dụng, dùng Llama 3.3 70B cực kỳ thông minh.
              </p>
            </div>

            {/* OpenRouter */}
            <div
              onClick={() => handleSelectProvider('openrouter')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                formData.ai_provider === 'openrouter'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-sky-500" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    OpenRouter Free
                  </span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                  Miễn Phí
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Đăng nhập Google là có key ngay, hỗ trợ các model miễn phí như Llama 3.3 và DeepSeek R1.
              </p>
            </div>

            {/* Google Gemini */}
            <div
              onClick={() => handleSelectProvider('gemini')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                formData.ai_provider === 'gemini'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-indigo-500" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Google Gemini
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Google AI Studio
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Cần key từ Google AI Studio đã kích hoạt Generative Language API.
              </p>
            </div>

            {/* xKiro / Custom */}
            <div
              onClick={() => handleSelectProvider('xkiro')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                formData.ai_provider === 'xkiro'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-base">💳</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    xKiro.com
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Cần nạp VNĐ
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Dành cho người dùng nạp tiền qua ngân hàng/MoMo để dùng DeepSeek V3 trả phí.
              </p>
            </div>
          </div>

          {/* Form details for active provider */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in">
            {/* Guide & Link */}
            {formData.ai_provider === 'groq' && (
              <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                <div className="font-bold flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-sm">
                    <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 fill-amber-500" />
                    <span>Cách lấy Groq API Key Miễn Phí 100% (trong 15 giây):</span>
                  </span>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center shrink-0"
                  >
                    <span>Mở Console Groq</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                </div>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-700 dark:text-slate-300">
                  <li>Bấm vào liên kết <strong>Mở Console Groq</strong> ở trên (hoặc truy cập <code className="text-amber-700 dark:text-amber-300 font-mono">console.groq.com/keys</code>).</li>
                  <li>Chọn <strong>Đăng nhập với Google</strong> (hoặc GitHub) hoàn toàn không cần thẻ ngân hàng.</li>
                  <li>Bấm nút <strong>Create API Key</strong> màu cam ➔ Đặt tên bất kỳ (VD: <em>ScheduleAI</em>) ➔ Bấm <strong>Submit</strong>.</li>
                  <li>Copy mã bắt đầu bằng <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded font-mono font-bold">gsk_...</code> và dán vào ô bên dưới!</li>
                </ol>
              </div>
            )}

            {formData.ai_provider === 'openrouter' && (
              <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/60 text-xs text-sky-900 dark:text-sky-200 space-y-2">
                <div className="font-bold flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-sm">
                    <Globe className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>Cách lấy OpenRouter Key Miễn Phí:</span>
                  </span>
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-sky-700 dark:text-sky-300 hover:underline flex items-center shrink-0"
                  >
                    <span>Mở OpenRouter</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                </div>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-700 dark:text-slate-300">
                  <li>Truy cập <code className="text-sky-700 dark:text-sky-300 font-mono">openrouter.ai/keys</code> và đăng nhập bằng Google.</li>
                  <li>Bấm nút <strong>Create Key</strong> ➔ Đặt tên <em>ScheduleAI</em>.</li>
                  <li>Copy chuỗi key bắt đầu bằng <code className="bg-sky-100 dark:bg-sky-900/60 px-1 py-0.5 rounded font-mono font-bold">sk-or-v1-...</code> và dán vào ô bên dưới.</li>
                </ol>
              </div>
            )}

            {formData.ai_provider === 'gemini' && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  👉 Lấy API Key từ Google AI Studio: Đăng nhập Google ➔ Bấm <strong>Create API Key</strong>:
                </div>
                <a
                  href={activePreset.keyLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center shrink-0"
                >
                  <span>Mở Google AI Studio</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              </div>
            )}

            {formData.ai_provider === 'xkiro' && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  👉 Đăng nhập tài khoản xKiro.com và sao chép API Key của bạn:
                </div>
                <a
                  href={activePreset.keyLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center shrink-0"
                >
                  <span>Mở xKiro</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              </div>
            )}

            {/* API Key Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {activePreset.name} API Key *
              </label>
              <div className="relative">
                <input
                  type={showTokens.ai ? 'text' : 'password'}
                  value={getCurrentKey()}
                  onChange={(e) => setCurrentKey(e.target.value)}
                  placeholder={activePreset.keyPlaceholder}
                  className="w-full text-sm font-mono px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowTokens({ ...showTokens, ai: !showTokens.ai })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showTokens.ai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Warning if Groq key doesn't start with gsk_ */}
              {formData.ai_provider === 'groq' && getCurrentKey() && !getCurrentKey().trim().startsWith('gsk_') && (
                <div className="p-2.5 mt-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>
                    <strong>Lưu ý:</strong> API Key của Groq Cloud phải bắt đầu bằng <code>gsk_</code>. Key bạn vừa dán có vẻ không phải của Groq (hãy vào <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="underline font-bold">console.groq.com/keys</a> để copy đúng key).
                  </span>
                </div>
              )}
            </div>

            {/* Model Selection (for Groq, OpenRouter, xKiro) */}
            {formData.ai_provider !== 'gemini' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Mô hình AI (Model)
                </label>
                {activePreset.models.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                    {activePreset.models.map(m => {
                      const isSelected = getCurrentModel() === m.id;
                      return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => setCurrentModel(m.id)}
                          className={`p-2.5 text-left rounded-xl border text-xs transition ${
                            isSelected
                              ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500 font-bold'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="truncate">{m.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal truncate">{m.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 shrink-0">Model ID:</span>
                  <input
                    type="text"
                    value={getCurrentModel()}
                    onChange={(e) => setCurrentModel(e.target.value)}
                    className="flex-1 text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Base URL (only for xKiro / custom OpenAI proxy) */}
            {formData.ai_provider === 'xkiro' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  API Endpoint (Base URL)
                </label>
                <input
                  type="text"
                  value={formData.xkiro_base_url}
                  onChange={(e) => setFormData({ ...formData, xkiro_base_url: e.target.value })}
                  className="w-full text-xs font-mono px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            )}

            {/* Test AI Button */}
            <div className="flex items-center space-x-3 pt-1 flex-wrap gap-y-2">
              <button
                type="button"
                onClick={handleTestAI}
                disabled={testingAI || !getCurrentKey().trim()}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 shadow-md shadow-brand-500/25 transition disabled:opacity-50"
              >
                {testingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                <span>Kiểm Tra Kết Nối {activePreset.name}</span>
              </button>

              {aiResult && (
                <span className={`text-xs font-semibold flex items-center ${aiResult.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {aiResult.success ? <CheckCircle2 className="w-4 h-4 mr-1 shrink-0" /> : <AlertCircle className="w-4 h-4 mr-1 shrink-0" />}
                  <span>{aiResult.text}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Discord Bot Configuration */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Discord Bot (2 Chiều)
                </h3>
                <p className="text-xs text-slate-400">
                  Gửi thông báo giá vàng, thời tiết, nhắc lịch và chat lệnh từ điện thoại
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              <HelpCircle className="w-3.5 h-3.5 mr-1" />
              <span>Hướng dẫn tạo Bot</span>
              {showGuide ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
            </button>
          </div>

          {/* Collapsible Step-by-Step Guide */}
          {showGuide && (
            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/60 text-xs text-slate-700 dark:text-slate-300 space-y-2 animate-in fade-in">
              <div className="font-bold text-blue-800 dark:text-blue-300">
                5 bước đơn giản tạo Discord Bot (khoảng 2 phút):
              </div>
              <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed">
                <li>Vào <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline font-semibold">Discord Developer Portal</a> → Bấm <strong>New Application</strong> → Đặt tên (VD: <em>ScheduleAI</em>).</li>
                <li>Vào menu <strong>Bot</strong> bên trái → Bấm <strong>Reset Token</strong> → Sao chép mã <strong>Token</strong> dán vào ô <em>Discord Bot Token</em> bên dưới.</li>
                <li>Tại trang Bot, cuộn xuống mục <strong>Privileged Gateway Intents</strong> → Bật xanh <strong>MESSAGE CONTENT INTENT</strong> (để bot đọc được câu lệnh bạn chat).</li>
                <li>Vào menu <strong>OAuth2</strong> → <strong>URL Generator</strong> → Tích vào <code>bot</code> và <code>applications.commands</code>. Ở bảng quyền bên dưới tích <code>Send Messages</code>, <code>Embed Links</code>, <code>Read Message History</code> → Sao chép link ở dưới mở ra để thêm bot vào Server của bạn.</li>
                <li>Trên Discord, bật <em>Cài đặt người dùng → Nâng cao → Chế độ nhà phát triển (Developer Mode)</em>. Nhấp chuột phải vào kênh text muốn nhận thông báo → Chọn <strong>Sao chép ID kênh (Copy Channel ID)</strong> và dán vào ô bên dưới.</li>
              </ol>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Discord Bot Token
              </label>
              <div className="relative">
                <input
                  type={showTokens.discord ? 'text' : 'password'}
                  value={formData.discord_bot_token}
                  onChange={(e) => setFormData({ ...formData, discord_bot_token: e.target.value })}
                  placeholder="MTM0Nzg... (Bot Token)"
                  className="w-full text-sm font-mono px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowTokens({ ...showTokens, discord: !showTokens.discord })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showTokens.discord ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Kênh Nhận Thông Báo (Channel ID)
              </label>
              <input
                type="text"
                value={formData.discord_channel_id}
                onChange={(e) => setFormData({ ...formData, discord_channel_id: e.target.value })}
                placeholder="VD: 123456789012345678"
                className="w-full text-sm font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Test Discord Button */}
          <div className="flex items-center space-x-3 pt-1">
            <button
              type="button"
              onClick={handleTestDiscord}
              disabled={testingDiscord || !formData.discord_bot_token || !formData.discord_channel_id}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition disabled:opacity-50"
            >
              {testingDiscord ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Radio className="w-3.5 h-3.5 mr-1" />}
              <span>Kiểm Tra & Bắn Tin Thử Nghiệm</span>
            </button>

            {discordResult && (
              <span className={`text-xs font-semibold flex items-center ${discordResult.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {discordResult.success ? <CheckCircle2 className="w-4 h-4 mr-1 shrink-0" /> : <AlertCircle className="w-4 h-4 mr-1 shrink-0" />}
                {discordResult.text}
              </span>
            )}
          </div>
        </div>

        {/* 3. General Preferences */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Tùy Chọn Nhắc Nhở & Địa Phương
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Tỉnh / Thành phố dự báo thời tiết
              </label>
              <select
                value={formData.weather_city}
                onChange={(e) => setFormData({ ...formData, weather_city: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notification_reminders}
                  onChange={(e) => setFormData({ ...formData, notification_reminders: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center">
                    <Bell className="w-3.5 h-3.5 mr-1 text-amber-500" />
                    Tự động bắn tin nhắc nhở trước sự kiện 15 phút
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Discord Bot sẽ chủ động ping kênh khi sắp đến giờ họp/lịch hẹn
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center space-x-2 px-8 py-3 rounded-xl text-sm font-extrabold text-white bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/25 transition disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            <span>Lưu Toàn Bộ Cấu Hình</span>
          </button>
        </div>
      </form>
    </div>
  );
}
