# 🚀 KIRO Professional Terminal - Arquitetura Completa

## Visão Geral

Sistema de terminal inteligente de nível profissional, inspirado em VS Code, Cursor e Kiro IDE.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │ ProfessionalTerminal│    │        ChatView                 │ │
│  │  - Múltiplas abas   │    │  - Chat com IA                  │ │
│  │  - Autocomplete     │◄──►│  - Editor de código             │ │
│  │  - Histórico        │    │  - File explorer                │ │
│  │  - Streaming        │    │                                 │ │
│  └─────────┬───────────┘    └─────────────┬───────────────────┘ │
│            │                              │                      │
│            └──────────────┬───────────────┘                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              KiroUnifiedAgent (Serviço)                     │ │
│  │  - Sessões de conversa                                      │ │
│  │  - Tool calling com Gemini                                  │ │
│  │  - Streaming de eventos                                     │ │
│  │  - Retry automático                                         │ │
│  │  - 20+ ferramentas                                          │ │
│  └─────────────────────────┬───────────────────────────────────┘ │
└────────────────────────────┼────────────────────────────────────┘
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express)                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │AdvancedTerminal     │    │     KiroTools Controller        │ │
│  │  - Execução segura  │    │  - grepSearch                   │ │
│  │  - Process Manager  │    │  - strReplace                   │ │
│  │  - Background procs │    │  - readMultiple                 │ │
│  │  - Output streaming │    │  - diagnostics                  │ │
│  └─────────────────────┘    └─────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   Process Manager                            │ │
│  │  - Gerencia processos em background                         │ │
│  │  - Buffer de output (1000 linhas)                           │ │
│  │  - Cleanup automático                                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Ferramentas Disponíveis (20+)

### Leitura
- `readFile` - Lê arquivo com suporte a range de linhas
- `readMultipleFiles` - Lê múltiplos arquivos de uma vez

### Escrita
- `writeFile` - Cria ou sobrescreve arquivo
- `strReplace` - Substituição precisa de texto
- `appendFile` - Adiciona ao final do arquivo
- `deleteFile` - Deleta arquivo (com confirmação)

### Busca
- `grepSearch` - Busca regex em arquivos
- `fileSearch` - Busca arquivos por nome
- `listDirectory` - Lista diretório recursivo

### Execução
- `executeCommand` - Executa comando com timeout
- `startProcess` - Inicia processo em background
- `stopProcess` - Para processo
- `getProcessOutput` - Obtém output de processo

### Diagnósticos
- `getDiagnostics` - Erros e warnings de código
- `getSymbols` - Símbolos (funções, classes, etc)

### Git
- `gitStatus` - Status do repositório
- `gitDiff` - Diff de arquivos
- `gitCommit` - Commit com mensagem

### Preview
- `openPreview` - Abre no navegador

## Uso

### No Terminal (Linguagem Natural)

```
❯ liste os arquivos da pasta src
❯ busque por useState nos arquivos tsx
❯ crie um componente Button em components/Button.tsx
❯ execute npm install axios
❯ inicie o servidor de desenvolvimento
❯ mostre o git status
```

### Comandos Especiais

```
clear/cls  - Limpar terminal
help/?     - Ajuda
new        - Nova aba
ps         - Listar processos
history    - Histórico
exit       - Fechar aba
```

### Atalhos

- `↑/↓` - Navegar histórico
- `Tab` - Autocomplete
- `Ctrl+L` - Limpar
- `Ctrl+C` - Cancelar

## Arquivos Criados/Modificados

### Novos Arquivos

1. `services/KiroUnifiedAgent.ts`
   - Agente unificado com tool calling
   - Gerenciamento de sessões
   - Streaming de eventos
   - 20+ ferramentas

2. `components/ProfessionalTerminal.tsx`
   - Terminal com múltiplas abas
   - Autocomplete inteligente
   - Histórico persistente
   - UI profissional

3. `backend/src/api/controllers/advancedTerminalController.ts`
   - Execução segura de comandos
   - Gerenciamento de processos em background
   - Buffer de output

4. `backend/src/api/routes/advancedTerminalRoutes.ts`
   - Rotas para o terminal avançado

### Arquivos Modificados

1. `backend/src/api/routes/index.ts`
   - Atualizado para usar rotas avançadas

## Integração

### Substituir IntegratedTerminal

```tsx
// Antes
import { IntegratedTerminal } from '@/components/IntegratedTerminal';

// Depois
import { ProfessionalTerminal } from '@/components/ProfessionalTerminal';

// Uso
<ProfessionalTerminal 
  projectFiles={projectFiles.map(f => f.path)}
  activeFile={activeFile}
  onFileSelect={onSelectFile}
/>
```

### Usar o Agente Diretamente

```typescript
import { kiroUnifiedAgent, useKiroAgent } from '@/services/KiroUnifiedAgent';

// Criar sessão
const sessionId = kiroUnifiedAgent.createSession({
  workingDirectory: '.',
  openFiles: ['src/App.tsx']
});

// Processar mensagem com streaming
await kiroUnifiedAgent.processMessage(
  'liste os arquivos da pasta src',
  sessionId,
  (event) => {
    if (event.type === 'text') {
      console.log(event.content);
    }
  }
);

// Atalhos
const content = await kiroUnifiedAgent.quickRead('package.json');
const results = await kiroUnifiedAgent.quickSearch('useState', '**/*.tsx');
```

## Segurança

- Sandbox: Todos os comandos executam dentro do workspace
- Whitelist: Lista de comandos permitidos
- Blacklist: Comandos perigosos bloqueados
- Timeout: Comandos têm timeout configurável
- Confirmação: Operações destrutivas requerem confirmação

## Próximos Passos

1. [ ] WebSocket para streaming real-time
2. [ ] PTY para terminal interativo completo
3. [ ] LSP integration para diagnósticos reais
4. [ ] File watcher para mudanças em tempo real
5. [ ] Integração com debugger
