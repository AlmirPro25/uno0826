# 🔍 Diagnóstico: Executor Offline

## ❌ Problema Identificado

O **Executor está offline** porque o módulo Python não está rodando.

## ✅ Configurações Verificadas

### Backend (.env)
```
✅ EXECUTOR_AUTH_TOKEN=gemini_executor_secret_2024
✅ PORT=3001
✅ WebSocket em: ws://localhost:3001/executor-ws
```

### Executor (.env)
```
✅ MAESTRO_WS_URL=ws://localhost:3001/executor-ws
✅ AUTH_TOKEN=gemini_executor_secret_2024
```

**Configurações estão CORRETAS!** ✅

## 🚨 Causa do Problema

O executor Python **NÃO ESTÁ RODANDO**. Ele precisa estar ativo para:
1. Conectar no WebSocket do backend
2. Receber comandos
3. Executar ações físicas (mouse, teclado, etc)

---

## 🔧 Solução Rápida (3 Passos)

### 1️⃣ Verifique se o Backend está rodando

```bash
# Terminal 1
cd backend
npm run dev
```

Aguarde ver:
```
✅ Servidor rodando na porta 3001
🔌 WebSocket Server iniciado em /executor-ws
```

### 2️⃣ Inicie o Executor Python

```bash
# Terminal 2
cd executor
py executor.py
```

Aguarde ver:
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

### 3️⃣ Verifique no Frontend

Abra `http://localhost:5173` e veja o componente **Executor Control**.

O botão deve ficar **VERDE** com "✅ Conectado".

---

## 🐛 Troubleshooting

### Problema: "ModuleNotFoundError: No module named 'websockets'"

**Solução:**
```bash
cd executor
pip install -r requirements.txt
```

### Problema: "Erro na conexão: [Errno 10061] No connection could be made"

**Causa:** Backend não está rodando

**Solução:**
```bash
cd backend
npm run dev
```

### Problema: "Autenticação falhou"

**Causa:** Tokens diferentes no backend e executor

**Solução:**
1. Verifique `backend/.env` → `EXECUTOR_AUTH_TOKEN`
2. Verifique `executor/.env` → `AUTH_TOKEN`
3. Devem ser IGUAIS

### Problema: "pyautogui não funciona"

**Solução Windows:**
```bash
pip install pyautogui pillow
```

**Solução Linux:**
```bash
pip install pyautogui python-xlib pillow
```

**Solução Mac:**
```bash
pip install pyautogui pillow
# Dar permissões de acessibilidade nas Preferências do Sistema
```

---

## 📊 Como Verificar se Está Funcionando

### No Terminal do Backend

Quando o executor conectar, você verá:
```
📡 Nova conexão WebSocket recebida
✅ Executor conectado!
📨 Mensagem do Executor: { type: 'init', executor: 'ready', ... }
```

### No Terminal do Executor

```
✅ Conectado ao Maestro!
```

### No Frontend

- **Botão VERDE**: ✅ Conectado
- **Informações da tela**: 1920 x 1080
- **Posição do mouse**: (500, 300)

---

## 🧪 Teste Rápido

### 1. Teste de Conexão

No frontend, clique em **"Conectar"** no Executor Control.

Deve aparecer: ✅ Conectado

### 2. Teste de Comando

Digite no campo de comando:
```
mover mouse para 500, 300
```

Clique em **"Executar"**.

O mouse deve se mover para a posição (500, 300).

### 3. Teste do Live Agent

No Live Command Panel, diga:
```
"Abra o YouTube"
```

Deve:
1. Abrir Win+R
2. Digitar "chrome youtube.com"
3. Pressionar Enter
4. YouTube abre

---

## 🎯 Checklist de Verificação

Antes de usar o sistema, verifique:

- [ ] Backend rodando na porta 3001
- [ ] WebSocket ativo em /executor-ws
- [ ] Executor Python rodando
- [ ] Executor conectado (logs mostram "✅ Conectado")
- [ ] Frontend mostra botão verde
- [ ] Teste de comando funciona

---

## 🚀 Scripts de Inicialização

### Windows

Crie `INICIAR_TUDO.bat`:
```batch
@echo off
echo Iniciando sistema completo...

start cmd /k "cd backend && npm run dev"
timeout /t 3
start cmd /k "cd executor && py executor.py"
timeout /t 3
start cmd /k "npm run dev"

echo Sistema iniciado!
```

### Linux/Mac

Crie `iniciar_tudo.sh`:
```bash
#!/bin/bash
echo "Iniciando sistema completo..."

# Backend
cd backend && npm run dev &
sleep 3

# Executor
cd ../executor && python executor.py &
sleep 3

# Frontend
cd .. && npm run dev &

echo "Sistema iniciado!"
```

---

## 📝 Logs Importantes

### Backend
```
backend/logs/server.log
```

### Executor
```
executor/executor.log
executor/executor_audit.log
```

### Frontend
```
Console do navegador (F12)
```

---

## 🎓 Entendendo o Fluxo

```
1. Backend inicia
   ↓
2. WebSocket Server ativo em /executor-ws
   ↓
3. Executor Python inicia
   ↓
4. Executor conecta no WebSocket
   ↓
5. Backend registra: "✅ Executor conectado!"
   ↓
6. Frontend verifica status
   ↓
7. Botão fica VERDE ✅
   ↓
8. Sistema pronto para receber comandos!
```

---

## 🔄 Reconexão Automática

O executor tem **reconexão automática**:

- Se perder conexão, tenta reconectar a cada 5s
- Logs mostram: "⚠️ Conexão fechada. Reconectando em 5s..."
- Quando reconectar: "✅ Conectado ao Maestro!"

---

## 🎯 Próximos Passos

Depois que o executor estiver conectado:

1. ✅ Teste comandos simples (mover mouse, clicar)
2. ✅ Teste Live Agent (comandos por voz)
3. ✅ Teste tarefas complexas (pesquisar e clicar)
4. ✅ Teste navegação web (Playwright)

---

## 📞 Suporte

Se ainda não funcionar:

1. Verifique logs do backend
2. Verifique logs do executor
3. Verifique console do navegador
4. Verifique se portas 3001 e 5173 estão livres
5. Verifique firewall/antivírus

---

## ✅ Resumo

**O executor está offline porque o Python não está rodando.**

**Solução:**
```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd executor
py executor.py

# Terminal 3
npm run dev
```

**Pronto! Sistema funcionando! 🚀**
