#!/bin/bash
# Script de setup inicial - Oracle Cloud VM
# Execute este script na VM Oracle após conectar via SSH

set -e

echo "🚀 Configurando servidor PROST-QS na Oracle Cloud..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para printar com cor
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Verificar se está rodando como ubuntu
if [ "$USER" != "ubuntu" ]; then
    print_error "Este script deve ser executado como usuário ubuntu"
    exit 1
fi

# Atualizar sistema
print_info "Atualizando sistema..."
sudo apt update && sudo apt upgrade -y
print_success "Sistema atualizado"

# Instalar dependências básicas
print_info "Instalando dependências..."
sudo apt install -y \
    git \
    curl \
    wget \
    build-essential \
    ufw \
    nginx \
    certbot \
    python3-certbot-nginx \
    htop \
    net-tools \
    postgresql-client
print_success "Dependências instaladas"

# Instalar Go 1.21
print_info "Instalando Go 1.21..."
cd /tmp
wget -q https://go.dev/dl/go1.21.6.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz
rm go1.21.6.linux-amd64.tar.gz

# Configurar Go no PATH
if ! grep -q "/usr/local/go/bin" ~/.bashrc; then
    echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
    echo 'export GOPATH=$HOME/go' >> ~/.bashrc
    echo 'export PATH=$PATH:$GOPATH/bin' >> ~/.bashrc
fi

export PATH=$PATH:/usr/local/go/bin
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin

# Verificar instalação Go
if go version &> /dev/null; then
    print_success "Go instalado: $(go version)"
else
    print_error "Falha ao instalar Go"
    exit 1
fi

# Configurar Firewall UFW
print_info "Configurando firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw allow 8080/tcp comment 'Backend (temporário)'
sudo ufw --force enable
print_success "Firewall configurado"

# Criar diretórios
print_info "Criando estrutura de diretórios..."
mkdir -p ~/apps
mkdir -p ~/backups
sudo mkdir -p /var/log/prostqs
sudo chown ubuntu:ubuntu /var/log/prostqs
print_success "Diretórios criados"

# Configurar Git
print_info "Configurando Git..."
git config --global user.name "PROST-QS Deploy"
git config --global user.email "deploy@prostqs.com.br"
print_success "Git configurado"

# Informações do sistema
print_info "Informações do sistema:"
echo "  - OS: $(lsb_release -d | cut -f2)"
echo "  - Kernel: $(uname -r)"
echo "  - CPU: $(nproc) cores"
echo "  - RAM: $(free -h | awk '/^Mem:/ {print $2}')"
echo "  - Disk: $(df -h / | awk 'NR==2 {print $4}') disponível"
echo "  - Go: $(go version | awk '{print $3}')"

print_success "Setup inicial concluído!"
echo ""
print_info "Próximos passos:"
echo "  1. Clonar repositório: cd ~/apps && git clone <URL>"
echo "  2. Configurar .env"
echo "  3. Buildar aplicação: go build -o prostqs-api cmd/api/main.go"
echo "  4. Configurar systemd service"
echo "  5. Configurar Nginx"
echo "  6. Configurar SSL com Certbot"
echo ""
print_info "Consulte: docs/DEPLOY-ORACLE-CLOUD.md"
