#!/bin/bash
# Script de deploy automático - PROST-QS Oracle Cloud
# Execute na VM Oracle para atualizar a aplicação

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
PROJECT_DIR="$HOME/apps/uno0826/backend"
BINARY_NAME="prostqs-api"
SERVICE_NAME="prostqs"
BRANCH="main"

# Funções de output
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }
print_step() { echo -e "${BLUE}🔹 $1${NC}"; }

# Banner
echo ""
echo "╔═══════════════════════════════════════╗"
echo "║   PROST-QS Deploy - Oracle Cloud     ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Verificar se diretório existe
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Diretório do projeto não encontrado: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

# Verificar se é repositório Git
if [ ! -d ".git" ]; then
    print_error "Não é um repositório Git"
    exit 1
fi

# Backup do binário atual
print_step "Fazendo backup do binário atual..."
if [ -f "$BINARY_NAME" ]; then
    BACKUP_NAME="${BINARY_NAME}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$BINARY_NAME" "$BACKUP_NAME"
    print_success "Backup criado: $BACKUP_NAME"
else
    print_info "Nenhum binário anterior encontrado"
fi

# Atualizar código
print_step "Atualizando código do repositório..."
git fetch origin
CURRENT_COMMIT=$(git rev-parse HEAD)
git pull origin "$BRANCH"
NEW_COMMIT=$(git rev-parse HEAD)

if [ "$CURRENT_COMMIT" = "$NEW_COMMIT" ]; then
    print_info "Código já está atualizado (commit: ${CURRENT_COMMIT:0:7})"
else
    print_success "Código atualizado: ${CURRENT_COMMIT:0:7} → ${NEW_COMMIT:0:7}"
fi

# Atualizar dependências
print_step "Atualizando dependências Go..."
go mod download
print_success "Dependências atualizadas"

# Buildar aplicação
print_step "Buildando aplicação..."
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_COMMIT=$(git rev-parse --short HEAD)

go build \
    -ldflags="-X main.Version=${GIT_COMMIT} -X main.BuildTime=${BUILD_TIME}" \
    -o "$BINARY_NAME" \
    cmd/api/main.go

if [ $? -eq 0 ]; then
    print_success "Build concluído"
else
    print_error "Falha no build"
    exit 1
fi

# Verificar binário
if [ ! -f "$BINARY_NAME" ]; then
    print_error "Binário não foi criado"
    exit 1
fi

# Tornar executável
chmod +x "$BINARY_NAME"

# Reiniciar serviço
print_step "Reiniciando serviço..."
sudo systemctl restart "$SERVICE_NAME"

# Aguardar inicialização
print_info "Aguardando serviço iniciar..."
sleep 3

# Verificar status
if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
    print_success "Serviço reiniciado com sucesso"
else
    print_error "Serviço falhou ao iniciar!"
    print_info "Revertendo para versão anterior..."
    
    # Reverter para backup
    if [ -f "$BACKUP_NAME" ]; then
        mv "$BACKUP_NAME" "$BINARY_NAME"
        sudo systemctl restart "$SERVICE_NAME"
        sleep 2
        
        if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
            print_success "Revertido para versão anterior"
        else
            print_error "Falha ao reverter. Verifique os logs!"
        fi
    fi
    
    print_info "Logs do serviço:"
    sudo journalctl -u "$SERVICE_NAME" -n 20 --no-pager
    exit 1
fi

# Testar API
print_step "Testando API..."
sleep 2

# Tentar health check local
if curl -f -s http://localhost:8080/health > /dev/null 2>&1; then
    print_success "Health check local OK"
else
    print_error "Health check local falhou"
fi

# Tentar health check público (se configurado)
if curl -f -s https://api.prostqs.com.br/health > /dev/null 2>&1; then
    print_success "Health check público OK"
else
    print_info "Health check público não disponível (normal se SSL não configurado)"
fi

# Informações finais
echo ""
echo "╔═══════════════════════════════════════╗"
echo "║         Deploy Concluído! 🎉          ║"
echo "╚═══════════════════════════════════════╝"
echo ""
print_info "Informações do deploy:"
echo "  - Commit: $GIT_COMMIT"
echo "  - Build: $BUILD_TIME"
echo "  - Serviço: $(sudo systemctl is-active $SERVICE_NAME)"
echo ""
print_info "Comandos úteis:"
echo "  - Ver logs: sudo journalctl -u $SERVICE_NAME -f"
echo "  - Status: sudo systemctl status $SERVICE_NAME"
echo "  - Reiniciar: sudo systemctl restart $SERVICE_NAME"
echo ""
