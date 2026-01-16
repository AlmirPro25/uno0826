# =============================================================================
# SCE Frontend - Production Dockerfile
# =============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Args para build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_PROSTQS_URL

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm install --legacy-peer-deps

# Copiar código fonte
COPY . .

# Build Next.js
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_PROSTQS_URL=$NEXT_PUBLIC_PROSTQS_URL
RUN npm run build

# =============================================================================
# Production image
# =============================================================================
FROM node:20-alpine

WORKDIR /app

# Copiar build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Iniciar
CMD ["node", "server.js"]
