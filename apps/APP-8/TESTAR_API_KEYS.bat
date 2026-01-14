@echo off
chcp 65001 >nul
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║        🔑 TESTE DE API KEYS - Gemini Live Companion       ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

echo 📋 Testando API Keys do Gemini...
echo.

REM Extrai as chaves dos arquivos .env
for /f "tokens=2 delims==" %%a in ('findstr "VITE_API_KEY=" .env.local 2^>nul') do set FRONTEND_KEY=%%a
for /f "tokens=2 delims==" %%a in ('findstr "GEMINI_API_KEY=" backend\.env 2^>nul') do set BACKEND_KEY=%%a

if "%FRONTEND_KEY%"=="" (
    echo ❌ ERRO: VITE_API_KEY não encontrada em .env.local
    goto :end
)

if "%BACKEND_KEY%"=="" (
    echo ❌ ERRO: GEMINI_API_KEY não encontrada em backend/.env
    goto :end
)

echo ✅ Chaves encontradas nos arquivos
echo.
echo 🧪 Testando API Key do Frontend...
echo Chave: %FRONTEND_KEY:~0,20%...
echo.

curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=%FRONTEND_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"contents\":[{\"parts\":[{\"text\":\"Hello\"}]}]}" > test_frontend.json

findstr "error" test_frontend.json >nul 2>&1
if not errorlevel 1 (
    echo ❌ ERRO: API Key do Frontend inválida!
    type test_frontend.json
    del test_frontend.json
    goto :end
) else (
    findstr "candidates" test_frontend.json >nul 2>&1
    if not errorlevel 1 (
        echo ✅ API Key do Frontend VÁLIDA!
    ) else (
        echo ⚠️  Resposta inesperada:
        type test_frontend.json
    )
    del test_frontend.json
)

echo.
echo 🧪 Testando API Key do Backend...
echo Chave: %BACKEND_KEY:~0,20%...
echo.

curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=%BACKEND_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"contents\":[{\"parts\":[{\"text\":\"Hello\"}]}]}" > test_backend.json

findstr "error" test_backend.json >nul 2>&1
if not errorlevel 1 (
    echo ❌ ERRO: API Key do Backend inválida!
    type test_backend.json
    del test_backend.json
    goto :end
) else (
    findstr "candidates" test_backend.json >nul 2>&1
    if not errorlevel 1 (
        echo ✅ API Key do Backend VÁLIDA!
    ) else (
        echo ⚠️  Resposta inesperada:
        type test_backend.json
    )
    del test_backend.json
)

echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo ✅ TESTE CONCLUÍDO!
echo.
echo 📚 Se houver erros, consulte:
echo    - docs/CONFIGURACAO_API_KEYS.md
echo    - ANALISE_API_KEYS.md
echo.
echo 🔑 Para gerar novas chaves:
echo    https://makersuite.google.com/app/apikey
echo.

:end
echo Pressione qualquer tecla para sair...
pause >nul
