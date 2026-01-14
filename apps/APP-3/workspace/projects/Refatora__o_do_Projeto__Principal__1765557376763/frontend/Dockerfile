
# Use a imagem base do Node para o build do frontend
FROM node:18-alpine AS builder

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos package.json e package-lock.json (se existirem)
COPY package*.json ./

# Instala as dependências do frontend
RUN npm install

# Copia o código fonte da aplicação para o container
COPY . .

# Constrói a aplicação React para produção
RUN npm run build

# Imagem final de produção, leve e segura
FROM nginx:alpine

# Copia os arquivos de build do React para o diretório de serviço do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Expõe a porta que o Nginx irá escutar (porta padrão 80)
EXPOSE 80

# Comando para iniciar o servidor web Nginx
CMD ["nginx", "-g", "daemon off;"]
