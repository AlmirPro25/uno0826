# 🔧 Troubleshooting - Agentes de Navegação

## 🚨 Erro: 404 (Not Found)

### Sintomas
```
Failed to load resource: the server responded with a status of 404
/api/navigator/process:1
```

### Causa
Backend não foi reiniciado após adicionar as rotas.

### Solução
```bash
# 1. Parar backend (Ctrl+C)
# 2. Reiniciar
cd backend
npm start

# 3. Verificar console
# Deve mostrar: "🤖 Navigator Agents inicializados"
```

### Teste
```bash
node backend/test-agentes.js
```

---

## 🚨 Erro: "Agentes não disponíveis"

### Sintomas
```json
{
  "error": "Agentes de navegação não disponíveis - API Key não configurada"
}
```

### Causa
GEMINI_API_KEY não está configurada.

### Solução
```bash
# Criar/editar .env na raiz do projeto
echo "GEMINI_API_KEY=sua_chave_aqui" >> .env
echo "VITE_GEMINI_API_KEY=sua_chave_aqui" >> .env

# Reiniciar backend
cd backend
npm start
```

---

## 🚨 Erro: "Cannot find module"

### Sintomas
```
Error: Cannot find module '@google/generative-ai'
```

### Causa
Dependência não instalada.

### Solução
```bash
cd backend
npm install @google/generative-ai
npm start
```

---

## 🚨 Erro: "browserService is not defined"

### Sintomas
```
ReferenceError: browserService is not defined
```

### Causa
Arquivo `browserService.js` não existe ou não está exportado.

### Solução
```bash
# Verificar se existe
ls backend/services/browserService.js

# Se não existir, restaurar do backup ou repositório
```

---

## 🚨 Erro: "Port already in use"

### Sintomas
```
Error: listen EADDRINUSE: address already in use :::3002
```

### Causa
Outra instância do backend está rodando.

### Solução Windows
```bash
# Encontrar processo
netstat -ano | findstr :3002

# Matar processo (substitua <PID>)
taskkill /PID <PID> /F

# Ou mudar porta no .env
echo "PORT=3003" >> .env
```

---

## 🚨 Erro: "Todos os agentes atingiram o limite"

### Sintomas
```
Error: Todos os agentes atingiram o limite de requisições
```

### Causa
Muitas requisições em pouco tempo.

### Solução
```bash
# Aguardar 1 minuto para reset da quota por minuto
# Ou verificar quotas
curl http://localhost:3002/api/navigator/stats

# Resetar estatísticas (apenas para desenvolvimento)
curl -X POST http://localhost:3002/api/navigator/stats/reset
```

---

## 🚨 Erro: "Playwright not installed"

### Sintomas
```
Error: Executable doesn't exist at ...
```

### Causa
Playwright não está instalado.

### Solução
```bash
cd backend
npm install playwright
npx playwright install chromium
```

---

## 🚨 Erro: "Unexpected token '<'"

### Sintomas
```
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

### Causa
Servidor retornando HTML (página 404) em vez de JSON.

### Solução
1. Verificar se backend está rodando
2. Verificar se a URL está correta
3. Reiniciar backend
4. Limpar cache do navegador (Ctrl+Shift+R)

---

## 🚨 Erro: "CORS policy"

### Sintomas
```
Access to fetch at 'http://localhost:3002/api/navigator/process' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

### Causa
CORS não configurado corretamente.

### Solução
Verificar no `server.js`:
```javascript
app.use(cors({ 
  origin: 'http://localhost:3000', 
  credentials: true 
}));
```

---

## 🚨 Erro: "Storage limit exceeded"

### Sintomas
```
Storage limit exceeded for key "proxChatHistory"
```

### Causa
localStorage cheio (muitas conversas salvas).

### Solução
```javascript
// No console do navegador (F12)
localStorage.clear();
location.reload();
```

Ou limpar apenas o histórico:
```javascript
localStorage.removeItem('proxChatHistory');
location.reload();
```

---

## 📊 Comandos de Diagnóstico

### Verificar Backend
```bash
# Health check
curl http://localhost:3002/health

# Estatísticas dos agentes
curl http://localhost:3002/api/navigator/stats

# Estatísticas do navegador
curl http://localhost:3002/api/browser/stats
```

### Testar Endpoint
```bash
# Teste completo
node backend/test-agentes.js

# Teste manual
curl -X POST http://localhost:3002/api/navigator/plan \
  -H "Content-Type: application/json" \
  -d "{\"userIntent\":\"teste\"}"
```

### Verificar Processos
```bash
# Windows
netstat -ano | findstr :3002

# Ver logs do backend
# (no terminal onde está rodando)
```

---

## 🔍 Checklist de Diagnóstico

Quando algo não funcionar, verifique na ordem:

- [ ] Backend está rodando? (`curl http://localhost:3002/health`)
- [ ] Console do backend mostra "Navigator Agents inicializados"?
- [ ] GEMINI_API_KEY está no .env?
- [ ] Dependências instaladas? (`npm install`)
- [ ] Playwright instalado? (`npx playwright install chromium`)
- [ ] Porta 3002 está livre?
- [ ] Frontend está apontando para URL correta?
- [ ] Cache do navegador limpo? (Ctrl+Shift+R)
- [ ] Console do navegador mostra erros? (F12)

---

## 🎯 Teste Rápido

Execute este comando para testar tudo:

```bash
# 1. Verificar backend
curl http://localhost:3002/health

# 2. Testar agentes
node backend/test-agentes.js

# 3. Se tudo OK, testar no frontend
# Abrir http://localhost:3000
# Ativar Modo Navegação
# Digitar: "Busque por Python no Google"
```

---

## 💡 Dicas de Prevenção

### 1. Use nodemon para auto-restart
```bash
npm install -g nodemon
nodemon backend/server.js
```

### 2. Configure logs detalhados
```javascript
// No server.js
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

### 3. Monitore quotas
```bash
# Verificar a cada 5 minutos
watch -n 300 'curl -s http://localhost:3002/api/navigator/stats'
```

### 4. Backup do .env
```bash
cp .env .env.backup
```

---

## 📞 Ainda com Problemas?

1. Verificar logs do backend (terminal)
2. Verificar console do navegador (F12)
3. Executar `node backend/test-agentes.js`
4. Verificar documentação: `AGENTES_NAVEGACAO_INTELIGENTE.md`
5. Verificar guia de teste: `TESTE_AGENTES_NAVEGACAO.md`

---

**Última atualização**: 2025-01-XX
