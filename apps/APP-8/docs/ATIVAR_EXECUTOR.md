# 🚀 ATIVANDO O EXECUTOR

## ⚡ PASSO A PASSO

### 1️⃣ Verificar Dependências Python
```bash
cd executor
py --version
```

### 2️⃣ Instalar Dependências (se necessário)
```bash
pip install websockets pyautogui python-dotenv playwright cryptography
playwright install chromium
```

### 3️⃣ Configurar API Key
Verifique se o arquivo `executor/.env` existe com:
```env
MAESTRO_WS_URL=ws://localhost:8081
AUTH_TOKEN=
LOG_LEVEL=INFO
LOG_FILE=executor.log
AUTO_TIMEOUT_SECONDS=300
MOUSE_SPEED=0.5
TYPING_INTERVAL=0.05
```

### 4️⃣ Iniciar Backend (Terminal 1)
```bash
cd backend
npm run dev
```

Aguarde até ver:
```
╔═══════════════════════════════════════════════════════╗
║  🚀 Gemini Companion Backend                          ║
║  📡 Server running on http://localhost:3001           ║
║  🤖 Gemini Maestro: ACTIVE                            ║
║  💾 SQLite3 Database: READY                           ║
║  📅 Auto-summaries: SCHEDULED                         ║
╚═══════════════════════════════════════════════════════╝
🔌 WebSocket Server iniciado na porta 8081
```

### 5️⃣ Iniciar Executor (Terminal 2)
```bash
cd executor
py executor.py
```

Aguarde até ver:
```
╔═══════════════════════════════════════════════╗
║       🎮 GEMINI EXECUTOR v1.0                 ║
║   Automação física coordenada pelo Maestro    ║
╚═══════════════════════════════════════════════╝

🚀 Iniciando Gemini Executor...
✅ Conectado ao Maestro!
```

## ✅ VERIFICAR SE ESTÁ FUNCIONANDO

### Teste 1: Status do Backend
```bash
curl http://localhost:3001/health
```

**Resultado esperado:**
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "database": "connected"
}
```

### Teste 2: Status do Executor
No terminal do executor, você deve ver:
```
✅ Conectado ao Maestro!
```

### Teste 3: Comando Simples
```bash
curl -X POST http://localhost:3001/api/executor/screen-info
```

**Resultado esperado:**
```json
{
  "status": "ok",
  "screen": { "width": 1920, "height": 1080 },
  "mouse": { "x": 960, "y": 540 }
}
```

### Teste 4: Robotics Vision
```bash
curl -X POST http://localhost:3001/api/robotics/detect-2d \
  -H "Content-Type: application/json" \
  -d "{\"targetItems\": \"buttons\", \"maxItems\": 10}"
```

## 🎯 COMANDOS ÚTEIS

### Mover Mouse
```bash
curl -X POST http://localhost:3001/api/executor/move \
  -H "Content-Type: application/json" \
  -d "{\"x\": 500, \"y\": 500}"
```

### Clicar
```bash
curl -X POST http://localhost:3001/api/executor/click \
  -H "Content-Type: application/json" \
  -d "{\"button\": \"left\"}"
```

### Digitar
```bash
curl -X POST http://localhost:3001/api/executor/type \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"Hello World\"}"
```

### Robotics Vision - Find and Click
```bash
curl -X POST http://localhost:3001/api/robotics/find-and-click \
  -H "Content-Type: application/json" \
  -d "{\"targetItem\": \"close button\"}"
```

## 🐛 TROUBLESHOOTING

### Erro: "Executor não está conectado"
**Solução:**
1. Verifique se o backend está rodando
2. Verifique se o executor está rodando
3. Reinicie ambos na ordem: Backend → Executor

### Erro: "Port 8081 already in use"
**Solução:**
```bash
# Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# Ou mude a porta no backend/src/websocket.ts
```

### Erro: "Module not found"
**Solução:**
```bash
cd executor
pip install -r requirements.txt
```

### Erro: "playwright not installed"
**Solução:**
```bash
playwright install chromium
```

## 🎊 PRONTO!

Agora você tem:
✅ Backend rodando (porta 3001)
✅ WebSocket rodando (porta 8081)
✅ Executor conectado
✅ Robotics Vision ativo

Pode usar comandos de voz ou API REST! 🚀
