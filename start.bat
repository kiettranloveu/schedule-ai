@echo off
chcp 65001 > nul
title ScheduleAI - Tro Ly Lich Trinh & Tu Dong Hoa AI
cls
echo ================================================================
echo           SCHEDULEAI - SMART CALENDAR & DISCORD BOT
echo ================================================================
echo.
echo [1/3] Kiem tra moi truong Node.js...
node -v > nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Node.js tren may tinh cua ban!
    echo Vui long cai dat Node.js tu: https://nodejs.org/
    pause
    exit /b
)

echo [2/3] Dang khoi dong ScheduleAI Server & Discord Bot...
start "" http://localhost:5000

echo [3/3] He thong da san sang!
echo Ung dung dang chay tai: http://localhost:5000
echo.
echo * Nhan Ctrl+C de dung server khi khong su dung.
echo ================================================================
echo.
node server/index.js
pause
