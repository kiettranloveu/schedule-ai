@echo off
chcp 65001 > nul
title ScheduleAI - Xuat File .IPA Cho iPhone (EAS Build)
cls
echo ================================================================
echo        SCHEDULEAI - XUAT FILE .IPA CHO IPHONE (EAS BUILD)
echo ================================================================
echo.
echo [1/2] Dang chuyen toi thu muc ung dung mobile...
cd mobile
echo.
echo [2/2] Dang ket noi Expo Cloud de bien dich thanh file .IPA...
echo.
echo ================================================================
echo  * HUONG DAN DANG NHAP TREN BAN PHIM (Chi hoi 1 lan):
echo    - Khi terminal hien: "Log in to EAS"
echo    - Ban dung phim mui ten xuong chon: "Log in with browser" ➔ Nhan Enter
echo    - Trinh duyet web se mo ra, ban chi can dang nhap Google la xong!
echo    - He thong se tu dong build va gui lai LINK TAI FILE .IPA cho ban.
echo ================================================================
echo.

call .\node_modules\.bin\eas.cmd build -p ios --profile preview
pause
