# 🖥️ Aether Local Mode - PowerShell Real

Este modo permite que o agente execute comandos PowerShell reais no seu sistema, em vez de usar o WebContainer sandbox.

## ⚠️ Aviso de Segurança

O modo local dá ao agente acesso real ao seu sistema de arquivos e terminal. Use com cuidado!

## 🚀 Como Usar

### Opção 1: Script Automático (Recomendado)

```powershell
# Execute na raiz do projeto
.\start-local.ps1
```

Isso vai:
1. Instalar dependências do servidor backend
2. Instalar dependências do frontend
3. Iniciar o servidor backend (porta 3001)
4. Iniciar o frontend em modo local (porta 5173)
5. Abrir o navegador automaticamente

### Opção 2: Manual

**Terminal 1 - Backend:**
```powershell
cd server
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
$env:VITE_LOCAL_MODE="true"
npm run dev
```

## 📁 Estrutura

```
├── server/                 # Backend Node.js
│   ├── index.ts           # Servidor Express + Socket.IO
│   ├── package.json
│   └── tsconfig.json
├── workspace/             # Diretório de trabalho do agente
├── services/
│   ├── localRuntime.ts    # Cliente para o backend local
│   ├── runtime.ts         # Abstração WebContainer/Local
│   └── webcontainer.ts    # Runtime original (sandbox)
├── hooks/
│   └── useRuntime.ts      # Hook React para usar o runtime
└── components/
    └── LocalPreview.tsx   # Preview do servidor local
```

## 🔌 API do Backend

### File System

- `POST /api/fs/read` - Ler arquivo
- `POST /api/fs/write` - Escrever arquivo
- `POST /api/fs/delete` - Deletar arquivo
- `POST /api/fs/rename` - Renomear arquivo
- `POST /api/fs/list` - Listar diretório
- `POST /api/fs/exists` - Verificar existência

### Execução

- `POST /api/exec` - Executar comando PowerShell

### Dev Server

- `POST /api/server/start` - Iniciar servidor de desenvolvimento
- `POST /api/server/stop` - Parar servidor
- `GET /api/server/status` - Status do servidor

### WebSocket

- `shell:start` - Iniciar shell interativo
- `shell:input` - Enviar input para o shell
- `shell:output` - Receber output do shell
- `shell:resize` - Redimensionar terminal

## 🔄 Alternando entre Modos

O modo é detectado automaticamente pela variável `VITE_LOCAL_MODE`:

```typescript
// Em qualquer componente
const isLocal = window.__AETHER_LOCAL_MODE__;

// Ou usando o hook
import { useRuntime } from './hooks/useRuntime';

function MyComponent() {
  const { isLocalMode, boot, exec } = useRuntime();
  
  // Funciona igual nos dois modos!
  await boot();
  const result = await exec('npm', ['install']);
}
```

## 🎯 Diferenças do WebContainer

| Feature | WebContainer | Local Mode |
|---------|-------------|------------|
| Shell | jsh (limitado) | PowerShell real |
| File System | Virtual | Sistema real |
| Packages | npm (sandbox) | npm real |
| Segurança | Isolado | Acesso total |
| Performance | Mais lento | Nativo |
| Git | Limitado | Completo |

## 🐛 Troubleshooting

### "Connection refused"
O servidor backend não está rodando. Execute:
```powershell
cd server && npm run dev
```

### "CORS error"
Verifique se o backend está na porta 3001 e o frontend na 5173.

### Preview não carrega
O servidor de desenvolvimento do projeto pode não ter iniciado. Verifique o terminal.
