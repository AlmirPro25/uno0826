# 🌐 Guia Completo: Navegador Remoto com Playwright

## Visão Geral

O sistema de navegação remota permite controlar um navegador Playwright em tempo real através de um canvas interativo no frontend. O usuário pode ver, clicar e digitar como se estivesse usando um navegador normal.

## Arquitetura

```
┌─────────────────┐         WebSocket          ┌─────────────────┐
│                 │ ◄─────────────────────────► │                 │
│   Frontend      │   Socket.IO (porta 3002)    │    Backend      │
│   (React)       │                             │   (Node.js)     │
│                 │                             │                 │
│  Canvas         │  ← Frames (JPEG)            │  Playwright     │
│  Interativo     │  → Input (mouse/keyboard)   │  Chromium       │
│                 │                             │                 │
└─────────────────┘                             └─────────────────┘
```

## Componentes

### Frontend

**RemoteBrowserCanvas.tsx**
- Conecta via Socket.IO
- Renderiza frames no canvas
- Captura input do usuário
- Converte coordenadas

**Eventos enviados:**
- `browser:create` - Criar sessão
- `browser:input` - Enviar input
- `browser:navigate` - Navegar para URL

**Eventos recebidos:**
- `browser:frame` - Frame (screenshot JPEG)
- `browser:metadata` - URL, título, viewport

### Backend

**remoteBrowserService.js**
- Gerencia sessões Playwright
- Captura frames (10 FPS)
- Processa input do usuário
- Controla navegação

**server.js**
- Configura Socket.IO
- Roteia eventos
- Gerencia conexões

## Instalação

### Passo 1: Instalar dependências

```bash
cd backend
npm install
```

### Passo 2: Instalar Playwright

```bash
npm install playwright
npx playwright install chromium
```

### Passo 3: Verificar instalação

```bash
node verificar-sistema.js
```

Você deve ver:
```
✅ Node.js          Versão v18.x.x
✅ NPM              Versão 9.x.x
✅ Playwright       Versão 1.x.x
✅ Chromium         Instalado
✅ Porta 3002       Porta livre
✅ Arquivos         Todos presentes
✅ Dependências     Todas instaladas
```

## Uso

### Iniciar o servidor

```bash
cd backend
npm start
```

### Testar navegador remoto

```bash
node test-navegador-remoto.js
```

### Usar no frontend

1. Abra o aplicativo
2. Vá para o modo de navegação
3. Verifique se mostra "Conectado" (bolinha verde)
4. Digite uma URL e pressione Enter
5. Interaja com a página (clique, digite, role)

## Fluxo de Dados

### 1. Criar Sessão

```javascript
// Frontend
socket.emit('browser:create', {
  url: 'https://www.google.com',
  viewport: { width: 1366, height: 768 },
  fps: 10
}, (response) => {
  console.log('Sessão criada:', response);
});

// Backend
remoteBrowserService.createSession(sessionId, options)
  → Lança Playwright
  → Cria página
  → Navega para URL
  → Retorna sessionId
```

### 2. Streaming de Frames

```javascript
// Backend (loop a cada 100ms para 10 FPS)
setInterval(() => {
  page.screenshot({ type: 'jpeg', quality: 60 })
    → Captura screenshot
    → Converte para JPEG
    → Envia via Socket.IO
}, 100);

// Frontend
socket.on('browser:frame', (data) => {
  createImageBitmap(data)
    → Desenha no canvas
    → Atualiza FPS
});
```

### 3. Processar Input

```javascript
// Frontend
canvas.onClick = (e) => {
  const coords = toViewportCoords(e.clientX, e.clientY);
  socket.emit('browser:input', {
    inputType: 'mouse',
    event: 'click',
    x: coords.x,
    y: coords.y
  });
};

// Backend
remoteBrowserService.handleInput(sessionId, inputEvent)
  → page.mouse.click(x, y)
  → Atualiza metadados
```

## Performance

### FPS (Frames Por Segundo)

- **10 FPS**: Padrão, bom equilíbrio
- **5 FPS**: Economia de banda
- **20 FPS**: Mais fluido, mais banda

### Qualidade JPEG

- **60%**: Padrão, bom equilíbrio
- **40%**: Menor qualidade, menor banda
- **80%**: Melhor qualidade, mais banda

### Viewport

- **1366x768**: Padrão, laptop comum
- **1920x1080**: Full HD, mais detalhes
- **1280x720**: HD, menor banda

## Troubleshooting

### Problema: "Desconectado"

**Causa**: Backend não está rodando
**Solução**: `npm start`

### Problema: "Playwright not found"

**Causa**: Playwright não instalado
**Solução**: 
```bash
npm install playwright
npx playwright install chromium
```

### Problema: "Port 3002 already in use"

**Causa**: Porta ocupada
**Solução Windows**:
```bash
netstat -ano | findstr :3002
taskkill /PID <PID> /F
```

### Problema: Canvas fica preto

**Causa**: Frames não estão sendo enviados
**Solução**: 
1. Verificar logs do backend
2. Verificar se FPS > 0
3. Verificar console do navegador

### Problema: Cliques não funcionam

**Causa**: Coordenadas incorretas
**Solução**:
1. Aguardar página carregar
2. Verificar conversão de coordenadas
3. Testar em áreas diferentes

## Segurança

### Limitações

- Máximo 10 sessões simultâneas
- Timeout de 5 minutos de inatividade
- Headless mode em produção
- Rate limiting recomendado

### Recomendações

1. **Autenticação**: Adicionar autenticação Socket.IO
2. **Rate Limiting**: Limitar requisições por IP
3. **Whitelist**: Permitir apenas URLs confiáveis
4. **Timeout**: Fechar sessões inativas
5. **Logs**: Registrar todas as ações

## Otimizações

### Reduzir Banda

```javascript
// Reduzir FPS
fps: 5

// Reduzir qualidade
quality: 40

// Reduzir viewport
viewport: { width: 1280, height: 720 }
```

### Melhorar Performance

```javascript
// Usar headless
headless: true

// Desabilitar imagens
page.route('**/*.{png,jpg,jpeg,gif,svg}', route => route.abort())

// Desabilitar CSS
page.route('**/*.css', route => route.abort())
```

### Cache

```javascript
// Cache de screenshots
screenshotCache.set(key, {
  data: base64,
  expires: Date.now() + 5 * 60 * 1000
});
```

## Métricas

### Monitoramento

```javascript
// Obter estatísticas
const stats = remoteBrowserService.getStats();

console.log(stats);
// {
//   sessions: { active: 2, max: 10, total: 15 },
//   operations: { navigations: 45, screenshots: 1200 },
//   cache: { screenshots: 5 }
// }
```

### Logs

```
✅ Logs importantes:
🖥️ Criando sessão remota: remote_xxx
📹 Iniciando streaming: remote_xxx (10 fps)
🌐 Navegando para: https://www.google.com
🖱️ Clicando em: (x, y)

❌ Erros comuns:
Error: Playwright not found
Error: Port 3002 already in use
Error: Session not found
Timeout waiting for page load
```

## Exemplos

### Exemplo 1: Navegação Simples

```javascript
// Criar sessão
const sessionId = await remoteBrowserService.createSession('test', {
  url: 'https://www.google.com'
});

// Navegar
await remoteBrowserService.navigate(sessionId, 'https://www.wikipedia.org');

// Fechar
await remoteBrowserService.closeSession(sessionId);
```

### Exemplo 2: Interação

```javascript
// Clicar
await remoteBrowserService.handleInput(sessionId, {
  inputType: 'mouse',
  event: 'click',
  x: 500,
  y: 300
});

// Digitar
await remoteBrowserService.handleInput(sessionId, {
  inputType: 'keyboard',
  event: 'type',
  text: 'Hello World'
});
```

### Exemplo 3: Executar JavaScript

```javascript
const result = await remoteBrowserService.evaluate(sessionId, () => {
  return document.title;
});

console.log('Título:', result);
```

## Arquivos

```
backend/
├── services/
│   ├── remoteBrowserService.js    # Serviço principal
│   └── browserService.js          # Serviço auxiliar
├── server.js                      # Servidor Socket.IO
├── test-navegador-remoto.js       # Testes
└── verificar-sistema.js           # Verificador

src/
└── components/
    └── RemoteBrowserCanvas.tsx    # Componente React

docs/
├── DIAGNOSTICO_NAVEGADOR_REMOTO.md
├── SOLUCAO_NAVEGADOR_REMOTO.md
└── GUIA_COMPLETO_NAVEGADOR.md
```

## Próximos Passos

1. ✅ Verificar instalação: `node verificar-sistema.js`
2. ✅ Testar navegador: `node test-navegador-remoto.js`
3. ✅ Iniciar servidor: `npm start`
4. ✅ Testar no frontend
5. ✅ Configurar para produção

## Suporte

Se precisar de ajuda:

1. Execute `node verificar-sistema.js`
2. Execute `node test-navegador-remoto.js`
3. Verifique logs do backend e frontend
4. Consulte `DIAGNOSTICO_NAVEGADOR_REMOTO.md`
5. Consulte `SOLUCAO_NAVEGADOR_REMOTO.md`
