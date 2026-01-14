# 🔧 AI Weaver Local Bridge

**O Terminal AI que dá mãos ao seu SaaS.**

## O Que É Isso?

O Local Bridge é um executor local que permite o AI Web Weaver (rodando no navegador) executar comandos reais na sua máquina. É a ponte entre a nuvem e o seu terminal.

## Instalação

```bash
# Opção 1: NPX (Recomendado - sem instalação)
npx @ai-weaver/local-bridge

# Opção 2: Instalação global
npm install -g @ai-weaver/local-bridge
ai-weaver

# Opção 3: Desenvolvimento local
cd cli
npm install
npm start
```

## Como Funciona

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  AI Web Weaver  │ ◄─────► │  Local Bridge    │ ◄─────► │  Seu Terminal   │
│  (Navegador)    │ WebSocket│  (Porta 4567)   │  spawn  │  (Comandos)     │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

1. Você abre o AI Web Weaver no navegador
2. Roda `npx @ai-weaver/local-bridge` no terminal
3. O SaaS detecta o Bridge e ganha "mãos"
4. Agora a IA pode:
   - Rodar `npm install`
   - Executar `docker-compose up`
   - Criar arquivos no disco
   - Ler logs de erro
   - **Se autocorrigir** quando algo falha

## Segurança (SAFE HANDS Protocol)

### ✅ Comandos Permitidos
- `npm`, `node`, `npx`, `yarn`, `pnpm`
- `docker`, `docker-compose`
- `git`, `go`, `cargo`, `python`
- `ls`, `mkdir`, `cat`, `echo`

### ⛔ Comandos Bloqueados
- `rm`, `del`, `rmdir` (destrutivos)
- `sudo`, `chmod`, `chown` (permissões)
- Qualquer comando fora da lista permitida

### 🔒 Sandbox
- O Bridge só pode acessar o diretório onde foi iniciado
- Tentativas de `../` ou `/etc` são bloqueadas
- Timeout de 5 minutos por comando

## Uso com o AI Web Weaver

1. Abra o AI Web Weaver no navegador
2. Em outro terminal, rode:
   ```bash
   npx @ai-weaver/local-bridge
   ```
3. No chat do AI, peça:
   > "Crie um projeto React e rode o servidor"

4. A IA vai:
   - Gerar os arquivos
   - Escrever no seu disco (via Bridge)
   - Rodar `npm install` (via Bridge)
   - Executar `npm run dev` (via Bridge)
   - Se der erro, **se autocorrigir**

## Variáveis de Ambiente

```bash
# Porta do Bridge (padrão: 4567)
BRIDGE_PORT=4567 npx @ai-weaver/local-bridge
```

## Troubleshooting

### "Bridge não encontrado"
- Certifique-se de que o CLI está rodando
- Verifique se a porta 4567 está livre
- Tente `lsof -i :4567` (Mac/Linux) ou `netstat -ano | findstr :4567` (Windows)

### "Comando não permitido"
- O Bridge só aceita comandos de desenvolvimento
- Para comandos customizados, edite `ALLOWED_COMMANDS` no código

### "Acesso negado"
- O Bridge opera em sandbox
- Ele só pode acessar o diretório onde foi iniciado

## Arquitetura

```typescript
// Frontend (React)
import { terminalBridge } from './services/TerminalBridge';

await terminalBridge.connect();
terminalBridge.executeCommand('npm install', './my-project');

// CLI (Node.js)
// Recebe via WebSocket → Valida → Executa → Retorna stream
```

## Self-Healing em Ação

```
1. IA gera: docker-compose up -d
2. Bridge executa
3. Erro: "port 3000 already in use"
4. Bridge detecta erro crítico
5. Frontend notifica Neural Core
6. IA analisa: "Vou mudar para porta 3001"
7. IA gera novo docker-compose.yml
8. Bridge escreve arquivo
9. Bridge executa novamente
10. ✅ Sucesso
```

## Roadmap

- [ ] Suporte a comandos interativos (vim, nano)
- [ ] Modo "Human-in-the-Loop" (confirmação manual)
- [ ] Dashboard web para monitorar execuções
- [ ] Logs persistentes
- [ ] Suporte a múltiplos projetos simultâneos

## Licença

MIT - Almir © 2024

---

**Aviso:** Este é um protótipo educacional. Use em ambientes de desenvolvimento. Nunca rode em produção sem auditoria de segurança.
