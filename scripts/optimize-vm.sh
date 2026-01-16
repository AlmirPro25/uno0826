#!/bin/bash
# ========================================
# PROST-QS VM Optimization Script
# "Transformar 1GB em 10GB de performance"
# ========================================

set -e

echo "🚀 PROST-QS VM Optimization Script"
echo "=================================="

# ========================================
# 1. SWAP - Memória Virtual
# "Quando a RAM acaba, o swap salva"
# ========================================
echo ""
echo "📦 Configurando Swap..."

# Verificar se swap já existe
if [ -f /swapfile ]; then
    echo "   Swap já existe, verificando tamanho..."
    SWAP_SIZE=$(swapon --show | grep /swapfile | awk '{print $3}')
    echo "   Swap atual: $SWAP_SIZE"
else
    echo "   Criando swapfile de 2GB..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    
    # Adicionar ao fstab se não existir
    if ! grep -q "/swapfile" /etc/fstab; then
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi
    echo "   ✅ Swap de 2GB criado"
fi

# ========================================
# 2. SYSCTL - Otimizações de Kernel
# "O kernel Linux também precisa de tuning"
# ========================================
echo ""
echo "⚙️  Configurando sysctl..."

# Criar arquivo de configuração
sudo tee /etc/sysctl.d/99-prostqs.conf > /dev/null << 'EOF'
# PROST-QS Performance Tuning
# Gerado em: $(date)

# ========================================
# MEMORY
# ========================================
# Usar swap apenas quando necessário (10% = quase nunca)
vm.swappiness=10

# Manter mais cache de arquivos em memória
vm.vfs_cache_pressure=50

# Permitir overcommit moderado (para Go GC)
vm.overcommit_memory=1
vm.overcommit_ratio=80

# ========================================
# NETWORK - TCP/IP
# ========================================
# Aumentar buffers de rede
net.core.rmem_max=16777216
net.core.wmem_max=16777216
net.core.rmem_default=1048576
net.core.wmem_default=1048576

# TCP buffers
net.ipv4.tcp_rmem=4096 1048576 16777216
net.ipv4.tcp_wmem=4096 1048576 16777216

# Conexões simultâneas
net.core.somaxconn=65535
net.ipv4.tcp_max_syn_backlog=65535
net.core.netdev_max_backlog=65535

# Reutilizar conexões TIME_WAIT
net.ipv4.tcp_tw_reuse=1

# Keepalive mais agressivo
net.ipv4.tcp_keepalive_time=60
net.ipv4.tcp_keepalive_intvl=10
net.ipv4.tcp_keepalive_probes=6

# Faster TCP
net.ipv4.tcp_fastopen=3
net.ipv4.tcp_slow_start_after_idle=0

# ========================================
# FILE DESCRIPTORS
# ========================================
fs.file-max=2097152
fs.nr_open=2097152
EOF

# Aplicar configurações
sudo sysctl -p /etc/sysctl.d/99-prostqs.conf
echo "   ✅ sysctl configurado"

# ========================================
# 3. LIMITS - Limites de Usuário
# "Mais file descriptors = mais conexões"
# ========================================
echo ""
echo "📝 Configurando limits..."

sudo tee /etc/security/limits.d/99-prostqs.conf > /dev/null << 'EOF'
# PROST-QS Limits
* soft nofile 1048576
* hard nofile 1048576
* soft nproc 65535
* hard nproc 65535
ubuntu soft nofile 1048576
ubuntu hard nofile 1048576
root soft nofile 1048576
root hard nofile 1048576
EOF

echo "   ✅ limits configurado"

# ========================================
# 4. DOCKER - Otimizações
# "Container leve = mais performance"
# ========================================
echo ""
echo "🐳 Verificando Docker..."

if command -v docker &> /dev/null; then
    # Limpar imagens não usadas
    echo "   Limpando imagens não usadas..."
    docker system prune -f --volumes 2>/dev/null || true
    
    # Verificar container uno-api
    if docker ps -a | grep -q uno-api; then
        echo "   Container uno-api encontrado"
        
        # Mostrar uso de recursos
        docker stats uno-api --no-stream --format "   CPU: {{.CPUPerc}}, MEM: {{.MemUsage}}" 2>/dev/null || true
    fi
    echo "   ✅ Docker verificado"
else
    echo "   ⚠️  Docker não instalado"
fi

# ========================================
# 5. VERIFICAÇÃO FINAL
# ========================================
echo ""
echo "📊 Status Final:"
echo "=================================="

# Memória
echo ""
echo "💾 Memória:"
free -h

# Swap
echo ""
echo "💿 Swap:"
swapon --show

# Conexões
echo ""
echo "🌐 Limites de Conexão:"
echo "   somaxconn: $(cat /proc/sys/net/core/somaxconn)"
echo "   file-max: $(cat /proc/sys/fs/file-max)"

# CPU
echo ""
echo "🖥️  CPU:"
echo "   Cores: $(nproc)"
echo "   Load: $(cat /proc/loadavg | awk '{print $1, $2, $3}')"

echo ""
echo "=================================="
echo "✅ Otimização concluída!"
echo ""
echo "⚠️  IMPORTANTE: Reinicie o container para aplicar todas as mudanças:"
echo "   sudo docker restart uno-api"
echo ""
