@echo off
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║  🚀 INICIANDO SISTEMA COMPLETO COM ROBOTICS VISION       ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Verifica Node.js
echo [1/4] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js não encontrado!
    echo Instale de: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js OK
echo.

REM Verifica Python
echo [2/4] Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python não encontrado!
    echo Instale de: https://www.python.org/
    pause
    exit /b 1
)
echo ✅ Python OK
echo.

REM Verifica dependências do backend
echo [3/4] Verificando dependências do backend...
if not exist "backend\node_modules" (
    echo ⚠️  Instalando dependências do backend...
    cd backend
    call npm install
    cd ..
    echo ✅ Dependências instaladas
) else (
    echo ✅ Dependências OK
)
echo.

REM Verifica dependências do executor
echo [4/4] Verificando dependências do executor...
cd executor
python -c "import pyautogui" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Instalando dependências do executor...
    pip install websockets pyautogui python-dotenv playwright cryptography
    playwright install chromium
    echo ✅ Dependências instaladas
) else (
    echo ✅ Dependências OK
)
cd ..
echo.

REM Verifica .env do backend
if not exist "backend\.env" (
    echo ⚠️  Criando backend\.env...
    echo GEMINI_API_KEY=sua_chave_aqui > backend\.env
    echo PORT=3001 >> backend\.env
    echo.
    echo ⚠️  IMPORTANTE: Configure GEMINI_API_KEY em backend\.env
    echo.
    pause
)

REM Verifica .env do executor
if not exist "executor\.env" (
    echo ⚠️  Criando executor\.env...
    copy executor\.env.example executor\.env
)

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║  ✅ TUDO PRONTO! INICIANDO SISTEMA...                     ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo 📋 O que vai acontecer:
echo    1. Backend será iniciado (porta 3001)
echo    2. WebSocket será iniciado (porta 8081)
echo    3. Executor Python será conectado
echo    4. Robotics Vision estará ativo
echo.
echo ⚠️  IMPORTANTE:
echo    • Duas janelas serão abertas
echo    • NÃO FECHE as janelas manualmente
echo    • Use Ctrl+C em cada janela para parar
echo.
pause

REM Inicia backend em nova janela
echo 🚀 Iniciando Backend...
start "Gemini Backend" cmd /k "cd backend && npm run dev"

REM Aguarda 5 segundos para backend iniciar
echo ⏳ Aguardando backend iniciar (5s)...
timeout /t 5 /nobreak >nul

REM Inicia executor em nova janela
echo 🎮 Iniciando Executor...
start "Gemini Executor" cmd /k "cd executor && python executor.py"

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║  ✅ SISTEMA INICIADO!                                     ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo 📊 Status:
echo    • Backend: http://localhost:3001
echo    • WebSocket: ws://localhost:8081
echo    • Executor: Conectado
echo.
echo 🧪 Teste rápido:
echo    curl http://localhost:3001/health
echo.
echo 🎯 Comandos de voz disponíveis:
echo    • "Clique no botão de pesquisa"
echo    • "Encontre o ícone de configurações"
echo    • "Mostre todos os botões"
echo.
echo 📚 Documentação:
echo    • ATIVAR_EXECUTOR.md
echo    • ROBOTICS_COMPLETE.md
echo    • TESTE_ROBOTICS_VISION.md
echo.
echo 🛑 Para parar:
echo    • Pressione Ctrl+C em cada janela
echo    • Ou feche as janelas
echo.
pause
