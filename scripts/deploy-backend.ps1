# ========================================
# PROST-QS Backend Deploy Script (Windows)
# ========================================

Write-Host "🚀 PROST-QS Backend Deploy" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan

# Verificar se está no diretório correto
if (-not (Test-Path "backend/go.mod")) {
    Write-Host "❌ Execute este script da raiz do projeto UNO-main" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 CHECKLIST PRÉ-DEPLOY:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. DATABASE_URL configurado no Render/Railway?" -ForegroundColor White
Write-Host "   Formato: postgresql://user:pass@host:5432/dbname" -ForegroundColor Gray
Write-Host ""
Write-Host "2. JWT_SECRET configurado (será gerado automaticamente no Render)" -ForegroundColor White
Write-Host ""
Write-Host "3. AES_SECRET_KEY configurado (32 caracteres exatos)" -ForegroundColor White
Write-Host "   Exemplo: ProstQS2024SecretKey32Bytes!!" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Migration SQL executada no Supabase/Neon?" -ForegroundColor White
Write-Host "   Arquivo: backend/scripts/migrations/20260113_create_lighthouse_tables.sql" -ForegroundColor Gray
Write-Host ""

$continue = Read-Host "Continuar? (s/n)"
if ($continue -ne "s") {
    Write-Host "Deploy cancelado." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔧 OPÇÕES DE DEPLOY:" -ForegroundColor Yellow
Write-Host "1. Render (render.yaml já configurado)"
Write-Host "2. Railway (via CLI)"
Write-Host "3. Fly.io (via CLI)"
Write-Host "4. Testar localmente primeiro"
Write-Host ""

$option = Read-Host "Escolha (1-4)"

switch ($option) {
    "1" {
        Write-Host ""
        Write-Host "📦 DEPLOY NO RENDER:" -ForegroundColor Cyan
        Write-Host "1. Acesse https://dashboard.render.com"
        Write-Host "2. New > Web Service"
        Write-Host "3. Conecte seu repositório GitHub"
        Write-Host "4. Render detectará o render.yaml automaticamente"
        Write-Host "5. Configure as variáveis de ambiente no Dashboard:"
        Write-Host "   - DATABASE_URL: sua connection string do Supabase/Neon"
        Write-Host "   - AES_SECRET_KEY: 32 caracteres"
        Write-Host "   - SECRETS_MASTER_KEY: 32 caracteres"
        Write-Host ""
        Write-Host "Após deploy, a URL será: https://prost-qs-backend.onrender.com" -ForegroundColor Green
    }
    "2" {
        Write-Host ""
        Write-Host "📦 DEPLOY NO RAILWAY:" -ForegroundColor Cyan
        Write-Host "railway login"
        Write-Host "railway init"
        Write-Host "railway up"
        Write-Host ""
        Write-Host "Configure variáveis em: https://railway.app/dashboard"
    }
    "3" {
        Write-Host ""
        Write-Host "📦 DEPLOY NO FLY.IO:" -ForegroundColor Cyan
        Write-Host "fly auth login"
        Write-Host "fly launch"
        Write-Host "fly secrets set DATABASE_URL='postgresql://...'"
        Write-Host "fly secrets set JWT_SECRET='...'"
        Write-Host "fly secrets set AES_SECRET_KEY='...'"
        Write-Host "fly deploy"
    }
    "4" {
        Write-Host ""
        Write-Host "🧪 TESTE LOCAL:" -ForegroundColor Cyan
        Write-Host ""
        
        # Verificar se Go está instalado
        $goVersion = go version 2>$null
        if (-not $goVersion) {
            Write-Host "❌ Go não encontrado. Instale em https://go.dev/dl/" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ $goVersion" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "Iniciando backend local..." -ForegroundColor Yellow
        Write-Host "Certifique-se de ter um arquivo .env no backend/" -ForegroundColor Gray
        Write-Host ""
        
        Set-Location backend
        go run ./cmd/api/...
    }
    default {
        Write-Host "Opção inválida" -ForegroundColor Red
    }
}
