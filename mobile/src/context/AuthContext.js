import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('scheduleai_mobile_token');
      const storedUser = await AsyncStorage.getItem('scheduleai_mobile_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Register push token in background
        registerForPushNotifications();
      }
    } catch (e) {
      console.warn('Load auth error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const registerForPushNotifications = async () => {
    try {
      if (!Device.isDevice) {
        console.log('[Push] Must use physical device for Push Notifications');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Push] Quyền thông báo bị từ chối.');
        return null;
      }

      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      const pushTokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : {});
      const pushToken = pushTokenData.data;

      console.log('[Push] Expo Push Token thu được:', pushToken);

      // Gửi token lên backend lưu trữ
      await api.post('/settings/push-token', {
        token: pushToken,
        deviceName: `${Device.modelName || 'iPhone'} (${Platform.OS})`
      });

      return pushToken;
    } catch (err) {
      console.warn('[Push] Lỗi đăng ký push token:', err.message);
      return null;
    }
  };

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    if (res.data.success && res.data.token) {
      const jwt = res.data.token;
      const userInfo = res.data.user || { username };
      await AsyncStorage.setItem('scheduleai_mobile_token', jwt);
      await AsyncStorage.setItem('scheduleai_mobile_user', JSON.stringify(userInfo));
      setToken(jwt);
      setUser(userInfo);

      // Register push token right after login
      registerForPushNotifications();
      return { success: true };
    }
    return { success: false, error: res.data.error || 'Đăng nhập thất bại' };
  };

  const logout = async () => {
    await AsyncStorage.removeItem('scheduleai_mobile_token');
    await AsyncStorage.removeItem('scheduleai_mobile_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, registerForPushNotifications }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
