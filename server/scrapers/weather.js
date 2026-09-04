const axios = require('axios');

const CITY_COORDINATES = {
  'hà nội': { lat: 21.0285, lon: 105.8542, name: 'Hà Nội' },
  'hanoi': { lat: 21.0285, lon: 105.8542, name: 'Hà Nội' },
  'hồ chí minh': { lat: 10.8231, lon: 106.6297, name: 'TP. Hồ Chí Minh' },
  'tp.hcm': { lat: 10.8231, lon: 106.6297, name: 'TP. Hồ Chí Minh' },
  'sài gòn': { lat: 10.8231, lon: 106.6297, name: 'TP. Hồ Chí Minh' },
  'saigon': { lat: 10.8231, lon: 106.6297, name: 'TP. Hồ Chí Minh' },
  'đà nẵng': { lat: 16.0544, lon: 108.2022, name: 'Đà Nẵng' },
  'danang': { lat: 16.0544, lon: 108.2022, name: 'Đà Nẵng' },
  'hải phòng': { lat: 20.8449, lon: 106.6881, name: 'Hải Phòng' },
  'cần thơ': { lat: 10.0452, lon: 105.7469, name: 'Cần Thơ' },
  'nha trang': { lat: 12.2388, lon: 109.1967, name: 'Nha Trang' },
  'đà lạt': { lat: 11.9404, lon: 108.4583, name: 'Đà Lạt' },
  'huế': { lat: 16.4637, lon: 107.5909, name: 'Huế' }
};

function getWeatherCondition(code) {
  if (code === 0) return 'Trời quang, nắng đẹp';
  if (code === 1 || code === 2) return 'Trời có mây vài nơi, dễ chịu';
  if (code === 3) return 'Nhiều mây, âm u';
  if (code >= 45 && code <= 48) return 'Có sương mù';
  if (code >= 51 && code <= 55) return 'Mưa phùn rải rác';
  if (code >= 61 && code <= 65) return 'Có mưa rào';
  if (code >= 80 && code <= 82) return 'Mưa dông từng cơn';
  if (code >= 95) return 'Có sấm sét, dông mạnh';
  return 'Thời tiết ổn định';
}

async function getWeather(cityName = 'Hà Nội') {
  const normKey = cityName.trim().toLowerCase();
  const city = CITY_COORDINATES[normKey] || CITY_COORDINATES['hà nội'];

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=Asia%2FBangkok`;
    const res = await axios.get(url, { timeout: 6000 });

    if (res.data && res.data.current) {
      const cur = res.data.current;
      const daily = res.data.daily;
      const condition = getWeatherCondition(cur.weather_code);

      return {
        city: city.name,
        temp: Math.round(cur.temperature_2m),
        feels_like: Math.round(cur.apparent_temperature),
        humidity: cur.relative_humidity_2m,
        wind_speed: cur.wind_speed_10m,
        condition,
        max_temp: daily && daily.temperature_2m_max ? Math.round(daily.temperature_2m_max[0]) : null,
        min_temp: daily && daily.temperature_2m_min ? Math.round(daily.temperature_2m_min[0]) : null,
        rain_prob: daily && daily.precipitation_probability_max ? daily.precipitation_probability_max[0] : 0,
        uv_index: daily && daily.uv_index_max ? daily.uv_index_max[0] : 0,
        summaryText: `• **Khu vực**: ${city.name}\n• **Nhiệt độ**: ${Math.round(cur.temperature_2m)}°C (Cảm giác như ${Math.round(cur.apparent_temperature)}°C)\n• **Thời tiết**: ${condition}\n• **Độ ẩm**: ${cur.relative_humidity_2m}% | Khả năng mưa: ${daily?.precipitation_probability_max?.[0] || 0}%\n• **Chỉ số UV**: ${daily?.uv_index_max?.[0] || 0}`
      };
    }
  } catch (err) {
    console.warn('[WeatherScraper] Open-Meteo failed, using fallback info', err.message);
  }

  return {
    city: city.name,
    temp: 28,
    feels_like: 30,
    humidity: 75,
    wind_speed: 12,
    condition: 'Có nắng nhẹ, chiều mát',
    max_temp: 32,
    min_temp: 24,
    rain_prob: 20,
    uv_index: 6,
    summaryText: `• **Khu vực**: ${city.name}\n• **Nhiệt độ**: 28°C (Cảm giác 30°C)\n• **Thời tiết**: Có nắng nhẹ, chiều mát\n• **Độ ẩm**: 75% | Khả năng mưa: 20%`
  };
}

module.exports = { getWeather };
