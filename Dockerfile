# ========================================
# PROST-QS - Dockerfile de Produção
# "Minimalista, seguro, auditável"
# ========================================

# Build stage - usando golang:latest para ter a versão mais recente
FROM golang:alpine AS builder

# Instalar dependências de build para SQLite
RUN apk add --no-cache gcc musl-dev sqlite-dev

# Habilitar toolchain automático para resolver dependências
ENV GOTOOLCHAIN=auto

WORKDIR /app

# Copiar go.mod e go.sum primeiro (cache de dependências)
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Copiar código fonte do backend
COPY backend/ .

# Compilar com CGO habilitado (necessário para SQLite)
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/api

# ========================================
# Runtime stage - Imagem mínima
# ========================================
FROM alpine:3.19

# Instalar apenas o necessário
RUN apk --no-cache add ca-certificates sqlite tzdata

# Timezone Brasil (opcional)
ENV TZ=America/Sao_Paulo

# Criar usuário não-root
RUN addgroup -g 1000 prostqs && \
    adduser -u 1000 -G prostqs -s /bin/sh -D prostqs

WORKDIR /app

# Copiar binário compilado
COPY --from=builder /app/main .

# Criar diretório de dados
RUN mkdir -p /data && chown prostqs:prostqs /data

# Trocar para usuário não-root
USER prostqs

# Expor porta
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Comando de inicialização
CMD ["./main"]
