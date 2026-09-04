@echo off
chcp 65001 > nul
title Day Code Len GitHub - ScheduleAI
cls
echo ================================================================
echo           DAY CODE SCHEDULEAI LEN GITHUB TU DONG
echo ================================================================
echo.
echo Hay dan duong link Repository tren GitHub cua ban vao day:
echo (Vi du: https://github.com/ten-cua-ban/schedule-ai.git)
echo.
set /p REPO_URL="Link GitHub Repo cua ban: "

if "%REPO_URL%"=="" (
    echo [LOI] Ban chua nhap link GitHub!
    pause
    exit /b
)

echo.
echo [*] Dang dong bo va day toan bo ma nguon len GitHub...
git branch -M main
git remote remove origin > nul 2>&1
git remote add origin %REPO_URL%
git push -u origin main --force

echo.
if %errorlevel% equ 0 (
    echo ================================================================
    echo [THANH CONG] Toan bo code da duoc day len GitHub 100%!
    echo ================================================================
) else (
    echo ================================================================
    echo [CHU Y] Neu hien popup dang nhap GitHub tren trinh duyet, hay bam Sign In nhe.
    echo ================================================================
)
pause
