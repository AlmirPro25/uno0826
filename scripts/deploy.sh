#!/bin/bash
# ========================================
# PROST-QS - Deploy Script (Linux/Mac)
# ========================================
#
# USO: ./scripts/deploy.sh "mensagem do commit"
# 
# O QUE FAZ:
# 1. Valida se tem mudanças
# 2. Commit + Push
# 3. Mostra URLs de produção
#
# RESULTADO:
# - Render deploya backend automaticamente
# - Vercel deploya frontend automaticamente

set -e

MESSAGE="${1:-deploy: update $(date '+%Y-%m-%d %H:%M')}"

# Cores
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${CYAN}========================================"
echo "   PROST-QS DEPLOY"
echo -e "========================================${NC}"
echo ""

# 1. Verificar diretório
if [ ! -f "backend/go.mod" ]; then
    echo -e "${RED}❌ Execute da raiz do projeto UNO-main${NC}"
    exit 1
fi

# 2. Git add
echo -e "${CYAN}📦 Adicionando arquivos...${NC}"
git add -A

# 3. Commit
echo -e "${CYAN}📦 Commitando: $MESSAGE${NC}"
git commit -m "$MESSAGE" || echo -e "${YELLOW}⚠️  Nada novo para commitar${NC}"

# 4. Push
echo -e "${CYAN}📦 Enviando para GitHub...${NC}"
git push origin main
echo -e "${GREEN}✅ Push realizado!${NC}"

# 5. Resultado
echo ""
echo -e "${GREEN}========================================"
echo "   DEPLOY INICIADO!"
echo -e "========================================${NC}"
echo ""
echo "Os deploys são AUTOMÁTICOS:"
echo ""
echo -e "${CYAN}🔧 Backend (Render):${NC}"
echo "   https://uno0826.onrender.com"
echo ""
echo -e "${CYAN}🎨 Frontend (Vercel):${NC}"
echo "   https://frontend-prost.vercel.app"
echo ""
echo -e "${YELLOW}⏱️  Tempo estimado:${NC}"
echo "   Backend: ~2-3 min"
echo "   Frontend: ~1 min"
echo ""
