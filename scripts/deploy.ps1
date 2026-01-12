# ========================================
# PROST-QS - Deploy Script (Windows)
# ========================================
#
# USO: .\scripts\deploy.ps1 "mensagem do commit"
# 
# O QUE FAZ:
# 1. Valida se tem mudanças
# 2. Roda build local (opcional)
# 3. Commit + Push
# 4. Mostra URLs de produção
#
# RESULTADO:
# - Render deploya backend automaticamente
# - Vercel deploya frontend automaticamente

param(
    [Parameter(Position=0)]
    [string]$Message = "deploy: update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

$ErrorActionPreference = "Stop"

# Cores
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "📦 $msg" -ForegroundColor Cyan }
function Write-Warn { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "   PROST-QS DEPLOY" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# 1. Verificar se está no diretório certo
if (-not (Test-Path "backend/go.mod")) {
    Write-Err "Execute este script da raiz do projeto UNO-main"
    exit 1
}

# 2. Verificar mudanças
Write-Info "Verificando mudanças..."
$status = git status --porcelain
if (-not $status) {
    Write-Warn "Nenhuma mudança para commitar"
    Write-Info "Forçando push de qualquer forma..."
} else {
    Write-Success "Mudanças detectadas"
}

# 3. Git add
Write-Info "Adicionando arquivos..."
git add -A
Write-Success "Arquivos adicionados"

# 4. Commit
Write-Info "Commitando: $Message"
git commit -m $Message 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Warn "Nada novo para commitar, continuando..."
}

# 5. Push
Write-Info "Enviando para GitHub..."
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Err "Falha no push!"
    exit 1
}
Write-Success "Push realizado!"

# 6. Resultado
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   DEPLOY INICIADO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Os deploys são AUTOMÁTICOS:" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Backend (Render):" -ForegroundColor Cyan
Write-Host "   https://uno0826.onrender.com" -ForegroundColor Gray
Write-Host "   Dashboard: https://dashboard.render.com" -ForegroundColor DarkGray
Write-Host ""
Write-Host "🎨 Frontend (Vercel):" -ForegroundColor Cyan
Write-Host "   https://frontend-prost.vercel.app" -ForegroundColor Gray
Write-Host "   Dashboard: https://vercel.com/dashboard" -ForegroundColor DarkGray
Write-Host ""
Write-Host "⏱️  Tempo estimado:" -ForegroundColor Yellow
Write-Host "   Backend: ~2-3 min (Render free tier)" -ForegroundColor Gray
Write-Host "   Frontend: ~1 min (Vercel)" -ForegroundColor Gray
Write-Host ""
Write-Host "📊 CI/CD:" -ForegroundColor Cyan
Write-Host "   https://github.com/SEU_USER/UNO-main/actions" -ForegroundColor Gray
Write-Host ""
