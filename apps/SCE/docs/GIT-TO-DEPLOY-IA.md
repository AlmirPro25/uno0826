# 🚀 SCE - Git to Deploy + IA (Aurora Builder)

## Visão Geral

Sistema de deploy inteligente que:
1. **Analisa repositórios Git** automaticamente
2. **Detecta framework, linguagem e configurações**
3. **Gera Dockerfile** se necessário
4. **IA no container** para analisar e melhorar código

---

## Funcionalidades Implementadas

### 1. Análise de Repositório (`/api/v1/repo/analyze`)

Quando o usuário cola um link do GitHub:

- ✅ Clone shallow do repositório
- ✅ Detecção de monorepo (apps/, packages/, etc)
- ✅ Identificação de projetos individuais
- ✅ Detecção automática de:
  - Framework (Next.js, React, Vue, Express, FastAPI, Go, etc)
  - Linguagem (TypeScript, JavaScript, Python, Go)
  - Porta padrão
  - Comandos de build/start
  - Presença de Dockerfile

**Frameworks suportados:**
- Frontend: Next.js, React, Vue, Angular, Svelte, Astro
- Backend Node: Express, Fastify, NestJS, Hono
- Backend Python: FastAPI, Django, Flask
- Backend Go: Go nativo, Gin

### 2. Geração de Dockerfile (`/api/v1/repo/generate-dockerfile`)

Gera Dockerfile otimizado baseado no framework detectado:

- ✅ Multi-stage builds para otimização
- ✅ Configurações específicas por framework
- ✅ Exposição de porta correta
- ✅ Comandos de start apropriados

### 3. Aurora Builder - IA no Container

#### Análise de Código (`/api/v1/ai/analyze`)
- ✅ Copia código do container rodando
- ✅ Analisa com Gemini 1.5 Flash
- ✅ Retorna:
  - Score de qualidade (0-100)
  - Issues (erros, warnings, info)
  - Sugestões de melhoria

#### Geração de Código (`/api/v1/ai/generate`)
- ✅ Contexto do projeto existente
- ✅ Manifestos de boas práticas (Next.js, React, TypeScript, API, Security)
- ✅ Gera arquivos completos e funcionais

#### Aplicação de Código (`/api/v1/ai/apply`)
- ✅ Aplica arquivos gerados no container
- ✅ Suporta create, update, delete
- ✅ Usa base64 para evitar problemas de escape

#### Sugestões (`/api/v1/ai/suggest`)
- ✅ Analisa arquivo específico
- ✅ Retorna até 5 melhorias específicas

---

## Arquivos Criados/Modificados

### Backend
```
apps/SCE/backend/src/
├── services/
│   ├── repo-analyzer.service.ts   # Análise de repositórios Git
│   └── ai-builder.service.ts      # Integração com Gemini
├── controllers/
│   ├── repo.controller.ts         # Endpoints de repo
│   └── ai.controller.ts           # Endpoints de IA
└── routes/
    └── index.ts                   # Rotas atualizadas
```

### Frontend
```
apps/SCE/frontend/src/
├── app/projects/new/
│   └── page.tsx                   # Wizard de novo projeto com análise
└── components/
    └── AIAssistant.tsx            # Modal de IA flutuante
```

---

## Como Usar

### 1. Criar Novo Projeto

1. Acesse `/projects/new`
2. Cole a URL do repositório Git
3. Clique em "Analisar Repositório"
4. Se monorepo, selecione qual projeto hospedar
5. Ajuste configurações (pré-preenchidas)
6. Adicione variáveis de ambiente
7. Clique em "Iniciar Deploy"

### 2. Usar IA no Projeto

1. Acesse a página do projeto
2. Clique no botão flutuante ✨ (canto inferior direito)
3. Escolha:
   - **Analisar Código**: Recebe score e sugestões
   - **Gerar Código**: Descreva o que quer criar
4. Aplique o código gerado no container

---

## Configuração

### Variáveis de Ambiente

```env
# Gemini API Key (obrigatório para IA)
GEMINI_API_KEY=sua_api_key_aqui
```

Obter em: https://aistudio.google.com/app/apikey

### Dependências

```bash
cd apps/SCE/backend
npm install @google/generative-ai
```

---

## Deploy das Novas Funcionalidades

### 1. Atualizar Backend

```bash
# No servidor
cd /opt/sce/backend
git pull
npm install
npm run build

# Reiniciar container
docker restart sce-backend
```

### 2. Atualizar Frontend

```bash
# No servidor
cd /opt/sce/frontend
git pull
npm install
npm run build

# Rebuild imagem
docker build -t sce-frontend:latest .
docker stop sce-frontend
docker rm sce-frontend
./start-frontend.sh
```

### 3. Adicionar GEMINI_API_KEY

```bash
# Editar .env do backend
echo "GEMINI_API_KEY=sua_key" >> /opt/sce/backend/.env

# Reiniciar
docker restart sce-backend
```

---

## Próximos Passos

- [ ] Integração com manifestos completos do APP-3 (Alexandria)
- [ ] Rebuild automático após aplicar código
- [ ] Preview de mudanças antes de aplicar
- [ ] Histórico de alterações da IA
- [ ] Rollback de código
- [ ] Suporte a mais linguagens (Rust, Java, etc)

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │  New Project    │  │      AI Assistant Modal         │   │
│  │  Wizard         │  │  ┌─────────┐  ┌─────────────┐   │   │
│  │  ┌───────────┐  │  │  │ Analyze │  │  Generate   │   │   │
│  │  │ Repo URL  │  │  │  └────┬────┘  └──────┬──────┘   │   │
│  │  └─────┬─────┘  │  │       │              │          │   │
│  │        │        │  │       ▼              ▼          │   │
│  │        ▼        │  │  ┌─────────────────────────┐    │   │
│  │  ┌───────────┐  │  │  │    Apply to Container  │    │   │
│  │  │ Analysis  │  │  │  └─────────────────────────┘    │   │
│  │  └───────────┘  │  └─────────────────────────────────┘   │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  ┌─────────────────────┐  ┌─────────────────────────────┐   │
│  │  RepoAnalyzerService│  │     AIBuilderService        │   │
│  │  ┌───────────────┐  │  │  ┌─────────────────────┐    │   │
│  │  │ Clone Repo    │  │  │  │   Gemini 1.5 Flash  │    │   │
│  │  │ Detect Stack  │  │  │  │   + Manifestos      │    │   │
│  │  │ Gen Dockerfile│  │  │  └─────────────────────┘    │   │
│  │  └───────────────┘  │  └─────────────────────────────┘   │
│  └─────────────────────┘                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     DOCKER ENGINE                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Container do Projeto                                │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │  /app                                        │    │    │
│  │  │  ├── src/                                    │    │    │
│  │  │  ├── package.json                            │    │    │
│  │  │  └── ... (código analisado/modificado)       │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```
