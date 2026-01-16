#!/bin/bash
# Deploy SCE para Google Cloud VM
# Uso: ./deploy.sh

set -e

VM_IP="34.95.249.26"
SSH_KEY="$HOME/.ssh/gcloud_sce_key"
REMOTE_DIR="~/sce"

echo "🚀 Deploying SCE to $VM_IP..."

# 1. Empacotar backend
echo "📦 Empacotando backend..."
tar --exclude="node_modules" --exclude="data" -cvf /tmp/sce-backend.tar -C "../../UNO-main/apps/SCE" backend

# 2. Empacotar frontend
echo "📦 Empacotando frontend..."
tar --exclude="node_modules" --exclude=".next" --exclude=".vercel" -cvf /tmp/sce-frontend.tar -C "../../UNO-main/apps/SCE" frontend

# 3. Enviar arquivos
echo "📤 Enviando arquivos..."
scp -i "$SSH_KEY" /tmp/sce-backend.tar ubuntu@$VM_IP:$REMOTE_DIR/
scp -i "$SSH_KEY" /tmp/sce-frontend.tar ubuntu@$VM_IP:$REMOTE_DIR/
scp -i "$SSH_KEY" docker-compose.yml ubuntu@$VM_IP:$REMOTE_DIR/
scp -i "$SSH_KEY" traefik.yml ubuntu@$VM_IP:$REMOTE_DIR/

# 4. Extrair e rebuildar no servidor
echo "🔧 Extraindo e rebuildando..."
ssh -i "$SSH_KEY" ubuntu@$VM_IP << 'EOF'
cd ~/sce
rm -rf SCE/backend SCE/frontend
tar -xf sce-backend.tar && mv backend SCE/
tar -xf sce-frontend.tar && mv frontend SCE/
sudo docker-compose down
sudo docker-compose build --no-cache
sudo docker-compose up -d
sudo docker-compose ps
EOF

echo "✅ Deploy concluído!"
echo "🌐 Frontend: https://sce.prostqs.com.br"
echo "🔌 API: https://api.sce.prostqs.com.br"
