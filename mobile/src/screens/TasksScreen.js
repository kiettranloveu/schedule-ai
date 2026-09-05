import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';
import { CheckCircle2, Circle, Clock, Sparkles, Plus, Trash2, ListTodo, AlertCircle } from 'lucide-react-native';

const PRIORITY_CONFIG = {
  urgent: { label: 'Khẩn cấp', color: '#EF4444', emoji: '🔴' },
  high: { label: 'Cao', color: '#F97316', emoji: '🟠' },
  medium: { label: 'Trung bình', color: '#3B82F6', emoji: '🔵' },
  low: { label: 'Thấp', color: '#94A3B8', emoji: '⚪' }
};

export default function TasksScreen() {
  const { theme } = useTheme();

  const [tasks, setTasks] = useState([]);
  const [filterStatus, setFilterStatus] = useState('todo'); // 'todo' | 'in_progress' | 'completed'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoScheduling, setAutoScheduling] = useState(false);

  // Modal create
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState('45');

  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.get('/tasks');
      if (res.data.success) {
        setTasks(res.data.data || []);
      }
    } catch (err) {
      console.warn('Fetch tasks error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleToggleStatus = async (task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await api.put(`/tasks/${task.id}`, { status: nextStatus });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái.');
    }
  };

  const handleDeleteTask = (id, taskTitle) => {
    Alert.alert(
      'Xóa công việc',
      `Bạn có chắc chắn muốn xóa "${taskTitle}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/tasks/${id}`);
              setTasks(prev => prev.filter(t => t.id !== id));
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể xóa công việc.');
            }
          }
        }
      ]
    );
  };

  const handleCreateTask = async () => {
    if (!title.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên công việc.');
      return;
    }

    try {
      const newId = 'tsk-' + Date.now();
      await api.post('/tasks', {
        id: newId,
        title: title.trim(),
        description: 'Tạo từ iPhone',
        priority: priority,
        status: 'todo',
        estimated_minutes: parseInt(estimatedMinutes, 10) || 30
      });

      setModalVisible(false);
      setTitle('');
      fetchTasks();
    } catch (err) {
      Alert.alert('Lỗi', err.response?.data?.error || err.message);
    }
  };

  // AI Auto Schedule
  const handleAutoSchedule = async () => {
    const todoTasks = tasks.filter(t => t.status !== 'completed');
    if (todoTasks.length === 0) {
      Alert.alert('Thông báo', 'Hiện tại không có công việc nào cần xếp lịch.');
      return;
    }

    setAutoScheduling(true);
    try {
      const taskIds = todoTasks.map(t => t.id);
      const res = await api.post('/tasks/auto-schedule', { taskIds });
      const plan = res.data.data;

      if (plan && plan.schedule && plan.schedule.length > 0) {
        Alert.alert(
          '✨ AI Đã Lập Lịch Tối Ưu',
          `AI đã sắp xếp ${plan.schedule.length} khung giờ làm việc tối ưu trong ngày!\n\nLý do: ${plan.reasoning || 'Tối ưu dựa trên độ ưu tiên và khoảng trống.'}`,
          [
            { text: 'Để sau', style: 'cancel' },
            {
              text: 'Áp dụng vào Lịch',
              onPress: async () => {
                try {
                  await api.post('/tasks/apply-schedule', { items: plan.schedule });
                  Alert.alert('Thành công', 'Đã áp dụng các khung giờ làm việc vào Lịch của bạn!');
                  fetchTasks();
                } catch (e) {
                  Alert.alert('Lỗi', 'Không thể lưu lịch.');
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('AI Phản Hồi', plan?.reasoning || 'Lịch hôm nay đã kín hoặc không tìm thấy khung giờ trống.');
      }
    } catch (err) {
      Alert.alert('Lỗi AI Auto-Schedule', err.response?.data?.error || err.message);
    } finally {
      setAutoScheduling(false);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filterStatus === 'todo') return t.status === 'todo';
    if (filterStatus === 'in_progress') return t.status === 'in_progress';
    return t.status === 'completed';
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* 1. AI Auto Schedule Banner */}
      <View style={[styles.aiBanner, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.aiBannerLeft}>
          <View style={[styles.sparkleIcon, { backgroundColor: theme.brandLight }]}>
            <Sparkles size={20} color={theme.brand} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.aiBannerTitle, { color: theme.text }]}>AI Tự Động Xếp Lịch</Text>
            <Text style={[styles.aiBannerDesc, { color: theme.textMuted }]}>
              Tính toán giờ trống và xếp lịch làm việc thông minh
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleAutoSchedule}
          disabled={autoScheduling}
          style={[styles.aiBannerBtn, { backgroundColor: theme.brand }]}
        >
          {autoScheduling ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.aiBannerBtnText}>Lập Lịch</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 2. Status Tabs Filter */}
      <View style={[styles.statusTabs, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        {[
          { key: 'todo', label: 'Cần làm' },
          { key: 'in_progress', label: 'Đang làm' },
          { key: 'completed', label: 'Đã xong' }
        ].map(st => {
          const isActive = filterStatus === st.key;
          return (
            <TouchableOpacity
              key={st.key}
              onPress={() => setFilterStatus(st.key)}
              style={[
                styles.statusTabItem,
                { backgroundColor: isActive ? theme.brand : 'transparent' }
              ]}
            >
              <Text style={[styles.statusTabText, { color: isActive ? '#FFFFFF' : theme.textMuted }]}>
                {st.label} ({tasks.filter(t => t.status === st.key).length})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Section Header & Add Task Button */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {filterStatus === 'todo' ? 'Việc Cần Làm' : filterStatus === 'in_progress' ? 'Đang Thực Hiện' : 'Đã Hoàn Thành'}
        </Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={[styles.addBtn, { backgroundColor: theme.brand }]}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Thêm Việc</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Tasks List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.brand} />
        </View>
      ) : filteredTasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ListTodo size={46} color={theme.subtext} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Không có công việc nào</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
            {filterStatus === 'todo' ? 'Bấm nút "Thêm Việc" để tạo mục tiêu mới' : 'Trống ở mục này'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const isCompleted = item.status === 'completed';
            const prio = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium;

            return (
              <View style={[styles.taskCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <TouchableOpacity onPress={() => handleToggleStatus(item)} style={styles.checkBtn}>
                  {isCompleted ? (
                    <CheckCircle2 size={22} color={theme.success} />
                  ) : (
                    <Circle size={22} color={theme.subtext} />
                  )}
                </TouchableOpacity>

                <View style={styles.taskBody}>
                  <Text style={[styles.taskTitle, { color: isCompleted ? theme.subtext : theme.text, textDecorationLine: isCompleted ? 'line-through' : 'none' }]}>
                    {item.title}
                  </Text>
                  <View style={styles.taskMeta}>
                    <View style={[styles.priorityBadge, { backgroundColor: prio.color + '20' }]}>
                      <Text style={{ fontSize: 10 }}>{prio.emoji}</Text>
                      <Text style={[styles.priorityText, { color: prio.color }]}>{prio.label}</Text>
                    </View>
                    <View style={styles.timeBadge}>
                      <Clock size={11} color={theme.textMuted} />
                      <Text style={[styles.timeText, { color: theme.textMuted }]}>
                        {item.estimated_minutes || 30} phút
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleDeleteTask(item.id, item.title)}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={16} color={theme.danger} />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* Modal Add Task */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Thêm Công Việc Mới</Text>

            <Text style={[styles.modalLabel, { color: theme.textMuted }]}>TÊN CÔNG VIỆC</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder="VD: Viết báo cáo tuần"
              placeholderTextColor={theme.subtext}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.modalLabel, { color: theme.textMuted }]}>MỨC ĐỘ ƯU TIÊN</Text>
            <View style={styles.priorityRow}>
              {['urgent', 'high', 'medium', 'low'].map(pKey => {
                const p = PRIORITY_CONFIG[pKey];
                const isSelected = priority === pKey;
                return (
                  <TouchableOpacity
                    key={pKey}
                    onPress={() => setPriority(pKey)}
                    style={[
                      styles.prioChip,
                      { backgroundColor: isSelected ? p.color : theme.inputBg, borderColor: theme.inputBorder }
                    ]}
                  >
                    <Text style={{ fontSize: 11 }}>{p.emoji}</Text>
                    <Text style={[styles.prioChipText, { color: isSelected ? '#FFFFFF' : theme.text }]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.modalLabel, { color: theme.textMuted }]}>THỜI LƯỢNG DỰ KIẾN (PHÚT)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder="45"
              keyboardType="number-pad"
              placeholderTextColor={theme.subtext}
              value={estimatedMinutes}
              onChangeText={setEstimatedMinutes}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalBtn, { backgroundColor: theme.inputBg }]}
              >
                <Text style={{ color: theme.textMuted, fontWeight: '700' }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateTask}
                style={[styles.modalBtn, { backgroundColor: theme.brand }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Lưu Công Việc</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  aiBanner: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  aiBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sparkleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  aiBannerDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  aiBannerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    marginLeft: 8,
  },
  aiBannerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  statusTabs: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    marginBottom: 14,
  },
  statusTabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  checkBtn: {
    paddingRight: 10,
  },
  taskBody: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {
    fontSize: 11,
  },
  deleteBtn: {
    padding: 6,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 14,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  prioChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 3,
  },
  prioChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 6,
  },
  modalBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
