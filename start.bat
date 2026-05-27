@echo off
echo [YT Hour Spy] Starting...

start "Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --port 8000"
timeout /t 2 /nobreak >nul
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo [OK] Backend  -> http://localhost:8000
echo [OK] Frontend -> http://localhost:5173
echo.
start http://localhost:5173
