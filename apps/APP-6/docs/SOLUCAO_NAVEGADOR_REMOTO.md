# 🔧 Solução: Navegador Remoto Desconectado

## Problema
O navegador remoto mostra "Desconectado" e não consegue conectar com o Playwright.

## Solução Rápida (5 minutos)

### Passo 1: Verificar se o backend está rodando

Abra um terminal e execute:

```bash
cd backend
npm start
```

Você deve ver:
```
╔════════════════════════════════════════════════════════╗
║  🤖 PROX AI STUDIO - BACKEND LIMPO                    ║
╠════════════════════════════════════════════════════════╣
║  Status: ✅ Running                                    ║
║  Port: 3002                                            ║
╚════════════════════════════════════════════════════════╝
```

### Passo 2: Verificar se Playwright está instalado

No mesmo terminal:

```bash
npm list playwright
```

Se não estiver instalado:

```bash
npm install playwright
npx playwright install chromium
```

### Passo 3: Testar o navegador remoto

Execute o script de teste:

```bash
node test-navegador-remoto.js
```

Você deve ver:
```
✅ Sessão criada
✅ Navegação
✅ Socket.IO conectado
🎉 Todos os testes passaram!
```

### Passo 4: Testar no frontend

1. Abra o aplicativo no navegador
2. Vá para o modo de navegação
3. Verifique se mostra "Conectado" (bolinha verde)
4. Digite uma URL e pressione Enter
5. Você deve ver a página carregando no canvas

## Se ainda não funcionar

### Problema: "Playwright not found"

**Solução:**
```bash
cd backend
npm install playwright
npx playwright install chromium
```

### Problema: "Port 3002 already in use"

**Solução Windows:**
```bash
netstat -ano | findstr :3002
taskkill /PID <PID> /F
```

**Solução Linux/Mac:**
```bash
lsof -ti:3002 | xargs kill -9
```

### Problema: "WebSocket connection failed"

**Causas possíveis:**
1. Backend não está rodando
2. Firewall bloqueando porta 3002
3. CORS não configurado

**Solução:**
1. Verificar se backend está rodando: `npm start`
2. Permitir porta 3002 no firewall
3. Verificar CORS em `backend/server.js`:
   ```javascript
   const io = new Server(server, {
     cors: {
       origin: 'http://localhost:3000',
       methods: ['GET', 'POST']
     }
   });
   ```

### Problema: Canvas fica preto

**Causas possíveis:**
1. Frames não estão sendo enviados
2. Formato de imagem incorreto
3. Canvas não está renderizando

**Solução:**
1. Verificar logs do backend para "📹 Iniciando streaming"
2. Verificar console do frontend para "📸 Frame recebido"
3. Verificar se FPS > 0 no frontend

### Problema: Cliques não funcionam

**Causas possíveis:**
1. Coordenadas incorretas
2. Página não carregou completamente
3. Elemento não é clicável

**Solução:**
1. Aguardar página carregar completamente
2. Verificar se URL está correta
3. Tentar clicar em áreas diferentes

## Verificação Final

Execute este checklist:

- [ ] Backend rodando na porta 3002
- [ ] Playwright instalado (`npm list playwright`)
- [ ] Chromium instalado (`npx playwright install chromium`)
- [ ] Frontend conectado (bolinha verde)
- [ ] FPS > 0 no frontend
- [ ] Canvas mostra conteúdo
- [ ] Cliques funcionam
- [ ] Navegação funciona

## Logs Importantes

### Backend (Terminal)
```
✅ Deve aparecer:
🖥️ Criando sessão remota: remote_xxx
📹 Iniciando streaming: remote_xxx (10 fps)
🌐 Navegando para: https://www.google.com

❌ Não deve aparecer:
Error: Playwright not found
Error: Port 3002 already in use
Error: Cannot find module 'playwright'
```

### Frontend (Console do Navegador)
```
✅ Deve aparecer:
🔌 Conectado ao backend
✅ Sessão criada: {sessionId: "...", viewport: {...}}
📸 Frame recebido (múltiplas vezes)

❌ Não deve aparecer:
WebSocket connection failed
Error: Session not found
Timeout waiting for connection
```

## Arquivos para Verificar

1. **backend/server.js** (linha 1060-1130)
   - Eventos Socket.IO configurados
   - remoteBrowserService importado

2. **backend/services/remoteBrowserService.js**
   - Playwright importado
   - Métodos createSession, startStreaming implementados

3. **src/components/RemoteBrowserCanvas.tsx**
   - Socket.IO conectando em localhost:3002
   - Eventos browser:frame, browser:metadata configurados

## Comandos Úteis

```bash
# Verificar se porta 3002 está em uso
netstat -ano | findstr :3002

# Matar processo na porta 3002
taskkill /PID <PID> /F

# Reinstalar dependências
cd backend
rm -rf node_modules package-lock.json
npm install

# Reinstalar Playwright
npx playwright install --force

# Testar navegador remoto
node test-navegador-remoto.js

# Ver logs do backend em tempo real
npm start

# Verificar versão do Playwright
npx playwright --version
```

## Suporte

Se o problema persistir após seguir todos os passos:

1. Verifique os logs completos do backend e frontend
2. Execute `node test-navegador-remoto.js` e compartilhe o resultado
3. Verifique se há erros no console do navegador (F12)
4. Verifique se o firewall está bloqueando a porta 3002

## Próximos Passos

Após resolver o problema de conexão:

1. Testar navegação em diferentes sites
2. Testar interação (cliques, digitação)
3. Ajustar FPS para melhor performance
4. Configurar headless mode para produção
