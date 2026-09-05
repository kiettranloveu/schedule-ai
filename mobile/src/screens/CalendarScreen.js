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
import { getLocalDateString, formatTimeVN } from '../utils/dateUtils';
import { Sparkles, Plus, Clock, Tag, Trash2, Calendar as CalendarIcon, Check } from 'lucide-react-native';

const CATEGORY_COLORS = {
  work: '#3B82F6',
  personal: '#10B981',
  urgent: '#EF4444',
  study: '#8B5CF6',
  health: '#EC4899'
};

export default function CalendarScreen() {
  const { theme } = useTheme();

  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // AI Natural parse input
  const [naturalText, setNaturalText] = useState('');
  const [aiParsing, setAiParsing] = useState(false);

  // Manual Add Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [newCategory, setNewCategory] = useState('work');

  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.get('/events');
      if (res.data.success) {
        setEvents(res.data.data || []);
      }
    } catch (err) {
      console.warn('Fetch events error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  // AI Natural parsing
  const handleAiParse = async () => {
    if (!naturalText.trim()) return;
    setAiParsing(true);
    try {
      const parseRes = await api.post('/events/parse-natural', { text: naturalText });
      const parsed = parseRes.data.data;

      const newId = 'evt-' + Date.now();
      await api.post('/events', {
        id: newId,
        title: parsed.title,
        description: parsed.description || 'Thêm qua AI iPhone',
        start_time: parsed.start_time,
        end_time: parsed.end_time,
        category: parsed.category || 'work',
        color: parsed.color || '#3B82F6',
        reminder_minutes: parsed.reminder_minutes || 15
      });

      setNaturalText('');
      fetchEvents();
      Alert.alert('✨ AI Tạo Lịch Thành Công', `Đã thêm: "${parsed.title}"\nBắt đầu: ${new Date(parsed.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`);
    } catch (err) {
      Alert.alert('Lỗi AI', err.response?.data?.error || err.message || 'Không thể phân tích câu lệnh.');
    } finally {
      setAiParsing(false);
    }
  };

  const handleManualAdd = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề sự kiện.');
      return;
    }

    try {
      const startDateTime = `${selectedDate}T${newStartTime}:00`;
      const endDateTime = `${selectedDate}T${newEndTime}:00`;
      const newId = 'evt-' + Date.now();

      await api.post('/events', {
        id: newId,
        title: newTitle.trim(),
        description: 'Tạo thủ công trên iPhone',
        start_time: startDateTime,
        end_time: endDateTime,
        category: newCategory,
        color: CATEGORY_COLORS[newCategory] || '#3B82F6',
        reminder_minutes: 15
      });

      setModalVisible(false);
      setNewTitle('');
      fetchEvents();
    } catch (err) {
      Alert.alert('Lỗi', err.response?.data?.error || err.message);
    }
  };

  const handleDeleteEvent = (id, title) => {
    Alert.alert(
      'Xóa sự kiện',
      `Bạn có chắc chắn muốn xóa "${title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/events/${id}`);
              setEvents(prev => prev.filter(e => e.id !== id));
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể xóa sự kiện.');
            }
          }
        }
      ]
    );
  };

  // Filter events for selected date
  const dayEvents = events.filter(e => e.start_time && e.start_time.startsWith(selectedDate));

  // Render 7-day strip (today +/- 3 days)
  const renderDayStrip = () => {
    const days = [];
    const today = new Date();
    for (let i = -2; i <= 4; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      days.push(d);
    }

    return (
      <View style={styles.dayStripContainer}>
        {days.map((dateObj, idx) => {
          const dateStr = getLocalDateString(dateObj);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === getLocalDateString();

          const dayOfWeekName = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][dateObj.getDay()];
          const dayNum = dateObj.getDate();

          return (
            <TouchableOpacity
              key={idx}
              onPress={() => setSelectedDate(dateStr)}
              style={[
                styles.dayChip,
                { backgroundColor: isSelected ? theme.brand : theme.card, borderColor: isSelected ? theme.brand : theme.cardBorder }
              ]}
            >
              <Text style={[styles.dayChipText, { color: isSelected ? '#FFFFFF' : theme.textMuted }]}>
                {isToday ? 'H.nay' : dayOfWeekName}
              </Text>
              <Text style={[styles.dayChipNum, { color: isSelected ? '#FFFFFF' : theme.text }]}>
                {dayNum}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* 1. AI Quick Add Input */}
      <View style={[styles.aiBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.aiHeader}>
          <Sparkles size={16} color={theme.gold} />
          <Text style={[styles.aiTitle, { color: theme.text }]}>AI Nhập Lịch Bằng Tiếng Việt</Text>
        </View>
        <View style={styles.aiInputRow}>
          <TextInput
            style={[styles.aiInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
            placeholder="VD: Mai 15h họp với team tại phòng 3..."
            placeholderTextColor={theme.subtext}
            value={naturalText}
            onChangeText={setNaturalText}
          />
          <TouchableOpacity
            onPress={handleAiParse}
            disabled={aiParsing || !naturalText.trim()}
            style={[styles.aiBtn, { backgroundColor: theme.brand, opacity: (!naturalText.trim() || aiParsing) ? 0.5 : 1 }]}
          >
            {aiParsing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Sparkles size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Date Strip */}
      {renderDayStrip()}

      {/* 3. Header for selected day & Manual Add Button */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {selectedDate === new Date().toISOString().split('T')[0] ? 'Hôm nay' : selectedDate}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
            {dayEvents.length} sự kiện được lên lịch
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={[styles.addBtn, { backgroundColor: theme.brand }]}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Thêm</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Events List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.brand} />
        </View>
      ) : dayEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <CalendarIcon size={48} color={theme.subtext} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Chưa có sự kiện nào</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
            Dùng ô AI phía trên hoặc bấm nút Thêm để lên lịch
          </Text>
        </View>
      ) : (
        <FlatList
          data={dayEvents}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const startTimeStr = new Date(item.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            const endTimeStr = new Date(item.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

            return (
              <View style={[styles.eventCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={[styles.eventStripe, { backgroundColor: item.color || theme.brand }]} />
                <View style={styles.eventBody}>
                  <Text style={[styles.eventTitle, { color: theme.text }]}>{item.title}</Text>
                  <View style={styles.eventMeta}>
                    <View style={styles.metaItem}>
                      <Clock size={13} color={theme.textMuted} />
                      <Text style={[styles.metaText, { color: theme.textMuted }]}>
                        {startTimeStr} - {endTimeStr}
                      </Text>
                    </View>
                    <View style={[styles.categoryBadge, { backgroundColor: (item.color || theme.brand) + '20' }]}>
                      <Tag size={11} color={item.color || theme.brand} />
                      <Text style={[styles.categoryText, { color: item.color || theme.brand }]}>
                        {item.category || 'Công việc'}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteEvent(item.id, item.title)}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={16} color={theme.danger} />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* Manual Add Event Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Thêm Sự Kiện Mới</Text>

            <Text style={[styles.modalLabel, { color: theme.textMuted }]}>TIÊU ĐỀ SỰ KIỆN</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder="VD: Họp định kỳ tuần"
              placeholderTextColor={theme.subtext}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalLabel, { color: theme.textMuted }]}>GIỜ BẮT ĐẦU</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                  placeholder="09:00"
                  placeholderTextColor={theme.subtext}
                  value={newStartTime}
                  onChangeText={setNewStartTime}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalLabel, { color: theme.textMuted }]}>GIỜ KẾT THÚC</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                  placeholder="10:00"
                  placeholderTextColor={theme.subtext}
                  value={newEndTime}
                  onChangeText={setNewEndTime}
                />
              </View>
            </View>

            <Text style={[styles.modalLabel, { color: theme.textMuted }]}>PHÂN LOẠI</Text>
            <View style={styles.categoryRow}>
              {['work', 'personal', 'urgent', 'study'].map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setNewCategory(cat)}
                  style={[
                    styles.catChip,
                    { backgroundColor: newCategory === cat ? theme.brand : theme.inputBg, borderColor: theme.inputBorder }
                  ]}
                >
                  <Text style={[styles.catChipText, { color: newCategory === cat ? '#FFFFFF' : theme.text }]}>
                    {cat === 'work' ? 'Công việc' : cat === 'personal' ? 'Cá nhân' : cat === 'urgent' ? 'Khẩn cấp' : 'Học tập'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalBtn, { backgroundColor: theme.inputBg }]}
              >
                <Text style={{ color: theme.textMuted, fontWeight: '700' }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleManualAdd}
                style={[styles.modalBtn, { backgroundColor: theme.brand }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Lưu Sự Kiện</Text>
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
  aiBox: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiInput: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  aiBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayStripContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayChip: {
    width: 44,
    height: 60,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  dayChipText: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  dayChipNum: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  eventCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    alignItems: 'center',
    paddingRight: 12,
  },
  eventStripe: {
    width: 5,
    height: '100%',
  },
  eventBody: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  deleteBtn: {
    padding: 8,
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
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
