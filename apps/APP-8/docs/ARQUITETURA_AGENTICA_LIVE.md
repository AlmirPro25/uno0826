# 🧠 Arquitetura Agêntica: Consciência + Subconsciente

## 🎯 O Problema Resolvido

O sistema estava funcionando apenas como **interface conversacional**, mas não como um **agente** que usa ferramentas e coordena ações. Agora temos uma arquitetura completa de **consciência (Live Agent) + subconsciente (Maestro)**.

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    👤 USUÁRIO                                │
│              (Voz, Texto, Gestos)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              🧠 LIVE AGENT (Consciência)                     │
│                                                              │
│  • Vê e ouve tudo em tempo real                             │
│  • Mantém contexto contínuo                                 │
│  • DECIDE quando e como agir                                │
│  • Executa ações rápidas direto                             │
│  • Coordena com Maestro para tarefas complexas              │
│                                                              │
│  DECISÃO AGÊNTICA:                                          │
│  ┌──────────────────────────────────────────────┐          │
│  │ Mensagem → Análise → Decisão → Ação          │          │
│  │                                               │          │
│  │ Tipos de decisão:                            │          │
│  │ • CONVERSAR (apenas responder)               │          │
│  │ • AÇÃO RÁPIDA (executar direto)              │          │
│  │ • TAREFA COMPLEXA (coordenar com Maestro)    │          │
│  │ • PERGUNTA VISUAL (analisar tela)            │          │
│  └──────────────────────────────────────────────┘          │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             │ Ações Rápidas              │ Tarefas Complexas
             ▼                            ▼
┌─────────────────────────┐  ┌──────────────────────────────┐
│   ⚡ EXECUTOR           │  │  🎭 MAESTRO (Subconsciente)  │
│   (Ferramentas Diretas) │  │                              │
│                         │  │  • Recebe contexto completo  │
│  • move_mouse           │  │  • Analisa com VISÃO         │
│  • click                │  │  • Cria PLANO de ação        │
│  • type                 │  │  • Executa com EXECUTOR      │
│  • press                │  │  • Retorna resultado         │
│  • hotkey               │  │                              │
│  • scroll               │  │  FLUXO COMPLETO:             │
│  • screenshot           │  │  Vision → Planner → Executor │
└─────────────────────────┘  └──────────────────────────────┘
             │                            │
             └────────────┬───────────────┘
                          ▼
                  ✅ RESULTADO
```

---

## 🔄 Fluxo de Processamento

### 1️⃣ Usuário Fala/Digita

```
Usuário: "Pesquise Python tutorial e clique no primeiro vídeo"
```

### 2️⃣ Live Agent Recebe e Analisa

```typescript
// Live Agent processa em tempo real
const decision = await makeAgenticDecision(userMessage);

// Resultado da decisão:
{
  shouldAct: true,
  actionType: 'complex',  // Precisa de planejamento
  confidence: 0.95,
  reasoning: "Tarefa com múltiplos passos: pesquisar + identificar + clicar"
}
```

### 3️⃣ Coordena com Maestro (Subconsciente)

```typescript
// Live Agent envia para Maestro
const result = await coordinateWithMaestro(userCommand);

// Maestro executa fluxo completo:
// 1. Vision: Analisa tela atual
// 2. Planner: Cria plano de 5 passos
// 3. Executor: Executa cada passo
// 4. Retorna: Resultado completo
```

### 4️⃣ Maestro Executa com Visão

```typescript
// 1. Analisa tela
const screenContext = await visionService.analyzeScreen();

// 2. Cria plano
const plan = await taskPlanner.planTask(command, screenContext);
// Plan: [
//   { action: 'click', target: 'search_box' },
//   { action: 'type', text: 'Python tutorial' },
//   { action: 'press', key: 'enter' },
//   { action: 'wait', duration: 2000 },
//   { action: 'click', target: 'first_video' }
// ]

// 3. Executa plano
const execution = await taskPlanner.executePlan(plan);
```

### 5️⃣ Retorna Resultado

```
Live Agent → Usuário: "✅ Pesquisei 'Python tutorial' e cliquei no primeiro vídeo"
```

---

## 🎯 Tipos de Decisão Agêntica

### 💬 CONVERSAR (Conversation)

**Quando:** Saudações, agradecimentos, perguntas gerais

**Exemplo:**
```
Usuário: "Obrigado!"
Decisão: conversation
Ação: Responde naturalmente
Resposta: "De nada! Estou aqui para ajudar."
```

### ⚡ AÇÃO RÁPIDA (Quick Action)

**Quando:** Comandos simples e diretos

**Exemplo:**
```
Usuário: "Abra o YouTube"
Decisão: quick
Ação: hotkey('win', 'r') → type('chrome youtube.com') → press('enter')
Resposta: "✅ Abrindo YouTube..."
```

### 🎭 TAREFA COMPLEXA (Complex Task)

**Quando:** Múltiplos passos, precisa visão e planejamento

**Exemplo:**
```
Usuário: "Pesquise Python e clique no primeiro vídeo"
Decisão: complex
Ação: Coordena com Maestro
  → Vision analisa tela
  → Planner cria 5 passos
  → Executor executa cada passo
Resposta: "✅ Tarefa completada em 5 passos (3.2s)"
```

### ❓ PERGUNTA VISUAL (Visual Question)

**Quando:** Perguntas sobre o que está na tela

**Exemplo:**
```
Usuário: "O que tem na tela?"
Decisão: question
Ação: Vision analisa → Gemini responde
Resposta: "Vejo a página inicial do YouTube com 12 vídeos recomendados..."
```

---

## 🛠️ Ferramentas Disponíveis

### Para Live Agent (Ações Rápidas)

```typescript
tools.executor = {
  move_mouse: (x, y) => executorService.moveMouse(x, y),
  click: (button, x, y) => executorService.click(button, x, y),
  type: (text) => executorService.type(text),
  press: (key) => executorService.press(key),
  hotkey: (...keys) => executorService.hotkey(...keys),
  scroll: (amount) => executorService.scroll(amount),
  screenshot: () => executorService.screenshot()
}
```

### Para Maestro (Tarefas Complexas)

```typescript
tools.maestro = {
  execute_complex_task: (command, context) => 
    geminiMaestro.executeComplexTask(command, context),
  
  plan_task: (command, screenContext) => 
    taskPlanner.planTask(command, screenContext)
}

tools.vision = {
  analyze_screen: (query) => visionService.analyzeScreen(query),
  find_element: (target) => roboticsVisionService.findAndClick(target),
  detect_elements: (target, max) => roboticsVisionService.detect2DBoundingBoxes(target, max)
}
```

---

## 📊 Contexto Mantido pelo Live Agent

```typescript
interface LiveContext {
  // Contexto visual
  currentScreen: {
    appName: string;
    description: string;
    elements: Array<any>;
  };
  lastScreenUpdate: Date;
  
  // Contexto conversacional
  recentMessages: Array<{
    speaker: string;
    text: string;
    timestamp: Date;
    isUser: boolean;
  }>;
  
  // Estado do agente
  currentTask: string;
  isExecuting: boolean;
  lastAction: {
    type: string;
    result: any;
    timestamp: Date;
  };
  
  // Memória de curto prazo
  shortTermMemory: string[];
}
```

---

## 🚀 Como Usar

### 1. Inicie o Backend

```bash
cd backend
npm run dev
```

### 2. Inicie o Executor

```bash
cd executor
py executor.py
```

### 3. Inicie o Frontend

```bash
npm run dev
```

### 4. Use o Live Agent

Abra a interface e:

- **Converse:** "Como você está?"
- **Comandos rápidos:** "Abra o YouTube"
- **Tarefas complexas:** "Pesquise Python e clique no primeiro"
- **Perguntas:** "O que tem na tela?"

---

## 🎯 Vantagens da Arquitetura

### ✅ Inteligente

- Decide automaticamente quando e como agir
- Não precisa de comandos específicos
- Entende contexto e intenção

### ✅ Eficiente

- Ações rápidas executam direto (sem overhead)
- Tarefas complexas usam planejamento inteligente
- Não desperdiça recursos

### ✅ Coordenado

- Live Agent (consciência) mantém contexto
- Maestro (subconsciente) executa tarefas complexas
- Comunicação bidirecional

### ✅ Contextual

- Mantém histórico de conversa
- Atualiza contexto visual periodicamente
- Memória de curto prazo

---

## 🔧 Endpoints da API

### POST /api/live/message

Processa mensagem em tempo real (modo agêntico)

```typescript
{
  speaker: "Usuário",
  text: "Abra o YouTube",
  isUser: true,
  visualContext?: any  // Opcional
}

// Resposta:
{
  success: true,
  response: "✅ Abrindo YouTube...",
  acted: true,
  action: { ... }
}
```

### GET /api/live/status

Verifica status do agente

```typescript
{
  executing: false,
  recentMessages: [...],
  currentScreen: "YouTube - Home",
  lastAction: { type: 'quick', result: {...} }
}
```

### POST /api/live/update-visual

Atualiza contexto visual manualmente

```typescript
{
  success: true,
  screen: { appName: "Chrome", description: "..." },
  updated: "2024-01-15T10:30:00Z"
}
```

---

## 🎓 Exemplos de Uso

### Exemplo 1: Ação Rápida

```
👤 Usuário: "Abra o navegador"

🧠 Live Agent:
   Decisão: quick action
   Ferramenta: hotkey
   
⚡ Executor:
   hotkey('win', 'r')
   type('chrome')
   press('enter')
   
✅ Resultado: "Abrindo navegador Chrome..."
```

### Exemplo 2: Tarefa Complexa

```
👤 Usuário: "Pesquise Python tutorial e clique no primeiro vídeo"

🧠 Live Agent:
   Decisão: complex task
   Coordena com Maestro
   
🎭 Maestro:
   1. Vision: Analisa tela (YouTube aberto)
   2. Planner: Cria 5 passos
   3. Executor: Executa cada passo
      - Clica na busca
      - Digita "Python tutorial"
      - Pressiona Enter
      - Aguarda 2s
      - Clica no primeiro vídeo
   
✅ Resultado: "Tarefa completada em 5 passos (3.2s)"
```

### Exemplo 3: Pergunta Visual

```
👤 Usuário: "Quais vídeos estão aparecendo?"

🧠 Live Agent:
   Decisão: visual question
   
👁️ Vision:
   Analisa tela
   Detecta 12 vídeos
   Extrai títulos
   
🤖 Gemini:
   Gera resposta natural
   
✅ Resultado: "Vejo 12 vídeos recomendados: 'Python Tutorial for Beginners', 'Learn Python in 10 Minutes', ..."
```

---

## 🎯 Próximos Passos

### 1. Integração com Gemini Live API

- Streaming de áudio bidirecional
- Latência ultra-baixa
- Interrupções naturais

### 2. Contexto Visual Contínuo

- Atualização automática a cada 5s
- Detecção de mudanças significativas
- Cache inteligente

### 3. Memória de Longo Prazo

- Salvar decisões importantes
- Aprender com feedback
- Personalização

### 4. Multi-modal

- Câmera do usuário
- Gestos
- Expressões faciais

---

## 📝 Conclusão

Agora o sistema tem uma **arquitetura agêntica completa**:

- **Live Agent** = Consciência em tempo real
- **Maestro** = Subconsciente que planeja e executa
- **Executor** = Braços e mãos do sistema
- **Vision** = Olhos que veem a tela

O Live Agent **decide** quando e como agir, coordenando com o Maestro para tarefas complexas e executando ações rápidas diretamente. É um **agente inteligente**, não apenas uma interface conversacional.

🚀 **O sistema está pronto para ser um verdadeiro assistente agêntico!**
