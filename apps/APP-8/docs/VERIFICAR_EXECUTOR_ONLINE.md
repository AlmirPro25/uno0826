# ✅ Como Verificar se o Executor Está Online

## 🎯 Checklist Visual Rápido

### 1️⃣ Terminal do Backend

**O que você DEVE ver:**

```
✅ Servidor rodando na porta 3001
🔌 WebSocket Server iniciado em /executor-ws
📡 Nova conexão WebSocket recebida
✅ Executor conectado!
📨 Mensagem do Executor: { type: 'init', executor: 'ready', screen: { width: 1920, height: 1080 } }
```

**❌ Se NÃO ver isso:**
- Backend não está rodando
- Execute: `cd backend && npm run dev`

---

### 2️⃣ Terminal do Executor

**O que você DEVE ver:**

```
╔═══════════════════════════════════════════════╗
║       🎮 GEMINI EXECUTOR v1.0                 ║
║   Automação física coordenada pelo Maestro    ║
╚═══════════════════════════════════════════════╝

🎮 Gemini Executor inicializado
📡 Conectando ao Maestro em: ws://localhost:3001/executor-ws
🌐 Módulo de navegação web carregado
🚀 Iniciando Gemini Executor...
✅ Conectado ao Maestro!
```

**❌ Se NÃO ver isso:**
- Executor não está rodando
- Execute: `cd executor && py executor.py`

**❌ Se ver erro de conexão:**
```
❌ Erro na conexão: [Errno 10061] No connection could be made
⚠️ Conexão fechada. Reconectando em 5s...
```
- Backend não está rodando ou porta errada
- Verifique `backend/.env` → PORT=3001
- Verifique `executor/.env` → MAESTRO_WS_URL=ws://localhost:3001/executor-ws

---

### 3️⃣ Interface Web (Frontend)

**Componente: Executor Control**

#### ✅ ONLINE (Conectado)

```
┌─────────────────────────────────────────────┐
│ 🎮 Gemini Executor          ✅ Conectado    │
├─────────────────────────────────────────────┤
│                                             │
│ Tela: 1920 x 1080                          │
│ Mouse: (500, 300)                          │
│                                             │
│ [Desconectar]  [PARAR]                     │
│                                             │
│ Comando em linguagem natural:              │
│ [_____________________________] [Executar] │
│                                             │
└─────────────────────────────────────────────┘
```

**Indicadores:**
- ✅ Botão VERDE com "Conectado"
- ✅ Informações da tela visíveis
- ✅ Posição do mouse atualizada
- ✅ Campo de comando habilitado

#### ❌ OFFLINE (Desconectado)

```
┌─────────────────────────────────────────────┐
│ 🎮 Gemini Executor          ⚠️ Desconectado │
├─────────────────────────────────────────────┤
│                                             │
│ ❌ Erro ao verificar status                │
│                                             │
│ [Conectar]                                 │
│                                             │
│ 📋 Como iniciar o Executor:                │
│ 1. Abra terminal em executor/              │
│ 2. Execute: python executor.py             │
│ 3. Clique em "Conectar" acima              │
│                                             │
└─────────────────────────────────────────────┘
```

**Indicadores:**
- ❌ Botão CINZA com "Desconectado"
- ❌ Sem informações da tela
- ❌ Instruções de como iniciar
- ❌ Campo de comando desabilitado

---

## 🔍 Verificação Passo a Passo

### Passo 1: Verifique o Backend

```bash
# Abra terminal
cd backend
npm run dev
```

**Aguarde ver:**
```
✅ Servidor rodando na porta 3001
🔌 WebSocket Server iniciado em /executor-ws
```

**Se não aparecer:**
- Verifique se a porta 3001 está livre
- Execute: `netstat -ano | findstr :3001`
- Se estiver ocupada, mate o processo ou mude a porta

---

### Passo 2: Verifique o Executor

```bash
# Abra OUTRO terminal
cd executor
py executor.py
```

**Aguarde ver:**
```
✅ Conectado ao Maestro!
```

**Se aparecer erro:**

#### Erro: "ModuleNotFoundError"
```bash
pip install -r requirements.txt
```

#### Erro: "Connection refused"
- Backend não está rodando
- Volte ao Passo 1

#### Erro: "Unauthorized"
- Tokens diferentes
- Verifique `backend/.env` e `executor/.env`
- AUTH_TOKEN deve ser igual

---

### Passo 3: Verifique o Frontend

```bash
# Abra OUTRO terminal
npm run dev
```

Abra: `http://localhost:5173`

**Procure o componente "Executor Control"**

**Deve mostrar:**
- ✅ Conectado (verde)
- Informações da tela
- Campo de comando habilitado

---

## 🧪 Teste de Funcionamento

### Teste 1: Status

No frontend, veja se o botão está **VERDE**.

### Teste 2: Comando Simples

Digite no campo de comando:
```
mover mouse para 500, 300
```

Clique em **"Executar"**.

**Resultado esperado:**
- Mouse se move para (500, 300)
- Logs no terminal do executor mostram a ação

### Teste 3: Live Agent

No Live Command Panel, diga:
```
"Abra o YouTube"
```

**Resultado esperado:**
- Win+R abre
- Digita "chrome youtube.com"
- Pressiona Enter
- YouTube abre

**Logs esperados no Backend:**
```
🧠 LIVE AGENT - Processando mensagem em tempo real
👤 Usuário: "Abra o YouTube"
🤔 Decisão: AGIR
📊 Tipo: quick | Confiança: 95%
⚡ Executando ação RÁPIDA...
✅ Ação completada
```

**Logs esperados no Executor:**
```
🎯 Ação: hotkey | Params: {'keys': ['win', 'r']}
🎯 Ação: type | Params: {'text': 'chrome youtube.com'}
🎯 Ação: press | Params: {'key': 'enter'}
```

---

## 📊 Tabela de Diagnóstico

| Sintoma | Causa | Solução |
|---------|-------|---------|
| Botão vermelho/cinza | Executor não rodando | `cd executor && py executor.py` |
| "Connection refused" | Backend não rodando | `cd backend && npm run dev` |
| "Unauthorized" | Tokens diferentes | Verifique `.env` files |
| "ModuleNotFoundError" | Dependências faltando | `pip install -r requirements.txt` |
| Conecta mas não executa | Erro no código | Veja logs do executor |
| Executa mas não funciona | Permissões/Tela bloqueada | Desbloqueie tela, dê permissões |

---

## 🎯 Estados do Sistema

### 🟢 TUDO FUNCIONANDO

```
Backend:  ✅ Rodando (porta 3001)
Executor: ✅ Conectado (WebSocket ativo)
Frontend: ✅ Botão verde
Comandos: ✅ Executando
```

### 🟡 PARCIALMENTE FUNCIONANDO

```
Backend:  ✅ Rodando
Executor: ⚠️ Conectando/Reconectando
Frontend: 🟡 Botão amarelo
Comandos: ❌ Não executam
```

**Ação:** Aguarde reconexão ou reinicie executor

### 🔴 NÃO FUNCIONANDO

```
Backend:  ❌ Não rodando
Executor: ❌ Não conectado
Frontend: 🔴 Botão vermelho
Comandos: ❌ Não executam
```

**Ação:** Inicie backend e executor

---

## 🚀 Script de Verificação Automática

Crie `verificar_status.bat`:

```batch
@echo off
echo Verificando status do sistema...
echo.

echo [1/3] Backend (porta 3001)...
curl -s http://localhost:3001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend rodando
) else (
    echo ❌ Backend não está rodando
)

echo [2/3] Executor (WebSocket)...
curl -s http://localhost:3001/api/executor/status >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Executor conectado
) else (
    echo ❌ Executor não conectado
)

echo [3/3] Frontend (porta 5173)...
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend rodando
) else (
    echo ❌ Frontend não está rodando
)

echo.
pause
```

---

## 📝 Resumo Visual

### ✅ Sistema Online

```
┌─────────────┐
│   BACKEND   │ ✅ Porta 3001
└──────┬──────┘
       │ WebSocket
       ↓
┌─────────────┐
│  EXECUTOR   │ ✅ Conectado
└──────┬──────┘
       │ Status
       ↓
┌─────────────┐
│  FRONTEND   │ ✅ Botão Verde
└─────────────┘
```

### ❌ Sistema Offline

```
┌─────────────┐
│   BACKEND   │ ❌ Não rodando
└─────────────┘
       ↓
┌─────────────┐
│  EXECUTOR   │ ❌ Não conecta
└─────────────┘
       ↓
┌─────────────┐
│  FRONTEND   │ ❌ Botão Vermelho
└─────────────┘
```

---

## 🎓 Conclusão

**Para o executor ficar ONLINE:**

1. ✅ Backend rodando
2. ✅ Executor Python rodando
3. ✅ WebSocket conectado
4. ✅ Frontend mostra verde

**Se qualquer um falhar, o sistema fica OFFLINE.**

**Use o script `INICIAR_SISTEMA_COMPLETO.bat` para iniciar tudo de uma vez!**
