@echo off
echo ========================================
echo   PREPARANDO PROJETO PARA PUBLICACAO
echo ========================================
echo.
echo Este script vai:
echo   1. Limpar codigo morto
echo   2. Remover arquivos sensíveis
echo   3. Verificar estrutura
echo   4. Preparar para git
echo.
pause

REM ==================== ETAPA 1: CODIGO MORTO ====================
echo.
echo ========================================
echo   ETAPA 1/4: LIMPANDO CODIGO MORTO
echo ========================================
echo.

echo [1.1] Removendo arquivos duplicados...
if exist "backend\server-clean.js" (
    del /q "backend\server-clean.js"
    echo ✓ server-clean.js removido
)
if exist "backend\enhanced-automation.js" (
    del /q "backend\enhanced-automation.js"
    echo ✓ enhanced-automation.js removido
)

echo [1.2] Removendo temporarios...
del /q "*.tmp" 2>nul
del /q "*.temp" 2>nul
del /q "*.bak" 2>nul
del /q "*.old" 2>nul
del /q "*.log" 2>nul
echo ✓ Temporarios removidos

REM ==================== ETAPA 2: ARQUIVOS SENSIVEIS ====================
echo.
echo ========================================
echo   ETAPA 2/4: REMOVENDO ARQUIVOS SENSIVEIS
echo ========================================
echo.

echo [2.1] Removendo sessao do WhatsApp...
if exist "whatsapp-bridge\.wwebjs_auth" (
    rmdir /s /q "whatsapp-bridge\.wwebjs_auth"
    echo ✓ Sessao WhatsApp removida
) else (
    echo ✓ Sessao WhatsApp ja estava limpa
)

echo [2.2] Removendo cache do WhatsApp...
if exist "whatsapp-bridge\.wwebjs_cache" (
    rmdir /s /q "whatsapp-bridge\.wwebjs_cache"
    echo ✓ Cache WhatsApp removido
) else (
    echo ✓ Cache WhatsApp ja estava limpo
)

echo [2.3] Removendo banco de dados...
if exist "whatsapp-bridge\data\whatsapp.db" (
    del /q "whatsapp-bridge\data\whatsapp.db"
    echo ✓ Banco de dados removido
) else (
    echo ✓ Banco de dados ja estava limpo
)

echo [2.4] Verificando arquivo .env...
if exist ".env" (
    echo ⚠ ATENCAO: Arquivo .env encontrado!
    echo   Certifique-se de que ele esta no .gitignore
) else (
    echo ✓ Nenhum arquivo .env encontrado
)

REM ==================== ETAPA 3: VERIFICACAO ====================
echo.
echo ========================================
echo   ETAPA 3/4: VERIFICANDO ESTRUTURA
echo ========================================
echo.

echo [3.1] Verificando arquivos na raiz...
echo.
echo Arquivos .md na raiz:
dir /b *.md 2>nul
echo.

echo [3.2] Verificando pastas criadas...
if exist "docs\guides" (
    echo ✓ docs/guides/ existe
) else (
    echo ✗ docs/guides/ NAO existe
)
if exist "docs\architecture" (
    echo ✓ docs/architecture/ existe
) else (
    echo ✗ docs/architecture/ NAO existe
)
if exist "docs\dev" (
    echo ✓ docs/dev/ existe
) else (
    echo ✗ docs/dev/ NAO existe
)
if exist "tests\fixtures" (
    echo ✓ tests/fixtures/ existe
) else (
    echo ✗ tests/fixtures/ NAO existe
)

REM ==================== ETAPA 4: GIT ====================
echo.
echo ========================================
echo   ETAPA 4/4: PREPARANDO GIT
echo ========================================
echo.

echo [4.1] Verificando git...
git --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Git instalado
) else (
    echo ✗ Git NAO instalado
    echo   Instale o Git: https://git-scm.com/
    goto :fim
)

echo [4.2] Verificando repositorio...
if exist ".git" (
    echo ✓ Repositorio git inicializado
) else (
    echo ⚠ Repositorio git NAO inicializado
    echo.
    set /p init="Deseja inicializar o git? (S/N): "
    if /i "%init%"=="S" (
        git init
        echo ✓ Git inicializado
    )
)

echo [4.3] Verificando .gitignore...
if exist ".gitignore" (
    echo ✓ .gitignore existe
) else (
    echo ✗ .gitignore NAO existe
)

REM ==================== RESUMO FINAL ====================
echo.
echo ========================================
echo   PREPARACAO CONCLUIDA!
echo ========================================
echo.
echo ✓ Codigo morto removido
echo ✓ Arquivos sensiveis removidos
echo ✓ Estrutura verificada
echo ✓ Git preparado
echo.
echo ========================================
echo   PROXIMOS PASSOS
echo ========================================
echo.
echo 1. Revise os arquivos:
echo    git status
echo.
echo 2. Adicione os arquivos:
echo    git add .
echo.
echo 3. Faca o commit:
echo    git commit -m "🎉 Projeto organizado e pronto para producao"
echo.
echo 4. Crie o repositorio no GitHub:
echo    https://github.com/new
echo.
echo 5. Adicione o remote:
echo    git remote add origin https://github.com/SEU_USUARIO/prox-ai-studio.git
echo.
echo 6. Publique:
echo    git branch -M main
echo    git push -u origin main
echo.
echo ========================================
echo.

:fim
pause
