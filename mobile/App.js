import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

import LoginScreen from './src/screens/LoginScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import TasksScreen from './src/screens/TasksScreen';
import BriefingScreen from './src/screens/BriefingScreen';
import SettingsScreen from './src/screens/SettingsScreen';

import { Calendar, CheckSquare, Sparkles, Settings } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

function MainTabs() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.bg,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTitleStyle: {
          color: theme.text,
          fontWeight: '800',
          fontSize: 18,
        },
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBarBorder,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.brand,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        }
      }}
    >
      <Tab.Screen
        name="Lịch Trình"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Calendar size={size - 2} color={color} />
        }}
      />
      <Tab.Screen
        name="Công Việc"
        component={TasksScreen}
        options={{
          tabBarIcon: ({ color, size }) => <CheckSquare size={size - 2} color={color} />
        }}
      />
      <Tab.Screen
        name="Bản Tin AI"
        component={BriefingScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Sparkles size={size - 2} color={color} />
        }}
      />
      <Tab.Screen
        name="Cài Đặt"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Settings size={size - 2} color={color} />
        }}
      />
    </Tab.Navigator>
  );
}

function NavigationRoot() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <NavigationContainer>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {user ? <MainTabs /> : <LoginScreen />}
      </NavigationContainer>
    </View>
  );
}

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.warn('ErrorBoundary caught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: '#F87171', fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>ScheduleAI</Text>
          <Text style={{ color: '#94A3B8', textAlign: 'center', fontSize: 14 }}>
            {String(this.state.error?.message || this.state.error || 'Đang khởi động ứng dụng...')}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const FALLBACK_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider initialMetrics={initialWindowMetrics || FALLBACK_METRICS}>
        <ThemeProvider>
          <AuthProvider>
            <NavigationRoot />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
