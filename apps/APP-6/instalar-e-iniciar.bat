@echo off
chcp 65001 >nul
cls

echo ╔════════════════════════════════════════════════════════╗
echo ║  🚀 INSTALAÇÃO E INICIALIZAÇÃO AUTOMÁTICA             ║
echo ║  Prox AI Studio - Sistema Completo                   ║
echo ╚════════════════════════════════════════════════════════╝
echo.

echo 📦 Passo 1/5: Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js não encontrado!
    echo 💡 Instale o Node.js em: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js encontrado
echo.

echo 📦 Passo 2/5: Instalando dependências do BACKEND...
cd backend
if not exist node_modules (
    echo 📥 Instalando pacotes npm...
    call npm install
    if errorlevel 1 (
        echo ❌ Erro ao instalar dependências do backend
        pause
        exit /b 1
    )
) else (
    echo ✅ Dependências já instaladas
)
echo.

echo 🎭 Passo 3/5: Instalando Playwright...
call npm list playwright >nul 2>&1
if errorlevel 1 (
    echo 📥 Instalando Playwright...
    call npm install playwright
    if errorlevel 1 (
        echo ❌ Erro ao instalar Playwright
        pause
        exit /b 1
    )
)

echo 🌐 Instalando navegadores Playwright...
call npx playwright install chromium
if errorlevel 1 (
    echo ⚠️  Aviso: Erro ao instalar Chromium, mas continuando...
)
echo ✅ Playwright configurado
echo.

echo 📦 Passo 4/5: Instalando dependências do FRONTEND...
cd ..
if not exist node_modules (
    echo 📥 Instalando pacotes npm do frontend...
    call npm install
    if errorlevel 1 (
        echo ❌ Erro ao instalar dependências do frontend
        pause
        exit /b 1
    )
) else (
    echo ✅ Dependências do frontend já instaladas
)
echo.

echo 🔍 Passo 5/5: Verificando sistema...
cd backend
call node verificar-sistema.js
echo.

echo ╔════════════════════════════════════════════════════════╗
echo ║  ✅ INSTALAÇÃO CONCLUÍDA!                             ║
echo ╚════════════════════════════════════════════════════════╝
echo.

echo 🚀 Iniciando sistema em 3 segundos...
timeout /t 3 /nobreak >nul

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  🔥 INICIANDO BACKEND                                 ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo 📍 Backend rodará em: http://localhost:3002
echo 📍 Frontend rodará em: http://localhost:3000
echo.
echo ⚠️  Mantenha esta janela aberta!
echo ⚠️  O frontend abrirá em outra janela
echo.

REM Iniciar backend em uma nova janela
start "Prox AI - Backend" cmd /k "cd /d %~dp0backend && npm start"

REM Aguardar 5 segundos para o backend iniciar
echo ⏳ Aguardando backend iniciar...
timeout /t 5 /nobreak >nul

REM Iniciar frontend em outra janela
cd ..
start "Prox AI - Frontend" cmd /k "npm run dev"

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  🎉 SISTEMA INICIADO!                                 ║
echo ╠════════════════════════════════════════════════════════╣
echo ║  Backend:  http://localhost:3002                      ║
echo ║  Frontend: http://localhost:3000                      ║
echo ║                                                        ║
echo ║  📝 Logs do backend: Janela "Prox AI - Backend"      ║
echo ║  📝 Logs do frontend: Janela "Prox AI - Frontend"    ║
echo ║                                                        ║
echo ║  🌐 O navegador abrirá automaticamente em instantes   ║
echo ╚════════════════════════════════════════════════════════╝
echo.

echo 💡 Dicas:
echo    - Para parar: Feche as janelas do backend e frontend
echo    - Para reiniciar: Execute este script novamente
echo    - Para testar navegador: cd backend ^&^& node test-navegador-remoto.js
echo.

pause
