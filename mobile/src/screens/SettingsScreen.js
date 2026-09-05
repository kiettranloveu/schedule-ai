import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api, { getBaseUrl, setServerUrl, DEFAULT_SERVER_URL } from '../api/client';
import { Bell, Smartphone, Moon, Sun, Server, MapPin, LogOut, Send, CheckCircle2 } from 'lucide-react-native';

const CITIES = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Nha Trang', 'Đà Lạt', 'Huế'];

export default function SettingsScreen() {
  const { user, logout, registerForPushNotifications } = useAuth();
  const { theme, mode, changeMode } = useTheme();

  const [serverUrl, setServerUrlInput] = useState('');
  const [testingPush, setTestingPush] = useState(false);
  const [registeringPush, setRegisteringPush] = useState(false);
  const [weatherCity, setWeatherCity] = useState('Hà Nội');
  const [deviceCount, setDeviceCount] = useState(0);

  useEffect(() => {
    getBaseUrl().then(url => setServerUrlInput(url));
    fetchPushStatus();
  }, []);

  const fetchPushStatus = async () => {
    try {
      const [tokenRes, settingsRes] = await Promise.all([
        api.get('/settings/push-tokens'),
        api.get('/settings')
      ]);

      if (tokenRes.data.success) {
        setDeviceCount(tokenRes.data.data?.length || 0);
      }
      if (settingsRes.data.success) {
        setWeatherCity(settingsRes.data.data?.weather_city || 'Hà Nội');
      }
    } catch (e) {
      // ignore
    }
  };

  const handleTestPush = async () => {
    setTestingPush(true);
    try {
      const res = await api.post('/settings/test-push', {
        title: '🎉 SCHEDULEAI THÔNG BÁO TEST',
        body: 'iPhone của bạn đã kết nối thành công! Bạn sẽ nhận thông báo giá vàng (07:30) và thời tiết (06:45) mỗi sáng.'
      });

      if (res.data.success) {
        Alert.alert('Thành công', res.data.message || 'Đã bắn thông báo tới iPhone!');
      } else {
        Alert.alert('Chưa nhận được', res.data.error || 'Vui lòng bấm nút "Đăng Ký Lại Thông Báo" bên dưới.');
      }
    } catch (err) {
      Alert.alert('Lỗi', err.response?.data?.error || err.message || 'Chưa có thiết bị iPhone nào đăng ký.');
    } finally {
      setTestingPush(false);
    }
  };

  const handleRegisterPushAgain = async () => {
    setRegisteringPush(true);
    try {
      const token = await registerForPushNotifications();
      if (token) {
        Alert.alert('Đăng ký thành công', 'Thiết bị iPhone của bạn đã được lưu vào hệ thống để nhận thông báo.');
        fetchPushStatus();
      } else {
        Alert.alert('Lưu ý', 'Vui lòng cấp quyền Thông Báo trong Cài đặt iPhone của bạn.');
      }
    } catch (err) {
      Alert.alert('Lỗi', err.message);
    } finally {
      setRegisteringPush(false);
    }
  };

  const handleSaveServerUrl = async () => {
    if (!serverUrl.trim()) return;
    try {
      await setServerUrl(serverUrl.trim());
      Alert.alert('Thành công', `Đã lưu địa chỉ máy chủ: ${serverUrl.trim()}`);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lưu địa chỉ.');
    }
  };

  const handleSaveCity = async (city) => {
    setWeatherCity(city);
    try {
      await api.post('/settings', { weather_city: city });
    } catch (e) {
      // ignore
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản trên iPhone?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: logout }
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 36 }}
    >
      {/* 1. Header Account */}
      <View style={[styles.accountCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={[styles.avatarBox, { backgroundColor: theme.brandLight }]}>
          <Text style={[styles.avatarText, { color: theme.brand }]}>
            {user?.username?.charAt(0).toUpperCase() || 'A'}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.userName, { color: theme.text }]}>Tài Khoản: {user?.username || 'admin'}</Text>
          <Text style={[styles.userRole, { color: theme.textMuted }]}>Quản trị viên ScheduleAI</Text>
        </View>
      </View>

      {/* 2. Push Notifications Box */}
      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.sectionHeader}>
          <Bell size={18} color={theme.brand} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Thông Báo Đẩy iPhone</Text>
        </View>
        <Text style={[styles.sectionDesc, { color: theme.textMuted }]}>
          Nhận thông báo giá vàng lúc 07:30, thời tiết lúc 06:45 và nhắc lịch trước 15 phút.
        </Text>

        <View style={[styles.statusBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
          <Smartphone size={16} color={theme.success} />
          <Text style={[styles.statusText, { color: theme.text }]}>
            Đã kết nối: <Text style={{ fontWeight: '800', color: theme.success }}>{deviceCount} thiết bị iPhone</Text>
          </Text>
        </View>

        {/* Test Push Button */}
        <TouchableOpacity
          onPress={handleTestPush}
          disabled={testingPush}
          style={[styles.testBtn, { backgroundColor: theme.brand }]}
        >
          {testingPush ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Send size={15} color="#FFFFFF" />
              <Text style={styles.testBtnText}>Bắn Thông Báo Thử Nghiệm Tới iPhone</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Re-register Push */}
        <TouchableOpacity
          onPress={handleRegisterPushAgain}
          disabled={registeringPush}
          style={[styles.subBtn, { borderColor: theme.inputBorder }]}
        >
          {registeringPush ? (
            <ActivityIndicator size="small" color={theme.textMuted} />
          ) : (
            <Text style={[styles.subBtnText, { color: theme.textMuted }]}>
              Đăng ký lại Push Token thiết bị này
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 3. Weather City Selection */}
      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.sectionHeader}>
          <MapPin size={18} color={theme.brand} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Tỉnh / Thành Phố Dự Báo</Text>
        </View>
        <View style={styles.cityChipsGrid}>
          {CITIES.map(c => {
            const isSelected = weatherCity === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => handleSaveCity(c)}
                style={[
                  styles.cityChip,
                  { backgroundColor: isSelected ? theme.brand : theme.inputBg, borderColor: theme.inputBorder }
                ]}
              >
                <Text style={[styles.cityChipText, { color: isSelected ? '#FFFFFF' : theme.text }]}>
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 4. Theme Selection */}
      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.sectionHeader}>
          {mode === 'dark' ? <Moon size={18} color={theme.brand} /> : <Sun size={18} color={theme.gold} />}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Giao Diện (Theme)</Text>
        </View>
        <View style={styles.themeRow}>
          {[
            { key: 'system', label: 'Tự động' },
            { key: 'dark', label: 'Tối (Dark)' },
            { key: 'light', label: 'Sáng (Light)' }
          ].map(tItem => {
            const isSelected = mode === tItem.key;
            return (
              <TouchableOpacity
                key={tItem.key}
                onPress={() => changeMode(tItem.key)}
                style={[
                  styles.themeChip,
                  { backgroundColor: isSelected ? theme.brand : theme.inputBg, borderColor: theme.inputBorder }
                ]}
              >
                <Text style={[styles.themeChipText, { color: isSelected ? '#FFFFFF' : theme.text }]}>
                  {tItem.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 5. Server URL Configuration */}
      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.sectionHeader}>
          <Server size={18} color={theme.brand} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Địa Chỉ Máy Chủ Backend</Text>
        </View>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
          value={serverUrl}
          onChangeText={setServerUrlInput}
          placeholder={DEFAULT_SERVER_URL}
          placeholderTextColor={theme.subtext}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={handleSaveServerUrl}
          style={[styles.saveUrlBtn, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
        >
          <Text style={[styles.saveUrlText, { color: theme.brand }]}>Cập Nhật Địa Chỉ</Text>
        </TouchableOpacity>
      </View>

      {/* 6. Logout Button */}
      <TouchableOpacity
        onPress={handleLogout}
        style={[styles.logoutBtn, { borderColor: theme.danger }]}
      >
        <LogOut size={16} color={theme.danger} />
        <Text style={[styles.logoutText, { color: theme.danger }]}>Đăng Xuất Khỏi iPhone</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
  },
  userRole: {
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    gap: 8,
    marginBottom: 8,
  },
  testBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  subBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  subBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cityChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  cityChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  cityChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  themeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  themeChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    marginTop: 6,
  },
  saveUrlBtn: {
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  saveUrlText: {
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
