#!/bin/bash
# =============================================================================
# SCE DEPLOY SCRIPT
# Executa após vps-setup.sh e configuração de DNS
# =============================================================================

set -e

# Verificar variáveis obrigatórias
if [ -z "$SUPER_DOMAIN" ]; then
    echo "❌ SUPER_DOMAIN não definido!"
    echo "   Exemplo: export SUPER_DOMAIN=sce.seudominio.com"
    exit 1
fi

echo "🚀 Deploy SCE para $SUPER_DOMAIN"

# Ir para diretório
cd ~/sce

# Clonar repositório (se não existir)
if [ ! -d "UNO-main" ]; then
    echo "📦 Clonando repositório..."
    git clone https://github.com/AlmirPro25/uno0826.git UNO-main
fi

# Atualizar código
cd UNO-main
git pull origin main

# Copiar arquivos de deploy
cp apps/SCE/deploy/docker-compose.prod.yml ~/sce/docker-compose.yml
cp apps/SCE/deploy/traefik.yml ~/sce/traefik.yml

# Criar arquivo .env se não existir
if [ ! -f ~/sce/.env ]; then
    echo "📝 Criando .env..."
    cat > ~/sce/.env << EOF
# =============================================================================
# SCE PRODUCTION CONFIG
# =============================================================================

# Domínio principal (ex: sce.seudominio.com)
SUPER_DOMAIN=${SUPER_DOMAIN}

# Email para SSL (Let's Encrypt)
ACME_EMAIL=seu@email.com

# Traefik Dashboard Auth (htpasswd format)
# Gerar com: htpasswd -nb admin suasenha
TRAEFIK_AUTH=admin:\$apr1\$xxx

# Database (SQLite local ou PostgreSQL externo)
DATABASE_URL=file:./data/sce.db

# Kernel Integration
PROSTQS_URL=https://uno0826.onrender.com
PROSTQS_APP_ID=seu_app_id
PROSTQS_APP_KEY=pq_pk_xxx
PROSTQS_APP_SECRET=pq_sk_xxx
PROST_QS_JWT_SECRET=seu_jwt_secret

# Encryption Key (32 bytes hex)
ENCRYPTION_KEY=$(openssl rand -hex 32)
EOF
    echo ""
    echo "⚠️  IMPORTANTE: Edite ~/sce/.env com suas credenciais!"
    echo "   nano ~/sce/.env"
    exit 0
fi

# Criar diretório de certificados
mkdir -p ~/sce/letsencrypt
touch ~/sce/letsencrypt/acme.json
chmod 600 ~/sce/letsencrypt/acme.json

# Build e deploy
cd ~/sce
echo "🔨 Building containers..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "✅ SCE deployed!"
echo ""
echo "📋 URLs:"
echo "   Dashboard: https://${SUPER_DOMAIN}"
echo "   API:       https://api.${SUPER_DOMAIN}"
echo "   Traefik:   https://traefik.${SUPER_DOMAIN}"
echo ""
echo "📋 Comandos úteis:"
echo "   docker-compose logs -f        # Ver logs"
echo "   docker-compose ps             # Ver status"
echo "   docker-compose restart        # Reiniciar"
echo ""
