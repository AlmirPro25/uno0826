@echo off
chcp 65001 >nul
echo ========================================
echo   🔄 REORGANIZANDO ESTRUTURA DO GIT
echo ========================================
echo.

cd /d "%~dp0"

echo [1/6] Removendo pasta gemini-pro-studio-main do repositório...
git rm -r --cached gemini-pro-studio-main
if errorlevel 1 (
    echo ⚠️ Aviso: Alguns arquivos podem não existir no git
)

echo.
echo [2/6] Movendo todos os arquivos para a raiz...
git add .
git commit -m "🔧 Reorganizando: removendo pasta duplicada"

echo.
echo [3/6] Criando commit com estrutura correta...
git add .
git commit -m "✨ Estrutura corrigida - arquivos na raiz"

echo.
echo [4/6] Forçando push para GitHub...
git push origin main --force

echo.
echo ========================================
echo   ✅ REORGANIZAÇÃO CONCLUÍDA!
echo ========================================
echo.
echo Seu repositório agora está com a estrutura correta!
echo README.md aparecerá na página inicial do GitHub.
echo.
pause
