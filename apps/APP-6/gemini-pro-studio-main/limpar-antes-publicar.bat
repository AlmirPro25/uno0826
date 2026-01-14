@echo off
echo ========================================
echo   LIMPEZA ANTES DE PUBLICAR NO GITHUB
echo ========================================
echo.

echo [1/4] Removendo sessao do WhatsApp...
if exist "whatsapp-bridge\.wwebjs_auth" (
    rmdir /s /q "whatsapp-bridge\.wwebjs_auth"
    echo ✓ Sessao removida
) else (
    echo ✓ Sessao ja estava limpa
)

echo.
echo [2/4] Removendo cache do WhatsApp...
if exist "whatsapp-bridge\.wwebjs_cache" (
    rmdir /s /q "whatsapp-bridge\.wwebjs_cache"
    echo ✓ Cache removido
) else (
    echo ✓ Cache ja estava limpo
)

echo.
echo [3/4] Removendo banco de dados...
if exist "whatsapp-bridge\data\whatsapp.db" (
    del /q "whatsapp-bridge\data\whatsapp.db"
    echo ✓ Banco de dados removido
) else (
    echo ✓ Banco de dados ja estava limpo
)

echo.
echo [4/4] Verificando arquivo .env...
if exist ".env" (
    echo ⚠ ATENCAO: Arquivo .env encontrado!
    echo   Certifique-se de que ele esta no .gitignore
) else (
    if exist ".env.local" (
        echo ⚠ ATENCAO: Arquivo .env.local encontrado!
        echo   Certifique-se de que ele esta no .gitignore
    ) else (
        echo ✓ Nenhum arquivo .env encontrado
    )
)

echo.
echo ========================================
echo   LIMPEZA CONCLUIDA!
echo ========================================
echo.
echo Proximo passo:
echo   1. Leia o arquivo GUIA_PUBLICAR_GITHUB.md
echo   2. Execute: git add .
echo   3. Execute: git commit -m "Initial commit"
echo   4. Configure o remote do GitHub
echo   5. Execute: git push -u origin main
echo.
pause
