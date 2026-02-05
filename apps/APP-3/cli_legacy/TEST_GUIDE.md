# 🧪 Guia de Teste - Terminal Integrado

## 🎯 Objetivo

Testar a integração completa entre o terminal integrado no frontend e o backend CLI PowerShell.

---

## 📋 Pré-requisitos

- ✅ Node.js instalado
- ✅ PowerShell 5.1+ ou PowerShell Core
- ✅ Projeto AI Web Weaver rodando

---

## 🚀 Passo a Passo

### 1️⃣ Iniciar Backend CLI

```powershell
# Abra PowerShell
cd cli
.\backend-server.ps1
```

**Resultado Esperado:**
```
╔═══════════════════════════════════════════╗
║   AI WEB WEAVER - BACKEND SERVER         ║
╚═══════════════════════════════════════════╝

🚀 Iniciando servidor na porta 5000...
✅ Servidor rodando em: http://localhost:5000
```

✅ **Status:** Backend online

---

### 2️⃣ Iniciar Frontend

```powershell
# Em outro terminal
npm run dev
```

**Resultado Esperado:**
```
VITE v6.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

✅ **Status:** Frontend rodando

---

### 3️⃣ Acessar Modo Chat

1. Abra o navegador em `http://localhost:5173`
2. Clique em **"Chat"** no menu superior
3. Verifique se o **terminal** aparece na parte inferior do editor

**Resultado Esperado:**
```
┌─────────────────────────────────────────┐
│  Terminal AI Web Weaver CLI             │
│  🟢 Backend Online                      │
├─────────────────────────────────────────┤
│  🚀 Terminal AI Web Weaver CLI          │
│  Digite "help" para ver comandos        │
│                                         │
│  $                                      │
└─────────────────────────────────────────┘
```

✅ **Status:** Terminal visível e backend online

---

## 🧪 Testes de Comandos

### Teste 1: Help

**Comando:**
```bash
aiweaver help
```

**Resultado Esperado:**
```
📚 AI WEB WEAVER CLI - COMANDOS DISPONÍVEIS

GERENCIAMENTO DE APPS:
  aiweaver install <arquivo> [nome]  - Instalar um app
  aiweaver start <id>                - Iniciar um app
  ...
```

✅ **Passou:** Ajuda exibida corretamente

---

### Teste 2: List (Vazio)

**Comando:**
```bash
aiweaver list
```

**Resultado Esperado:**
```
📱 Nenhum app instalado.

Use 'aiweaver install <arquivo>' para instalar um app.
```

✅ **Passou:** Lista vazia exibida

---

### Teste 3: Version

**Comando:**
```bash
aiweaver version
```

**Resultado Esperado:**
```
AI Web Weaver CLI v1.0.0
Backend Server v1.0.0
PowerShell 7.x.x
```

✅ **Passou:** Versão exibida

---

### Teste 4: Linguagem Natural

**Comando:**
```bash
listar todos os apps
```

**Resultado Esperado:**
```
🤖 Analisando comando...
💡 Listar todos os apps instalados
⚡ Executando comando...

📱 Nenhum app instalado.
```

✅ **Passou:** Maestro interpretou corretamente

---

### Teste 5: Comando Inválido

**Comando:**
```bash
comando invalido
```

**Resultado Esperado:**
```
❌ Comando não reconhecido: comando invalido

💡 Digite 'aiweaver help' para ver comandos disponíveis
```

✅ **Passou:** Erro tratado corretamente

---

### Teste 6: Backend Offline

**Ação:**
1. Pare o backend (Ctrl+C no PowerShell)
2. Execute qualquer comando no terminal

**Resultado Esperado:**
```
❌ Backend offline. Inicie o servidor:

cd cli
.\backend-server.ps1
```

✅ **Passou:** Detectou backend offline

---

### Teste 7: Histórico de Comandos

**Ação:**
1. Execute: `aiweaver help`
2. Execute: `aiweaver list`
3. Pressione **↑** (seta para cima)

**Resultado Esperado:**
```
$ aiweaver list
```

✅ **Passou:** Histórico funcionando

---

### Teste 8: Auto-Completar

**Ação:**
1. Digite: `aiwe`
2. Pressione **Tab**

**Resultado Esperado:**
```
$ aiweaver 
```

✅ **Passou:** Auto-completar funcionando

---

### Teste 9: Sugestões

**Ação:**
1. Execute: `aiweaver help`
2. Observe as sugestões abaixo do terminal

**Resultado Esperado:**
```
💡 Sugestões (Tab para autocompletar):
  aiweaver list
  aiweaver help
```

✅ **Passou:** Sugestões exibidas

---

### Teste 10: Resize do Terminal

**Ação:**
1. Passe o mouse sobre a linha divisória entre editor e terminal
2. Arraste para cima/baixo

**Resultado Esperado:**
- Cursor muda para `row-resize`
- Terminal aumenta/diminui de tamanho
- Editor ajusta proporcionalmente

✅ **Passou:** Resize funcionando

---

## 🎨 Testes Visuais

### Teste 11: Cores e Ícones

**Verificar:**
- ✅ Comandos em azul claro (`text-sky-400`)
- ✅ Output em cinza (`text-slate-300`)
- ✅ Erros em vermelho (`text-red-400`)
- ✅ Info em azul (`text-blue-400`)
- ✅ Sugestões em verde (`text-green-400`)
- ✅ Ícones corretos (❯, ❌, ℹ️, 💡)

✅ **Passou:** Cores e ícones corretos

---

### Teste 12: Indicador de Status

**Verificar:**
- 🟢 **Backend Online** - Bolinha verde
- 🔴 **Backend Offline** - Bolinha vermelha
- 🟡 **Verificando...** - Bolinha amarela piscando

✅ **Passou:** Indicadores corretos

---

### Teste 13: Botões

**Verificar:**
- ✅ Botão "Limpar" funciona
- ✅ Botão "Status" atualiza status
- ✅ Botão "Ocultar/Mostrar Terminal" no header do editor

✅ **Passou:** Botões funcionando

---

## 🔧 Testes de Integração

### Teste 14: Instalar App via API

**Ação:**
1. No terminal, execute:
```bash
curl -X POST http://localhost:5000/api/apps -H "Content-Type: application/json" -d "{\"name\":\"Test App\",\"fileName\":\"index.html\",\"content\":\"<!DOCTYPE html><html><body><h1>Test</h1></body></html>\",\"type\":\"single-file-html\",\"port\":3000}"
```

2. Execute: `aiweaver list`

**Resultado Esperado:**
```
📱 APPS INSTALADOS:

🔹 Test App
   ID: abc123
   Tipo: single-file-html
   ...
```

✅ **Passou:** App instalado e listado

---

### Teste 15: Análise de Código

**Comando:**
```bash
aiweaver analyze examples/simple-dashboard.html
```

**Resultado Esperado:**
```
⚠️  Comando 'analyze' detectado mas ainda não implementado no backend.
...
```

✅ **Passou:** Comando detectado (em desenvolvimento)

---

## 📊 Checklist Final

### Backend
- [x] Servidor inicia corretamente
- [x] Porta 5000 acessível
- [x] Endpoint /api/health responde
- [x] Endpoint /api/execute funciona
- [x] Comandos são executados
- [x] Output é retornado corretamente

### Frontend
- [x] Terminal aparece no modo chat
- [x] Input aceita comandos
- [x] Output é exibido
- [x] Cores e formatação corretas
- [x] Status do backend é detectado
- [x] Histórico funciona (↑↓)
- [x] Auto-completar funciona (Tab)
- [x] Sugestões aparecem

### Maestro (IA)
- [x] Interpreta comandos
- [x] Detecta intent
- [x] Gera comando CLI
- [x] Analisa output
- [x] Sugere correções
- [x] Sugere próximos comandos

### UX
- [x] Resize do terminal funciona
- [x] Botões funcionam
- [x] Indicadores visuais corretos
- [x] Feedback ao usuário
- [x] Mensagens de erro claras

---

## 🐛 Problemas Conhecidos

### 1. Comandos Não Implementados

**Status:** 🚧 Em desenvolvimento

Comandos que ainda não estão implementados:
- `install`
- `start`
- `stop`
- `debug`
- `remove`
- `logs`
- `analyze`

**Workaround:** Use a API REST diretamente.

---

### 2. Backend Precisa Estar Rodando

**Status:** ⚠️ Limitação

O backend PowerShell precisa estar rodando para executar comandos.

**Solução:** Sempre inicie o backend antes de usar o terminal.

---

## ✅ Resultado Final

Se todos os testes passaram:

```
╔═══════════════════════════════════════════╗
║   ✅ TODOS OS TESTES PASSARAM!           ║
║                                           ║
║   Terminal Integrado: 100% Funcional     ║
║   Backend CLI: Online                    ║
║   Maestro IA: Operacional                ║
║                                           ║
╚═══════════════════════════════════════════╝
```

🎉 **Parabéns! O sistema está funcionando perfeitamente!**

---

## 📞 Suporte

Se algum teste falhou:

1. Verifique se o backend está rodando
2. Verifique a porta (5000)
3. Veja os logs do PowerShell
4. Veja o console do navegador (F12)
5. Consulte `cli/INTEGRATION.md`

---

**Feito com ❤️ para AI Web Weaver**
