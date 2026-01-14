
# Use a imagem base do Go para compilação
FROM golang:1.22-alpine AS builder

# Configuração do CGO para compilação estática
ENV CGO_ENABLED=0

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos go.mod e go.sum para gerenciar dependências
COPY go.mod go.sum ./

# Baixa as dependências
RUN go mod download

# Copia o código fonte da aplicação para o container
COPY . .

# Compila o executável principal
RUN go build -o main cmd/api/main.go

# Imagem final de produção, leve e segura
FROM alpine:latest

# Instala certificados de segurança para comunicação SSL
RUN apk --no-cache add ca-certificates

# Define o diretório de trabalho da imagem final
WORKDIR /root/

# Copia o executável compilado da imagem builder
COPY --from=builder /app/main .

# Expõe a porta que o servidor Go irá escutar
EXPOSE 8080

# Comando para rodar a aplicação quando o container iniciar
CMD ["./main"]
