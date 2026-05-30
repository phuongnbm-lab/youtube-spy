@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title Build YouTube Spy EXE
color 0B

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║     Build YouTube Spy — Single EXE       ║
echo  ╚══════════════════════════════════════════╝
echo.

set "ROOT=%~dp0"

:: ── 1. Build React frontend ────────────────────────────────────────────────────
echo  [1/4] Build giao dien React...
cd /d "%ROOT%frontend"

if not exist "node_modules" (
    echo         Cai node_modules truoc...
    npm install --silent
)

call npm run build >nul 2>&1
if errorlevel 1 (
    echo  [LOI] npm run build that bai!
    cd /d "%ROOT%frontend" && npm run build
    pause & exit /b 1
)
echo         OK — dist\ da san sang

:: ── 2. Cai PyInstaller ────────────────────────────────────────────────────────
echo  [2/4] Cai PyInstaller...
pip install pyinstaller -q --disable-pip-version-check
if errorlevel 1 ( echo  [LOI] Khong cai duoc PyInstaller & pause & exit /b 1 )
echo         OK

:: ── 3. Don dep build cu ───────────────────────────────────────────────────────
echo  [3/4] Don dep file cu...
cd /d "%ROOT%"
if exist "build" rmdir /s /q "build" >nul 2>&1
if exist "dist\YouTube Spy.exe" del /q "dist\YouTube Spy.exe" >nul 2>&1
if exist "YouTube Spy.spec" del /q "YouTube Spy.spec" >nul 2>&1
echo         OK

:: ── 4. Build EXE ──────────────────────────────────────────────────────────────
echo  [4/4] Dong goi EXE (co the mat 2-5 phut)...
echo.

pyinstaller ^
    --onefile ^
    --noconsole ^
    --name "YouTube Spy" ^
    --icon "Logo_build.ico" ^
    --add-data "frontend\dist;dist" ^
    --add-data "Logo.ico;." ^
    --hidden-import uvicorn.logging ^
    --hidden-import uvicorn.loops ^
    --hidden-import uvicorn.loops.auto ^
    --hidden-import uvicorn.protocols ^
    --hidden-import uvicorn.protocols.http ^
    --hidden-import uvicorn.protocols.http.auto ^
    --hidden-import uvicorn.protocols.websockets ^
    --hidden-import uvicorn.protocols.websockets.auto ^
    --hidden-import uvicorn.lifespan ^
    --hidden-import uvicorn.lifespan.on ^
    --hidden-import pystray._win32 ^
    --hidden-import pystray._base ^
    --hidden-import googleapiclient ^
    --hidden-import google.auth ^
    --hidden-import email.mime.text ^
    --hidden-import email.mime.multipart ^
    --collect-all uvicorn ^
    --collect-all pystray ^
    --collect-all PIL ^
    backend\launcher.py

if errorlevel 1 (
    echo.
    echo  [LOI] Build that bai! Xem log o tren.
    pause
    exit /b 1
)

:: ── Ket qua ────────────────────────────────────────────────────────────────────
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║           BUILD THANH CONG!              ║
echo  ╚══════════════════════════════════════════╝
echo.

set "EXE=%ROOT%dist\YouTube Spy.exe"
if exist "%EXE%" (
    for %%F in ("%EXE%") do set SIZE=%%~zF
    set /a SIZE_MB=!SIZE! / 1048576
    echo  File : dist\YouTube Spy.exe
    echo  Size : ~!SIZE_MB! MB
    echo.
    echo  Gui file nay cho Bob la xong!
    echo  Bob chi can double-click — khong can cai gi them.
    echo.
    echo  Luu y: Neu Bob chua co API Key, mo app va vao Settings ^(bieu tuong chiec khoa^) de nhap.
) else (
    echo  [CANH BAO] Khong tim thay file EXE!
)

echo.
pause
