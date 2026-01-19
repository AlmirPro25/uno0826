#!/bin/bash
# Script para corrigir duplicidade de CORS no Nginx
# Execute este script na VM Oracle

echo "🔍 Verificando configuração do Nginx..."
CONFIG_FILE="/etc/nginx/sites-available/prostqs"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Arquivo de configuração não encontrado em: $CONFIG_FILE"
    exit 1
fi

# Fazer backup
cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%s)"
echo "✅ Backup criado"

# Verificar se existe a linha problemática
if grep -q "Access-Control-Allow-Origin" "$CONFIG_FILE"; then
    echo "⚠️  Detectada configuração manual de CORS no Nginx (causa do conflito)"
    
    # Remover linhas de CORS do Nginx (deixar o Go gerenciar)
    sudo sed -i '/Access-Control-Allow-Origin/d' "$CONFIG_FILE"
    sudo sed -i '/Access-Control-Allow-Methods/d' "$CONFIG_FILE"
    sudo sed -i '/Access-Control-Allow-Headers/d' "$CONFIG_FILE"
    
    echo "✅ Linhas manuais removidas do Nginx"
    
    # Testar configuração
    if sudo nginx -t; then
        echo "✅ Configuração válida. Recarregando Nginx..."
        sudo systemctl reload nginx
        echo "🚀 Nginx corrigido com sucesso! O erro de CORS deve sumir."
    else
        echo "❌ Configuração inválida após alteração. Restaurando backup..."
        sudo cp "${CONFIG_FILE}.backup.*" "$CONFIG_FILE"
        exit 1
    fi
else
    echo "✅ Nenhuma configuração explícita de CORS encontrada no Nginx."
    echo "ℹ️  Se o erro persiste, verifique se há configurações em /etc/nginx/nginx.conf"
fi
