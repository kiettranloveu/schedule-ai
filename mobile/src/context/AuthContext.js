import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';
import { Platform } from 'react-native';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
      }
    } catch (e) {
      console.warn('Load auth error:', e);
    }
  };

  const registerForPushNotifications = async () => {
    return null;
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
