# 🧠 DAIA - Database AI Apprentice

> **O Agente Autônomo que Aprende com Seus Códigos Aprovados**

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-green.svg)](https://fastapi.tiangolo.com/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-orange.svg)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🆕 v2.0 - DAIA Brain (Gemini + Tool Calling)

O DAIA agora possui um **cérebro autônomo** que usa **Gemini 2.5 Flash** com **Tool Calling** para:

- 🧠 **Raciocinar** sobre o que você quer
- 🔍 **Buscar** templates automaticamente
- 💾 **Salvar** códigos aprovados com análise inteligente
- 📊 **Analisar** qualidade do código
- 💡 **Sugerir** melhorias baseado no histórico

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DAIA BRAIN ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   [User Message] ──► [DAIA Brain] ──► [Gemini 2.5 Flash]                   │
│                          │                   │                              │
│                          │                   ▼                              │
│                          │         [Tool Calling Decision]                  │
│                          │                   │                              │
│                          ▼                   ▼                              │
│                    ┌─────────────────────────────────┐                      │
│                    │           8 TOOLS               │                      │
│                    ├─────────────────────────────────┤                      │
│                    │ • search_templates              │                      │
│                    │ • save_template                 │                      │
│                    │ • get_template_by_id            │                      │
│                    │ • list_categories               │                      │
│                    │ • get_statistics                │                      │
│                    │ • analyze_code_quality          │                      │
│                    │ • suggest_improvements          │                      │
│                    │ • delete_template               │                      │
│                    └─────────────────────────────────┘                      │
│                                   │                                         │
│                                   ▼                                         │
│                          [Template Database]                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🎯 O Que É o DAIA?

O **DAIA** (Database AI Apprentice) é um agente autônomo que transforma seus códigos aprovados em um banco de conhecimento inteligente:

1. **Recebe** códigos que você aprova (like) no AI Web Weaver
2. **Vetoriza** usando embeddings semânticos (sentence-transformers)
3. **Armazena** em banco SQLite com índice FAISS para busca rápida
4. **Sugere** templates similares quando você faz pedidos parecidos
5. **Melhora** a qualidade das gerações usando exemplos do seu histórico

### 🔥 Filosofia: Banco de Dados Inteligente

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO DO DAIA                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   [AI Web Weaver]  ──(gera código)──►  [Usuário]                           │
│         │                                  │                                │
│         │                                  │ (dá like)                      │
│         │                                  ▼                                │
│         │                           [DAIA Server]                           │
│         │                                  │                                │
│         │                    ┌─────────────┼─────────────┐                  │
│         │                    ▼             ▼             ▼                  │
│         │              [Embedding]   [Template DB]  [Fine-tune]             │
│         │              (vetoriza)    (SQLite)       (opcional)              │
│         │                    │             │             │                  │
│         │                    └─────────────┼─────────────┘                  │
│         │                                  │                                │
│         │◄──────(busca similar)────────────┘                                │
│         │                                                                   │
│   [Próxima geração usa templates como exemplo]                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🚀 Requisitos Mínimos

- **CPU**: Intel i3 7ª geração ou superior
- **RAM**: 8GB (mínimo), 16GB (recomendado)
- **Disco**: 5GB livres
- **Python**: 3.10+
- **GPU**: Não necessária (100% CPU)
- **SO**: Windows 10/11, Linux, macOS

## 📦 Instalação Rápida (Windows)

```batch
# 1. Entre na pasta
cd daia-local

# 2. Configure a API Key do Gemini
copy .env.example .env
# Edite .env e adicione sua GEMINI_API_KEY

# 3. Execute o instalador
install-daia.bat

# 4. Inicie o servidor
start-daia.bat
```

### ⚠️ Configuração do Brain (Gemini)

Para habilitar o Brain com Tool Calling, você precisa de uma API Key do Gemini:

1. Acesse: https://aistudio.google.com/app/apikey
2. Crie uma nova API Key
3. Crie o arquivo `.env` na pasta `daia-local`:

```env
GEMINI_API_KEY=sua_chave_aqui
```

Sem a API Key, o DAIA funciona apenas como banco de templates (sem o Brain).

## 📦 Instalação Manual

```bash
# 1. Entre na pasta
cd daia-local

# 2. Crie ambiente virtual
python -m venv venv

# 3. Ative o ambiente
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 4. Instale dependências
pip install -r requirements.txt

# 5. Inicie o servidor
python server.py
```

## ✅ Verificar Instalação

Após iniciar, acesse: http://localhost:8765

Você deve ver:
```json
{
  "service": "DAIA - Database AI Apprentice",
  "status": "online",
  "version": "1.0.0"
}
```

## 🔌 Endpoints da API

### Endpoints do Brain (Gemini + Tool Calling)

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/brain/think` | POST | Envia mensagem para o Brain pensar |
| `/brain/generate` | POST | Gera código com memória |
| `/brain/approve` | POST | Aprova e salva código |
| `/brain/status` | GET | Status do Brain |
| `/brain/reset` | POST | Reseta conversa |
| `/brain/history` | GET | Histórico da conversa |
| `/brain/analyze` | POST | Analisa qualidade do código |
| `/brain/suggest` | POST | Sugere baseado em templates |

### Exemplo: Pedir ao Brain para Pensar

```bash
curl -X POST http://localhost:8765/brain/think \
  -H "Content-Type: application/json" \
  -d '{"message": "Preciso criar um dashboard de vendas moderno"}'
```

Resposta:
```json
{
  "response": "Encontrei 3 templates similares de dashboard...",
  "tools_used": [
    {"name": "search_templates", "args": {"query": "dashboard vendas"}}
  ],
  "conversation_length": 2
}
```

### Endpoints do Banco de Templates

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/learn` | POST | Aprende novo código |
| `/search` | POST | Busca templates similares |
| `/templates` | GET | Lista todos os templates |
| `/templates/{id}` | GET | Obtém template específico |
| `/stats` | GET | Estatísticas do banco |
| `/categories` | GET | Lista categorias |
| `/finetune` | POST | Inicia fine-tuning (opcional) |

## 🧠 Modelos Suportados

| Modelo | Tamanho | RAM | Velocidade | Qualidade |
|--------|---------|-----|------------|-----------|
| **Qwen2-0.5B** | 500MB | 2GB | ⚡⚡⚡ | ⭐⭐ |
| **TinyLlama-1.1B** | 1.1GB | 4GB | ⚡⚡ | ⭐⭐⭐ |
| **Phi-2** | 2.7GB | 6GB | ⚡ | ⭐⭐⭐⭐ |
| **CodeLlama-7B-Q4** | 4GB | 8GB | 🐢 | ⭐⭐⭐⭐⭐ |

**Recomendado para i3 7ª geração**: Qwen2-0.5B ou TinyLlama-1.1B

## 📁 Estrutura

```
daia-local/
├── server.py           # Servidor FastAPI
├── models/
│   ├── embedder.py     # Gerador de embeddings
│   └── local_llm.py    # Modelo local (opcional)
├── database/
│   ├── templates.db    # SQLite com templates
│   └── vectors.db      # Embeddings vetoriais
├── services/
│   ├── template_store.py   # CRUD de templates
│   ├── similarity.py       # Busca por similaridade
│   └── finetuner.py        # Fine-tuning (opcional)
├── requirements.txt
└── README.md
```

## 🔗 Integração com AI Web Weaver

O DAIA se integra automaticamente quando você:

1. Dá **like** em um código gerado
2. Marca como **"Bom para Treinamento"** no Evolution Tracker
3. Exporta logs de treinamento

O frontend envia automaticamente para `http://localhost:8765/learn`.

## 📊 Como Funciona

### 1. Embedding (Vetorização)

Quando você aprova um código, o DAIA:
- Extrai features do código (estrutura, tags, classes)
- Gera um embedding vetorial (384 dimensões)
- Salva no banco vetorial

### 2. Busca por Similaridade

Quando você faz um novo pedido:
- O prompt é vetorizado
- Busca os N templates mais similares
- Retorna como contexto para o Gemini

### 3. Fine-tuning (Opcional)

Com 100+ templates, você pode:
- Treinar um modelo local pequeno
- Especializado nos seus padrões
- Roda 100% offline

## 🛠️ Configuração

```python
# config.py
DAIA_CONFIG = {
    "host": "0.0.0.0",
    "port": 8765,
    "database_path": "./database/templates.db",
    "embedding_model": "all-MiniLM-L6-v2",  # 80MB, rápido
    "local_llm": "Qwen/Qwen2-0.5B",  # Opcional
    "max_templates": 10000,
    "similarity_threshold": 0.7
}
```

## 📈 Roadmap

- [x] Servidor FastAPI
- [x] Banco de templates SQLite
- [x] Embeddings com sentence-transformers
- [x] Busca por similaridade
- [ ] Fine-tuning com LoRA
- [ ] Interface web de gerenciamento
- [ ] Exportação de modelos
- [ ] Sincronização com nuvem

## 📝 Licença

MIT

---

**DAIA** - Seu Banco de Dados de Código Inteligente 🧠✨


## 🔧 Integração com Frontend (TypeScript)

### Arquivos de Integração

O AI Web Weaver inclui serviços TypeScript para comunicação com o DAIA:

- `services/DAIAService.ts` - Cliente HTTP para a API do DAIA
- `services/DAIAIntegration.ts` - Hooks de integração com o store
- `components/DAIAStatusIndicator.tsx` - Indicador visual de status

### Exemplo de Uso

```typescript
import { sendToDAIA, enrichWithDAIA, isDAIAAvailable } from '@/services/DAIAIntegration';

// Verificar se DAIA está online
const available = await isDAIAAvailable();

// Enviar código aprovado
await sendToDAIA({
    code: htmlCode,
    prompt: userPrompt,
    modelUsed: 'gemini-2.5-flash',
    userRating: 'liked'
});

// Enriquecer prompt antes de gerar
const { enrichedPrompt, usedTemplates } = await enrichWithDAIA(prompt);
```

### Integração com Store (Zustand)

```typescript
import { createDAIAStoreHandlers } from '@/services/DAIAIntegration';

const handlers = createDAIAStoreHandlers();

// No store:
handleLikeInteraction: async () => {
    const { htmlCode, initialPlanPrompt, selectedTextModel } = get();
    await handlers.onCodeLiked(htmlCode, initialPlanPrompt, selectedTextModel);
}
```

## 🧪 Testes

```bash
# Testar servidor
python test_server.py

# Testar endpoints manualmente
curl http://localhost:8765/health
curl http://localhost:8765/stats
```

## 🐛 Troubleshooting

### DAIA não inicia
- Verifique se Python 3.10+ está instalado
- Execute `pip install -r requirements.txt` novamente
- Verifique se a porta 8765 está livre

### Embeddings lentos
- Normal na primeira execução (download do modelo)
- Modelo fica em cache em `./models/cache`

### Erro de memória
- Reduza `batch_size` no fine-tuning
- Use modelo menor (Qwen2-0.5B)
