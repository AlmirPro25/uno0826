# =============================================================================
# SCE Backend - Production Dockerfile
# =============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências de build
RUN apk add --no-cache python3 make g++

# Copiar package files
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci

# Gerar Prisma client
RUN npx prisma generate

# Copiar código fonte
COPY . .

# Build TypeScript
RUN npm run build

# =============================================================================
# Production image
# =============================================================================
FROM node:20-alpine

WORKDIR /app

# Instalar Docker CLI (para orquestrar containers) e OpenSSL para Prisma
RUN apk add --no-cache docker-cli git openssl openssl-dev

# Copiar node_modules e build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Criar diretório de dados
RUN mkdir -p /app/data

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3001

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/v1/health || exit 1

# Iniciar
CMD ["node", "dist/index.js"]
