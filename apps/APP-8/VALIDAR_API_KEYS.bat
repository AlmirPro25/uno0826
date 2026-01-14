@echo off
chcp 65001 >nul
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║     🔍 VALIDADOR DE API KEYS - Gemini Live Companion      ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

set "ERRO=0"

echo 📋 Verificando configurações...
echo.

REM ========== FRONTEND ==========
echo [1/3] Frontend (.env.local)
echo ─────────────────────────────────────────────────────────────

if not exist ".env.local" (
    echo ❌ ERRO: Arquivo .env.local não encontrado!
    echo    Crie o arquivo .env.local na raiz do projeto
    set "ERRO=1"
) else (
    echo ✅ Arquivo .env.local encontrado
    
    findstr /C:"VITE_API_KEY=" .env.local >nul 2>&1
    if errorlevel 1 (
        echo ❌ ERRO: VITE_API_KEY não configurada!
        echo    Adicione: VITE_API_KEY=sua_chave_aqui
        set "ERRO=1"
    ) else (
        findstr /C:"VITE_API_KEY=AIza" .env.local >nul 2>&1
        if errorlevel 1 (
            echo ⚠️  AVISO: VITE_API_KEY parece estar vazia ou inválida
            echo    Formato esperado: AIzaSy...
            set "ERRO=1"
        ) else (
            echo ✅ VITE_API_KEY configurada
        )
    )
    
    findstr /C:"VITE_API_URL=" .env.local >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  AVISO: VITE_API_URL não configurada
        echo    Adicione: VITE_API_URL=http://localhost:3001/api
    ) else (
        echo ✅ VITE_API_URL configurada
    )
)

echo.

REM ========== BACKEND ==========
echo [2/3] Backend (backend/.env)
echo ─────────────────────────────────────────────────────────────

if not exist "backend\.env" (
    echo ❌ ERRO: Arquivo backend/.env não encontrado!
    echo    Crie o arquivo backend/.env
    set "ERRO=1"
) else (
    echo ✅ Arquivo backend/.env encontrado
    
    findstr /C:"GEMINI_API_KEY=" backend\.env >nul 2>&1
    if errorlevel 1 (
        echo ❌ ERRO: GEMINI_API_KEY não configurada!
        echo    Adicione: GEMINI_API_KEY=sua_chave_aqui
        set "ERRO=1"
    ) else (
        findstr /C:"GEMINI_API_KEY=AIza" backend\.env >nul 2>&1
        if errorlevel 1 (
            echo ⚠️  AVISO: GEMINI_API_KEY parece estar vazia ou inválida
            echo    Formato esperado: AIzaSy...
            set "ERRO=1"
        ) else (
            echo ✅ GEMINI_API_KEY configurada
        )
    )
    
    findstr /C:"PORT=" backend\.env >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  AVISO: PORT não configurada (usará padrão 3001)
    ) else (
        echo ✅ PORT configurada
    )
    
    findstr /C:"EXECUTOR_AUTH_TOKEN=" backend\.env >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  AVISO: EXECUTOR_AUTH_TOKEN não configurada
    ) else (
        echo ✅ EXECUTOR_AUTH_TOKEN configurada
    )
)

echo.

REM ========== EXECUTOR ==========
echo [3/3] Executor Python (executor/.env)
echo ─────────────────────────────────────────────────────────────

if not exist "executor\.env" (
    echo ❌ ERRO: Arquivo executor/.env não encontrado!
    echo    Crie o arquivo executor/.env
    set "ERRO=1"
) else (
    echo ✅ Arquivo executor/.env encontrado
    
    REM Verifica se NÃO tem GEMINI_API_KEY (o que é correto)
    findstr /C:"GEMINI_API_KEY=" executor\.env >nul 2>&1
    if not errorlevel 1 (
        echo ⚠️  AVISO: GEMINI_API_KEY encontrada no executor/.env
        echo    O executor NÃO precisa da API Key do Gemini!
        echo    Remova essa linha do arquivo.
    ) else (
        echo ✅ Sem GEMINI_API_KEY (correto!)
    )
    
    findstr /C:"AUTH_TOKEN=" executor\.env >nul 2>&1
    if errorlevel 1 (
        echo ❌ ERRO: AUTH_TOKEN não configurada!
        echo    Adicione: AUTH_TOKEN=gemini_executor_secret_2024
        set "ERRO=1"
    ) else (
        echo ✅ AUTH_TOKEN configurada
    )
    
    findstr /C:"MAESTRO_WS_URL=" executor\.env >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  AVISO: MAESTRO_WS_URL não configurada
    ) else (
        echo ✅ MAESTRO_WS_URL configurada
    )
)

echo.
echo ═══════════════════════════════════════════════════════════
echo.

if "%ERRO%"=="1" (
    echo ❌ CONFIGURAÇÃO INCOMPLETA!
    echo.
    echo 📚 Consulte o guia completo:
    echo    docs/CONFIGURACAO_API_KEYS.md
    echo.
    echo 🔑 Para obter uma API Key:
    echo    https://makersuite.google.com/app/apikey
    echo.
) else (
    echo ✅ TODAS AS CONFIGURAÇÕES ESTÃO CORRETAS!
    echo.
    echo 🚀 Você pode iniciar o sistema com:
    echo    INICIAR_SISTEMA_COMPLETO.bat
    echo.
)

echo Pressione qualquer tecla para sair...
pause >nul
