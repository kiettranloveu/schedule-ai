import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext({
  theme: themes.dark,
  mode: 'dark',
  isDark: true,
  changeMode: async () => {},
});

export const themes = {
  dark: {
    isDark: true,
    bg: '#0B0F19',
    card: '#161F30',
    cardBorder: '#233044',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    subtext: '#64748B',
    brand: '#3B82F6',
    brandLight: 'rgba(59, 130, 246, 0.15)',
    gold: '#F59E0B',
    success: '#10B981',
    danger: '#EF4444',
    tabBar: '#111827',
    tabBarBorder: '#1F2937',
    inputBg: '#0F172A',
    inputBorder: '#334155',
  },
  light: {
    isDark: false,
    bg: '#F8FAFC',
    card: '#FFFFFF',
    cardBorder: '#E2E8F0',
    text: '#0F172A',
    textMuted: '#64748B',
    subtext: '#94A3B8',
    brand: '#2563EB',
    brandLight: 'rgba(37, 99, 235, 0.1)',
    gold: '#D97706',
    success: '#059669',
    danger: '#DC2626',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E2E8F0',
    inputBg: '#F1F5F9',
    inputBorder: '#CBD5E1',
  }
};

export function ThemeProvider({ children }) {
  const systemColor = useColorScheme();
  const [mode, setMode] = useState('system'); // 'system' | 'dark' | 'light'

  useEffect(() => {
    AsyncStorage.getItem('scheduleai_theme_mode').then(val => {
      if (val) setMode(val);
    });
  }, []);

  const changeMode = async (newMode) => {
    setMode(newMode);
    await AsyncStorage.setItem('scheduleai_theme_mode', newMode);
  };

  const isDark = mode === 'system' ? (systemColor === 'dark') : (mode === 'dark');
  const theme = isDark ? themes.dark : themes.light;

  return (
    <ThemeContext.Provider value={{ theme, mode, changeMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
