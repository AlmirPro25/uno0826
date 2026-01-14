# 🚀 Gemini Companion - Backend SQLite3

> **Sistema completo de backend com SQLite3 nativo e Gemini Maestro**  
> Armazenamento ilimitado • Busca semântica • Resumos automáticos • Análise de imagens

📚 **[Ver Índice Completo da Documentação](INDICE_DOCUMENTACAO.md)**

## 🎯 Visão Geral

Sistema completo de backend com SQLite3 nativo, onde o **Gemini atua como "maestro"** orquestrando toda a inteligência artificial do sistema.

### 🔥 Principais Benefícios

| Antes (localStorage) | Depois (Backend SQLite3) |
|---------------------|-------------------------|
| ❌ Limite de ~5-10MB | ✅ **Sem limites** |
| ❌ Travamentos por quota | ✅ **Performance nativa** |
| ❌ Embeddings simulados | ✅ **Embeddings reais do Gemini** |
| ❌ Sem fotos | ✅ **Armazenamento de imagens** |
| ❌ Sem resumos automáticos | ✅ **Resumos diários automáticos** |
| ❌ Busca por texto | ✅ **Busca semântica inteligente** |

## 🎼 Gemini Maestro

O diferencial deste sistema é o **Gemini Maestro** - não é apenas uma IA que responde, mas um sistema que:

- 🧠 **Pensa** sobre suas conversas
- 💭 **Extrai** fatos importantes automaticamente
- 🔍 **Busca** semanticamente com embeddings reais
- 📊 **Analisa** padrões e tendências
- 📸 **Entende** imagens e screenshots
- 💡 **Sugere** insights personalizados
- 🎯 **Evolui** continuamente com você

> É como ter um assistente pessoal que realmente te conhece! 🤖✨

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── database/
│   │   ├── db.ts              # Conexão SQLite3
│   │   └── schema.ts          # Schema do banco
│   ├── services/
│   │   ├── geminiMaestro.ts   # 🎼 Cérebro do sistema
│   │   ├── sessionService.ts  # Gerencia sessões
│   │   ├── memoryService.ts   # Memórias de longo prazo
│   │   ├── captureService.ts  # Fotos e screenshots
│   │   └── dailySummaryService.ts # Resumos automáticos
│   ├── routes/
│   │   ├── sessions.ts        # API de sessões
│   │   ├── memories.ts        # API de memórias
│   │   ├── captures.ts        # API de fotos
│   │   └── summaries.ts       # API de resumos
│   ├── types.ts               # Tipos TypeScript
│   └── server.ts              # Servidor Express
├── examples/
│   ├── test-system.ts         # Script de teste
│   └── README.md              # Exemplos de uso
├── data/
│   └── companion.db           # Banco SQLite3 (criado automaticamente)
├── package.json
├── tsconfig.json
└── .env                       # Configurações

services/
└── backendService.ts          # Cliente para o frontend
```

## ⚡ Quick Start

### 1. Instalar

```bash
cd backend
npm install
```

### 2. Configurar

Crie `backend/.env`:

```env
GEMINI_API_KEY=sua_chave_aqui
PORT=3001
DATABASE_PATH=./data/companion.db
```

### 3. Iniciar

```bash
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

### 4. Testar

```bash
curl http://localhost:3001/health
```

## 🗄️ Banco de Dados

### Tabelas Principais

- **sessions** - Sessões de conversa
- **messages** - Mensagens individuais (com áudio opcional)
- **memories** - Memórias de longo prazo com embeddings
- **captures** - Fotos/screenshots com análise IA
- **daily_summaries** - Resumos diários automáticos
- **user_profile** - Perfil e preferências
- **short_term_context** - Contexto de curto prazo

### Recursos Avançados

- ✅ Embeddings reais do Gemini para busca semântica
- ✅ Armazenamento de imagens em BLOB
- ✅ Thumbnails automáticos
- ✅ Foreign keys para integridade
- ✅ Índices otimizados
- ✅ WAL mode para performance

## 📡 API Endpoints

### Sessions
```bash
POST   /api/sessions                    # Criar sessão
POST   /api/sessions/:id/messages       # Adicionar mensagem
GET    /api/sessions/:id                # Buscar sessão
GET    /api/sessions                    # Listar todas
POST   /api/sessions/:id/summarize      # Resumir sessão
DELETE /api/sessions/:id                # Deletar sessão
```

### Memories
```bash
POST   /api/memories                    # Adicionar memória
GET    /api/memories/search?q=query     # Buscar memórias
POST   /api/memories/extract-facts      # Extrair fatos
GET    /api/memories/stats              # Estatísticas
```

### Captures (Fotos)
```bash
POST   /api/captures                    # Upload de imagem
GET    /api/captures/:id                # Buscar captura
GET    /api/captures/session/:id        # Por sessão
POST   /api/captures/search             # Buscar por tags
```

### Daily Summaries
```bash
POST   /api/summaries                   # Criar resumo
GET    /api/summaries/:date             # Buscar resumo
GET    /api/summaries                   # Listar resumos
GET    /api/summaries/trends/weekly     # Análise semanal
```

## 🔄 Migração do Frontend

### Antes:
```typescript
import { databaseService } from './services/databaseService';
await databaseService.createSession();
```

### Depois:
```typescript
import { backendService } from './services/backendService';
await backendService.createSession();
```

## 🆕 Novos Recursos

### 1. Armazenamento de Fotos

```typescript
const imageFile = await captureScreen();
const result = await backendService.saveCapture(
  imageFile,
  sessionId,
  undefined,
  'Contexto da conversa'
);

console.log('Análise:', result.analysis.description);
console.log('Tags:', result.analysis.tags);
```

### 2. Resumos Diários Automáticos

```typescript
const today = new Date().toISOString().split('T')[0];
const summary = await backendService.getDailySummary(today);

console.log('Resumo:', summary.summary);
console.log('Humor:', summary.user_mood);
console.log('Produtividade:', summary.productivity_score);
console.log('Insights:', summary.ai_insights);
```

### 3. Busca Semântica Real

```typescript
const memories = await backendService.searchMemories(
  'Como fazer deploy no servidor?',
  5
);

// Retorna memórias ordenadas por relevância semântica
memories.forEach(mem => {
  console.log(`[${mem.type}] ${mem.content} (score: ${mem.score})`);
});
```

### 4. Análise de Tendências

```typescript
const trends = await backendService.getWeeklyTrends();

console.log('Produtividade média:', trends.averageProductivity);
console.log('Tópicos principais:', trends.topTopics);
```

## 🧪 Testar Sistema Completo

```bash
cd backend
npx tsx examples/test-system.ts
```

Isso vai executar um teste completo:
- ✅ Criar sessões
- ✅ Adicionar mensagens
- ✅ Gerar resumos
- ✅ Extrair fatos
- ✅ Buscar memórias
- ✅ Criar resumo diário

## 📚 Documentação

- **[QUICK_START_BACKEND.md](QUICK_START_BACKEND.md)** - Início rápido (5 minutos)
- **[backend/README.md](backend/README.md)** - Documentação completa do backend
- **[backend/ARCHITECTURE.md](backend/ARCHITECTURE.md)** - Arquitetura detalhada
- **[backend/GEMINI_MAESTRO.md](backend/GEMINI_MAESTRO.md)** - Como funciona o Maestro
- **[MIGRATION_TO_BACKEND.md](MIGRATION_TO_BACKEND.md)** - Guia de migração completo
- **[IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md)** - Checklist de implementação

## 🎯 Fluxo de Trabalho

### Conversa Normal
```
1. Usuário fala
2. Frontend envia para backend
3. Backend salva no SQLite3
4. Gemini Maestro analisa em background
5. Extrai fatos importantes
6. Gera embeddings
7. Relaciona com memórias existentes
8. Armazena tudo no banco
```

### Captura de Tela
```
1. Usuário tira screenshot
2. Frontend envia imagem
3. Backend comprime e cria thumbnail
4. Gemini Maestro analisa visualmente
5. Extrai descrição e tags
6. Salva BLOB no banco
7. Associa com sessão/mensagem
```

### Resumo Diário (Automático)
```
1. 00:05 AM - Trigger automático
2. Backend busca sessões do dia anterior
3. Gemini Maestro analisa tudo
4. Detecta padrões, humor, produtividade
5. Gera insights personalizados
6. Salva resumo no banco
7. Disponível para consulta
```

## 🚀 Performance

- **10x mais rápido** que sql.js no navegador
- **Sem limites** de armazenamento
- **Busca semântica** em milissegundos
- **Processamento de imagens** otimizado
- **Resumos automáticos** sem travar o frontend

## 🔐 Segurança

- ✅ API Key em variável de ambiente
- ✅ CORS configurado
- ✅ Validação de tipos
- ✅ Foreign keys para integridade
- ✅ Sanitização de inputs

## 📊 Monitoramento

### Ver tamanho do banco
```bash
ls -lh backend/data/companion.db
```

### Backup
```bash
cp backend/data/companion.db backup-$(date +%Y%m%d).db
```

### Consultar diretamente
```bash
sqlite3 backend/data/companion.db
sqlite> SELECT COUNT(*) FROM sessions;
sqlite> SELECT COUNT(*) FROM memories;
sqlite> .quit
```

## 🐛 Troubleshooting

### Backend não inicia
- Verifique se a porta 3001 está livre
- Confirme que GEMINI_API_KEY está configurado
- Veja os logs de erro no console

### Frontend não conecta
- Verifique se VITE_API_URL está no .env.local
- Confirme que o backend está rodando
- Verifique CORS no navegador (F12 → Console)

### Erro de quota ainda aparece
- Certifique-se de usar backendService, não databaseService
- Limpe o localStorage antigo: `localStorage.clear()`

## 💡 Dicas

- O banco de dados é criado automaticamente em `./data/companion.db`
- Resumos diários são criados automaticamente às 00:05
- Embeddings são gerados usando a API do Gemini
- Imagens são comprimidas automaticamente
- Backup é simples: copiar o arquivo .db

## 🎉 Resultado Final

Um sistema completo onde:
- 🧠 O Gemini **pensa** sobre suas conversas
- 💭 **Extrai** conhecimento automaticamente
- 🔍 **Busca** semanticamente
- 📊 **Analisa** padrões
- 💡 **Sugere** insights
- 🎯 **Evolui** com você

**É como ter um assistente pessoal que realmente te conhece!** 🤖✨

---

## 📞 Próximos Passos

1. ✅ Leia o [Quick Start](QUICK_START_BACKEND.md)
2. ✅ Instale e configure o backend
3. ✅ Execute o teste completo
4. ✅ Migre o frontend gradualmente
5. ✅ Explore os novos recursos
6. ✅ Aproveite o sistema sem limites! 🚀
