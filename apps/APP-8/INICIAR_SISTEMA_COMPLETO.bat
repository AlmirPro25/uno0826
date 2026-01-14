@echo off
chcp 65001 >nul
cls

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║     🧠 INICIANDO SISTEMA AGÊNTICO COMPLETO               ║
echo ║                                                           ║
echo ║     Consciência (Live Agent) + Subconsciente (Maestro)   ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

echo 📋 Verificando dependências...
echo.

REM Verifica Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado!
    echo    Instale em: https://nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js encontrado

REM Verifica Python
where py >nul 2>&1
if %errorlevel% neq 0 (
    where python >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Python não encontrado!
        echo    Instale em: https://python.org
        pause
        exit /b 1
    )
)
echo ✅ Python encontrado

echo.
echo ═══════════════════════════════════════════════════════════
echo  INICIANDO SERVIÇOS
echo ═══════════════════════════════════════════════════════════
echo.

REM 1. Inicia Backend
echo 🔧 [1/3] Iniciando Backend (porta 3001)...
start "Backend - Maestro" cmd /k "cd backend && echo 🎭 BACKEND - MAESTRO && echo. && npm run dev"
timeout /t 5 /nobreak >nul

REM 2. Inicia Executor
echo ⚡ [2/3] Iniciando Executor Python...
start "Executor - Braços" cmd /k "cd executor && echo 🎮 EXECUTOR - BRAÇOS && echo. && py executor.py"
timeout /t 5 /nobreak >nul

REM 3. Inicia Frontend
echo 🌐 [3/3] Iniciando Frontend (porta 5173)...
start "Frontend - Interface" cmd /k "echo 🧠 FRONTEND - CONSCIÊNCIA && echo. && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ═══════════════════════════════════════════════════════════
echo  ✅ SISTEMA INICIADO COM SUCESSO!
echo ═══════════════════════════════════════════════════════════
echo.
echo 📊 Status dos Serviços:
echo.
echo    🎭 Backend (Maestro)     → http://localhost:3001
echo    🎮 Executor (Braços)     → WebSocket conectado
echo    🧠 Frontend (Consciência) → http://localhost:5173
echo.
echo ═══════════════════════════════════════════════════════════
echo  📝 PRÓXIMOS PASSOS
echo ═══════════════════════════════════════════════════════════
echo.
echo  1. Aguarde 10-15 segundos para tudo inicializar
echo  2. Abra: http://localhost:5173
echo  3. Verifique se o Executor está VERDE (conectado)
echo  4. Teste o Live Agent com comandos de voz
echo.
echo  💡 Comandos de exemplo:
echo     • "Abra o YouTube"
echo     • "Pesquise Python tutorial"
echo     • "O que tem na tela?"
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo 🔍 Para verificar logs:
echo    • Backend: Janela "Backend - Maestro"
echo    • Executor: Janela "Executor - Braços"
echo    • Frontend: Janela "Frontend - Consciência"
echo.
echo 🛑 Para parar tudo: Feche todas as janelas ou pressione Ctrl+C
echo.
echo ═══════════════════════════════════════════════════════════
echo.

pause
