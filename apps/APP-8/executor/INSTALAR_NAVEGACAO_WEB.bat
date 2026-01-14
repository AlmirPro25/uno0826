@echo off
echo ========================================
echo  INSTALACAO DO MODULO DE NAVEGACAO WEB
echo  Playwright + Chromium
echo ========================================
echo.

echo [1/3] Instalando Playwright...
py -m pip install playwright
if %errorlevel% neq 0 (
    echo.
    echo ERRO: Falha ao instalar Playwright
    echo Verifique se o Python esta instalado
    pause
    exit /b 1
)

echo.
echo [2/3] Baixando Chromium (~300MB)...
echo Isso pode demorar alguns minutos...
py -m playwright install chromium
if %errorlevel% neq 0 (
    echo.
    echo ERRO: Falha ao instalar Chromium
    pause
    exit /b 1
)

echo.
echo [3/3] Testando instalacao...
py test_browser.py
if %errorlevel% neq 0 (
    echo.
    echo AVISO: Teste falhou, mas a instalacao pode estar OK
    echo Tente executar manualmente: py test_browser.py
)

echo.
echo ========================================
echo  INSTALACAO CONCLUIDA!
echo ========================================
echo.
echo Proximo passo:
echo 1. Inicie o executor: py executor.py
echo 2. Inicie o backend: cd ../backend ^&^& npm run dev
echo 3. Use o componente BrowserControl no frontend
echo.
pause
