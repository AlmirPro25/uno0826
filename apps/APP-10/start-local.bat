@echo off
title Aether Local Mode

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║  🚀 Aether - Local PowerShell Mode                       ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

:: Create workspace if not exists
if not exist "workspace" mkdir workspace

:: Install server dependencies
if not exist "server\node_modules" (
    echo 📦 Installing server dependencies...
    cd server
    call npm install
    cd ..
)

:: Install frontend dependencies
if not exist "node_modules" (
    echo 📦 Installing frontend dependencies...
    call npm install
)

echo.
echo 🔧 Starting services...
echo.

:: Start backend in new window
echo   [1/2] Starting Backend Server (port 3001)...
start "Aether Backend" cmd /k "cd server && npm run dev"

timeout /t 2 /nobreak >nul

:: Start frontend in new window
echo   [2/2] Starting Frontend (port 5173)...
start "Aether Frontend" cmd /k "set VITE_LOCAL_MODE=true && npm run dev"

echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo   ✅ Services started!
echo.
echo   🌐 Frontend:  http://localhost:5173
echo   🔌 Backend:   http://localhost:3001
echo   📁 Workspace: %CD%\workspace
echo.
echo   💡 The agent now has access to real PowerShell!
echo.
echo ═══════════════════════════════════════════════════════════
echo.

:: Wait and open browser
timeout /t 3 /nobreak >nul
start http://localhost:5173

pause
