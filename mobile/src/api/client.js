import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_SERVER_URL = 'http://192.168.50.178:5000';

const api = axios.create({
  baseURL: `${DEFAULT_SERVER_URL}/api`,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Load custom server URL from storage
export async function getBaseUrl() {
  try {
    const customUrl = await AsyncStorage.getItem('scheduleai_server_url');
    return customUrl || DEFAULT_SERVER_URL;
  } catch (e) {
    return DEFAULT_SERVER_URL;
  }
}

// Update base URL dynamically
export async function setServerUrl(newUrl) {
  const cleanUrl = (newUrl || '').trim().replace(/\/+$/, '');
  await AsyncStorage.setItem('scheduleai_server_url', cleanUrl);
  api.defaults.baseURL = `${cleanUrl}/api`;
}

// Request interceptor: attach token and dynamic baseURL
api.interceptors.request.use(async (config) => {
  const currentBase = await getBaseUrl();
  config.baseURL = `${currentBase}/api`;

  const token = await AsyncStorage.getItem('scheduleai_mobile_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
