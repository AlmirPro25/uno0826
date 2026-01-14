
# Use a imagem oficial do Go como base
FROM golang:1.22-alpine

# Definir o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copiar os arquivos de módulo e download das dependências
COPY go.mod go.sum ./
RUN go mod download

# Copiar o restante do código-fonte
COPY . .

# Compilar o aplicativo Go para um binário estático
RUN go build -o /aether-market ./cmd/api

# Expor a porta que o aplicativo Go irá escutar
EXPOSE 8080

# Comando para rodar a aplicação quando o contêiner iniciar
CMD ["/aether-market"]
