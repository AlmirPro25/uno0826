# ⚡ Início Rápido - Navegação Web

## 🚀 3 Passos para Começar

### 1️⃣ Instalar (2 minutos)

```bash
cd executor
INSTALAR_NAVEGACAO_WEB.bat
```

Aguarde:
- ✅ Playwright instalado
- ✅ Chromium baixado (~300MB)
- ✅ Testes executados

### 2️⃣ Iniciar Sistema (3 terminais)

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Executor
cd executor
python executor.py

# Terminal 3: Frontend
npm run dev
```

### 3️⃣ Usar (escolha uma opção)

#### Opção A: Interface React (Recomendado)

Adicione ao seu `App.tsx`:

```tsx
import { BrowserControlWebSocket } from './components/BrowserControlWebSocket';

function App() {
  return (
    <div>
      <BrowserControlWebSocket />
    </div>
  );
}
```

Abra http://localhost:5173 e clique em "Abrir Navegador"!

#### Opção B: Via Código (WebSocket)

```tsx
import { useBrowserWebSocket } from './hooks/useBrowserWebSocket';

function MyComponent() {
  const { sendCommand } = useBrowserWebSocket();
  
  const search = async () => {
    await sendCommand({ action: 'browser_open' });
    await sendCommand({ action: 'browser_goto', params: { url: 'google.com' }});
    await sendCommand({ action: 'browser_type', params: { 
      selector: 'textarea[name="q"]', 
      text: 'Python Playwright' 
    }});
    await sendCommand({ action: 'browser_press', params: { key: 'Enter' }});
  };
  
  return <button onClick={search}>Pesquisar</button>;
}
```

#### Opção C: Via API REST

```javascript
// Comando simples
await fetch('http://localhost:3001/api/browser/open', { method: 'POST' });
await fetch('http://localhost:3001/api/browser/navigate', {
  method: 'POST',
  body: JSON.stringify({ url: 'google.com' })
});

// Comando inteligente (com IA)
await fetch('http://localhost:3001/api/tasks/execute', {
  method: 'POST',
  body: JSON.stringify({
    command: 'Abra o Chrome e pesquise Python tutorial'
  })
});
```

---

## 🎯 Exemplos Rápidos

### Pesquisar no Google

```tsx
const { sendCommand } = useBrowserWebSocket();

await sendCommand({ action: 'browser_open' });
await sendCommand({ action: 'browser_goto', params: { url: 'google.com' }});
await sendCommand({ action: 'browser_type', params: { 
  selector: 'textarea[name="q"]', 
  text: 'Python Playwright' 
}});
await sendCommand({ action: 'browser_press', params: { key: 'Enter' }});
```

### Capturar Screenshot

```tsx
await sendCommand({ action: 'browser_screenshot', params: { 
  filename: 'pagina.png',
  full_page: true 
}});
```

### Preencher Formulário

```tsx
await sendCommand({ action: 'browser_fill_form', params: {
  data: {
    '#name': 'João Silva',
    '#email': 'joao@email.com'
  }
}});
```

---

## 📚 Documentação Completa

- **`GUIA_NAVEGACAO_WEB.md`** - Guia completo
- **`CONTROLE_NAVEGADOR_WEBSOCKET.md`** - REST vs WebSocket
- **`executor/EXEMPLOS_NAVEGACAO.md`** - 10+ exemplos

---

## ⚠️ Troubleshooting

### Playwright não instalado?
```bash
pip install playwright
playwright install chromium
```

### Executor não conecta?
```bash
cd executor
python executor.py
# Verifique se aparece: "✅ Conectado ao Maestro!"
```

### WebSocket desconectado?
- Certifique-se de que o Executor está rodando
- Verifique a porta: `ws://localhost:8081`

---

**Pronto! Comece a automatizar!** 🎉
