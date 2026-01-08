# ============================================
# SCE - Iniciar Desenvolvimento (Windows)
# ============================================

Write-Host "🚀 Iniciando SCE em modo desenvolvimento..." -ForegroundColor Cyan

# Verificar se PostgreSQL está rodando
$pgContainer = docker ps --filter "name=sce-database" --format "{{.Names}}" 2>$null
if (-not $pgContainer) {
    Write-Host "⚠️ PostgreSQL não está rodando. Iniciando..." -ForegroundColor Yellow
    docker-compose up -d database
    Start-Sleep -Seconds 5
}

# Iniciar Backend em background
Write-Host "`n🔧 Iniciando Backend..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\backend
    npm run dev
}

# Aguardar backend iniciar
Start-Sleep -Seconds 3

# Iniciar Frontend em background
Write-Host "🎨 Iniciando Frontend..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\frontend
    npm run dev
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "✅ SCE rodando!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "`nServiços:" -ForegroundColor White
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host "  Backend:  http://localhost:3001" -ForegroundColor Gray
Write-Host "  Database: localhost:5432" -ForegroundColor Gray
Write-Host "`nPressione Ctrl+C para parar..." -ForegroundColor Yellow

# Manter script rodando e mostrar logs
try {
    while ($true) {
        Receive-Job $backendJob, $frontendJob
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "`n🛑 Parando serviços..." -ForegroundColor Yellow
    Stop-Job $backendJob, $frontendJob
    Remove-Job $backendJob, $frontendJob
}
