@echo off
chcp 65001 >nul
cls

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  🚀 PROX AI STUDIO - INICIAR SISTEMA                  ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Verificar se já está instalado
if not exist "backend\node_modules" (
    echo ⚠️  Dependências não instaladas!
    echo 📦 Execute primeiro: instalar-e-iniciar.bat
    echo.
    pause
    exit /b 1
)

echo 🔥 Iniciando Backend...
start "Prox AI - Backend" cmd /k "cd /d %~dp0backend && npm start"

echo ⏳ Aguardando 5 segundos...
timeout /t 5 /nobreak >nul

echo 🎨 Iniciando Frontend...
start "Prox AI - Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  ✅ SISTEMA INICIADO!                                 ║
echo ╠════════════════════════════════════════════════════════╣
echo ║  Backend:  http://localhost:3002                      ║
echo ║  Frontend: http://localhost:3000                      ║
echo ║                                                        ║
echo ║  🌐 Abra o navegador em: http://localhost:3000        ║
echo ╚════════════════════════════════════════════════════════╝
echo.

pause
