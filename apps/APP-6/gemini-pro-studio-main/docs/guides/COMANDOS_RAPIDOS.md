# ⚡ COMANDOS RÁPIDOS

## 🚀 INICIAR SISTEMA

### Backend
```bash
cd gemini-pro-studio-main/backend
node server.js
```

### Frontend
```bash
cd gemini-pro-studio-main
npm run dev
```

---

## 🧪 TESTAR ENDPOINTS

### Wikipedia (sempre funciona)
```bash
curl -X POST http://localhost:3002/api/search/wikipedia \
  -H "Content-Type: application/json" \
  -d '{"query":"Python"}'
```

### Startpage
```bash
curl -X POST http://localhost:3002/api/browser/search-startpage \
  -H "Content-Type: application/json" \
  -d '{"query":"Python"}'
```

### Bing
```bash
curl -X POST http://localhost:3002/api/browser/search-bing \
  -H "Content-Type: application/json" \
  -d '{"query":"Python"}'
```

### Busca Inteligente (todas as fontes)
```bash
curl -X POST http://localhost:3002/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"Python"}'
```

---

## 🔍 VERIFICAR SISTEMA

### Verificar se DuckDuckGo foi removido
```bash
cd gemini-pro-studio-main
grep -r "duckduckgo" src/
grep -r "DuckDuckGo" src/
```
**Resultado esperado:** Nenhuma referência encontrada

### Verificar arquivos criados
```bash
ls -la src/services/intelligentSearchService.ts
ls -la SISTEMA_BUSCA_INTELIGENTE.md
ls -la TESTE_SISTEMA_BUSCA.md
```

### Verificar backend rodando
```bash
curl http://localhost:3002/health
```

---

## 🛠️ INSTALAÇÃO

### Instalar dependências
```bash
cd gemini-pro-studio-main
npm install
```

### Instalar Playwright
```bash
npx playwright install chromium
```

### Verificar instalação
```bash
npx playwright --version
```

---

## 📊 MONITORAMENTO

### Ver logs do backend
```bash
cd gemini-pro-studio-main/backend
node server.js
# Logs aparecem no console
```

### Ver logs do frontend
```
Abra o navegador
Pressione F12
Vá para a aba Console
```

### Estatísticas do navegador
```bash
curl http://localhost:3002/api/browser/stats
```

---

## 🧹 LIMPEZA

### Limpar cache do navegador
```bash
curl -X POST http://localhost:3002/api/products/cache/clear
```

### Fechar todas as sessões
```bash
# Reiniciar o backend
# Ctrl+C no terminal do backend
# node server.js
```

---

## 🐛 TROUBLESHOOTING

### Backend não inicia
```bash
# Verificar porta 3002
netstat -ano | findstr :3002

# Matar processo se necessário
taskkill /PID <PID> /F

# Reiniciar
node server.js
```

### Frontend não inicia
```bash
# Limpar cache
npm cache clean --force

# Reinstalar
rm -rf node_modules
npm install

# Iniciar
npm run dev
```

### Playwright não funciona
```bash
# Reinstalar
npx playwright install chromium --force

# Verificar
npx playwright --version
```

---

## 📝 TESTES RÁPIDOS

### Teste 1: Wikipedia
```bash
curl -X POST http://localhost:3002/api/search/wikipedia \
  -H "Content-Type: application/json" \
  -d '{"query":"Python"}' | jq
```

### Teste 2: Busca Inteligente
```bash
curl -X POST http://localhost:3002/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"Como aprender Python"}' | jq
```

### Teste 3: Health Check
```bash
curl http://localhost:3002/health | jq
```

---

## 🔧 CONFIGURAÇÃO

### Configurar API Key do Gemini
```bash
# Editar .env
cd gemini-pro-studio-main
nano .env

# Adicionar:
GEMINI_API_KEY=sua_api_key_aqui
VITE_GEMINI_API_KEY=sua_api_key_aqui
```

### Configurar porta do backend
```bash
# Editar .env
PORT=3002
```

### Configurar timeout do Playwright
```javascript
// backend/services/browserService.js
// Linha ~150
timeout: 30000  // Alterar para 60000 se necessário
```

---

## 📚 DOCUMENTAÇÃO

### Abrir documentação
```bash
# Windows
start COMECE_AQUI_BUSCA.md

# Linux/Mac
xdg-open COMECE_AQUI_BUSCA.md
```

### Listar toda documentação
```bash
ls -la *.md
```

---

## 🎯 ATALHOS ÚTEIS

### Iniciar tudo de uma vez (Windows)
```bash
# Criar arquivo start.bat
@echo off
start cmd /k "cd backend && node server.js"
start cmd /k "npm run dev"
```

### Iniciar tudo de uma vez (Linux/Mac)
```bash
# Criar arquivo start.sh
#!/bin/bash
cd backend && node server.js &
npm run dev &
```

### Parar tudo
```bash
# Windows
taskkill /F /IM node.exe

# Linux/Mac
pkill -f node
```

---

## 🚀 DEPLOY

### Build para produção
```bash
npm run build
```

### Testar build
```bash
npm run preview
```

### Deploy no Vercel
```bash
vercel deploy
```

---

## 📊 MÉTRICAS

### Ver estatísticas dos agentes
```bash
curl http://localhost:3002/api/navigator/stats | jq
```

### Ver estatísticas do navegador
```bash
curl http://localhost:3002/api/browser/stats | jq
```

### Ver estatísticas de cache
```bash
curl http://localhost:3002/api/products/cache/stats | jq
```

---

## 🎉 COMANDOS MAIS USADOS

```bash
# 1. Iniciar backend
cd backend && node server.js

# 2. Iniciar frontend
npm run dev

# 3. Testar busca
curl -X POST http://localhost:3002/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"Python"}'

# 4. Ver logs
# (no console do backend)

# 5. Verificar saúde
curl http://localhost:3002/health
```

---

**💡 Dica:** Salve este arquivo para referência rápida!
