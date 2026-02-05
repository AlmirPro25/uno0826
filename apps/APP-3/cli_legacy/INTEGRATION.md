# 🔗 Integração CLI com Frontend

## 📋 Visão Geral

O **Terminal Integrado** no modo chat se comunica com o **Backend PowerShell** via API REST para executar comandos CLI.

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         IntegratedTerminal.tsx                  │    │
│  │  - Interface do terminal                        │    │
│  │  - Input de comandos                            │    │
│  │  - Display de output                            │    │
│  └─────────────────┬──────────────────────────────┘    │
│                    │                                     │
│  ┌─────────────────▼──────────────────────────────┐    │
│  │         TerminalMaestro.ts                      │    │
│  │  - Interpreta comandos (IA)                     │    │
│  │  - Analisa output                               │    │
│  │  - Sugere correções                             │    │
│  └─────────────────┬──────────────────────────────┘    │
│                    │                                     │
└────────────────────┼─────────────────────────────────────┘
                     │
                     │ HTTP POST /api/execute
                     │ { command: "aiweaver list" }
                     │
┌────────────────────▼─────────────────────────────────────┐
│              BACKEND (PowerShell)                         │
│                                                           │
│  ┌────────────────────────────────────────────────┐     │
│  │         backend-server.ps1                      │     │
│  │  - Servidor HTTP (porta 5000)                   │     │
│  │  - Endpoints REST                               │     │
│  │  - Execução de comandos                         │     │
│  └─────────────────┬──────────────────────────────┘     │
│                    │                                      │
│  ┌─────────────────▼──────────────────────────────┐     │
│  │         aiweaver.ps1                            │     │
│  │  - CLI principal                                │     │
│  │  - Comandos: install, start, debug, etc         │     │
│  │  - Gerenciamento de apps                        │     │
│  └─────────────────┬──────────────────────────────┘     │
│                    │                                      │
│  ┌─────────────────▼──────────────────────────────┐     │
│  │         apps.db (JSON)                          │     │
│  │  - Banco de dados de apps                       │     │
│  │  - Logs                                         │     │
│  │  - Histórico                                    │     │
│  └─────────────────────────────────────────────────┘     │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## 🔌 Endpoints da API

### 1. Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "version": "1.0.0",
  "uptime": "00:15:30"
}
```

---

### 2. Executar Comando

```http
POST /api/execute
Content-Type: application/json

{
  "command": "aiweaver list"
}
```

**Response:**
```json
{
  "success": true,
  "output": "📱 APPS INSTALADOS:\n...",
  "exitCode": 0,
  "duration": 125.5,
  "timestamp": "2025-01-13 15:30:00"
}
```

---

### 3. Listar Apps

```http
GET /api/apps
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "apps": [
    {
      "id": "abc123",
      "name": "Meu Dashboard",
      "type": "single-file-html",
      "port": 3000,
      "status": "installed"
    }
  ]
}
```

---

### 4. Instalar App

```http
POST /api/apps
Content-Type: application/json

{
  "name": "Meu App",
  "fileName": "index.html",
  "content": "<!DOCTYPE html>...",
  "type": "single-file-html",
  "port": 3000
}
```

---

### 5. Iniciar App

```http
POST /api/apps/:id/start
```

---

### 6. Parar App

```http
POST /api/apps/:id/stop
```

---

### 7. Ver Logs

```http
GET /api/apps/:id/logs?lines=50
```

---

### 8. Analisar Código

```http
GET /api/apps/:id/analyze
```

---

## 🤖 Terminal Maestro (IA)

O **TerminalMaestro** é um orquestrador inteligente que:

### 1. Interpreta Comandos

```typescript
// Entrada: "instalar meu app"
// Saída: { 
//   intent: "install",
//   cliCommand: "aiweaver install app.html",
//   explanation: "Instalar um novo app"
// }
```

### 2. Analisa Output

```typescript
// Detecta erros automaticamente
// Sugere correções
// Identifica tipo de erro (permission, network, syntax, etc)
```

### 3. Sugere Próximos Comandos

```typescript
// Baseado no contexto
// Histórico de comandos
// Arquivos do projeto
```

---

## 🚀 Como Usar

### 1. Iniciar Backend

```powershell
cd cli
.\backend-server.ps1
```

**Output:**
```
╔═══════════════════════════════════════════╗
║   AI WEB WEAVER - BACKEND SERVER         ║
╚═══════════════════════════════════════════╝

🚀 Iniciando servidor na porta 5000...
✅ Servidor rodando em: http://localhost:5000

📚 ENDPOINTS DISPONÍVEIS:
  GET    /api/health              - Status do servidor
  POST   /api/execute             - Executar comando CLI
  GET    /api/apps                - Listar apps
  POST   /api/apps                - Instalar app
  ...
```

---

### 2. Abrir Frontend

```powershell
npm run dev
```

Navegue para o **modo chat** e o terminal estará disponível na parte inferior do editor.

---

### 3. Executar Comandos

No terminal integrado, digite:

```bash
aiweaver help
```

Ou use linguagem natural:

```bash
listar todos os apps
```

```bash
instalar meu dashboard
```

---

## 💡 Exemplos de Uso

### Exemplo 1: Listar Apps

**Terminal:**
```bash
$ aiweaver list
```

**Output:**
```
📱 APPS INSTALADOS:
==================================================

🔹 Meu Dashboard
   ID: abc123
   Tipo: single-file-html
   Porta: 3000
   Status: installed
   Instalado: 2025-01-13 10:30:00

🔹 API Backend
   ID: def456
   Tipo: node-backend
   Porta: 3001
   Status: running
   Instalado: 2025-01-13 11:00:00
```

---

### Exemplo 2: Linguagem Natural

**Terminal:**
```bash
$ instalar meu app
```

**Maestro interpreta:**
```
🤖 Analisando comando...
💡 Instalar um novo app
⚡ Executando comando...
```

**Output:**
```
✅ Comando executado com sucesso!
```

---

### Exemplo 3: Erro com Sugestão

**Terminal:**
```bash
$ aiweaver start xyz999
```

**Output:**
```
❌ App não encontrado: xyz999
💡 Sugestão: Use 'aiweaver list' para ver apps disponíveis
```

---

## 🔧 Desenvolvimento

### Adicionar Novo Comando

#### 1. Backend (backend-server.ps1)

```powershell
function Execute-CliCommand {
    # ...
    switch ($action) {
        "meucomando" {
            $output = "Executando meu comando..."
            # Lógica aqui
        }
    }
}
```

#### 2. Maestro (TerminalMaestro.ts)

```typescript
private fallbackInterpretation(userInput: string): MaestroResponse {
    if (input.includes('meucomando')) {
        return {
            understood: true,
            intent: 'meucomando',
            cliCommand: 'aiweaver meucomando',
            explanation: 'Executar meu comando',
            needsConfirmation: false
        };
    }
}
```

---

## 🐛 Troubleshooting

### Backend Offline

**Erro:**
```
❌ Backend offline. Inicie o servidor:

cd cli
.\backend-server.ps1
```

**Solução:**
Inicie o backend PowerShell.

---

### Porta em Uso

**Erro:**
```
Erro ao iniciar servidor: porta 5000 já em uso
```

**Solução:**
```powershell
# Usar porta diferente
.\backend-server.ps1 -Port 5001
```

---

### Permissão Negada

**Erro:**
```
❌ Permissão negada
💡 Sugestão: Execute o PowerShell como Administrador
```

**Solução:**
Execute PowerShell como Administrador.

---

## 📊 Fluxo Completo

```
1. Usuário digita comando no terminal
   ↓
2. IntegratedTerminal captura input
   ↓
3. TerminalMaestro interpreta comando (IA)
   ↓
4. POST /api/execute enviado ao backend
   ↓
5. Backend PowerShell executa comando
   ↓
6. Output retornado ao frontend
   ↓
7. TerminalMaestro analisa output (IA)
   ↓
8. Resultado exibido no terminal
   ↓
9. Sugestões de próximos comandos
```

---

## 🎯 Recursos Avançados

### 1. Auto-Completar

Digite parte do comando e pressione **Tab**:

```bash
$ aiwe[TAB]
$ aiweaver 
```

---

### 2. Histórico

Use **↑** e **↓** para navegar no histórico de comandos.

---

### 3. Sugestões Inteligentes

O Maestro sugere comandos baseado no contexto:

```bash
$ aiweaver install app.html
✅ App instalado com sucesso!

💡 Sugestões:
  - aiweaver list
  - aiweaver start abc123
```

---

### 4. Análise de Erros

Erros são automaticamente analisados:

```bash
$ aiweaver start abc123
❌ Erro: Porta 3000 já em uso
💡 Sugestão: Use porta diferente ou pare o processo
🔧 Correção automática: aiweaver start abc123 --port 8080
```

---

## 🚀 Próximos Passos

- [ ] Implementar todos os comandos CLI
- [ ] Auto-fix de erros comuns
- [ ] Integração com Git
- [ ] Deploy automático
- [ ] Testes automatizados
- [ ] Monitoramento em tempo real

---

**Feito com ❤️ para AI Web Weaver**
