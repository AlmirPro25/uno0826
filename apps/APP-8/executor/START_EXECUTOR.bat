@echo off
echo.
echo ╔═══════════════════════════════════════════════╗
echo ║       🎮 GEMINI EXECUTOR                      ║
echo ║   Iniciando módulo de automação física...    ║
echo ╚═══════════════════════════════════════════════╝
echo.

REM Verifica se Python está instalado
py --version >nul 2>&1
if errorlevel 1 (
    python --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Python não encontrado!
        echo.
        echo Por favor, instale Python 3.10+ de:
        echo https://www.python.org/downloads/
        echo.
        pause
        exit /b 1
    ) else (
        set PYTHON_CMD=python
    )
) else (
    set PYTHON_CMD=py
)

echo ✅ Python encontrado
echo.

REM Verifica se as dependências estão instaladas
%PYTHON_CMD% -c "import pyautogui" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Dependências não instaladas
    echo Instalando dependências...
    echo.
    %PYTHON_CMD% -m pip install -r requirements.txt
    if errorlevel 1 (
        echo ❌ Erro ao instalar dependências
        pause
        exit /b 1
    )
    echo ✅ Dependências instaladas
    echo.
)

REM Verifica se o .env existe
if not exist .env (
    echo ⚠️  Arquivo .env não encontrado
    echo Criando .env a partir do .env.example...
    copy .env.example .env
    echo.
    echo ⚠️  IMPORTANTE: Configure o AUTH_TOKEN no arquivo .env
    echo.
    pause
)

echo 🚀 Iniciando Gemini Executor...
echo.
echo ⚠️  DICAS:
echo    • Pressione Ctrl+C para parar
echo    • Mova o mouse para o canto superior esquerdo para emergência
echo    • Não mexa no mouse/teclado durante automações
echo.
echo ═══════════════════════════════════════════════
echo.

%PYTHON_CMD% executor.py

if errorlevel 1 (
    echo.
    echo ❌ Executor encerrado com erro
    pause
    exit /b 1
)

echo.
echo 👋 Executor finalizado
pause
