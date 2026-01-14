#!/bin/bash

# ============================================
# SCRIPT DE TESTE DO NEURAL CORE
# ============================================

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║        🧪 TESTANDO NEURAL CORE - ORQUESTRADOR 🧪             ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

NEURAL_CORE_URL="http://localhost:3000"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar endpoint
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  
  echo -e "${YELLOW}🧪 Testando: $name${NC}"
  
  if [ "$method" == "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$NEURAL_CORE_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X POST "$NEURAL_CORE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✅ PASSOU ($http_code)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  else
    echo -e "${RED}❌ FALHOU ($http_code)${NC}"
    echo "$body"
  fi
  
  echo ""
}

# ============================================
# TESTES
# ============================================

echo "1️⃣  Health Check"
test_endpoint "Health Check" "GET" "/health" ""

echo "2️⃣  Análise de Contexto - Jogo"
test_endpoint "Contexto: Jogo" "POST" "/api/analyze-context" \
  '{"prompt": "Crie um jogo de plataforma com Mario"}'

echo "3️⃣  Análise de Contexto - Fintech"
test_endpoint "Contexto: Fintech" "POST" "/api/analyze-context" \
  '{"prompt": "Crie um banco digital com PIX"}'

echo "4️⃣  Análise de Contexto - Fullstack"
test_endpoint "Contexto: Fullstack" "POST" "/api/analyze-context" \
  '{"prompt": "Crie um app de tarefas com backend"}'

echo "5️⃣  Geração de Código Simples"
test_endpoint "Geração: Botão" "POST" "/api/generate" \
  '{"prompt": "Crie um botão vermelho", "modelName": "gemini-2.0-flash-exp"}'

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║        ✅ TESTES CONCLUÍDOS                                  ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
