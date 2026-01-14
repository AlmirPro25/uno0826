@echo off
echo ========================================
echo   PUBLICANDO NO GITHUB
echo ========================================
echo.

REM Configurar git
echo [1/5] Configurando git...
git config user.name "Almir"
git config user.email "almir@proxai.studio"
echo ✓ Git configurado

echo.
echo [2/5] Fazendo commit...
git commit -m "🎉 Initial commit - prox ai studio v1.0.0"
echo ✓ Commit feito

echo.
echo [3/5] Verificando remote...
git remote -v
echo.

echo [4/5] Adicionando remote (se necessário)...
git remote add origin https://github.com/almirpask/gemini-pro-studio-principal.git 2>nul
echo ✓ Remote configurado

echo.
echo [5/5] Fazendo push...
git branch -M main
git push -u origin main

echo.
echo ========================================
echo   PUBLICACAO CONCLUIDA!
echo ========================================
echo.
pause
