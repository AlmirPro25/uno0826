@echo off
echo ========================================
echo   ORGANIZANDO PROJETO PROFISSIONALMENTE
echo ========================================
echo.

REM Criar estrutura de pastas
echo [1/5] Criando estrutura de pastas...
if not exist "docs\dev" mkdir "docs\dev"
if not exist "docs\guides" mkdir "docs\guides"
if not exist "docs\architecture" mkdir "docs\architecture"
if not exist "docs\troubleshooting" mkdir "docs\troubleshooting"
if not exist "tests\fixtures" mkdir "tests\fixtures"
echo ✓ Estrutura criada

echo.
echo [2/5] Movendo documentacao de desenvolvimento...
move /Y "*CORRECAO*.md" "docs\dev\" 2>nul
move /Y "*TESTE*.md" "docs\dev\" 2>nul
move /Y "*LIMPEZA*.md" "docs\dev\" 2>nul
move /Y "*FIX*.md" "docs\dev\" 2>nul
move /Y "*AJUSTE*.md" "docs\dev\" 2>nul
move /Y "*MELHORIAS*.md" "docs\dev\" 2>nul
move /Y "*IMPLEMENTACAO*.md" "docs\dev\" 2>nul
move /Y "*ATUALIZACAO*.md" "docs\dev\" 2>nul
echo ✓ Docs de desenvolvimento movidos

echo.
echo [3/5] Movendo guias e tutoriais...
move /Y "GUIA*.md" "docs\guides\" 2>nul
move /Y "QUICK_START*.md" "docs\guides\" 2>nul
move /Y "COMECE_AQUI*.md" "docs\guides\" 2>nul
move /Y "EXEMPLO*.md" "docs\guides\" 2>nul
move /Y "COMANDOS_RAPIDOS.md" "docs\guides\" 2>nul
echo ✓ Guias movidos

echo.
echo [4/5] Movendo documentacao de arquitetura...
move /Y "SISTEMA*.md" "docs\architecture\" 2>nul
move /Y "ARQUITETURA*.md" "docs\architecture\" 2>nul
move /Y "INTEGRACAO*.md" "docs\architecture\" 2>nul
move /Y "NAVEGACAO*.md" "docs\architecture\" 2>nul
move /Y "NAVEGADOR*.md" "docs\architecture\" 2>nul
move /Y "*AGENTES*.md" "docs\architecture\" 2>nul
move /Y "MAESTRO*.md" "docs\architecture\" 2>nul
move /Y "INDICE*.md" "docs\architecture\" 2>nul
move /Y "RESUMO*.md" "docs\architecture\" 2>nul
move /Y "PLANO*.md" "docs\architecture\" 2>nul
move /Y "PROXIMOS*.md" "docs\architecture\" 2>nul
move /Y "*VOICE*.md" "docs\architecture\" 2>nul
move /Y "*VOZ*.md" "docs\architecture\" 2>nul
move /Y "*AUDIO*.md" "docs\architecture\" 2>nul
move /Y "*BUSCA*.md" "docs\architecture\" 2>nul
move /Y "*PESQUISA*.md" "docs\architecture\" 2>nul
move /Y "*PRODUTOS*.md" "docs\architecture\" 2>nul
move /Y "*APIS*.md" "docs\architecture\" 2>nul
move /Y "*WHATSAPP*.md" "docs\architecture\" 2>nul
move /Y "*SIDEBAR*.md" "docs\architecture\" 2>nul
move /Y "*CANVAS*.md" "docs\architecture\" 2>nul
move /Y "*IFRAME*.md" "docs\architecture\" 2>nul
move /Y "*COT*.md" "docs\architecture\" 2>nul
move /Y "*PERSONALIDADE*.md" "docs\architecture\" 2>nul
move /Y "*PROMPT*.md" "docs\architecture\" 2>nul
move /Y "*UX*.md" "docs\architecture\" 2>nul
move /Y "SITES*.md" "docs\architecture\" 2>nul
move /Y "RESULTADOS*.md" "docs\architecture\" 2>nul
move /Y "NOVAS*.md" "docs\architecture\" 2>nul
move /Y "STARTPAGE*.md" "docs\architecture\" 2>nul
echo ✓ Docs de arquitetura movidos

echo.
echo [5/5] Movendo troubleshooting e testes...
move /Y "TROUBLESHOOTING*.md" "docs\troubleshooting\" 2>nul
move /Y "SOLUCAO*.md" "docs\troubleshooting\" 2>nul
move /Y "test-*.json" "tests\fixtures\" 2>nul
move /Y "LISTA_URLS_NAVEGACAO.json" "tests\fixtures\" 2>nul
echo ✓ Troubleshooting e testes movidos

echo.
echo [6/5] Limpando arquivos duplicados...
if exist "README_UPDATED.md" del "README_UPDATED.md"
if exist "metadata.json" del "metadata.json"
echo ✓ Arquivos duplicados removidos

echo.
echo ========================================
echo   ORGANIZACAO CONCLUIDA!
echo ========================================
echo.
echo Estrutura final:
echo   docs/
echo     ├── guides/          (Guias e tutoriais)
echo     ├── architecture/    (Arquitetura e sistemas)
echo     ├── dev/             (Desenvolvimento e correcoes)
echo     └── troubleshooting/ (Solucoes de problemas)
echo   tests/
echo     └── fixtures/        (Arquivos de teste)
echo.
pause
