@echo off
chcp 65001 > nul
title ScheduleAI - Xuat File .IPA Cho iPhone (EAS Build)
cls
echo ================================================================
echo        SCHEDULEAI - XUAT FILE .IPA CHO IPHONE (EAS BUILD)
echo ================================================================
echo.
echo [1/3] Kiem tra cau hinh du an mobile...
cd mobile
echo.
echo [2/3] Dang ket noi Expo Cloud de bien dich thanh file .IPA...
echo.
echo * Neu chua dang nhap Expo, he thong se hien thi menu dang nhap
echo   (Chon "Log in with browser" hoac nhap tai khoan expo.dev mien phi).
echo.
echo [3/3] Bat dau build file .IPA cho iPhone...
echo.
npx eas build -p ios --profile preview
pause
