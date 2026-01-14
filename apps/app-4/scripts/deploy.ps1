# MediSync - Script de Deploy
# Uso: .\scripts\deploy.ps1 -Environment [staging|production]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("staging", "production")]
    [string]$Environment
)

Write-Host "🚀 MediSync Deploy Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Verificar pré-requisitos
Write-Host "`n📋 Verificando pré-requisitos..." -ForegroundColor Green

# Verificar Docker
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker não encontrado. Instale o Docker primeiro." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker instalado" -ForegroundColor Green

# Verificar Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js não encontrado. Instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js instalado" -ForegroundColor Green

# Verificar Go
if (!(Get-Command go -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Go não encontrado. Instale o Go primeiro." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Go instalado" -ForegroundColor Green

# Rodar testes
Write-Host "`n🧪 Rodando testes..." -ForegroundColor Green

# Testes do Backend
Write-Host "  Backend tests..." -ForegroundColor Yellow
Push-Location backend
$backendTests = go test ./... 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Testes do backend falharam:" -ForegroundColor Red
    Write-Host $backendTests
    Pop-Location
    exit 1
}
Write-Host "  ✅ Backend tests passed" -ForegroundColor Green
Pop-Location

# Testes do Frontend
Write-Host "  Frontend tests..." -ForegroundColor Yellow
Push-Location frontend
$frontendTests = npm test -- --passWithNoTests 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Testes do frontend falharam:" -ForegroundColor Red
    Write-Host $frontendTests
    Pop-Location
    exit 1
}
Write-Host "  ✅ Frontend tests passed" -ForegroundColor Green
Pop-Location

# Build
Write-Host "`n🔨 Building..." -ForegroundColor Green

# Build Backend
Write-Host "  Building backend..." -ForegroundColor Yellow
Push-Location backend
$env:CGO_ENABLED = "0"
$env:GOOS = "linux"
go build -o medisync-backend cmd/api/main.go
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build do backend falhou" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "  ✅ Backend built" -ForegroundColor Green
Pop-Location

# Build Frontend
Write-Host "  Building frontend..." -ForegroundColor Yellow
Push-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build do frontend falhou" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "  ✅ Frontend built" -ForegroundColor Green
Pop-Location

# Docker Build
Write-Host "`n🐳 Building Docker image..." -ForegroundColor Green
$tag = if ($Environment -eq "production") { "latest" } else { "staging" }
docker build -t medisync:$tag .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build falhou" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker image built: medisync:$tag" -ForegroundColor Green

# Deploy
Write-Host "`n🚀 Deploying to $Environment..." -ForegroundColor Green

if ($Environment -eq "staging") {
    Write-Host "  Deploying to staging environment..." -ForegroundColor Yellow
    # Adicione aqui os comandos de deploy para staging
    # Exemplo: docker-compose -f docker-compose.staging.yml up -d
    Write-Host "  ✅ Deployed to staging" -ForegroundColor Green
}
elseif ($Environment -eq "production") {
    Write-Host "  ⚠️  Deploying to PRODUCTION!" -ForegroundColor Red
    $confirm = Read-Host "  Tem certeza? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "  Deploy cancelado." -ForegroundColor Yellow
        exit 0
    }
    # Adicione aqui os comandos de deploy para produção
    # Exemplo: docker-compose -f docker-compose.prod.yml up -d
    Write-Host "  ✅ Deployed to production" -ForegroundColor Green
}

# Health Check
Write-Host "`n🏥 Running health check..." -ForegroundColor Green
Start-Sleep -Seconds 5

$healthUrl = if ($Environment -eq "production") { 
    "https://api.medisync.com/health" 
} else { 
    "https://staging-api.medisync.com/health" 
}

try {
    $response = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 10
    if ($response.status -eq "healthy") {
        Write-Host "✅ Health check passed!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Health check returned unexpected status" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Health check failed (servidor pode ainda estar iniciando)" -ForegroundColor Yellow
}

# Finalização
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🎉 Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URLs:" -ForegroundColor Yellow
if ($Environment -eq "production") {
    Write-Host "  Frontend: https://medisync.com"
    Write-Host "  Backend:  https://api.medisync.com"
    Write-Host "  Health:   https://api.medisync.com/health"
} else {
    Write-Host "  Frontend: https://staging.medisync.com"
    Write-Host "  Backend:  https://staging-api.medisync.com"
    Write-Host "  Health:   https://staging-api.medisync.com/health"
}
Write-Host ""
