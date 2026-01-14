# Gemini Companion Backend

Backend Node.js com SQLite3 nativo para o Gemini Companion. Sistema inteligente com Gemini como "maestro" orquestrando memórias, sessões e análises.

## 🚀 Características

- **SQLite3 Nativo**: Sem limites de armazenamento do localStorage
- **Gemini Maestro**: IA que orquestra todo o sistema
- **Armazenamento de Imagens**: Fotos salvas como BLOB no banco
- **Resumos Automáticos**: Resumos diários criados automaticamente
- **Busca Semântica**: Embeddings do Gemini para busca inteligente
- **Memória Contextual**: Sistema avançado de memória de longo prazo

## 📦 Instalação

```bash
cd backend
npm install
```

## ⚙️ Configuração

Crie um arquivo `.env`:

```env
GEMINI_API_KEY=sua_chave_aqui
PORT=3001
DATABASE_PATH=./data/companion.db
```

## 🏃 Executar

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

## 📡 API Endpoints

### Sessions
- `POST /api/sessions` - Criar nova sessão
- `POST /api/sessions/:id/messages` - Adicionar mensagem
- `GET /api/sessions/:id` - Buscar sessão
- `GET /api/sessions` - Listar todas
- `POST /api/sessions/:id/summarize` - Resumir sessão
- `DELETE /api/sessions/:id` - Deletar sessão

### Memories
- `POST /api/memories` - Adicionar memória
- `GET /api/memories/search?q=query` - Buscar memórias
- `POST /api/memories/extract-facts` - Extrair fatos
- `GET /api/memories/stats` - Estatísticas

### Captures (Fotos)
- `POST /api/captures` - Upload de imagem
- `GET /api/captures/:id` - Buscar captura
- `GET /api/captures/session/:id` - Capturas por sessão
- `POST /api/captures/search` - Buscar por tags

### Daily Summaries
- `POST /api/summaries` - Criar resumo diário
- `GET /api/summaries/:date` - Buscar resumo
- `GET /api/summaries` - Listar resumos
- `GET /api/summaries/trends/weekly` - Análise semanal

## 🗄️ Estrutura do Banco

### Tabelas Principais
- `sessions` - Sessões de conversa
- `messages` - Mensagens individuais
- `memories` - Memórias de longo prazo com embeddings
- `captures` - Fotos/screenshots com análise IA
- `daily_summaries` - Resumos diários automáticos
- `user_profile` - Perfil e preferências do usuário
- `short_term_context` - Contexto de curto prazo

## 🤖 Gemini Maestro

O Gemini atua como "maestro" do sistema:
- Extrai fatos importantes de conversas
- Cria resumos inteligentes
- Analisa imagens e extrai contexto
- Gera embeddings para busca semântica
- Cria resumos diários automáticos
- Detecta humor e produtividade

## 🔄 Migração do Frontend

No frontend, substitua:

```typescript
// Antes (localStorage)
import { databaseService } from './services/databaseService';

// Depois (backend)
import { backendService } from './services/backendService';
```

## 📊 Vantagens

✅ **Sem limites de armazenamento**
✅ **Performance superior**
✅ **Busca semântica real com embeddings**
✅ **Armazenamento de imagens**
✅ **Resumos automáticos**
✅ **Análise de tendências**
✅ **Backup fácil** (apenas copiar o arquivo .db)

## 🛠️ Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em modo watch
npm run dev

# Build
npm run build

# Rodar testes (adicionar depois)
npm test
```

## 📝 Notas

- O banco de dados é criado automaticamente em `./data/companion.db`
- Resumos diários são criados automaticamente às 00:05
- Embeddings são gerados usando a API do Gemini
- Imagens são comprimidas e thumbnails são criados automaticamente
