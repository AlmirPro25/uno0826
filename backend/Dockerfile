
# Use a imagem oficial do Go para construir o binário
FROM golang:1.22-alpine AS builder

# Instalar git e ca-certificates para dependências e SSL
RUN apk add --no-cache git ca-certificates

WORKDIR /app

# Copiar go.mod e go.sum para resolver as dependências
COPY backend/go.mod ./
COPY backend/go.sum ./

# Baixar as dependências do Go
RUN go mod download

# Copiar o restante do código do backend
COPY backend/ .

# Compilar a aplicação
# Desabilitar CGO para garantir um binário estático
# Habilitar otimizações e remover símbolos de depuração
RUN CGO_ENABLED=0 go build -ldflags "-s -w" -o /usr/local/bin/prost-qs-core ./cmd/api/main.go

# Use uma imagem leve para a execução
FROM alpine/git:latest as runner

# Instalar ca-certificates (necessário para HTTPS)
# RUN apk add --no-cache ca-certificates

WORKDIR /app

# Criar o diretório de dados para o SQLite
RUN mkdir -p /app/data

# Copiar o binário compilado do estágio de construção
COPY --from=builder /usr/local/bin/prost-qs-core .

# Copiar o .env.example para o container para referência, mas o .env real deve ser montado via Docker Compose
# COPY backend/.env.example .env.example

# Expor a porta que a aplicação Go escutará
EXPOSE 8080

# Comando para executar a aplicação
ENTRYPOINT ["/app/prost-qs-core"]

