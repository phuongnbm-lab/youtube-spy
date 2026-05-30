@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title YouTube Spy - Dang khoi dong...
color 0A

echo.
echo  ============================================
echo        YouTube Spy  ^|  by Ba Phuong
echo  ============================================
echo.

set "ROOT=%~dp0"

:: ── 1. Kiem tra Python ────────────────────────────────────────────────────────
echo  [1/3] Kiem tra Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo  [LOI] Khong tim thay Python!
    echo  Tai va cai tai: https://python.org/downloads
    echo  Luu y: Tich "Add Python to PATH" khi cai dat.
    echo.
    pause
    exit /b 1
)
for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PY_VER=%%v
echo         OK - Python %PY_VER%

:: ── 2. Cai thu vien Python (bo qua neu da co) ─────────────────────────────────
echo  [2/3] Kiem tra thu vien Python...
python -c "import fastapi, uvicorn, pystray, PIL" >nul 2>&1
if errorlevel 1 (
    echo         Dang cai thu vien...
    pip install -r "%ROOT%backend\requirements.txt" -q -q
    if errorlevel 1 (
        echo  [LOI] Khong cai duoc thu vien. Kiem tra ket noi mang.
        pause
        exit /b 1
    )
)
echo         OK

:: ── 3. Build frontend (luon build de cap nhat code moi nhat) ─────────────────
echo  [3/3] Build giao dien...
node --version >nul 2>&1
if errorlevel 1 (
    echo  [LOI] Chua cai Node.js! Tai tai: https://nodejs.org
    pause
    exit /b 1
)
cd /d "%ROOT%frontend"
if not exist "node_modules" (
    echo         Cai node_modules lan dau...
    call npm install --silent
)
echo         Dang build...
call npm run build
if errorlevel 1 (
    echo  [LOI] Build that bai.
    pause
    exit /b 1
)
echo         OK - Build xong

:: ── Khoi dong ─────────────────────────────────────────────────────────────────
echo.
echo  Dang khoi dong... Icon se xuat hien o goc phai man hinh (System Tray).
echo  De tat: click phai icon tray ^> Tat app
echo.
title YouTube Spy - Dang chay

cd /d "%ROOT%"
python backend\launcher.py
set EXIT_CODE=%ERRORLEVEL%

:: Giu cua so neu co loi
if %EXIT_CODE% NEQ 0 (
    echo.
    echo  [LOI] App tat bat thuong (code %EXIT_CODE%).
    if exist "%ROOT%backend\ytspy.log" (
        echo  === Log cuoi ===
        powershell -NoProfile -Command "Get-Content '%ROOT%backend\ytspy.log' -Tail 15"
    )
    echo.
)
pause
