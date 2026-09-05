import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
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

// Set global notification presentation handler safely
try {
  if (Notifications && Notifications.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (e) {
  console.warn('Notifications handler init error:', e);
}

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
  const { user, isLoading } = useAuth();
  const { theme, isDark } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.brand} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {user ? <MainTabs /> : <LoginScreen />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <NavigationRoot />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
