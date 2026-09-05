import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getBaseUrl, setServerUrl, DEFAULT_SERVER_URL } from '../api/client';
import { Calendar, Lock, User, Server, ArrowRight } from 'lucide-react-native';

export default function LoginScreen() {
  const { login } = useAuth();
  const { theme } = useTheme();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('kiethost@123');
  const [serverUrl, setServerUrlInput] = useState('');
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getBaseUrl().then(url => setServerUrlInput(url));
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tài khoản và mật khẩu.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (serverUrl.trim()) {
        await setServerUrl(serverUrl);
      }
      const res = await login(username.trim(), password);
      if (!res.success) {
        setError(res.error || 'Tài khoản hoặc mật khẩu không chính xác.');
      }
    } catch (err) {
      setError('Không thể kết nối tới Server. Vui lòng kiểm tra lại địa chỉ máy chủ và kết nối mạng Wi-Fi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header Branding */}
        <View style={styles.brandContainer}>
          <View style={[styles.iconWrapper, { backgroundColor: theme.brandLight }]}>
            <Calendar size={42} color={theme.brand} />
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>ScheduleAI</Text>
          <Text style={[styles.appSubtitle, { color: theme.textMuted }]}>
            Trợ Lý Lịch Trình & Tự Động Hóa Thông Minh
          </Text>
        </View>

        {/* Card Form */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Đăng Nhập</Text>
          <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
            Đồng bộ lịch trình và nhận thông báo trên iPhone
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textMuted }]}>TÊN ĐĂNG NHẬP</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
              <User size={18} color={theme.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="admin"
                placeholderTextColor={theme.subtext}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textMuted }]}>MẬT KHẨU</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
              <Lock size={18} color={theme.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="••••••••"
                placeholderTextColor={theme.subtext}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          {/* Toggle Server Config */}
          <TouchableOpacity
            onPress={() => setShowServerConfig(!showServerConfig)}
            style={styles.serverToggle}
          >
            <Server size={14} color={theme.brand} />
            <Text style={[styles.serverToggleText, { color: theme.brand }]}>
              {showServerConfig ? 'Ẩn cấu hình máy chủ' : 'Cấu hình địa chỉ Máy chủ Backend'}
            </Text>
          </TouchableOpacity>

          {showServerConfig && (
            <View style={[styles.inputGroup, { marginTop: 6 }]}>
              <Text style={[styles.label, { color: theme.textMuted }]}>ĐỊA CHỈ SERVER BACKEND</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <TextInput
                  style={[styles.input, { color: theme.text, fontSize: 13 }]}
                  placeholder={DEFAULT_SERVER_URL}
                  placeholderTextColor={theme.subtext}
                  value={serverUrl}
                  onChangeText={setServerUrlInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <Text style={[styles.hintText, { color: theme.subtext }]}>
                Mặc định kết nối IP máy tính trong mạng Wi-Fi: {DEFAULT_SERVER_URL}
              </Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={[styles.button, { backgroundColor: theme.brand }]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Vào Ứng Dụng</Text>
                <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconWrapper: {
    width: 76,
    height: 76,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
  },
  serverToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  serverToggleText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  hintText: {
    fontSize: 11,
    marginTop: 4,
  },
  button: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
