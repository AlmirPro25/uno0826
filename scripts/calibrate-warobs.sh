#!/bin/bash
# 🎯 War Observability Calibration Tool
# Execute na VM para calibrar e validar métricas

BASE_URL="http://localhost:8080/api/v1"
HEALTH_URL="$BASE_URL/health"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📡 War Telemetry Calibration${NC}"
echo "=================================================="

# 1. Baseline
echo -e "${YELLOW}1. Capturando Baseline (Estado Repouso)...${NC}"
BASELINE=$(curl -s "$HEALTH_URL")
PRESSURE_STATUS=$(echo "$BASELINE" | jq -r '.pressure.status // "unknown"')
ERROR_RATE=$(echo "$BASELINE" | jq -r '.pressure.error_rate_percent // 0')
REQUESTS=$(echo "$BASELINE" | jq -r '.pressure.requests_total // 0')

echo "Status: $PRESSURE_STATUS"
echo "Error Rate: $ERROR_RATE%"
echo "Total Requests: $REQUESTS"

if [ "$PRESSURE_STATUS" != "normal" ] && [ "$PRESSURE_STATUS" != "unknown" ]; then
    echo -e "${RED}⚠️  Sistema já está sob pressão! Verifique logs.${NC}"
fi

# 2. Traffic Generation (Noise)
echo ""
echo -e "${YELLOW}2. Gerando Ruído (100 Requests 404)...${NC}"
echo "Isso deve elevar a 'Client Error Rate' sem derrubar o sistema."

for i in {1..100}; do
    curl -s -o /dev/null "$BASE_URL/force-404-noise-$i" &
    if (( $i % 20 == 0 )); then 
        wait
        echo -n "." 
    fi
done
wait
echo ""

# 3. Verification
echo ""
echo -e "${YELLOW}3. Verificando Reação do Sistema...${NC}"
sleep 2

POST_STATS=$(curl -s "$HEALTH_URL")
NEW_PRESSURE=$(echo "$POST_STATS" | jq -r '.pressure.status // "unknown"')
NEW_ERROR_RATE=$(echo "$POST_STATS" | jq -r '.pressure.error_rate_percent // 0')
NEW_REQUESTS=$(echo "$POST_STATS" | jq -r '.pressure.requests_total // 0')

echo "Status: $NEW_PRESSURE"
echo "Error Rate: $NEW_ERROR_RATE%"
echo "Total Requests: $NEW_REQUESTS"

DELTA_REQS=$((NEW_REQUESTS - REQUESTS))
echo ""
echo "📈 Delta: +$DELTA_REQS requests processados"

if (( $(echo "$NEW_ERROR_RATE > 0" | bc -l) )); then
    echo -e "${GREEN}✅ Sucesso: O sistema detectou os erros (Rate > 0%).${NC}"
else
    echo -e "${RED}❌ Falha: O sistema não registrou aumento na taxa de erro.${NC}"
fi

echo ""
echo "=================================================="
echo "Dica: Ajuste os thresholds no .env:"
echo "WAROBS_ERROR_RATE_ELEVATED=5.0"
echo "WAROBS_MIN_REQUESTS_THRESHOLD=10"
echo "=================================================="
