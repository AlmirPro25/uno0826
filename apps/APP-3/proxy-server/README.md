# 🔒 AI Web Weaver - Secure Proxy Server

Servidor proxy seguro para intermediar comunicação entre o frontend e a API do Google Gemini.

## 🎯 Propósito

Este servidor resolve problemas críticos de segurança:

- ✅ **API Keys protegidas**: Nunca expostas no frontend
- ✅ **Rate limiting**: Proteção contra abuso
- ✅ **Validação de entrada**: Previne ataques
- ✅ **Logs auditáveis**: Rastreabilidade completa
- ✅ **CORS configurado**: Segurança de origem

## 🚀 Quick Start

### 1. Instalação

```bash
cd proxy-server
npm install
```

### 2. Configuração

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar .env e adicionar sua GEMINI_API_KEY
nano .env
```

### 3. Desenvolvimento

```bash
# Modo desenvolvimento (hot reload)
npm run dev
```

### 4. Produção

```bash
# Build
npm run build

# Start
npm start
```

## 📡 Endpoints

### GET /health

Health check do servidor.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-18T12:00:00.000Z",
  "uptime": 123.45,
  "environment": "development"
}
```

### POST /api/generate

Gera resposta usando Google Gemini.

**Request:**
```json
{
  "prompt": "Crie um dashboard de vendas",
  "modelName": "gemini-2.0-flash-exp",
  "history": [],
  "temperature": 0.7,
  "maxOutputTokens": 8192
}
```

**Response (Success):**
```json
{
  "success": true,
  "text": "<!DOCTYPE html>...",
  "usage": {
    "promptTokens": 0,
    "completionTokens": 0,
    "totalTokens": 0
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Descrição do erro"
}
```

## 🧪 Testes

```bash
# Rodar todos os testes
npm test

# Modo watch
npm run test:watch

# Com coverage
npm test -- --coverage
```

## 🔧 Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `GEMINI_API_KEY` | API Key do Google Gemini | **Obrigatório** |
| `PORT` | Porta do servidor | `3000` |
| `NODE_ENV` | Ambiente (development/production) | `development` |
| `ALLOWED_ORIGINS` | Origens CORS permitidas | `http://localhost:5173` |
| `RATE_LIMIT_MAX` | Máximo de requisições | `100` |
| `RATE_LIMIT_WINDOW_MS` | Janela de tempo (minutos) | `15` |

## 🛡️ Segurança

### Rate Limiting

- **Padrão**: 100 requisições por 15 minutos por IP
- **Configurável**: Via variáveis de ambiente
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

### CORS

- **Origens permitidas**: Configurável via `ALLOWED_ORIGINS`
- **Métodos**: GET, POST, OPTIONS
- **Credentials**: Habilitado

### Helmet

Headers de segurança automáticos:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

### Validação

- Prompt obrigatório e não vazio
- Limite de 1MB por prompt
- Validação de tipos

## 📊 Logs

### Desenvolvimento
```
GET /health 200 2.345 ms - 123
POST /api/generate 200 1234.567 ms - 5678
```

### Produção
```
::1 - - [18/Jan/2025:12:00:00 +0000] "POST /api/generate HTTP/1.1" 200 5678
```

## 🚀 Deploy

### Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Railway

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Deploy
railway up
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

## 🔍 Troubleshooting

### Erro: "GEMINI_API_KEY não está configurada"

**Solução**: Copie `.env.example` para `.env` e adicione sua API Key.

### Erro: "Origem não permitida pelo CORS"

**Solução**: Adicione a origem em `ALLOWED_ORIGINS` no `.env`.

### Erro: "Muitas requisições"

**Solução**: Aguarde 15 minutos ou aumente `RATE_LIMIT_MAX`.

## 📚 Documentação Adicional

- [Google Gemini API](https://ai.google.dev/)
- [Express.js](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)

## 📝 Licença

MIT
