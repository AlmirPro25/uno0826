# ============================================================================
# 🌐 SETUP WEB RESEARCH - Script de Configuração
# ============================================================================
# 
# Este script configura e testa o sistema de pesquisa web.
#
# Uso:
#   .\scripts\setup-web-research.ps1
#
# ============================================================================

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🌐 SETUP WEB RESEARCH - Sistema de Pesquisa Real         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos na raiz do projeto
if (-not (Test-Path "backend/package.json")) {
    Write-Host "❌ Execute este script da raiz do projeto!" -ForegroundColor Red
    exit 1
}

# 1. Instalar dependências do backend
Write-Host "📦 1. Instalando dependências do backend..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "   ✅ Dependências instaladas!" -ForegroundColor Green

# 2. Instalar Playwright (opcional)
Write-Host ""
Write-Host "📦 2. Instalando Playwright (opcional)..." -ForegroundColor Yellow
npm install playwright 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Playwright instalado!" -ForegroundColor Green
    Write-Host "   📥 Baixando Chromium..." -ForegroundColor Yellow
    npx playwright install chromium 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Chromium instalado!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Chromium não instalado (opcional)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️ Playwright não instalado (opcional)" -ForegroundColor Yellow
}

Set-Location ..

# 3. Verificar variáveis de ambiente
Write-Host ""
Write-Host "🔧 3. Verificando configuração..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "VITE_BACKEND_URL") {
        Write-Host "   ✅ VITE_BACKEND_URL configurado" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Adicionando VITE_BACKEND_URL ao .env..." -ForegroundColor Yellow
        Add-Content ".env" "`nVITE_BACKEND_URL=http://localhost:3001"
        Write-Host "   ✅ VITE_BACKEND_URL adicionado" -ForegroundColor Green
    }
} else {
    Write-Host "   ⚠️ Criando arquivo .env..." -ForegroundColor Yellow
    "VITE_BACKEND_URL=http://localhost:3001" | Out-File ".env" -Encoding UTF8
    Write-Host "   ✅ Arquivo .env criado" -ForegroundColor Green
}

# 4. Instruções finais
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    ✅ SETUP CONCLUÍDO!                        ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   1. Iniciar o backend:" -ForegroundColor White
Write-Host "      cd backend" -ForegroundColor Gray
Write-Host "      npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Em outro terminal, testar a integração:" -ForegroundColor White
Write-Host "      node tests/test-research-integration-simple.js" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Iniciar o frontend:" -ForegroundColor White
Write-Host "      npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "   4. Testar no chat:" -ForegroundColor White
Write-Host "      'Pesquise sobre Liquid Neural Networks no ArXiv'" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Documentação: docs/WEB_RESEARCH_INTEGRATION_COMPLETE.md" -ForegroundColor Cyan
Write-Host ""
