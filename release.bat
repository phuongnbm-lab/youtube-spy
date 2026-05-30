@echo off
chcp 65001 >/dev/null 2>&1
title YouTube Spy — Release

echo.
echo  ╔══════════════════════════════════════╗
echo  ║     YouTube Spy — Tao Release        ║
echo  ╚══════════════════════════════════════╝
echo.

:: Doc APP_VERSION tu main.py
for /f "tokens=3 delims== " %%v in ('findstr /r "APP_VERSION = " backend\main.py') do (
    set RAW=%%v
)
:: Bo dau ngoac kep
set VERSION=%RAW:"=%
set TAG=v%VERSION%

echo  Phien ban hien tai: %TAG%
echo.
echo  Cac buoc se thuc hien:
echo    1. git add tat ca thay doi
echo    2. git commit
echo    3. git push len GitHub
echo    4. Tao tag %TAG%
echo    5. Push tag → GitHub Actions tu dong build EXE va tao Release
echo.
set /p CONFIRM= Ban chac chan muon release %TAG%? (Y/N): 
if /i not "%CONFIRM%"=="Y" (
    echo  Huy bo.
    pause & exit /b 0
)

echo.
echo  [1/4] Commit code...
git add -A
git commit -m "chore: release %TAG%"
if errorlevel 1 (
    echo  Khong co gi de commit — OK, tiep tuc...
)

echo  [2/4] Push code len GitHub...
git push origin master
if errorlevel 1 (
    echo  [LOI] Push that bai! Kiem tra ket noi mang.
    pause & exit /b 1
)

echo  [3/4] Tao tag %TAG%...
git tag %TAG%
if errorlevel 1 (
    echo  [LOI] Tag %TAG% da ton tai! Doi APP_VERSION trong backend\main.py truoc.
    pause & exit /b 1
)

echo  [4/4] Push tag len GitHub...
git push origin %TAG%
if errorlevel 1 (
    echo  [LOI] Push tag that bai!
    pause & exit /b 1
)

echo.
echo  ╔══════════════════════════════════════╗
echo  ║           THANH CONG!                ║
echo  ╚══════════════════════════════════════╝
echo.
echo  GitHub Actions dang build EXE tu dong.
echo  Khoang 5-10 phut sau se co ban tai tai:
echo  https://github.com/phuongnbm-lab/youtube-spy/releases
echo.
echo  Bob se tu dong thay thong bao khi mo app!
echo.

start https://github.com/phuongnbm-lab/youtube-spy/actions
pause
