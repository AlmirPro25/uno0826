# 🖥️ Como Usar o Navegador Remoto

## ✅ Teste Concluído com Sucesso!

O backend está funcionando perfeitamente! Agora vamos integrar no frontend.

---

## 🚀 Passo a Passo

### 1. Iniciar o Backend

```bash
cd backend
npm start
```

O servidor vai iniciar na porta **3002** com Socket.IO ativo.

---

### 2. Adicionar o Componente no App

**Opção A: Modo Navegação no Chat**

Edite `gemini-pro-studio-main/src/App.tsx`:

```tsx
import { RemoteBrowserCanvas } from './components/RemoteBrowserCanvas';
import { useState } from 'react';

function App() {
  const [showBrowser, setShowBrowser] = useState(false);

  return (
    <div className="app">
      {/* Botão para abrir navegador */}
      <button onClick={() => setShowBrowser(true)}>
        🌐 Abrir Navegador
      </button>

      {/* Navegador Remoto */}
      {showBrowser && (
        <div className="fixed inset-0 z-50 bg-black/80">
          <RemoteBrowserCanvas
            url="https://www.google.com"
            onClose={() => setShowBrowser(false)}
          />
        </div>
      )}
    </div>
  );
}
```

**Opção B: Integrar no ChatView**

Edite `gemini-pro-studio-main/src/components/ChatView.tsx`:

```tsx
import { RemoteBrowserCanvas } from './RemoteBrowserCanvas';

// Adicionar no render:
{isBrowserMode && (
  <div className="browser-panel h-full">
    <RemoteBrowserCanvas
      url="https://www.google.com"
      onUrlChange={(url) => console.log('URL:', url)}
    />
  </div>
)}
```

---

### 3. Testar

1. Inicie o backend: `npm start` (na pasta backend)
2. Inicie o frontend: `npm run dev` (na pasta raiz)
3. Abra http://localhost:3000
4. Clique no botão "Abrir Navegador"
5. Você verá o Canvas com o Google carregando
6. Clique e digite no Canvas!

---

## 🎯 Exemplo Completo

Crie um arquivo `gemini-pro-studio-main/src/pages/BrowserPage.tsx`:

```tsx
import React from 'react';
import { RemoteBrowserCanvas } from '../components/RemoteBrowserCanvas';

export const BrowserPage: React.FC = () => {
  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      {/* Header */}
      <div className="p-4 bg-bg-secondary border-b border-border-color">
        <h1 className="text-2xl font-bold text-text-primary">
          🌐 Navegador Remoto
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Navegue na web através do Playwright
        </p>
      </div>

      {/* Browser Canvas */}
      <div className="flex-1">
        <RemoteBrowserCanvas
          url="https://www.google.com"
          onUrlChange={(url) => {
            console.log('Navegou para:', url);
          }}
        />
      </div>
    </div>
  );
};
```

Depois adicione a rota no seu App:

```tsx
import { BrowserPage } from './pages/BrowserPage';

// No router:
<Route path="/browser" element={<BrowserPage />} />
```

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to backend"

**Solução:** Verifique se o backend está rodando na porta 3002:

```bash
cd backend
npm start
```

### Erro: "Session not found"

**Solução:** O Socket.IO desconectou. Recarregue a página.

### Canvas não atualiza

**Solução:** Verifique o console do navegador. Pode ser problema de CORS.

Adicione no `backend/server.js`:

```javascript
const io = new Server(server, {
  cors: {
    origin: '*', // Permitir todas as origens (desenvolvimento)
    methods: ['GET', 'POST']
  }
});
```

### Performance ruim

**Solução:** Ajuste o FPS no componente:

```tsx
<RemoteBrowserCanvas
  url="https://www.google.com"
  fps={15} // Aumentar para 15 FPS
/>
```

E no backend, edite `remoteBrowserService.js`:

```javascript
startStreaming(sessionId, socket, fps = 15) // Aumentar padrão
```

---

## 📊 Configurações Avançadas

### Mudar Resolução

```tsx
<RemoteBrowserCanvas
  url="https://www.google.com"
  viewport={{ width: 1920, height: 1080 }}
/>
```

### Headless vs Headful

No backend (`remoteBrowserService.js`):

```javascript
const browser = await chromium.launch({
  headless: false, // Mostrar navegador (debug)
  // headless: true, // Esconder navegador (produção)
});
```

### Qualidade JPEG

```javascript
const screenshot = await session.page.screenshot({
  type: 'jpeg',
  quality: 80, // Aumentar qualidade (40-100)
  fullPage: false
});
```

---

## 🎉 Pronto!

Agora você tem um **navegador remoto completo** funcionando! 🚀

O Playwright executa no backend e você controla tudo pelo Canvas no frontend.

**Próximos passos:**
1. Integrar com o sistema de busca
2. Adicionar botões de voltar/avançar
3. Implementar multi-tab
4. Adicionar histórico de navegação

---

**Documento criado em:** 30/10/2025
**Status:** ✅ Testado e Funcionando
