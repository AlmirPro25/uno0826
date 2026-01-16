# ========================================
# PROST-QS - Apply Optimizations to VM
# "Aplicar otimizações sem rebuild"
# ========================================

$ErrorActionPreference = "Stop"

$VM_IP = "64.181.175.25"
$VM_USER = "ubuntu"
$SSH_KEY = "$env:USERPROFILE\.ssh\oracle_vm_key"

Write-Host "⚙️  Aplicando otimizações na VM Oracle..." -ForegroundColor Cyan
Write-Host ""

# ========================================
# 1. SWAP
# ========================================
Write-Host "💾 Configurando Swap..." -ForegroundColor Yellow

$swapScript = @'
#!/bin/bash
set -e

# Verificar se swap existe
if [ -f /swapfile ]; then
    echo "Swap já existe:"
    swapon --show
else
    echo "Criando swap de 2GB..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    
    # Adicionar ao fstab
    if ! grep -q "/swapfile" /etc/fstab; then
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi
    echo "Swap criado!"
fi
'@

$swapScript | ssh -i $SSH_KEY "$VM_USER@$VM_IP" "bash -s"
Write-Host "   ✅ Swap configurado" -ForegroundColor Green

# ========================================
# 2. SYSCTL
# ========================================
Write-Host ""
Write-Host "🔧 Configurando sysctl..." -ForegroundColor Yellow

$sysctlScript = @'
#!/bin/bash
set -e

# Criar arquivo de configuração
sudo tee /etc/sysctl.d/99-prostqs.conf > /dev/null << 'SYSCTL'
# PROST-QS Performance Tuning
vm.swappiness=10
vm.vfs_cache_pressure=50
net.core.somaxconn=65535
net.ipv4.tcp_max_syn_backlog=65535
net.core.netdev_max_backlog=65535
net.ipv4.tcp_tw_reuse=1
net.ipv4.tcp_keepalive_time=60
net.ipv4.tcp_keepalive_intvl=10
net.ipv4.tcp_keepalive_probes=6
fs.file-max=2097152
SYSCTL

# Aplicar
sudo sysctl -p /etc/sysctl.d/99-prostqs.conf 2>/dev/null || true
echo "sysctl aplicado!"
'@

$sysctlScript | ssh -i $SSH_KEY "$VM_USER@$VM_IP" "bash -s"
Write-Host "   ✅ sysctl configurado" -ForegroundColor Green

# ========================================
# 3. LIMITS
# ========================================
Write-Host ""
Write-Host "📝 Configurando limits..." -ForegroundColor Yellow

$limitsScript = @'
#!/bin/bash
set -e

sudo tee /etc/security/limits.d/99-prostqs.conf > /dev/null << 'LIMITS'
* soft nofile 1048576
* hard nofile 1048576
* soft nproc 65535
* hard nproc 65535
ubuntu soft nofile 1048576
ubuntu hard nofile 1048576
LIMITS

echo "limits aplicado!"
'@

$limitsScript | ssh -i $SSH_KEY "$VM_USER@$VM_IP" "bash -s"
Write-Host "   ✅ limits configurado" -ForegroundColor Green

# ========================================
# 4. DOCKER CLEANUP
# ========================================
Write-Host ""
Write-Host "🐳 Limpando Docker..." -ForegroundColor Yellow

ssh -i $SSH_KEY "$VM_USER@$VM_IP" "sudo docker system prune -f 2>/dev/null || true"
Write-Host "   ✅ Docker limpo" -ForegroundColor Green

# ========================================
# 5. RESTART CONTAINER COM OTIMIZAÇÕES
# ========================================
Write-Host ""
Write-Host "🚀 Reiniciando container com otimizações..." -ForegroundColor Yellow

$restartScript = @'
#!/bin/bash
set -e

# Parar container atual
sudo docker stop uno-api 2>/dev/null || true
sudo docker rm uno-api 2>/dev/null || true

# Iniciar com configurações otimizadas
sudo docker run -d \
    --name uno-api \
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
    alpine:latest /app/prost-qs-linux

echo "Container reiniciado!"
'@

$restartScript | ssh -i $SSH_KEY "$VM_USER@$VM_IP" "bash -s"
Write-Host "   ✅ Container reiniciado" -ForegroundColor Green

# ========================================
# 6. VERIFICAÇÃO
# ========================================
Write-Host ""
Write-Host "🔍 Verificando..." -ForegroundColor Yellow

Start-Sleep -Seconds 5

# Health check
$health = ssh -i $SSH_KEY "$VM_USER@$VM_IP" "curl -s http://localhost:80/health 2>/dev/null || echo 'FAILED'"
Write-Host "   Health: $health" -ForegroundColor Cyan

# Stats
$stats = ssh -i $SSH_KEY "$VM_USER@$VM_IP" "sudo docker stats uno-api --no-stream --format 'CPU: {{.CPUPerc}}, MEM: {{.MemUsage}}' 2>/dev/null"
Write-Host "   Stats: $stats" -ForegroundColor Cyan

# Memory
$mem = ssh -i $SSH_KEY "$VM_USER@$VM_IP" "free -h | grep Mem | awk '{print \$3 \"/\" \$2}'"
Write-Host "   Memory: $mem" -ForegroundColor Cyan

# Swap
$swap = ssh -i $SSH_KEY "$VM_USER@$VM_IP" "free -h | grep Swap | awk '{print \$3 \"/\" \$2}'"
Write-Host "   Swap: $swap" -ForegroundColor Cyan

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Otimizações aplicadas!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 API: https://api.prostqs.com.br" -ForegroundColor White
Write-Host ""
