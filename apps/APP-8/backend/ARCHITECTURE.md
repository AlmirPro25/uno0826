# 🏗️ Arquitetura do Backend

## Visão Geral

Sistema backend Node.js + TypeScript com SQLite3 nativo, onde o **Gemini atua como "maestro"** orquestrando toda a inteligência do sistema.

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  App.tsx │  │ Memory   │  │ History  │  │ Capture  │   │
│  │          │  │  Panel   │  │  Panel   │  │  Gallery │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │              │              │          │
│       └─────────────┴──────────────┴──────────────┘          │
│                          │                                    │
│                   backendService.ts                          │
└──────────────────────────┼──────────────────────────────────┘
                           │ HTTP/REST
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js + Express)                 │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              🤖 GEMINI MAESTRO                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │ • Extrai fatos de conversas                      │  │ │
│  │  │ • Cria resumos inteligentes                      │  │ │
│  │  │ • Analisa imagens e extrai contexto              │  │ │
│  │  │ • Gera embeddings para busca semântica           │  │ │
│  │  │ • Cria resumos diários automáticos               │  │ │
│  │  │ • Detecta humor e produtividade                  │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                   │
│  ┌────────────┬───────────┼───────────┬────────────┐        │
│  │            │            │           │            │        │
│  ▼            ▼            ▼           ▼            ▼        │
│ ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐          │
│ │Session│ │Memory│  │Capture│ │Daily │  │User  │          │
│ │Service│ │Service│ │Service│ │Summary│ │Profile│         │
│ └───┬───┘ └───┬──┘  └───┬──┘  └───┬──┘  └───┬──┘          │
│     │         │          │         │         │              │
└─────┼─────────┼──────────┼─────────┼─────────┼─────────────┘
      │         │          │         │         │
      └─────────┴──────────┴─────────┴─────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  SQLite3 Database (Nativo)                   │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ sessions │  │ messages │  │ memories │  │ captures │   │
│  │          │  │          │  │          │  │          │   │
│  │ • id     │  │ • id     │  │ • id     │  │ • id     │   │
│  │ • start  │  │ • session│  │ • content│  │ • image  │   │
│  │ • summary│  │ • speaker│  │ • type   │  │ • thumb  │   │
│  └──────────┘  │ • text   │  │ • embed  │  │ • tags   │   │
│                │ • audio  │  │ • tags   │  │ • ai_ana │   │
│  ┌──────────┐  └──────────┘  └──────────┘  └──────────┘   │
│  │  daily   │                                                │
│  │summaries │  ┌──────────┐  ┌──────────┐                  │
│  │          │  │   user   │  │  short   │                  │
│  │ • date   │  │ profile  │  │  term    │                  │
│  │ • summary│  │          │  │ context  │                  │
│  │ • mood   │  │ • name   │  │          │                  │
│  │ • prod   │  │ • prefs  │  │ • content│                  │
│  │ • insights│ │ • skills │  │ • score  │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## 🧠 Gemini Maestro - O Cérebro do Sistema

O Gemini não é apenas um modelo de IA que responde perguntas. Ele é o **maestro** que orquestra todo o sistema:

### Responsabilidades

1. **Análise de Conversas**
   - Extrai fatos importantes automaticamente
   - Identifica preferências do usuário
   - Detecta habilidades e interesses
   - Classifica importância de informações

2. **Criação de Resumos**
   - Resumos de sessões individuais
   - Resumos diários automáticos
   - Análise de tendências semanais
   - Insights personalizados

3. **Processamento de Imagens**
   - Análise visual de screenshots
   - Extração de texto de imagens
   - Identificação de contexto
   - Geração automática de tags

4. **Busca Semântica**
   - Gera embeddings reais usando Gemini API
   - Busca por similaridade semântica
   - Relaciona memórias automaticamente
   - Prioriza por relevância e recência

5. **Inteligência Contextual**
   - Monta contexto completo para respostas
   - Combina memórias de curto e longo prazo
   - Considera perfil do usuário
   - Adapta comunicação ao estilo do usuário

## 📊 Fluxo de Dados

### 1. Conversa Normal

```
Usuário fala → Frontend captura → Backend salva mensagem
                                          ↓
                                   Gemini analisa
                                          ↓
                              Extrai fatos importantes
                                          ↓
                              Salva em memórias com embeddings
```

### 2. Captura de Tela

```
Usuário tira screenshot → Frontend envia imagem → Backend recebe
                                                        ↓
                                                  Sharp comprime
                                                        ↓
                                                  Cria thumbnail
                                                        ↓
                                              Gemini analisa imagem
                                                        ↓
                                          Extrai descrição e tags
                                                        ↓
                                          Salva BLOB no banco
```

### 3. Resumo Diário (Automático)

```
00:05 AM → Trigger automático → Busca sessões do dia anterior
                                          ↓
                                   Gemini analisa tudo
                                          ↓
                              Cria resumo inteligente
                                          ↓
                    Detecta humor, produtividade, tópicos
                                          ↓
                              Gera insights personalizados
                                          ↓
                              Salva no banco de dados
```

### 4. Busca Semântica

```
Usuário busca "como fazer deploy" → Gera embedding da query
                                              ↓
                                    Compara com embeddings salvos
                                              ↓
                                    Calcula similaridade cosseno
                                              ↓
                                    Aplica boost de recência/importância
                                              ↓
                                    Retorna top N resultados
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### sessions
Armazena sessões de conversa
- `id`: Identificador único
- `start_time`: Início da sessão
- `end_time`: Fim da sessão
- `summary`: Resumo gerado pelo Gemini
- `daily_summary_id`: Referência ao resumo diário

#### messages
Mensagens individuais
- `id`: Identificador único
- `session_id`: Sessão pai
- `timestamp`: Momento da mensagem
- `speaker`: user | model | analysis
- `text`: Conteúdo da mensagem
- `audio_data`: Áudio opcional (BLOB)

#### memories
Memórias de longo prazo
- `id`: Identificador único (string)
- `content`: Conteúdo da memória
- `type`: conversation | fact | preference | skill | context
- `importance`: 1-10
- `embedding`: Vetor de embedding (BLOB)
- `tags`: Tags JSON
- `related_to`: IDs de memórias relacionadas

#### captures
Fotos e screenshots
- `id`: Identificador único
- `session_id`: Sessão relacionada
- `image_data`: Imagem completa (BLOB)
- `thumbnail`: Miniatura (BLOB)
- `description`: Descrição gerada pelo Gemini
- `ai_analysis`: Análise detalhada
- `tags`: Tags extraídas automaticamente

#### daily_summaries
Resumos diários automáticos
- `id`: Identificador único
- `date`: Data do resumo
- `summary`: Resumo geral do dia
- `key_topics`: Tópicos principais (JSON)
- `important_facts`: Fatos importantes (JSON)
- `user_mood`: Humor detectado
- `productivity_score`: 1-10
- `ai_insights`: Insights e sugestões

#### user_profile
Perfil do usuário
- `name`: Nome
- `preferences`: Preferências (JSON)
- `skills`: Habilidades (JSON)
- `interests`: Interesses (JSON)
- `work_patterns`: Padrões de trabalho (JSON)
- `communication_style`: Estilo de comunicação

#### short_term_context
Contexto de curto prazo
- `content`: Conteúdo
- `timestamp`: Momento
- `relevance_score`: Score de relevância

## 🔄 Ciclo de Vida de uma Sessão

1. **Criação**: `POST /api/sessions`
   - Cria registro no banco
   - Retorna sessionId

2. **Interação**: `POST /api/sessions/:id/messages`
   - Adiciona mensagens
   - Gemini analisa em background
   - Extrai fatos importantes

3. **Captura** (opcional): `POST /api/captures`
   - Upload de imagem
   - Compressão automática
   - Análise visual pelo Gemini
   - Associação com sessão

4. **Finalização**: `POST /api/sessions/:id/summarize`
   - Gemini cria resumo
   - Atualiza registro da sessão
   - Marca end_time

5. **Resumo Diário** (automático às 00:05)
   - Agrupa todas as sessões do dia
   - Gemini cria análise completa
   - Detecta padrões e tendências

## 🚀 Performance

### Otimizações

1. **WAL Mode**: Write-Ahead Logging para melhor concorrência
2. **Índices**: Em campos frequentemente consultados
3. **Foreign Keys**: Garantem integridade dos dados
4. **Embeddings em BLOB**: Armazenamento eficiente de vetores
5. **Thumbnails**: Imagens pequenas para listagens rápidas

### Escalabilidade

- SQLite3 suporta bancos de **até 281 TB**
- Sem limites práticos para este uso
- Performance nativa (10x mais rápido que sql.js)
- Backup simples (copiar arquivo .db)

## 🔐 Segurança

- API Key do Gemini em variável de ambiente
- CORS configurado
- Validação de tipos no TypeScript
- Foreign keys para integridade
- Sanitização de inputs

## 📈 Monitoramento

### Logs
- Inicialização do banco
- Criação de resumos automáticos
- Erros de API do Gemini
- Operações de limpeza

### Métricas
- Total de sessões
- Total de memórias
- Tamanho do banco
- Estatísticas por tipo

## 🔮 Futuras Melhorias

1. **Cache de Embeddings**: Redis para embeddings frequentes
2. **Queue System**: Bull/BullMQ para processamento assíncrono
3. **WebSockets**: Atualizações em tempo real
4. **Backup Automático**: Cron job para backups diários
5. **Analytics Dashboard**: Visualização de tendências
6. **Multi-usuário**: Suporte a múltiplos usuários
7. **Sincronização**: Sync entre dispositivos

## 🎯 Diferencial

Este não é apenas um backend de armazenamento. É um **sistema inteligente** onde:

- O Gemini **pensa** sobre suas conversas
- Extrai **conhecimento** automaticamente
- Cria **resumos** sem você pedir
- **Aprende** suas preferências
- **Sugere** insights relevantes
- **Organiza** suas memórias semanticamente

É como ter um **assistente pessoal** que realmente entende você! 🤖✨
