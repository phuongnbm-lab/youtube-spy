@echo off
setlocal
chcp 65001 >nul 2>&1
title YouTube Spy - DEV / TEST mode
color 0B

echo.
echo  ============================================
echo     YouTube Spy  ^|  DEV / TEST (hot reload)
echo  ============================================
echo.

set "ROOT=%~dp0"

REM --- 1. Kiem tra Python ^& Node ---
python --version >nul 2>&1
if errorlevel 1 (
    echo  [LOI] Khong tim thay Python. Tai tai: https://python.org/downloads
    pause & exit /b 1
)
node --version >nul 2>&1
if errorlevel 1 (
    echo  [LOI] Chua cai Node.js. Tai tai: https://nodejs.org
    pause & exit /b 1
)

REM --- 2. Thu vien Python cho dev (cai neu thieu) ---
echo  [1/3] Kiem tra thu vien backend...
python -c "import fastapi, uvicorn" >nul 2>&1
if errorlevel 1 (
    echo         Dang cai fastapi/uvicorn/google-api...
    python -m pip install fastapi "uvicorn[standard]" google-api-python-client python-dotenv aiofiles -q
    if errorlevel 1 (
        echo  [LOI] Khong cai duoc thu vien Python. Kiem tra mang.
        pause & exit /b 1
    )
)
echo         OK

REM --- 3. node_modules (cai lan dau) ---
echo  [2/3] Kiem tra node_modules...
if not exist "%ROOT%frontend\node_modules" (
    echo         Cai node_modules lan dau...
    cd /d "%ROOT%frontend"
    call npm install --silent
)
echo         OK

REM --- 4. Mo 2 cua so: Backend (8000, auto-reload) + Frontend (Vite dev) ---
echo  [3/3] Khoi dong backend + frontend...
echo.
echo   - Backend  : http://localhost:8000   (FastAPI, --reload)
echo   - Frontend : http://localhost:5173   (Vite, hot reload)
echo.

start "YTSpy BACKEND :8000"  cmd /k "cd /d "%ROOT%backend" && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
start "YTSpy FRONTEND :5173" cmd /k "cd /d "%ROOT%frontend" && npm run dev"

REM Cho frontend khoi dong roi mo trinh duyet
timeout /t 5 >nul
start "" http://localhost:5173

echo  Da mo trinh duyet. Sua code, luu -^> tu cap nhat (khong can build lai).
echo.
echo  De TAT: dong 2 cua so "YTSpy BACKEND" va "YTSpy FRONTEND".
echo.
pause
