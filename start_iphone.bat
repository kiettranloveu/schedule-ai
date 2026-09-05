@echo off
chcp 65001 > nul
title ScheduleAI - Ung Dung iPhone (Expo)
cls
echo ================================================================
echo           SCHEDULEAI - KHOI CHAY APP CHO IPHONE (EXPO)
echo ================================================================
echo.
echo [1/2] Dang khoi dong ScheduleAI Backend Server...
start "ScheduleAI Backend Server" cmd /c "node server/index.js"
timeout /t 2 > nul

echo.
echo [2/2] Dang khoi chay Expo Dev Server cho iPhone...
echo.
echo ================================================================
echo   HUONG DAN MO APP TREN IPHONE:
echo   1. Cai app "Expo Go" mien phi tu App Store tren iPhone
echo   2. Mo CAMERA tren iPhone va QUET MA QR ben duoi
echo   3. Cham vao thong bao tren man hinh iPhone de vao app!
echo ================================================================
echo.

cd mobile
npx expo start -c
pause
