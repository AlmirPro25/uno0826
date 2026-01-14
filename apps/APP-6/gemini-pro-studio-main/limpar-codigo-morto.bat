@echo off
echo ========================================
echo   LIMPANDO CODIGO MORTO E DUPLICADOS
echo ========================================
echo.

echo [1/6] Removendo arquivos duplicados do backend...
if exist "backend\server-clean.js" (
    del /q "backend\server-clean.js"
    echo ✓ server-clean.js removido (duplicado)
) else (
    echo ✓ server-clean.js ja estava limpo
)

if exist "backend\enhanced-automation.js" (
    del /q "backend\enhanced-automation.js"
    echo ✓ enhanced-automation.js removido (nao usado)
) else (
    echo ✓ enhanced-automation.js ja estava limpo
)

echo.
echo [2/6] Removendo arquivos temporarios...
del /q "*.tmp" 2>nul
del /q "*.temp" 2>nul
del /q "*~" 2>nul
echo ✓ Arquivos temporarios removidos

echo.
echo [3/6] Removendo arquivos de backup...
del /q "*.bak" 2>nul
del /q "*.backup" 2>nul
del /q "*.old" 2>nul
echo ✓ Arquivos de backup removidos

echo.
echo [4/6] Limpando cache do npm...
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo ✓ Cache do npm removido
) else (
    echo ✓ Cache do npm ja estava limpo
)

echo.
echo [5/6] Removendo logs antigos...
del /q "*.log" 2>nul
del /q "npm-debug.log*" 2>nul
del /q "yarn-debug.log*" 2>nul
del /q "yarn-error.log*" 2>nul
echo ✓ Logs removidos

echo.
echo [6/6] Removendo arquivos de sistema...
del /q ".DS_Store" 2>nul
del /q "Thumbs.db" 2>nul
del /q "desktop.ini" 2>nul
echo ✓ Arquivos de sistema removidos

echo.
echo ========================================
echo   LIMPEZA DE CODIGO MORTO CONCLUIDA!
echo ========================================
echo.
echo Arquivos removidos:
echo   - backend/server-clean.js (duplicado)
echo   - backend/enhanced-automation.js (nao usado)
echo   - Arquivos temporarios
echo   - Arquivos de backup
echo   - Logs antigos
echo   - Cache
echo.
pause
