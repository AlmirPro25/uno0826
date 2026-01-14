# ============================================
# NEURAL CORE - DOCKERFILE
# ============================================

FROM node:20-alpine AS base

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat

WORKDIR /app

# ============================================
# DEPENDENCIES
# ============================================

FROM base AS deps

# Copiar arquivos de dependências
COPY package.json package-lock.json* ./

# Instalar dependências
RUN npm ci

# ============================================
# BUILDER
# ============================================

FROM base AS builder

WORKDIR /app

# Copiar dependências
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fonte
COPY . .

# Build
RUN npm run build

# ============================================
# RUNNER
# ============================================

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 neuralcore

# Copiar arquivos necessários
COPY --from=builder --chown=neuralcore:nodejs /app/dist ./dist
COPY --from=builder --chown=neuralcore:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=neuralcore:nodejs /app/package.json ./package.json

USER neuralcore

EXPOSE 3000

ENV PORT=3000

CMD ["node", "dist/index.js"]
