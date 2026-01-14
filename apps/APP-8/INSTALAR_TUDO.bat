@echo off
echo.
echo ╔═══════════════════════════════════════════════╗
echo ║     🚀 INSTALACAO COMPLETA DO SISTEMA         ║
echo ║     Instalando todas as dependencias...      ║
echo ╚═══════════════════════════════════════════════╝
echo.

REM Verifica Node.js
echo [1/4] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js nao encontrado!
    echo Por favor, instale Node.js 18+ de: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js encontrado
echo.

REM Verifica Python
echo [2/4] Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python nao encontrado!
    echo Por favor, instale Python 3.10+ de: https://www.python.org/
    pause
    exit /b 1
)
echo ✅ Python encontrado
echo.

REM Instala dependencias do Backend
echo [3/4] Instalando dependencias do Backend...
cd backend
call npm install
if errorlevel 1 (
    echo ❌ Erro ao instalar dependencias do backend
    pause
    exit /b 1
)
cd ..
echo ✅ Backend instalado
echo.

REM Instala dependencias do Executor
echo [4/4] Instalando dependencias do Executor...
cd executor
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Erro ao instalar dependencias do executor
    pause
    exit /b 1
)
cd ..
echo ✅ Executor instalado
echo.

echo ╔═══════════════════════════════════════════════╗
echo ║     ✅ INSTALACAO CONCLUIDA COM SUCESSO!      ║
echo ╚═══════════════════════════════════════════════╝
echo.
echo Proximos passos:
echo 1. Execute INICIAR_SISTEMA.bat
echo 2. Ou inicie manualmente cada componente
echo.
pause
