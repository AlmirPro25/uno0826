# 🚀 Como Iniciar o Sistema

## ✅ Instalação Concluída!

Tudo foi instalado com sucesso! Agora vamos iniciar o sistema.

## 🎯 Passo a Passo

### 1. Configurar API Key do Gemini

Você precisa de uma API Key do Gemini. Obtenha em:
👉 https://makersuite.google.com/app/apikey

Depois, edite os arquivos:
- `backend/.env` → Linha 3: `GEMINI_API_KEY=SUA_CHAVE_AQUI`
- `.env.local` → Linha 5: `API_KEY=SUA_CHAVE_AQUI`

### 2. Iniciar Backend

**Opção A - Script automático:**
```bash
# Clique duas vezes em:
start-backend.bat
```

**Opção B - Manual:**
```bash
cd backend
npm run dev
```

Você verá:
```
╔═══════════════════════════════════════════════════════╗
║  🚀 Gemini Companion Backend                          ║
║  📡 Server running on http://localhost:3001           ║
║  🤖 Gemini Maestro: ACTIVE                            ║
║  💾 SQLite3 Database: READY                           ║
║  📅 Auto-summaries: SCHEDULED                         ║
╚═══════════════════════════════════════════════════════╝
```

### 3. Iniciar Frontend (em outro terminal)

**Opção A - Script automático:**
```bash
# Clique duas vezes em:
start-frontend.bat
```

**Opção B - Manual:**
```bash
npm run dev
```

### 4. Abrir no Navegador

Abra: http://localhost:5173

## 🧪 Testar o Sistema

### Teste 1: Backend está rodando?
```bash
curl http://localhost:3001/health
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "...",
  "database": "connected"
}
```

### Teste 2: Contexto do Maestro
```bash
curl http://localhost:3001/api/context/system-instruction
```

Deve retornar um JSON com o System Instruction completo.

### Teste 3: Sistema Completo
```bash
cd backend
npx tsx examples/test-system.ts
```

Isso testa:
- ✅ Criação de sessões
- ✅ Adição de mensagens
- ✅ Geração de resumos
- ✅ Extração de fatos
- ✅ Busca de memórias
- ✅ Criação de resumo diário

## 🎼 Usar com Gemini Maestro

Para usar o sistema com contexto dinâmico, você precisa substituir o componente:

Em `src/App.tsx`, linha ~10:

**Antes:**
```typescript
import UnifiedInterface from './components/UnifiedInterface';
```

**Depois:**
```typescript
import UnifiedInterface from './components/UnifiedInterfaceWithMaestro';
```

Salve e recarregue. Agora o Gemini Live terá contexto dinâmico do Maestro! 🎼

## 🐛 Problemas?

### Backend não inicia
- Verifique se a porta 3001 está livre
- Confirme que a API Key está configurada
- Veja os logs de erro no terminal

### Frontend não conecta
- Verifique se o backend está rodando
- Confirme que `.env.local` tem `VITE_API_URL=http://localhost:3001/api`
- Abra F12 no navegador e veja o Console

### Erro de API Key
- Verifique se a chave está correta em ambos os arquivos
- Teste a chave: https://generativelanguage.googleapis.com/v1/models?key=SUA_CHAVE

## 📚 Documentação

- **[README_SISTEMA_COMPLETO.md](README_SISTEMA_COMPLETO.md)** - Visão geral
- **[INTEGRACAO_MAESTRO.md](INTEGRACAO_MAESTRO.md)** - Integração Maestro
- **[RESUMO_INTEGRACAO.md](RESUMO_INTEGRACAO.md)** - Resumo direto
- **[backend/COMANDOS_UTEIS.md](backend/COMANDOS_UTEIS.md)** - Comandos úteis

## 🎉 Pronto!

Agora você tem:
- ✅ Backend rodando com SQLite3
- ✅ Frontend conectado
- ✅ Gemini Maestro ativo
- ✅ Contexto dinâmico funcionando
- ✅ Sistema completo operacional!

**Aproveite seu assistente inteligente! 🤖✨**
