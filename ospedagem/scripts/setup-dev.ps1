# ============================================
# SCE - Setup de Desenvolvimento (Windows)
# ============================================

Write-Host "🚀 Iniciando setup do Sovereign Cloud Engine..." -ForegroundColor Cyan

# Verificar Docker
Write-Host "`n📦 Verificando Docker..." -ForegroundColor Yellow
$dockerRunning = docker info 2>$null
if (-not $dockerRunning) {
    Write-Host "❌ Docker não está rodando. Inicie o Docker Desktop primeiro." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker OK" -ForegroundColor Green

# Criar .env se não existir
if (-not (Test-Path ".env")) {
    Write-Host "`n📝 Criando arquivo .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env criado" -ForegroundColor Green
}

# Subir apenas o PostgreSQL
Write-Host "`n🐘 Iniciando PostgreSQL..." -ForegroundColor Yellow
docker-compose up -d database
Start-Sleep -Seconds 5

# Verificar se PostgreSQL está pronto
$maxRetries = 30
$retry = 0
do {
    $pgReady = docker exec sce-database pg_isready -U sce_admin 2>$null
    if ($pgReady -match "accepting") {
        Write-Host "✅ PostgreSQL pronto" -ForegroundColor Green
        break
    }
    $retry++
    Write-Host "⏳ Aguardando PostgreSQL... ($retry/$maxRetries)" -ForegroundColor Gray
    Start-Sleep -Seconds 2
} while ($retry -lt $maxRetries)

# Instalar dependências do Backend
Write-Host "`n📦 Instalando dependências do Backend..." -ForegroundColor Yellow
Set-Location backend
npm install
npx prisma generate
npx prisma db push
Set-Location ..
Write-Host "✅ Backend configurado" -ForegroundColor Green

# Instalar dependências do Frontend
Write-Host "`n📦 Instalando dependências do Frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
Set-Location ..
Write-Host "✅ Frontend configurado" -ForegroundColor Green

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "🎉 Setup concluído!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "`nPara iniciar o desenvolvimento:" -ForegroundColor White
Write-Host "  Terminal 1: cd backend && npm run dev" -ForegroundColor Gray
Write-Host "  Terminal 2: cd frontend && npm run dev" -ForegroundColor Gray
Write-Host "`nAcesse:" -ForegroundColor White
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host "  Backend:  http://localhost:3001/api/v1/health" -ForegroundColor Gray
Write-Host "  Login:    admin@sce.local / admin123456" -ForegroundColor Gray
