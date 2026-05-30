@echo off
chcp 65001 >/dev/null 2>&1
title YouTube Spy — Release

echo.
echo  ╔══════════════════════════════════════╗
echo  ║     YouTube Spy — Tao Release        ║
echo  ╚══════════════════════════════════════╝
echo.

:: Lay ngay hom nay lam version: YYYY.MM.DD
for /f "tokens=2 delims==" %%d in ('wmic os get LocalDateTime /value') do set DT=%%d
set VERSION=%DT:~0,4%.%DT:~4,2%.%DT:~6,2%
set TAG=v%VERSION%

echo  Phien ban moi: %TAG%
echo.
echo  Cac buoc se thuc hien:
echo    1. git commit + push len GitHub
echo    2. Tao tag %TAG%
echo    3. Push tag → GitHub Actions tu dong build EXE va tao Release
echo    4. Bob mo app → bam "Cap nhat ngay" → tu dong cap nhat
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
    echo  [LOI] Tag %TAG% da ton tai! Hom nay da release roi.
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
echo  Khoang 5-10 phut sau Bob se thay thong bao "Cap nhat ngay" khi mo app.
echo.

start https://github.com/phuongnbm-lab/youtube-spy/actions
pause
