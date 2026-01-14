@echo off
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║  🧪 TESTANDO SISTEMA EXECUTOR + ROBOTICS VISION          ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Verifica se curl está disponível
curl --version >nul 2>&1
if errorlevel 1 (
    echo ❌ curl não encontrado!
    echo.
    echo Use PowerShell ou instale curl
    pause
    exit /b 1
)

echo [1/5] Testando Backend...
curl -s http://localhost:3001/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Backend não está rodando!
    echo.
    echo Execute: INICIAR_EXECUTOR_COMPLETO.bat
    pause
    exit /b 1
)
echo ✅ Backend OK
echo.

echo [2/5] Testando Executor - Screen Info...
curl -s -X POST http://localhost:3001/api/executor/screen-info >nul 2>&1
if errorlevel 1 (
    echo ❌ Executor não está conectado!
    echo.
    echo Verifique se o executor está rodando
    pause
    exit /b 1
)
echo ✅ Executor OK
echo.

echo [3/5] Testando Robotics Vision - Detect 2D...
curl -s -X POST http://localhost:3001/api/robotics/detect-2d ^
  -H "Content-Type: application/json" ^
  -d "{\"targetItems\": \"buttons\", \"maxItems\": 5}" >nul 2>&1
if errorlevel 1 (
    echo ❌ Robotics Vision falhou!
    pause
    exit /b 1
)
echo ✅ Robotics Vision OK
echo.

echo [4/5] Testando movimento do mouse...
curl -s -X POST http://localhost:3001/api/executor/move ^
  -H "Content-Type: application/json" ^
  -d "{\"x\": 500, \"y\": 500, \"duration\": 0.5}" >nul 2>&1
if errorlevel 1 (
    echo ❌ Movimento do mouse falhou!
    pause
    exit /b 1
)
echo ✅ Mouse OK (movido para 500, 500)
echo.

echo [5/5] Testando detecção de pontos...
curl -s -X POST http://localhost:3001/api/robotics/detect-points ^
  -H "Content-Type: application/json" ^
  -d "{\"targetItems\": \"icons\", \"maxItems\": 5}" >nul 2>&1
if errorlevel 1 (
    echo ❌ Detecção de pontos falhou!
    pause
    exit /b 1
)
echo ✅ Detecção de pontos OK
echo.

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║  ✅ TODOS OS TESTES PASSARAM!                             ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo 🎊 Seu sistema está 100%% funcional!
echo.
echo 🎯 Próximos passos:
echo    1. Teste comandos de voz no frontend
echo    2. Use a API REST para automações
echo    3. Veja exemplos em: backend/examples/robotics-vision-examples.ts
echo.
echo 📚 Documentação:
echo    • ROBOTICS_COMPLETE.md - Guia completo
echo    • TESTE_ROBOTICS_VISION.md - Testes detalhados
echo    • QUICK_START_ROBOTICS.md - Início rápido
echo.
echo 🧪 Teste manual:
echo    curl -X POST http://localhost:3001/api/robotics/find-and-click \
echo      -H "Content-Type: application/json" \
echo      -d "{\"targetItem\": \"close button\"}"
echo.
pause
