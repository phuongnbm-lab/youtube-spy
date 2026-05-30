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
set /p CONFIRM= Ban chac chan muon release %TAG%? (Y/N): 
if /i not "%CONFIRM%"=="Y" (
    echo  Huy bo.
    pause & exit /b 0
)

echo.
echo  [1/5] Ghi version %VERSION% vao main.py...
powershell -Command "(Get-Content backend\main.py -Raw) -replace 'APP_VERSION = \"[^\"]+\"', 'APP_VERSION = \"%VERSION%\"' | Set-Content backend\main.py -NoNewline"
echo         OK

echo  [2/5] Commit code...
git add -A
git commit -m "chore: release %TAG%"
if errorlevel 1 echo  Khong co gi de commit — OK, tiep tuc...

echo  [3/5] Push code len GitHub...
git push origin master
if errorlevel 1 ( echo  [LOI] Push that bai! & pause & exit /b 1 )

echo  [4/5] Tao tag %TAG%...
git tag %TAG%
if errorlevel 1 ( echo  [LOI] Tag %TAG% da ton tai! Hom nay da release roi. & pause & exit /b 1 )

echo  [5/5] Push tag len GitHub...
git push origin %TAG%
if errorlevel 1 ( echo  [LOI] Push tag that bai! & pause & exit /b 1 )

echo.
echo  ╔══════════════════════════════════════╗
echo  ║           THANH CONG!                ║
echo  ╚══════════════════════════════════════╝
echo.
echo  GitHub Actions dang build EXE tu dong (~5-10 phut).
echo  Bob se thay nut "Cap nhat ngay" khi mo app.
echo.
start https://github.com/phuongnbm-lab/youtube-spy/actions
pause
