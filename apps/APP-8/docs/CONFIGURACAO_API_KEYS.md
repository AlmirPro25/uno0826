# 🔑 Configuração de API Keys - Guia Completo

## 📊 Visão Geral

O sistema **Gemini Live Companion** usa **3 arquivos .env diferentes** para configuração, mas **APENAS 2 precisam da API Key do Gemini**.

---

## 🗂️ Estrutura de Configuração

```
gemini-live-companion/
│
├── .env.local                    # Frontend (React)
│   └── VITE_API_KEY=sua_chave   # ✅ PRECISA da API Key
│
├── backend/.env                  # Backend (Node.js)
│   └── GEMINI_API_KEY=sua_chave # ✅ PRECISA da API Key
│
└── executor/.env                 # Executor Python
    └── (SEM API KEY)            # ❌ NÃO precisa da API Key
```

---

## 🔍 Análise Detalhada

### 1. Frontend (.env.local)

**Localização:** `/.env.local`

```env
# URL da API do Backend
VITE_API_URL=http://localhost:3001/api

# Gemini API Key (para o frontend)
# IMPORTANTE: No Vite, variáveis de ambiente precisam do prefixo VITE_
VITE_API_KEY=AIzaSyCZZfpAtX7RUYKPLn82n9m8NgYTR2D-GqM
```

**Uso:**
- Sessão ao vivo (Live Session)
- Modo pensamento (Thinking Mode)
- Análise de capturas de tela
- Comunicação direta com Gemini API

**⚠️ IMPORTANTE:** A chave precisa do prefixo `VITE_` para funcionar no Vite!

---

### 2. Backend (backend/.env)

**Localização:** `/backend/.env`

```env
# Gemini API Key (obrigatório)
# Obtenha em: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=AIzaSyCseKMsvxhuV33KMtMCHLErqDoX5e2NTso

# Porta do servidor (padrão: 3001)
PORT=3001

# Caminho do banco de dados SQLite3
DATABASE_PATH=./data/companion.db

# Ambiente
NODE_ENV=development

# CORS Origins (separados por vírgula)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Log Level
LOG_LEVEL=info

# Gemini Executor
EXECUTOR_AUTH_TOKEN=gemini_executor_secret_2024
```

**Uso:**
- Gemini Maestro (orquestrador)
- Live Agent com function calling
- Visão computacional (roboticsVisionService)
- Planejador de tarefas (taskPlanner)
- Serviço de visão (visionService)
- Reconhecimento facial
- Resumos e análises

**Serviços que usam a API Key:**
```typescript
// backend/src/services/geminiMaestro.ts
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// backend/src/services/liveAgentWithTools.ts
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// backend/src/services/roboticsVisionService.ts
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// backend/src/services/taskPlanner.ts
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// backend/src/services/visionService.ts
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
```

---

### 3. Executor Python (executor/.env)

**Localização:** `/executor/.env`

```env
# Configuração do Gemini Executor

# WebSocket do Maestro
MAESTRO_WS_URL=ws://localhost:3001/executor-ws

# Token de autenticação (deve ser o mesmo no backend)
AUTH_TOKEN=gemini_executor_secret_2024

# Configurações de segurança
ENABLE_EMERGENCY_STOP=true
EMERGENCY_KEY=esc
AUTO_TIMEOUT_SECONDS=300

# Configurações de automação
MOUSE_SPEED=0.5
TYPING_INTERVAL=0.05
SCREENSHOT_QUALITY=85

# Logs
LOG_LEVEL=INFO
LOG_FILE=executor.log
```

**❌ NÃO PRECISA DA API KEY DO GEMINI!**

**Por quê?**
- O executor Python **NÃO se comunica diretamente** com a API do Gemini
- Ele apenas **executa comandos** enviados pelo backend via WebSocket
- O backend (Maestro) é quem decide o que fazer e envia comandos
- O executor apenas executa: mover mouse, clicar, digitar, etc.

**Fluxo de Comunicação:**
```
Frontend → Backend (usa GEMINI_API_KEY) → Executor (sem API Key)
         ↓
    Gemini API
```

---

## 🔧 Como Configurar Corretamente

### Passo 1: Obter API Key do Gemini

1. Acesse: https://makersuite.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

### Passo 2: Configurar Frontend

Edite o arquivo `.env.local` na raiz do projeto:

```env
VITE_API_URL=http://localhost:3001/api
VITE_API_KEY=SUA_CHAVE_AQUI
```

**⚠️ ATENÇÃO:** Use `VITE_API_KEY` (com prefixo VITE_), não `GEMINI_API_KEY`!

### Passo 3: Configurar Backend

Edite o arquivo `backend/.env`:

```env
GEMINI_API_KEY=SUA_CHAVE_AQUI
PORT=3001
DATABASE_PATH=./data/companion.db
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
LOG_LEVEL=info
EXECUTOR_AUTH_TOKEN=gemini_executor_secret_2024
```

### Passo 4: Configurar Executor (Opcional)

O arquivo `executor/.env` **NÃO precisa da API Key**, mas você pode ajustar outras configurações:

```env
MAESTRO_WS_URL=ws://localhost:3001/executor-ws
AUTH_TOKEN=gemini_executor_secret_2024
ENABLE_EMERGENCY_STOP=true
MOUSE_SPEED=0.5
TYPING_INTERVAL=0.05
LOG_LEVEL=INFO
```

**⚠️ IMPORTANTE:** O `AUTH_TOKEN` deve ser o mesmo no backend e no executor!

---

## ✅ Checklist de Configuração

### Frontend
- [ ] Arquivo `.env.local` existe na raiz
- [ ] Variável `VITE_API_KEY` está configurada (com prefixo VITE_)
- [ ] Variável `VITE_API_URL` aponta para `http://localhost:3001/api`

### Backend
- [ ] Arquivo `backend/.env` existe
- [ ] Variável `GEMINI_API_KEY` está configurada
- [ ] Variável `PORT` está configurada (padrão: 3001)
- [ ] Variável `EXECUTOR_AUTH_TOKEN` está configurada

### Executor
- [ ] Arquivo `executor/.env` existe
- [ ] Variável `MAESTRO_WS_URL` aponta para `ws://localhost:3001/executor-ws`
- [ ] Variável `AUTH_TOKEN` é a mesma do backend
- [ ] **NÃO precisa de GEMINI_API_KEY**

---

## 🐛 Problemas Comuns

### Problema 1: "API Key not found" no Frontend

**Causa:** Variável sem prefixo `VITE_`

**Solução:**
```env
# ❌ ERRADO
GEMINI_API_KEY=sua_chave

# ✅ CORRETO
VITE_API_KEY=sua_chave
```

### Problema 2: "API Key not found" no Backend

**Causa:** Variável não configurada ou nome errado

**Solução:**
```env
# ✅ CORRETO
GEMINI_API_KEY=sua_chave
```

### Problema 3: Executor não conecta

**Causa:** `AUTH_TOKEN` diferente entre backend e executor

**Solução:**
```env
# backend/.env
EXECUTOR_AUTH_TOKEN=gemini_executor_secret_2024

# executor/.env
AUTH_TOKEN=gemini_executor_secret_2024
```

### Problema 4: "Invalid API Key"

**Causas possíveis:**
1. API Key incorreta ou expirada
2. API Key com espaços ou caracteres extras
3. Billing não configurado no Google Cloud

**Solução:**
1. Gere uma nova API Key em https://makersuite.google.com/app/apikey
2. Verifique se não há espaços antes/depois da chave
3. Configure billing em https://console.cloud.google.com/billing

---

## 🔍 Como Verificar se Está Funcionando

### Teste 1: Frontend

```bash
# Inicie o frontend
npm run dev

# Abra o console do navegador (F12)
# Procure por erros relacionados a API Key
```

**Sucesso:** Nenhum erro de API Key no console

### Teste 2: Backend

```bash
# Inicie o backend
cd backend
npm run dev

# Verifique os logs
# Procure por "✅ Gemini API inicializada"
```

**Sucesso:** Backend inicia sem erros de API Key

### Teste 3: Executor

```bash
# Inicie o executor
cd executor
python executor.py

# Verifique os logs
# Procure por "✅ Conectado ao Maestro!"
```

**Sucesso:** Executor conecta ao backend via WebSocket

---

## 📊 Resumo Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    CONFIGURAÇÃO DE API KEYS                  │
└─────────────────────────────────────────────────────────────┘

Frontend (.env.local)
├── VITE_API_KEY=sua_chave          ✅ PRECISA
└── VITE_API_URL=http://localhost:3001/api

Backend (backend/.env)
├── GEMINI_API_KEY=sua_chave        ✅ PRECISA
├── PORT=3001
├── DATABASE_PATH=./data/companion.db
└── EXECUTOR_AUTH_TOKEN=token_secreto

Executor (executor/.env)
├── MAESTRO_WS_URL=ws://localhost:3001/executor-ws
├── AUTH_TOKEN=token_secreto        ❌ NÃO PRECISA de GEMINI_API_KEY
└── (configurações de automação)

┌─────────────────────────────────────────────────────────────┐
│                    FLUXO DE COMUNICAÇÃO                      │
└─────────────────────────────────────────────────────────────┘

Frontend (usa VITE_API_KEY)
    ↓
    ↓ HTTP/WebSocket
    ↓
Backend (usa GEMINI_API_KEY)
    ↓                    ↓
    ↓                    ↓ WebSocket (sem API Key)
    ↓                    ↓
Gemini API          Executor Python
                    (apenas executa comandos)
```

---

## 🎯 Conclusão

**Resumo:**
- ✅ Frontend precisa de `VITE_API_KEY`
- ✅ Backend precisa de `GEMINI_API_KEY`
- ❌ Executor **NÃO precisa** de API Key do Gemini
- ✅ Executor precisa de `AUTH_TOKEN` (mesmo do backend)

**Por que o executor não precisa?**
- Ele não faz chamadas diretas à API do Gemini
- Apenas executa comandos físicos (mouse, teclado, navegador)
- O backend (Maestro) é quem decide e envia os comandos

---

**Última atualização:** 12 de Novembro de 2025  
**Versão:** 1.0
