@echo off
chcp 65001 > nul
title ScheduleAI - Xuat File .IPA Cho iPhone
cls
echo ================================================================
echo        SCHEDULEAI - XUAT FILE .IPA CHO IPHONE
echo ================================================================
echo.
echo  File .IPA (Ban sua loi mo app) dang duoc he thong bien dich!
echo.
echo  CHON PHUONG THUC:
echo  [1] Mo trang Releases de tai truc tiep file ScheduleAI.ipa (Khuyen dung)
echo  [2] Mo trang GitHub Actions xem tien trinh Cloud Build
echo  [3] Chay build tren Expo EAS (Yeu cau tai khoan Apple Developer)
echo.
set /p choice="Nhap lua chon (1, 2 hoac 3) [Mac dinh: 1]: "
if "%choice%"=="" set choice=1

if "%choice%"=="1" (
    echo.
    echo Dang mo trang tai Releases tren trinh duyet...
    start https://github.com/kiettranloveu/schedule-ai/releases
    pause
    exit /b
)

if "%choice%"=="2" (
    echo.
    echo Dang mo GitHub Actions...
    start https://github.com/kiettranloveu/schedule-ai/actions/runs/33956193005
    pause
    exit /b
)

if "%choice%"=="3" (
    cd /d "%~dp0mobile"
    echo.
    echo Kiem tra dang nhap Expo...
    call .\node_modules\.bin\eas.cmd whoami > nul 2>&1
    if %errorlevel% neq 0 (
        echo Dang mo trinh duyet de ban dang nhap Expo...
        call .\node_modules\.bin\eas.cmd login
    )
    echo.
    echo Dang bat dau EAS Build...
    call .\node_modules\.bin\eas.cmd build -p ios --profile preview
    pause
)