import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Platform
} from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

import LoginScreen from './src/screens/LoginScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import TasksScreen from './src/screens/TasksScreen';
import BriefingScreen from './src/screens/BriefingScreen';
import SettingsScreen from './src/screens/SettingsScreen';

import { Calendar, CheckSquare, Sparkles, Settings } from 'lucide-react-native';

function TabButton({ label, IconComponent, active, onPress, theme }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.tabItem}
    >
      <IconComponent
        size={22}
        color={active ? theme.brand : theme.textMuted}
        strokeWidth={active ? 2.5 : 2}
      />
      <Text
        style={[
          styles.tabLabel,
          { color: active ? theme.brand : theme.textMuted, fontWeight: active ? '700' : '500' }
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function MainTabs() {
  const [activeTab, setActiveTab] = useState('calendar');
  const { theme, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Screen Area */}
      <View style={styles.screenContainer}>
        {activeTab === 'calendar' && <CalendarScreen />}
        {activeTab === 'tasks' && <TasksScreen />}
        {activeTab === 'briefing' && <BriefingScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
      </View>

      {/* Custom Bottom Tab Bar */}
      <View
        style={[
          styles.tabBar,
          { backgroundColor: theme.tabBar, borderTopColor: theme.tabBarBorder }
        ]}
      >
        <TabButton
          label="Lịch Trình"
          IconComponent={Calendar}
          active={activeTab === 'calendar'}
          onPress={() => setActiveTab('calendar')}
          theme={theme}
        />
        <TabButton
          label="Công Việc"
          IconComponent={CheckSquare}
          active={activeTab === 'tasks'}
          onPress={() => setActiveTab('tasks')}
          theme={theme}
        />
        <TabButton
          label="Bản Tin AI"
          IconComponent={Sparkles}
          active={activeTab === 'briefing'}
          onPress={() => setActiveTab('briefing')}
          theme={theme}
        />
        <TabButton
          label="Cài Đặt"
          IconComponent={Settings}
          active={activeTab === 'settings'}
          onPress={() => setActiveTab('settings')}
          theme={theme}
        />
      </View>
    </SafeAreaView>
  );
}

function NavigationRoot() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {user ? <MainTabs /> : <LoginScreen />}
    </SafeAreaView>
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
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: '#F87171', fontSize: 24, fontWeight: 'bold', marginBottom: 12 }}>ScheduleAI</Text>
          <Text style={{ color: '#FCA5A5', fontSize: 16, marginBottom: 8, textAlign: 'center' }}>Đang khởi động giao diện...</Text>
          <Text style={{ color: '#94A3B8', textAlign: 'center', fontSize: 13, paddingHorizontal: 16 }}>
            {String(this.state.error?.message || this.state.error || 'Vui lòng kiểm tra lại')}
          </Text>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <NavigationRoot />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 62,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    paddingTop: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
  },
});

