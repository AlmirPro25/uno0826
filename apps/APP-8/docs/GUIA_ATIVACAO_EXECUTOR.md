# 🎮 GUIA DE ATIVAÇÃO DO EXECUTOR

## 🚀 MÉTODO RÁPIDO (RECOMENDADO)

### Opção 1: Script Automático
```bash
# Duplo clique no arquivo:
INICIAR_EXECUTOR_COMPLETO.bat
```

**O que acontece:**
1. ✅ Verifica Node.js e Python
2. ✅ Instala dependências automaticamente
3. ✅ Cria arquivos .env se necessário
4. ✅ Inicia Backend (porta 3001)
5. ✅ Inicia Executor Python
6. ✅ Conecta via WebSocket (porta 8081)

**Resultado:**
- 2 janelas abertas (Backend + Executor)
- Sistema pronto para uso em ~10 segundos

---

## 🔧 MÉTODO MANUAL

### Passo 1: Terminal 1 - Backend
```bash
cd backend
npm run dev
```

**Aguarde ver:**
```
╔═══════════════════════════════════════════════════════╗
║  🚀 Gemini Companion Backend                          ║
║  📡 Server running on http://localhost:3001           ║
╚═══════════════════════════════════════════════════════╝
🔌 WebSocket Server iniciado na porta 8081
```

### Passo 2: Terminal 2 - Executor
```bash
cd executor
python executor.py
```

**Aguarde ver:**
```
╔═══════════════════════════════════════════════╗
║       🎮 GEMINI EXECUTOR v1.0                 ║
╚═══════════════════════════════════════════════╝
🚀 Iniciando Gemini Executor...
✅ Conectado ao Maestro!
```

---

## ✅ VERIFICAR SE ESTÁ FUNCIONANDO

### Teste Automático
```bash
# Duplo clique no arquivo:
TESTAR_EXECUTOR.bat
```

**Testes executados:**
1. ✅ Backend respondendo
2. ✅ Executor conectado
3. ✅ Robotics Vision funcionando
4. ✅ Movimento do mouse
5. ✅ Detecção de pontos

### Teste Manual
```bash
# Teste 1: Backend
curl http://localhost:3001/health

# Teste 2: Executor
curl -X POST http://localhost:3001/api/executor/screen-info

# Teste 3: Robotics Vision
curl -X POST http://localhost:3001/api/robotics/detect-2d \
  -H "Content-Type: application/json" \
  -d "{\"targetItems\": \"buttons\", \"maxItems\": 5}"
```

---

## 🎯 USAR O SISTEMA

### 1. Via Comandos de Voz
```
Abra o frontend → Inicie sessão Live → Fale:

"Clique no botão de pesquisa"
"Encontre o ícone de configurações"
"Mostre todos os botões"
"Clique no primeiro vídeo"
```

### 2. Via API REST
```bash
# Detectar botões
curl -X POST http://localhost:3001/api/robotics/detect-2d \
  -H "Content-Type: application/json" \
  -d "{\"targetItems\": \"buttons\", \"maxItems\": 10}"

# Encontrar e clicar
curl -X POST http://localhost:3001/api/robotics/find-and-click \
  -H "Content-Type: application/json" \
  -d "{\"targetItem\": \"close button\"}"

# Mover mouse
curl -X POST http://localhost:3001/api/executor/move \
  -H "Content-Type: application/json" \
  -d "{\"x\": 500, \"y\": 500}"

# Digitar texto
curl -X POST http://localhost:3001/api/executor/type \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"Hello World\"}"
```

### 3. Via Código TypeScript
```typescript
import { roboticsVisionService } from './services/roboticsVisionService';
import { geminiMaestro } from './services/geminiMaestro';

// Detectar botões
const boxes = await roboticsVisionService.detect2DBoundingBoxes('buttons', 20);

// Encontrar e clicar
const result = await roboticsVisionService.findAndClick('submit button');

// Via Maestro
await geminiMaestro.findAndClickWithRobotics('close button');
```

---

## 🐛 PROBLEMAS COMUNS

### ❌ "Backend não está rodando"
**Solução:**
```bash
cd backend
npm run dev
```

### ❌ "Executor não está conectado"
**Solução:**
```bash
cd executor
python executor.py
```

### ❌ "Port 8081 already in use"
**Solução:**
```bash
# Encontrar processo
netstat -ano | findstr :8081

# Matar processo
taskkill /PID <PID> /F

# Reiniciar backend
cd backend
npm run dev
```

### ❌ "Module 'pyautogui' not found"
**Solução:**
```bash
cd executor
pip install -r requirements.txt
```

### ❌ "Playwright not installed"
**Solução:**
```bash
playwright install chromium
```

### ❌ "API Key inválida"
**Solução:**
```bash
# Edite backend/.env
GEMINI_API_KEY=sua_chave_aqui
```

---

## 📊 STATUS DO SISTEMA

### ✅ Sistema Funcionando
Você deve ver:
- ✅ Backend rodando (porta 3001)
- ✅ WebSocket ativo (porta 8081)
- ✅ Executor conectado
- ✅ Logs de conexão no terminal

### ❌ Sistema com Problema
Você verá:
- ❌ Erros no terminal
- ❌ "Executor não está conectado"
- ❌ Timeout em requisições

---

## 🎊 PRONTO PARA USAR!

Quando tudo estiver funcionando, você terá:

✅ **Backend ativo** (http://localhost:3001)
✅ **WebSocket ativo** (ws://localhost:8081)
✅ **Executor conectado** (Python)
✅ **Robotics Vision ativo** (Gemini)

**Comandos disponíveis:**
- 🎙️ Comandos de voz naturais
- 🤖 Detecção robótica de objetos
- 🖱️ Controle de mouse/teclado
- 🌐 Automação de navegador
- 📸 Captura e análise de tela

---

## 📚 DOCUMENTAÇÃO

- `ATIVAR_EXECUTOR.md` - Este guia
- `ROBOTICS_COMPLETE.md` - Guia completo
- `TESTE_ROBOTICS_VISION.md` - Testes detalhados
- `QUICK_START_ROBOTICS.md` - Início rápido

---

## 🚀 PRÓXIMOS PASSOS

1. **Teste comandos básicos**
   ```bash
   TESTAR_EXECUTOR.bat
   ```

2. **Teste comandos de voz**
   - Abra o frontend
   - Inicie sessão Live
   - Fale comandos naturais

3. **Explore exemplos**
   ```bash
   cd backend/examples
   # Veja robotics-vision-examples.ts
   ```

4. **Crie suas automações**
   - Use a API REST
   - Integre com seu código
   - Crie workflows personalizados

**Seu sistema está pronto! 🎊🤖👁️✨**
