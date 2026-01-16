#!/bin/bash
# =============================================================================
# SCE VM SETUP - Oracle Cloud ARM (Free Tier)
# Executa na VM após criação
# =============================================================================

set -e

echo "🚀 SCE VM Setup - Iniciando..."
echo "================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Atualizar sistema
echo -e "${YELLOW}📦 Atualizando sistema...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. Instalar dependências
echo -e "${YELLOW}📦 Instalando dependências...${NC}"
sudo apt install -y \
    curl \
    git \
    wget \
    htop \
    ufw \
    fail2ban \
    unzip \
    jq

# 3. Instalar Docker
echo -e "${YELLOW}🐳 Instalando Docker...${NC}"
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 4. Instalar Docker Compose v2
echo -e "${YELLOW}🐳 Instalando Docker Compose...${NC}"
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# 5. Configurar firewall
echo -e "${YELLOW}🔥 Configurando firewall...${NC}"
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
# Porta para comunicação com Kernel (opcional, interno)
sudo ufw allow from 64.181.175.25 to any port 3001
sudo ufw --force enable

# 6. Configurar fail2ban
echo -e "${YELLOW}🛡️ Configurando fail2ban...${NC}"
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# 7. Criar estrutura de diretórios
echo -e "${YELLOW}📁 Criando diretórios...${NC}"
mkdir -p ~/sce/{data,certs,traefik,logs}

# 8. Criar rede Docker para SCE
echo -e "${YELLOW}🌐 Criando rede Docker...${NC}"
sudo docker network create sce-network 2>/dev/null || true

# 9. Configurar swap (importante para ARM com muitos containers)
echo -e "${YELLOW}💾 Configurando swap...${NC}"
if [ ! -f /swapfile ]; then
    sudo fallocate -l 4G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# 10. Otimizações de kernel para containers
echo -e "${YELLOW}⚙️ Aplicando otimizações...${NC}"
cat << 'EOF' | sudo tee /etc/sysctl.d/99-sce.conf
# Otimizações para containers
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_tw_reuse = 1
vm.swappiness = 10
vm.overcommit_memory = 1
fs.file-max = 2097152
EOF
sudo sysctl -p /etc/sysctl.d/99-sce.conf

# 11. Limites de arquivos abertos
echo -e "${YELLOW}⚙️ Configurando limites...${NC}"
cat << 'EOF' | sudo tee /etc/security/limits.d/99-sce.conf
* soft nofile 65535
* hard nofile 65535
* soft nproc 65535
* hard nproc 65535
EOF

echo ""
echo -e "${GREEN}✅ Setup básico concluído!${NC}"
echo ""
echo "================================"
echo "📋 PRÓXIMOS PASSOS:"
echo "================================"
echo ""
echo "1. Faça logout e login novamente:"
echo "   exit"
echo ""
echo "2. Verifique Docker:"
echo "   docker --version"
echo "   docker compose version"
echo ""
echo "3. Configure DNS apontando para este IP"
echo ""
echo "4. Execute o script de deploy do SCE"
echo ""
echo "================================"
echo "📊 RECURSOS DISPONÍVEIS:"
echo "================================"
echo "CPU: $(nproc) cores"
echo "RAM: $(free -h | awk '/^Mem:/ {print $2}')"
echo "Disco: $(df -h / | awk 'NR==2 {print $4}') livres"
echo ""
