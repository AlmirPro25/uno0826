# ========================================
# PROST-QS Optimized Deploy Script
# "Deploy de startup de 1 bilhão"
# ========================================

param(
    [switch]$SkipBuild,
    [switch]$SkipOptimize,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

# Configurações
$VM_IP = "64.181.175.25"
$VM_USER = "ubuntu"
$SSH_KEY = "$env:USERPROFILE\.ssh\oracle_vm_key"
$CONTAINER_NAME = "uno-api"
$BINARY_NAME = "prost-qs-linux"
$BACKEND_PATH = "UNO-main/backend"

Write-Host "🚀 PROST-QS Optimized Deploy" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# ========================================
# 1. BUILD - Compilação otimizada
# ========================================
if (-not $SkipBuild) {
    Write-Host "📦 Building optimized binary..." -ForegroundColor Yellow
    
    Push-Location $BACKEND_PATH
    
    # Configurar ambiente para Linux
    $env:GOOS = "linux"
    $env:GOARCH = "amd64"
    $env:CGO_ENABLED = "0"
    
    # Build com otimizações
    # -ldflags="-s -w" remove debug info (binário menor)
    # -trimpath remove paths locais (segurança)
    # -X main.version injects version at build time
    $buildTime = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
    $gitCommit = git rev-parse --short HEAD 2>$null
    if (-not $gitCommit) { $gitCommit = "unknown" }
    
    $ldflags = "-s -w -X main.version=2.0.0-optimized -X main.buildTime=$buildTime -X main.gitCommit=$gitCommit"
    $buildCmd = "go build -ldflags=`"$ldflags`" -trimpath -o prost-qs-linux ./cmd/api"
    
    Write-Host "   Executando: $buildCmd" -ForegroundColor Gray
    Invoke-Expression $buildCmd
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build falhou!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    # Verificar tamanho do binário
    $binarySize = (Get-Item "prost-qs-linux").Length / 1MB
    Write-Host "   ✅ Binary size: $([math]::Round($binarySize, 2)) MB" -ForegroundColor Green
    
    Pop-Location
    
    # Limpar variáveis de ambiente
    Remove-Item Env:GOOS -ErrorAction SilentlyContinue
    Remove-Item Env:GOARCH -ErrorAction SilentlyContinue
    Remove-Item Env:CGO_ENABLED -ErrorAction SilentlyContinue
}

# ========================================
# 2. STOP - Parar container
# ========================================
Write-Host ""
Write-Host "🛑 Stopping container..." -ForegroundColor Yellow

$stopCmd = "ssh -i `"$SSH_KEY`" $VM_USER@$VM_IP `"sudo docker stop $CONTAINER_NAME 2>/dev/null || true`""
Invoke-Expression $stopCmd

Write-Host "   ✅ Container stopped" -ForegroundColor Green

# ========================================
# 3. UPLOAD - Enviar binário
# ========================================
Write-Host ""
Write-Host "📤 Uploading binary..." -ForegroundColor Yellow

$scpCmd = "scp -i `"$SSH_KEY`" `"$BACKEND_PATH/$BINARY_NAME`" $VM_USER@$VM_IP`:~/backend/"
Invoke-Expression $scpCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Upload falhou!" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Binary uploaded" -ForegroundColor Green

# ========================================
# 4. OPTIMIZE - Aplicar otimizações na VM
# ========================================
if (-not $SkipOptimize) {
    Write-Host ""
    Write-Host "⚙️  Applying VM optimizations..." -ForegroundColor Yellow
    
    # Verificar/criar swap
    $swapCmd = @"
ssh -i "$SSH_KEY" $VM_USER@$VM_IP "
    # Verificar swap
    if [ ! -f /swapfile ]; then
        echo 'Creating swap...'
        sudo fallocate -l 2G /swapfile
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi
    
    # Aplicar sysctl otimizado
    echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-prostqs.conf
    echo 'net.core.somaxconn=65535' | sudo tee -a /etc/sysctl.d/99-prostqs.conf
    sudo sysctl -p /etc/sysctl.d/99-prostqs.conf 2>/dev/null || true
    
    echo 'Optimizations applied'
"
"@
    Invoke-Expression $swapCmd
    Write-Host "   ✅ VM optimized" -ForegroundColor Green
}

# ========================================
# 5. START - Iniciar container otimizado
# ========================================
Write-Host ""
Write-Host "🚀 Starting optimized container..." -ForegroundColor Yellow

# Container com limites de memória e variáveis de ambiente otimizadas
$startCmd = @"
ssh -i "$SSH_KEY" $VM_USER@$VM_IP "
    # Remover container antigo se existir
    sudo docker rm $CONTAINER_NAME 2>/dev/null || true
    
    # Iniciar com configurações otimizadas
    # alpine:3.19 pinned para evitar surpresas em produção
    sudo docker run -d \
        --name $CONTAINER_NAME \
        --restart unless-stopped \
        -p 80:8080 \
        --memory=768m \
        --memory-swap=1536m \
        --cpus=1.5 \
        -e GOGC=50 \
        -e GOMEMLIMIT=734003200 \
        -e GOMAXPROCS=2 \
        --env-file /home/ubuntu/backend/.env \
        -v /home/ubuntu/backend/prost-qs-linux:/app/prost-qs-linux \
        alpine:3.19 /app/prost-qs-linux
"
"@
Invoke-Expression $startCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Container start falhou!" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Container started" -ForegroundColor Green

# ========================================
# 6. VERIFY - Verificar deploy
# ========================================
Write-Host ""
Write-Host "🔍 Verifying deployment..." -ForegroundColor Yellow

Start-Sleep -Seconds 5

# Health check
$healthCmd = "ssh -i `"$SSH_KEY`" $VM_USER@$VM_IP `"curl -s http://localhost:80/health || echo 'FAILED'`""
$healthResult = Invoke-Expression $healthCmd

if ($healthResult -match "ok" -or $healthResult -match "healthy") {
    Write-Host "   ✅ Health check passed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Health check: $healthResult" -ForegroundColor Yellow
}

# Container stats
$statsCmd = "ssh -i `"$SSH_KEY`" $VM_USER@$VM_IP `"sudo docker stats $CONTAINER_NAME --no-stream --format 'CPU: {{.CPUPerc}}, MEM: {{.MemUsage}}'`""
$stats = Invoke-Expression $statsCmd
Write-Host "   📊 Container: $stats" -ForegroundColor Cyan

# ========================================
# 7. SUMMARY
# ========================================
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Deploy completed!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 API: https://api.prostqs.com.br" -ForegroundColor White
Write-Host "📊 Health: https://api.prostqs.com.br/health" -ForegroundColor White
Write-Host ""
Write-Host "📝 Otimizações aplicadas:" -ForegroundColor Yellow
Write-Host "   • GOGC=50 (GC mais agressivo)" -ForegroundColor Gray
Write-Host "   • GOMEMLIMIT=700MB" -ForegroundColor Gray
Write-Host "   • Memory limit: 768MB + 768MB swap" -ForegroundColor Gray
Write-Host "   • Connection pool: 3 idle, 10 max" -ForegroundColor Gray
Write-Host "   • Swap: 2GB" -ForegroundColor Gray
Write-Host ""
