@echo off
echo.
echo ╔═══════════════════════════════════════════════╗
echo ║       🧪 TESTE DO GEMINI EXECUTOR             ║
echo ║   Verificando funcionalidades básicas...     ║
echo ╚═══════════════════════════════════════════════╝
echo.

REM Verifica se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python não encontrado!
    echo.
    echo Por favor, instale Python 3.10+ de:
    echo https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo ✅ Python encontrado
echo.

REM Verifica se as dependências estão instaladas
python -c "import pyautogui" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Dependências não instaladas
    echo Instalando dependências...
    echo.
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ❌ Erro ao instalar dependências
        pause
        exit /b 1
    )
    echo ✅ Dependências instaladas
    echo.
)

echo 🧪 Executando testes...
echo.

python test_executor.py

echo.
pause
