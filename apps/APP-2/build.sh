#!/bin/bash
# Nexus Sovereign Build Script for Linux/macOS
# Requires: Go 1.20+, Node.js 18+, Wails CLI

set -e

MODE=${1:-dev}

echo "═══════════════════════════════════════════════════"
echo "  NEXUS SOVEREIGN - Build System"
echo "═══════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}[1/5] Verificando pré-requisitos...${NC}"

if ! command -v go &> /dev/null; then
    echo -e "${RED}ERRO: Go não encontrado. Instale em https://go.dev/dl/${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓ Go encontrado: $(go version)${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}ERRO: Node.js não encontrado. Instale em https://nodejs.org/${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓ Node.js encontrado: $(node --version)${NC}"

if ! command -v wails &> /dev/null; then
    echo -e "  ${YELLOW}! Wails CLI não encontrado. Instalando...${NC}"
    go install github.com/wailsapp/wails/v2/cmd/wails@latest
fi
echo -e "  ${GREEN}✓ Wails CLI disponível${NC}"

# Install frontend dependencies
echo ""
echo -e "${YELLOW}[2/5] Instalando dependências do frontend...${NC}"
cd web
npm install
cd ..
echo -e "  ${GREEN}✓ Dependências instaladas${NC}"

# Install Go dependencies
echo ""
echo -e "${YELLOW}[3/5] Instalando dependências do backend...${NC}"
cd nexus-node
go mod tidy
cd ..
echo -e "  ${GREEN}✓ Módulos Go sincronizados${NC}"

# Build based on mode
echo ""
echo -e "${YELLOW}[4/5] Compilando aplicação (modo: $MODE)...${NC}"

case $MODE in
    dev)
        echo -e "  ${CYAN}Iniciando modo desenvolvimento...${NC}"
        wails dev
        ;;
    build)
        echo -e "  ${CYAN}Compilando binário de produção...${NC}"
        
        # Detect OS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            PLATFORM="darwin/universal"
            OUTPUT="NexusSovereign.app"
        else
            PLATFORM="linux/amd64"
            OUTPUT="NexusSovereign"
        fi
        
        wails build -clean -platform $PLATFORM
        
        echo ""
        echo -e "${GREEN}[5/5] Build concluído!${NC}"
        echo ""
        echo "═══════════════════════════════════════════════════"
        echo -e "  Binário gerado em: build/bin/$OUTPUT"
        echo "═══════════════════════════════════════════════════"
        ;;
    docker)
        echo -e "  ${CYAN}Iniciando via Docker Compose...${NC}"
        docker-compose up --build -d
        echo ""
        echo -e "  ${GREEN}✓ Containers iniciados${NC}"
        echo "  → Frontend: http://localhost:3000"
        echo "  → API: http://localhost:8080"
        ;;
    *)
        echo -e "${RED}Modo inválido. Use: dev, build, ou docker${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Concluído!${NC}"
