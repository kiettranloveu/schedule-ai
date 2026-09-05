@echo off
chcp 65001 > nul
title ScheduleAI - Xuat File .IPA Cho iPhone
cls
echo ================================================================
echo        SCHEDULEAI - XUAT FILE .IPA CHO IPHONE
echo ================================================================
echo.
echo [1/2] Dang chuyen toi thu muc ung dung mobile...
cd /d "%~dp0mobile"

echo.
echo [2/2] Kiem tra trang thai dang nhap Expo...
call .\node_modules\.bin\eas.cmd whoami > nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ================================================================
    echo  * BUOC 1: DANG NHAP TAI KHOAN EXPO
    echo    - He thong dang mo trinh duyet web de ban dang nhap...
    echo    - Ban chi can chon "Log in with Google" tren web la xong!
    echo ================================================================
    echo.
    call .\node_modules\.bin\eas.cmd login
)

echo.
echo ================================================================
echo  * BUOC 2: TIEN HANH BIEN DICH .IPA
echo    - Dang ket noi may chu dam may de xuat file .IPA...
echo ================================================================
echo.
call .\node_modules\.bin\eas.cmd build -p ios --profile preview
echo.
echo ================================================================
echo  Luu y: Neu Expo yeu cau tai khoan Apple Developer (/nam),
echo  ban chi can mo GitHub Actions de build .IPA mien phi 100%%:
echo  https://github.com/kiettranloveu/schedule-ai/actions
echo ================================================================
pause