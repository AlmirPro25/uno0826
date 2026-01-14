@echo off
echo ========================================
echo   PUBLICANDO NO GITHUB
echo ========================================
echo.
echo Repositorio: https://github.com/AlmirPro25/gemini-pro-studio-main
echo.

REM Configurar git
echo [1/5] Configurando git...
git config user.name "Almir"
git config user.email "almir@proxai.studio"
echo ✓ Git configurado

echo.
echo [2/5] Fazendo commit...
git commit -m "🎉 Initial commit - prox ai studio v1.0.0"
if %errorlevel% neq 0 (
    echo ⚠ Erro no commit ou nada para commitar
    pause
    exit /b 1
)
echo ✓ Commit feito

echo.
echo [3/5] Adicionando remote...
git remote add origin https://github.com/AlmirPro25/gemini-pro-studio-main.git 2>nul
if %errorlevel% equ 0 (
    echo ✓ Remote adicionado
) else (
    echo ℹ Remote já existe
)

echo.
echo [4/5] Verificando remote...
git remote -v
echo.

echo [5/5] Fazendo push para GitHub...
git branch -M main
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   ✓ PUBLICACAO CONCLUIDA COM SUCESSO!
    echo ========================================
    echo.
    echo Seu projeto está em:
    echo https://github.com/AlmirPro25/gemini-pro-studio-main
    echo.
) else (
    echo.
    echo ========================================
    echo   ✗ ERRO NO PUSH
    echo ========================================
    echo.
    echo Possíveis causas:
    echo - Você precisa fazer login no GitHub
    echo - Verifique suas credenciais
    echo - O repositório pode já ter conteúdo
    echo.
)

pause
