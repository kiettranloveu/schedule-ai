import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';
import { Sparkles, Coins, CloudSun, Newspaper, RefreshCw, Send } from 'lucide-react-native';

export default function BriefingScreen() {
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [runningJobId, setRunningJobId] = useState(null);

  const [jobs, setJobs] = useState([]);
  const [logs, setLogs] = useState([]);

  const fetchData = async () => {
    try {
      const [jobsRes, logsRes] = await Promise.all([
        api.get('/recurring'),
        api.get('/recurring/logs?limit=15')
      ]);

      if (jobsRes.data.success) setJobs(jobsRes.data.data || []);
      if (logsRes.data.success) setLogs(logsRes.data.data || []);
    } catch (err) {
      console.warn('Fetch briefing error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleRunNow = async (job) => {
    setRunningJobId(job.id);
    try {
      const res = await api.post(`/recurring/${job.id}/run`);
      if (res.data.success) {
        Alert.alert(
          '🎉 Đã Chạy Thành Công',
          `Tác vụ "${job.name}" đã được thực thi và bắn thông báo trực tiếp tới iPhone!`
        );
        fetchData();
      } else {
        Alert.alert('Lỗi', res.data.error || 'Thực thi thất bại.');
      }
    } catch (err) {
      Alert.alert('Lỗi', err.response?.data?.error || err.message);
    } finally {
      setRunningJobId(null);
    }
  };

  const goldJob = jobs.find(j => j.type === 'gold');
  const weatherJob = jobs.find(j => j.type === 'weather');
  const newsJob = jobs.find(j => j.type === 'news');

  const latestGoldLog = logs.find(l => l.job_id === goldJob?.id || l.job_name?.toLowerCase().includes('vàng'));
  const latestWeatherLog = logs.find(l => l.job_id === weatherJob?.id || l.job_name?.toLowerCase().includes('thời tiết'));

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.brand} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>Đang tải bản tin AI...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand} />}
    >
      {/* 1. Header Intro */}
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>Bản Tin AI Mỗi Sáng</Text>
        <Text style={[styles.pageSubtitle, { color: theme.textMuted }]}>
          Tự động thu thập giá vàng, thời tiết và phân tích bằng AI
        </Text>
      </View>

      {/* 2. Gold Price Card */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <Coins size={22} color={theme.gold} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Giá Vàng Việt Nam</Text>
            <Text style={[styles.cardTime, { color: theme.textMuted }]}>
              Hẹn giờ: 07:30 mỗi sáng
            </Text>
          </View>
          {goldJob && (
            <TouchableOpacity
              onPress={() => handleRunNow(goldJob)}
              disabled={runningJobId === goldJob.id}
              style={[styles.runBtn, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}
            >
              {runningJobId === goldJob.id ? (
                <ActivityIndicator size="small" color={theme.gold} />
              ) : (
                <>
                  <Send size={13} color={theme.gold} />
                  <Text style={[styles.runBtnText, { color: theme.gold }]}>Bắn Tin</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.cardContent, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
          <Text style={[styles.contentTitle, { color: theme.gold }]}>
            {latestGoldLog ? '📊 Dữ liệu gần nhất:' : '✨ Chưa có lần chạy gần đây'}
          </Text>
          <Text style={[styles.contentBody, { color: theme.text }]}>
            {latestGoldLog?.preview || 'Hệ thống sẽ cào giá vàng SJC, Doji, PNJ và vàng nhẫn 9999 lúc 07:30 sáng và gửi thông báo đẩy tới màn hình khóa iPhone.'}
          </Text>
        </View>
      </View>

      {/* 3. Weather Card */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconBox, { backgroundColor: 'rgba(14, 165, 233, 0.15)' }]}>
            <CloudSun size={22} color="#0EA5E9" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Dự Báo Thời Tiết</Text>
            <Text style={[styles.cardTime, { color: theme.textMuted }]}>
              Hẹn giờ: 06:45 mỗi sáng
            </Text>
          </View>
          {weatherJob && (
            <TouchableOpacity
              onPress={() => handleRunNow(weatherJob)}
              disabled={runningJobId === weatherJob.id}
              style={[styles.runBtn, { backgroundColor: 'rgba(14, 165, 233, 0.15)' }]}
            >
              {runningJobId === weatherJob.id ? (
                <ActivityIndicator size="small" color="#0EA5E9" />
              ) : (
                <>
                  <Send size={13} color="#0EA5E9" />
                  <Text style={[styles.runBtnText, { color: "#0EA5E9" }]}>Bắn Tin</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.cardContent, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
          <Text style={[styles.contentTitle, { color: "#0EA5E9" }]}>
            {latestWeatherLog ? '⛅ Bản tin gần nhất:' : '✨ Dự báo sắp tới'}
          </Text>
          <Text style={[styles.contentBody, { color: theme.text }]}>
            {latestWeatherLog?.preview || 'Dự báo nhiệt độ, độ ẩm, khả năng mưa kèm gợi ý trang phục ngày mới từ AI.'}
          </Text>
        </View>
      </View>

      {/* 4. Tech & AI News Card */}
      {newsJob && (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Newspaper size={22} color={theme.success} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Điểm Tin Công Nghệ</Text>
              <Text style={[styles.cardTime, { color: theme.textMuted }]}>
                Hẹn giờ: 08:00 sáng
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleRunNow(newsJob)}
              disabled={runningJobId === newsJob.id}
              style={[styles.runBtn, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}
            >
              {runningJobId === newsJob.id ? (
                <ActivityIndicator size="small" color={theme.success} />
              ) : (
                <>
                  <Send size={13} color={theme.success} />
                  <Text style={[styles.runBtnText, { color: theme.success }]}>Bắn Tin</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 5. Logs History */}
      <View style={{ marginTop: 10 }}>
        <Text style={[styles.historyTitle, { color: theme.text }]}>Nhật Ký Gửi Thông Báo Gần Nhất</Text>
        {logs.slice(0, 5).map(log => (
          <View key={log.id} style={[styles.logItem, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.logLeft}>
              <View style={[styles.logDot, { backgroundColor: log.status === 'success' ? theme.success : theme.danger }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.logName, { color: theme.text }]}>{log.job_name}</Text>
                <Text style={[styles.logTime, { color: theme.textMuted }]}>
                  {new Date(log.run_at).toLocaleString('vi-VN')}
                </Text>
              </View>
            </View>
            <Text style={[styles.logStatus, { color: log.status === 'success' ? theme.success : theme.danger }]}>
              {log.status === 'success' ? 'Đã gửi' : 'Lỗi'}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  pageSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardTime: {
    fontSize: 12,
    marginTop: 2,
  },
  runBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 5,
  },
  runBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardContent: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  contentTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  contentBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  logName: {
    fontSize: 13,
    fontWeight: '600',
  },
  logTime: {
    fontSize: 11,
    marginTop: 2,
  },
  logStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    marginTop: 10,
  },
});
