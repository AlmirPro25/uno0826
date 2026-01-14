@echo off
echo.
echo ╔═══════════════════════════════════════════════╗
echo ║     🚀 INICIANDO SISTEMA COMPLETO             ║
echo ╚═══════════════════════════════════════════════╝
echo.
echo Este script vai abrir 3 janelas:
echo   1. Backend (Node.js)
echo   2. Executor (Python)
echo   3. Frontend (React)
echo.
echo Aguarde todos iniciarem antes de usar!
echo.
pause

REM Inicia Backend
echo Iniciando Backend...
start "Backend - Gemini Companion" cmd /k "cd backend && npm run dev"
timeout /t 3 >nul

REM Inicia Executor
echo Iniciando Executor...
start "Executor - Gemini Robotics" cmd /k "cd executor && python executor.py"
timeout /t 3 >nul

REM Inicia Frontend
echo Iniciando Frontend...
start "Frontend - React" cmd /k "npm run dev"

echo.
echo ╔═══════════════════════════════════════════════╗
echo ║     ✅ SISTEMA INICIADO!                      ║
echo ╚═══════════════════════════════════════════════╝
echo.
echo Aguarde alguns segundos e acesse:
echo http://localhost:5173
echo.
echo Para parar, feche as 3 janelas que abriram.
echo.
pause
