@echo off
chcp 65001 > nul
title ScheduleAI - Xuat File .IPA Cho iPhone
cls
echo ================================================================
echo        SCHEDULEAI - XUAT FILE .IPA CHO IPHONE (V1.0.3)
echo ================================================================
echo.
echo  File ScheduleAI.ipa (Ban Zero-Crash Shield) dang duoc bien dich!
echo.
echo  CHON PHUONG THUC:
echo  [1] Tai truc tiep ScheduleAI.ipa v1.0.3 (Khuyen dung - 100%% Mo Duoc)
echo  [2] Mo trang GitHub Releases
echo  [3] Chay build tren Expo EAS
echo.
set /p choice="Nhap lua chon (1, 2 hoac 3) [Mac dinh: 1]: "
if "%choice%"=="" set choice=1

if "%choice%"=="1" (
    echo.
    echo Dang mo link tai truc tiep file ScheduleAI.ipa v1.0.3...
    start https://github.com/kiettranloveu/schedule-ai/releases/download/v1.0.3-ipa/ScheduleAI.ipa
    pause
    exit /b
)

if "%choice%"=="2" (
    echo.
    echo Dang mo trang GitHub Releases...
    start https://github.com/kiettranloveu/schedule-ai/releases
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