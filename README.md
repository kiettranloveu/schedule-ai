# 🚀 ScheduleAI - Trợ Lý Lịch Trình & Tự Động Hóa AI

Ứng dụng quản lý lịch trình cá nhân kết hợp AI tự động hóa và **Discord Bot 2 chiều**.

![ScheduleAI](https://img.shields.io/badge/AI-Google%20Gemini-indigo?style=flat-square)
![Discord](https://img.shields.io/badge/Bot-Discord.js%20v14-blue?style=flat-square)
![Database](https://img.shields.io/badge/Storage-Local%20SQLite-green?style=flat-square)
![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Tailwind-sky?style=flat-square)

---

## ✨ Tính Năng Nổi Bật

1. **Lịch Biểu Trực Quan (Interactive Calendar)**:
   - Xem theo **Tháng**, **Tuần**, **Ngày**.
   - Hỗ trợ đổi màu sắc, phân loại (Công việc, Cuộc họp, Cá nhân, Học tập, Quan trọng).
   - **AI Nhập Nhanh**: Gõ văn bản tự nhiên (ví dụ: *"Chiều mai 15h họp với team tại phòng 3"*), Gemini tự động bóc tách giờ giấc và điền thông tin sự kiện.

2. **Quản Lý Công Việc & AI Auto-Scheduler**:
   - To-Do checklist với độ ưu tiên (Khẩn cấp, Cao, Trung bình, Thấp) và hạn chót (Deadline).
   - **✨ AI Auto-Scheduler**: Bạn chỉ cần chọn các việc cần làm, Gemini AI sẽ tự động tính toán các khung giờ trống trong ngày và xếp lịch vào Calendar tối ưu năng suất.

3. **Tác Vụ AI Lặp Lại Định Kỳ (Autonomous Recurring Jobs)**:
   - 🪙 **Báo giá vàng Việt Nam mỗi sáng (07:30)**: Tự động cào giá vàng SJC, Doji, PNJ, vàng nhẫn 9999 thực tế trong ngày, AI phân tích biến động và gửi Rich Embed vào Discord.
   - ⛅ **Bản tin thời tiết & Lời khuyên (06:45)**: Dự báo nhiệt độ, khả năng mưa, chỉ số UV và gợi ý trang phục/lịch trình ngoài trời.
   - 📋 **Briefing lịch trình đầu ngày (07:00)**: Tổng hợp các cuộc hẹn và deadline quan trọng trong ngày.
   - 📰 **Điểm tin công nghệ & AI (08:00)**: 3 tin tức nóng hổi được AI chọn lọc.
   - **Nút "Chạy Thử Ngay" (Test Run)**: Bấm để chạy ngay lập tức và bắn thử vào Discord để kiểm tra kết quả bất kỳ lúc nào.

4. **Discord Bot 2 Chiều**:
   - **Tự động gửi thông báo**: Báo giá vàng, thời tiết, điểm tin sáng đúng giờ hẹn.
   - **Tự động nhắc lịch**: Bot chủ động ping trước 15 phút khi sắp diễn ra sự kiện hoặc tới hạn chót.
   - **Lệnh Chat 2 Chiều**:
     - Gõ `/today` hoặc nhắn *"lịch hôm nay"*, *"hôm nay có việc gì"*: Bot trả về lịch trình trong ngày.
     - Nhắn *"giá vàng hôm nay"*, *"thời tiết hôm nay"*: Bot tra cứu tức thì và gửi bảng giá ngay.
     - Nhắn *"thêm lịch chiều mai 14h họp..."*: AI tự bóc tách và tạo sự kiện vào Web App!

5. **Bảo Mật Cục Bộ & 1-Click Launch**:
   - Lưu trữ 100% trên máy tính bằng SQLite (`schedule_ai.db`).
   - Khởi động cực nhanh với file `start.bat`.

---

## 🚀 Hướng Dẫn Khởi Chạy

### Cách 1: Chạy Bằng 1-Click (Khuyên dùng trên Windows)
- Nhấp đúp chuột vào file **`start.bat`**.
- Trình duyệt sẽ tự động mở trang web tại `http://localhost:5000`.

### Cách 2: Chạy Bằng Dòng Lệnh
```bash
# Khởi động server backend và bot
npm start
```
Truy cập: `http://localhost:5000`

---

## ⚙️ Hướng Dẫn Cài Đặt Ban Đầu (Chỉ Cần Làm 1 Lần)

Mở ứng dụng Web, chuyển sang tab **⚙️ Cài Đặt**:

### 1. Cấu hình Google Gemini API Key:
1. Vào [Google AI Studio](https://aistudio.google.com/app/apikey) (Miễn phí 100%).
2. Nhấp **Create API key** và sao chép mã API key.
3. Dán vào ô **Gemini API Key** trên Web và bấm **Kiểm Tra Kết Nối**.

### 2. Cấu hình Discord Bot (2 phút):
1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications) → Bấm **New Application** → Đặt tên bot (VD: *ScheduleAI*).
2. Vào menu **Bot** bên trái → Bấm **Reset Token** → Sao chép mã **Token** dán vào ô *Discord Bot Token*.
3. Tại trang Bot, cuộn xuống mục **Privileged Gateway Intents** → Bật xanh **MESSAGE CONTENT INTENT** (để bot đọc được lệnh chat).
4. Vào menu **OAuth2** → **URL Generator** → Tích chọn `bot` và `applications.commands`. Bên dưới tích `Send Messages`, `Embed Links`, `Read Message History` → Sao chép URL tạo ra và mở trên trình duyệt để mời Bot vào Server Discord của bạn.
5. Trên Discord, bật *Cài đặt người dùng → Nâng cao → Developer Mode*. Nhấp chuột phải vào kênh chat bạn muốn nhận thông báo → Chọn **Copy Channel ID** và dán vào ô *Channel ID*.
6. Bấm nút **Kiểm Tra & Bắn Tin Thử Nghiệm** trên Web!

---

## 📂 Cấu Trúc Mã Nguồn

```
ScheduleAI/
├── package.json              # Quản lý dependencies (Node.js Express + Discord.js + Cron)
├── start.bat                 # 1-Click Windows Launcher
├── README.md                 # Tài liệu hướng dẫn sử dụng
├── data/
│   └── schedule_ai.db        # SQLite database lưu trữ cục bộ
├── server/
│   ├── index.js              # Express API Server & Discord Bot entry point
│   ├── db.js                 # SQLite ORM / Data access methods
│   ├── discordBot.js         # Discord Client & 2-way message handler
│   ├── scheduler.js          # node-cron scheduler engine & 15m reminder checker
│   ├── gemini.js             # Gemini AI integration (auto-scheduler, scrapers synthesis)
│   ├── scrapers/
│   │   ├── goldPrice.js      # Bộ lấy dữ liệu giá vàng SJC, Doji, PNJ, 9999
│   │   └── weather.js        # Bộ lấy dữ liệu thời tiết Open-Meteo
│   └── routes/
│       ├── events.js         # API Quản lý lịch
│       ├── tasks.js          # API Quản lý to-do & auto-scheduling
│       ├── recurring.js      # API Quản lý tác vụ lặp lại & Test Run
│       └── settings.js       # API Cấu hình & Test kết nối
└── client/                   # Frontend Single Page App (React + Vite + Tailwind)
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── CalendarView.jsx
    │   │   ├── EventModal.jsx
    │   │   ├── TodoView.jsx
    │   │   ├── TaskModal.jsx
    │   │   ├── AutoSchedulerModal.jsx
    │   │   ├── RecurringJobsView.jsx
    │   │   ├── JobModal.jsx
    │   │   ├── LogsModal.jsx
    │   │   └── SettingsView.jsx
    │   └── services/api.js
    └── dist/                 # Production web bundle
```
