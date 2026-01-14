# 🚀 Ativar Live Agent - Modo Agêntico

## ⚡ Início Rápido (3 Passos)

### 1️⃣ Inicie o Backend

```bash
cd backend
npm run dev
```

Aguarde ver:
```
✅ Servidor rodando na porta 3001
✅ WebSocket ativo
```

### 2️⃣ Inicie o Executor

```bash
cd executor
py executor.py
```

Aguarde ver:
```
✅ Executor conectado ao backend
✅ Ferramentas disponíveis: 15
```

### 3️⃣ Inicie o Frontend

```bash
npm run dev
```

Abra: `http://localhost:5173`

---

## 🧠 Testando o Live Agent

### Teste 1: Conversa Normal

```
Você: "Olá!"
Agente: "Olá! Como posso ajudar?"
```

**Resultado esperado:** Resposta conversacional, sem executar ações

### Teste 2: Ação Rápida

```
Você: "Abra o YouTube"
Agente: "✅ Abrindo YouTube..."
```

**Resultado esperado:** 
- Abre Win+R
- Digita "chrome youtube.com"
- Pressiona Enter
- YouTube abre

### Teste 3: Tarefa Complexa

```
Você: "Pesquise Python tutorial e clique no primeiro vídeo"
Agente: "✅ Tarefa completada em 5 passos (3.2s)"
```

**Resultado esperado:**
- Analisa tela com Vision
- Cria plano de 5 passos
- Executa cada passo
- Clica no primeiro vídeo

### Teste 4: Pergunta Visual

```
Você: "O que tem na tela?"
Agente: "Vejo a página inicial do YouTube com 12 vídeos recomendados..."
```

**Resultado esperado:**
- Captura screenshot
- Analisa com Vision
- Descreve o que vê

---

## 🔍 Verificando Status

### No Terminal do Backend

Você verá logs detalhados:

```
=======================================================================
🧠 LIVE AGENT - Processando mensagem em tempo real
=======================================================================
👤 Usuário: "Abra o YouTube"
───────────────────────────────────────────────────────────────────────
🤔 Decisão: AGIR
📊 Tipo: quick | Confiança: 95%
💭 Raciocínio: Comando simples de navegação, execução direta
───────────────────────────────────────────────────────────────────────
⚡ Executando ação RÁPIDA...
   🔧 Ferramenta: hotkey
   📦 Parâmetros: { keys: ['win', 'r'] }
✅ Ação completada: Executado: hotkey
=======================================================================
```

### Na Interface Web

- **Status:** ✅ Pronto / ⏳ Executando
- **Mensagens:** Histórico completo
- **Indicadores:** 🤖 Agente (ações) / 💬 Assistente (conversa)

---

## 🎯 Comandos de Exemplo

### Navegação

```
"Abra o YouTube"
"Abra o navegador"
"Vá para o Google"
"Feche a janela"
```

### Pesquisa

```
"Pesquise Python tutorial"
"Procure por React hooks"
"Busque no YouTube por música relaxante"
```

### Interação

```
"Clique no primeiro vídeo"
"Role para baixo"
"Volte a página"
"Atualize a página"
```

### Perguntas

```
"O que tem na tela?"
"Quais vídeos estão aparecendo?"
"Resume esse artigo"
"Quantos botões você vê?"
```

### Tarefas Complexas

```
"Pesquise Python tutorial e clique no primeiro vídeo"
"Abra o YouTube, pesquise música relaxante e reproduza"
"Vá para o Google e pesquise o clima de hoje"
```

---

## 🐛 Troubleshooting

### Problema: "Executor não conectado"

**Solução:**
```bash
cd executor
py executor.py
```

Aguarde ver: `✅ Executor conectado`

### Problema: "Erro ao processar mensagem"

**Verificar:**
1. Backend rodando? `http://localhost:3001/health`
2. Executor conectado? Veja logs do backend
3. API Key do Gemini configurada? Veja `.env.local` e `backend/.env`

### Problema: "Não está executando ações"

**Verificar:**
1. Logs do backend mostram decisão?
2. Tipo de decisão: `quick`, `complex`, `question` ou `conversation`?
3. Se `conversation`, é esperado não executar ações

### Problema: "Ações executam mas não funcionam"

**Verificar:**
1. Executor está rodando com permissões?
2. Tela está desbloqueada?
3. Aplicativo correto está em foco?

---

## 📊 Monitoramento

### Logs do Backend

```bash
cd backend
npm run dev
```

Mostra:
- Decisões do agente
- Ferramentas usadas
- Resultados de execução
- Erros detalhados

### Logs do Executor

```bash
cd executor
py executor.py
```

Mostra:
- Conexão WebSocket
- Comandos recebidos
- Ações executadas
- Screenshots capturados

### Interface Web

- Console do navegador (F12)
- Status em tempo real
- Histórico de mensagens

---

## 🎓 Entendendo as Decisões

### Decisão: CONVERSAR

```
Entrada: "Obrigado!"
Decisão: conversation
Ação: Nenhuma
Resposta: "De nada! Estou aqui para ajudar."
```

### Decisão: AÇÃO RÁPIDA

```
Entrada: "Abra o YouTube"
Decisão: quick
Ferramenta: hotkey + type + press
Resposta: "✅ Abrindo YouTube..."
```

### Decisão: TAREFA COMPLEXA

```
Entrada: "Pesquise Python e clique no primeiro"
Decisão: complex
Coordenação: Live Agent → Maestro → Vision → Planner → Executor
Resposta: "✅ Tarefa completada em 5 passos"
```

### Decisão: PERGUNTA VISUAL

```
Entrada: "O que tem na tela?"
Decisão: question
Análise: Vision → Gemini
Resposta: "Vejo a página inicial do YouTube..."
```

---

## 🔧 Configuração Avançada

### Ajustar Confiança Mínima

Em `backend/src/services/liveAgentService.ts`:

```typescript
// Linha ~200
if (!decision.shouldAct || decision.confidence < 0.7) {
  // Altere 0.7 para ajustar sensibilidade
  // 0.5 = mais permissivo
  // 0.9 = mais restritivo
}
```

### Atualização Visual Automática

```typescript
// Atualiza contexto visual a cada 10s
setInterval(async () => {
  await liveAgentService.updateVisualContext();
}, 10000);
```

### Memória de Curto Prazo

```typescript
// Adiciona informação importante
liveAgentService.addToShortTermMemory(
  "Usuário prefere vídeos curtos"
);
```

---

## 📈 Métricas de Sucesso

### Ações Rápidas

- ✅ Latência < 500ms
- ✅ Taxa de sucesso > 95%
- ✅ Sem necessidade de Maestro

### Tarefas Complexas

- ✅ Planejamento correto
- ✅ Execução completa
- ✅ Feedback claro

### Perguntas Visuais

- ✅ Análise precisa
- ✅ Resposta natural
- ✅ Contexto relevante

---

## 🎯 Próximos Passos

1. **Teste todos os tipos de comando**
2. **Monitore os logs para entender decisões**
3. **Ajuste confiança se necessário**
4. **Adicione novos comandos rápidos**
5. **Integre com Gemini Live API para streaming**

---

## 🚀 Sistema Pronto!

O Live Agent está funcionando como um **verdadeiro agente**:

- ✅ Decide quando agir
- ✅ Escolhe a melhor abordagem
- ✅ Coordena com Maestro
- ✅ Executa ações diretas
- ✅ Mantém contexto

**Agora é só usar e ver a mágica acontecer! 🎉**
