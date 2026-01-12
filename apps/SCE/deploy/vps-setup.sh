#!/bin/bash
# =============================================================================
# SCE VPS SETUP SCRIPT
# Para Oracle Cloud Free Tier (ARM Ampere A1)
# =============================================================================

set -e

echo "🚀 SCE VPS Setup - Iniciando..."

# Atualizar sistema
echo "📦 Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
echo "📦 Instalando dependências..."
sudo apt install -y \
    curl \
    git \
    wget \
    htop \
    ufw \
    fail2ban \
    certbot

# Instalar Docker
echo "🐳 Instalando Docker..."
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
echo "🐳 Instalando Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Configurar firewall
echo "🔥 Configurando firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Configurar fail2ban
echo "🛡️ Configurando fail2ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Criar diretórios
echo "📁 Criando diretórios..."
mkdir -p ~/sce/{data,certs,traefik}

# Criar rede Docker
echo "🌐 Criando rede Docker..."
docker network create sce-network || true

echo ""
echo "✅ Setup básico concluído!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Faça logout e login novamente (para grupo docker)"
echo "   2. Configure o domínio DNS apontando para este IP"
echo "   3. Execute: ./deploy-sce.sh"
echo ""
