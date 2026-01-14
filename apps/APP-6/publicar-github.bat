@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  🚀 PUBLICAR NO GITHUB - Prox AI Studio              ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Verificar se Git está instalado
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git não está instalado!
    echo.
    echo Instale o Git em: https://git-scm.com/
    pause
    exit /b 1
)

echo ✅ Git encontrado
echo.

REM Verificar se já é um repositório Git
if not exist ".git" (
    echo 📦 Inicializando repositório Git...
    git init
    echo ✅ Repositório inicializado
    echo.
) else (
    echo ✅ Repositório Git já existe
    echo.
)

REM Verificar se há arquivos .env
if exist ".env" (
    echo ⚠️  AVISO: Arquivo .env encontrado!
    echo Este arquivo contém informações sensíveis e NÃO deve ser enviado ao GitHub.
    echo.
    set /p REMOVE_ENV="Deseja remover o arquivo .env? (S/N): "
    if /i "%REMOVE_ENV%"=="S" (
        del .env
        echo ✅ Arquivo .env removido
    )
    echo.
)

if exist "backend\.env" (
    echo ⚠️  AVISO: Arquivo backend/.env encontrado!
    echo Este arquivo contém informações sensíveis e NÃO deve ser enviado ao GitHub.
    echo.
    set /p REMOVE_BACKEND_ENV="Deseja remover o arquivo backend/.env? (S/N): "
    if /i "%REMOVE_BACKEND_ENV%"=="S" (
        del backend\.env
        echo ✅ Arquivo backend/.env removido
    )
    echo.
)

REM Adicionar arquivos
echo 📝 Adicionando arquivos ao Git...
git add .
echo ✅ Arquivos adicionados
echo.

REM Mostrar status
echo 📊 Status do repositório:
git status --short
echo.

REM Fazer commit
set /p COMMIT_MSG="Digite a mensagem do commit (ou Enter para usar padrão): "
if "%COMMIT_MSG%"=="" (
    set COMMIT_MSG=🎉 Initial commit: Prox AI Studio com Busca Visual Inteligente
)

echo.
echo 💾 Fazendo commit...
git commit -m "%COMMIT_MSG%"
echo ✅ Commit realizado
echo.

REM Verificar se já tem remote
git remote -v | findstr "origin" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 🔗 Configurando remote do GitHub...
    echo.
    set /p GITHUB_USER="Digite seu usuário do GitHub: "
    set /p REPO_NAME="Digite o nome do repositório (padrão: prox-ai-studio): "
    if "%REPO_NAME%"=="" set REPO_NAME=prox-ai-studio
    
    git remote add origin https://github.com/!GITHUB_USER!/!REPO_NAME!.git
    echo ✅ Remote configurado
    echo.
) else (
    echo ✅ Remote já configurado
    echo.
)

REM Verificar branch
git branch | findstr "main" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 🌿 Renomeando branch para main...
    git branch -M main
    echo ✅ Branch renomeada
    echo.
)

REM Push para GitHub
echo 🚀 Enviando para o GitHub...
echo.
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ╔════════════════════════════════════════════════════════╗
    echo ║  ✅ PUBLICADO COM SUCESSO!                            ║
    echo ╚════════════════════════════════════════════════════════╝
    echo.
    echo 🎉 Seu projeto está no GitHub!
    echo.
    echo 📝 Próximos passos:
    echo    1. Acesse seu repositório no GitHub
    echo    2. Adicione topics: ai, gemini, chatbot, visual-search
    echo    3. Configure GitHub Pages (opcional)
    echo    4. Compartilhe com o mundo!
    echo.
) else (
    echo.
    echo ╔════════════════════════════════════════════════════════╗
    echo ║  ❌ ERRO AO PUBLICAR                                  ║
    echo ╚════════════════════════════════════════════════════════╝
    echo.
    echo Possíveis causas:
    echo    1. Repositório não existe no GitHub
    echo    2. Credenciais incorretas
    echo    3. Sem permissão de escrita
    echo.
    echo Soluções:
    echo    1. Crie o repositório no GitHub primeiro
    echo    2. Verifique suas credenciais
    echo    3. Use token de acesso pessoal
    echo.
)

echo.
pause
