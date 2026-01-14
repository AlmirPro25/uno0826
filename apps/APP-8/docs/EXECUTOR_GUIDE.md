# 🎮 Guia Completo do Gemini Executor

## 🎯 O que é o Executor?

O **Gemini Executor** é o "braço e mão" do seu sistema de IA. Ele permite que o Gemini Maestro controle fisicamente o computador:

- 🖱️ Mover e clicar o mouse
- ⌨️ Digitar texto e pressionar teclas
- 📸 Capturar screenshots
- 🔄 Rolar páginas
- 🎯 Executar ações complexas via comandos em linguagem natural

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────┐
│     Frontend (React)                        │
│     • Interface de controle                 │
│     • Botão de parada de emergência         │
└──────────────┬──────────────────────────────┘
               │ HTTP/REST
               ▼
┌─────────────────────────────────────────────┐
│     Backend (Node.js/TypeScript)            │
│     • Gemini Maestro                        │
│     • ExecutorService                       │
│     • Rotas de API                          │
└──────────────┬──────────────────────────────┘
               │ WebSocket
               ▼
┌─────────────────────────────────────────────┐
│     Gemini Executor (Python)                │
│     • pyautogui (controle físico)           │
│     • pywinauto (janelas Windows)           │
│     • opencv (visão computacional)          │
│     • pytesseract (OCR)                     │
└─────────────────────────────────────────────┘
```

## 🚀 Instalação Rápida

### 1. Instalar Python e Dependências

```bash
# Verificar Python
python --version  # Deve ser 3.10+

# Navegar para a pasta do executor
cd executor

# Instalar dependências
pip install -r requirements.txt
```

### 2. Configurar Token de Autenticação

Edite `executor/.env`:
```env
AUTH_TOKEN=gemini_executor_secret_2024
```

Adicione o mesmo token em `backend/.env`:
```env
EXECUTOR_AUTH_TOKEN=gemini_executor_secret_2024
```

### 3. Iniciar o Sistema

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Executor:**
```bash
cd executor
python executor.py
```

**Terminal 3 - Frontend:**
```bash
npm run dev
```

### 4. Conectar na Interface

1. Abra http://localhost:5173
2. Vá até o painel "Executor Control"
3. Clique em "Conectar"
4. Aguarde a confirmação ✅

## 📡 API do Executor

### Endpoints Disponíveis

#### Status
```http
GET /api/executor/status
```
Retorna status da conexão e informações da tela.

#### Conectar
```http
POST /api/executor/connect
```

#### Desconectar
```http
POST /api/executor/disconnect
```

#### Mover Mouse
```http
POST /api/executor/mouse/move
Content-Type: application/json

{
  "x": 500,
  "y": 300,
  "duration": 0.5
}
```

#### Clicar
```http
POST /api/executor/mouse/click
Content-Type: application/json

{
  "button": "left",
  "x": 500,
  "y": 300
}
```

#### Digitar
```http
POST /api/executor/keyboard/type
Content-Type: application/json

{
  "text": "Olá mundo!"
}
```

#### Pressionar Tecla
```http
POST /api/executor/keyboard/press
Content-Type: application/json

{
  "key": "enter",
  "presses": 1
}
```

#### Atalho de Teclado
```http
POST /api/executor/keyboard/hotkey
Content-Type: application/json

{
  "keys": ["ctrl", "c"]
}
```

#### Screenshot
```http
POST /api/executor/screen/screenshot
Content-Type: application/json

{
  "filename": "captura.png",
  "region": [0, 0, 800, 600]
}
```

#### Rolar Página
```http
POST /api/executor/screen/scroll
Content-Type: application/json

{
  "amount": -3
}
```

## 🤖 Integração com Gemini Maestro

O Maestro pode interpretar comandos em linguagem natural e executar ações:

```typescript
import { geminiMaestro } from './services/geminiMaestro';

// Comando em linguagem natural
const result = await geminiMaestro.interpretAndExecute(
  "Abra o navegador e pesquise por 'Python tutorial'"
);

console.log(result.explanation);
// "Vou abrir o navegador, clicar na barra de pesquisa e digitar 'Python tutorial'"

console.log(result.actions);
// [
//   { action: "hotkey", params: { keys: ["win", "r"] }, success: true },
//   { action: "type", params: { text: "chrome" }, success: true },
//   { action: "press", params: { key: "enter" }, success: true },
//   ...
// ]
```

## 🔒 Segurança

### Parada de Emergência

**3 formas de parar:**

1. **Botão na Interface:** Clique no botão vermelho "PARAR"
2. **Tecla ESC:** Mova o mouse para o canto superior esquerdo (failsafe do pyautogui)
3. **Ctrl+C:** No terminal do Executor

### Timeout Automático

O Executor para automaticamente após 5 minutos de inatividade (configurável em `.env`).

### Logs de Auditoria

Todas as ações são registradas em:
- `executor/executor.log` - Log geral
- `executor/executor_audit.log` - Auditoria detalhada (JSON)

### Token de Autenticação

O WebSocket usa autenticação via Bearer token. Mantenha o token secreto!

## 🎯 Exemplos de Uso

### Exemplo 1: Automação Simples

```python
# Via Python diretamente
import asyncio
from executor import GeminiExecutor

async def main():
    executor = GeminiExecutor()
    await executor.run()

asyncio.run(main())
```

### Exemplo 2: Via API REST

```javascript
// Mover mouse e clicar
await fetch('http://localhost:3001/api/executor/mouse/move', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ x: 500, y: 300 })
});

await fetch('http://localhost:3001/api/executor/mouse/click', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ button: 'left' })
});
```

### Exemplo 3: Comando em Linguagem Natural

```javascript
// Via Maestro
const result = await geminiMaestro.interpretAndExecute(
  "Copie o texto selecionado e cole no bloco de notas"
);
```

## 🛠️ Solução de Problemas

### Executor não conecta

**Problema:** "Connection refused"

**Solução:**
1. Verifique se o backend está rodando: `http://localhost:3001/health`
2. Confirme que o token no `.env` está correto
3. Verifique firewall/antivírus

### PyAutoGUI não funciona

**Problema:** "No module named 'pyautogui'"

**Solução:**
```bash
pip install pyautogui pillow
```

### Mouse não se move

**Problema:** Comandos são enviados mas nada acontece

**Solução:**
1. Verifique se o Executor está realmente conectado
2. Teste manualmente: `python -c "import pyautogui; pyautogui.moveTo(500, 500)"`
3. No Linux/Mac, pode precisar de permissões especiais

### Timeout muito curto

**Problema:** Executor desconecta rapidamente

**Solução:**
Edite `executor/.env`:
```env
AUTO_TIMEOUT_SECONDS=600  # 10 minutos
```

## 📚 Referências

- [PyAutoGUI Docs](https://pyautogui.readthedocs.io/)
- [PyWinAuto Docs](https://pywinauto.readthedocs.io/)
- [WebSocket Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## 🎓 Próximos Passos

1. ✅ Instalar e conectar o Executor
2. ✅ Testar comandos básicos (mover, clicar)
3. ✅ Experimentar comandos em linguagem natural
4. 🔄 Integrar com fluxos de trabalho personalizados
5. 🚀 Criar automações complexas com o Maestro

## ⚠️ Avisos Importantes

- **Supervisão:** Sempre supervisione as ações do Executor
- **Ambiente Controlado:** Use apenas em ambiente de desenvolvimento/teste
- **Backup:** Faça backup antes de automações críticas
- **Responsabilidade:** Você é responsável pelas ações executadas

---

**Dúvidas?** Consulte a documentação completa ou abra uma issue no repositório.
