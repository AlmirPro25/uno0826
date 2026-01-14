@echo off
chcp 65001 >nul
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║      🔧 CORREÇÃO AUTOMÁTICA - Gemini Live Companion       ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

echo 📋 Iniciando correção do sistema...
echo.

REM ========== 1. Verificar Node.js ==========
echo [1/8] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js não encontrado!
    echo    Instale em: https://nodejs.org/
    goto :end
) else (
    echo ✅ Node.js instalado
)

REM ========== 2. Verificar Python ==========
echo [2/8] Verificando Python...
py --version >nul 2>&1
if errorlevel 1 (
    python --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Python não encontrado!
        echo    Instale em: https://www.python.org/
        goto :end
    ) else (
        echo ✅ Python instalado
        set PYTHON_CMD=python
    )
) else (
    echo ✅ Python instalado
    set PYTHON_CMD=py
)

REM ========== 3. Instalar dependências do Frontend ==========
echo [3/8] Instalando dependências do Frontend...
call npm install
if errorlevel 1 (
    echo ❌ Erro ao instalar dependências do Frontend
    goto :end
) else (
    echo ✅ Dependências do Frontend instaladas
)

REM ========== 4. Instalar dependências do Backend ==========
echo [4/8] Instalando dependências do Backend...
cd backend
call npm install
if errorlevel 1 (
    echo ❌ Erro ao instalar dependências do Backend
    cd ..
    goto :end
) else (
    echo ✅ Dependências do Backend instaladas
)
cd ..

REM ========== 5. Instalar dependências do Executor ==========
echo [5/8] Instalando dependências do Executor Python...
cd executor
%PYTHON_CMD% -m pip install -r requirements.txt >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Aviso: Erro ao instalar dependências do Python
    echo    Execute manualmente: py -m pip install -r executor/requirements.txt
) else (
    echo ✅ Dependências do Executor instaladas
)
cd ..

REM ========== 6. Verificar arquivos .env ==========
echo [6/8] Verificando arquivos .env...

if not exist ".env.local" (
    echo ⚠️  Criando .env.local...
    (
        echo # URL da API do Backend
        echo VITE_API_URL=http://localhost:3001/api
        echo.
        echo # Gemini API Key ^(para o frontend^)
        echo # IMPORTANTE: No Vite, variáveis de ambiente precisam do prefixo VITE_
        echo VITE_API_KEY=SUA_CHAVE_AQUI
    ) > .env.local
    echo ⚠️  Arquivo .env.local criado - CONFIGURE A API KEY!
) else (
    echo ✅ Arquivo .env.local existe
)

if not exist "backend\.env" (
    echo ⚠️  Criando backend/.env...
    (
        echo # Gemini API Key ^(obrigatório^)
        echo GEMINI_API_KEY=SUA_CHAVE_AQUI
        echo.
        echo # Porta do servidor
        echo PORT=3001
        echo.
        echo # Caminho do banco de dados SQLite3
        echo DATABASE_PATH=./data/companion.db
        echo.
        echo # Ambiente
        echo NODE_ENV=development
        echo.
        echo # CORS Origins
        echo CORS_ORIGINS=http://localhost:5173,http://localhost:3000
        echo.
        echo # Log Level
        echo LOG_LEVEL=info
        echo.
        echo # Gemini Executor
        echo EXECUTOR_AUTH_TOKEN=gemini_executor_secret_2024
    ) > backend\.env
    echo ⚠️  Arquivo backend/.env criado - CONFIGURE A API KEY!
) else (
    echo ✅ Arquivo backend/.env existe
)

if not exist "executor\.env" (
    echo ⚠️  Criando executor/.env...
    copy executor\.env.example executor\.env >nul 2>&1
    echo ✅ Arquivo executor/.env criado
) else (
    echo ✅ Arquivo executor/.env existe
)

REM ========== 7. Criar pasta de dados do backend ==========
echo [7/8] Criando pasta de dados...
if not exist "backend\data" (
    mkdir backend\data
    echo ✅ Pasta backend/data criada
) else (
    echo ✅ Pasta backend/data existe
)

REM ========== 8. Verificar API Keys ==========
echo [8/8] Verificando API Keys...

findstr "VITE_API_KEY=AIza" .env.local >nul 2>&1
if errorlevel 1 (
    echo ⚠️  VITE_API_KEY não configurada em .env.local
    echo    Configure sua chave do Gemini!
    set "NEEDS_CONFIG=1"
) else (
    echo ✅ VITE_API_KEY configurada
)

findstr "GEMINI_API_KEY=AIza" backend\.env >nul 2>&1
if errorlevel 1 (
    echo ⚠️  GEMINI_API_KEY não configurada em backend/.env
    echo    Configure sua chave do Gemini!
    set "NEEDS_CONFIG=1"
) else (
    echo ✅ GEMINI_API_KEY configurada
)

echo.
echo ═══════════════════════════════════════════════════════════
echo.

if "%NEEDS_CONFIG%"=="1" (
    echo ⚠️  CONFIGURAÇÃO NECESSÁRIA!
    echo.
    echo 🔑 Obtenha sua API Key em:
    echo    https://makersuite.google.com/app/apikey
    echo.
    echo 📝 Configure nos arquivos:
    echo    - .env.local ^(VITE_API_KEY^)
    echo    - backend/.env ^(GEMINI_API_KEY^)
    echo.
    echo 📚 Consulte o guia:
    echo    docs/CONFIGURACAO_API_KEYS.md
    echo.
) else (
    echo ✅ SISTEMA CORRIGIDO E PRONTO!
    echo.
    echo 🚀 Para iniciar o sistema:
    echo    INICIAR_SISTEMA_COMPLETO.bat
    echo.
    echo 🧪 Para testar as API Keys:
    echo    TESTAR_API_KEYS.bat
    echo.
)

:end
echo Pressione qualquer tecla para sair...
pause >nul
