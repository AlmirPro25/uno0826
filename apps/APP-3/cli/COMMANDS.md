# 📚 Comandos CLI - Referência Completa

## ✅ Comandos Implementados

### 📋 Informações

#### `aiweaver help`
Mostra ajuda completa dos comandos.

**Aliases:** `help`, `ajuda`, `?`

**Exemplo:**
```bash
$ aiweaver help
```

---

#### `aiweaver version`
Mostra versão do CLI, backend e PowerShell.

**Aliases:** `version`, `versao`

**Exemplo:**
```bash
$ aiweaver version
```

**Output:**
```
🚀 AI Web Weaver CLI
==================================================

CLI Version: 1.0.0
Backend Server: 1.0.0
PowerShell: 7.4.0
OS: Windows 10.0.22631
```

---

#### `aiweaver status`
Mostra status do sistema e apps rodando.

**Aliases:** `status`, `info`

**Exemplo:**
```bash
$ aiweaver status
```

**Output:**
```
📊 STATUS DO SISTEMA
==================================================

🟢 Backend: Online
📱 Apps Instalados: 3
🚀 Apps Rodando: 1
💾 Banco de Dados: C:\Users\...\apps.db
📁 Diretório Apps: C:\Users\...\.aiweaver\apps

🟢 APPS RODANDO:
  - Meu Dashboard (porta 3000)
```

---

### 📱 Gerenciamento de Apps

#### `aiweaver list`
Lista todos os apps instalados.

**Aliases:** `list`, `listar`, `ls`

**Exemplo:**
```bash
$ aiweaver list
```

**Output:**
```
📱 APPS INSTALADOS:
==================================================

🟢 Meu Dashboard
   ID: abc123
   Tipo: single-file-html
   Porta: 3000
   Status: running
   Instalado: 2025-01-13 10:30:00

⚪ API Backend
   ID: def456
   Tipo: node-backend
   Porta: 3001
   Status: installed
   Instalado: 2025-01-13 11:00:00
```

---

#### `aiweaver start <app-id>`
Inicia um app instalado.

**Aliases:** `start`, `iniciar`, `run`

**Exemplo:**
```bash
$ aiweaver start abc123
```

**Output:**
```
✅ App iniciado com sucesso!

🌐 URL: http://localhost:3000
📊 Job ID: 12345

💡 Use 'aiweaver logs abc123' para ver os logs
```

---

#### `aiweaver stop <app-id>`
Para um app em execução.

**Aliases:** `stop`, `parar`, `kill`

**Exemplo:**
```bash
$ aiweaver stop abc123
```

**Output:**
```
✅ App parado com sucesso!
```

---

#### `aiweaver remove <app-id>`
Remove um app instalado.

**Aliases:** `remove`, `remover`, `deletar`, `delete`, `rm`

**Exemplo:**
```bash
$ aiweaver remove abc123
```

**Output:**
```
✅ App 'Meu Dashboard' removido com sucesso!
```

**⚠️ Atenção:** Esta ação é irreversível!

---

### 🔍 Análise e Debug

#### `aiweaver logs <app-id> [linhas]`
Mostra logs de um app.

**Aliases:** `logs`, `log`

**Parâmetros:**
- `app-id` (obrigatório) - ID do app
- `linhas` (opcional) - Número de linhas (padrão: 50)

**Exemplo:**
```bash
$ aiweaver logs abc123
$ aiweaver logs abc123 100
```

**Output:**
```
📝 LOGS DO APP: abc123
==================================================

[2025-01-13 10:30:00] [info] App iniciado
[2025-01-13 10:30:05] [info] Request: /
[2025-01-13 10:30:10] [info] Request: /api/data
```

---

#### `aiweaver analyze <app-id>`
Analisa código de um app.

**Aliases:** `analyze`, `analisar`, `check`

**Exemplo:**
```bash
$ aiweaver analyze abc123
```

**Output:**
```
📊 ANÁLISE DE CÓDIGO
==================================================

📝 Linhas: 450
🔧 Funções: 12
📦 Variáveis: 35
💬 Comentários: 8
🌐 APIs Externas: 2
⭐ Score: 85/100

⚠️  PROBLEMAS ENCONTRADOS:
  - Console.log encontrado (remover em produção)
  - 2 imagens sem atributo alt
```

---

#### `aiweaver debug <app-id>`
Modo debug completo com análise + logs.

**Aliases:** `debug`, `debugar`, `inspect`

**Exemplo:**
```bash
$ aiweaver debug abc123
```

**Output:**
```
🐛 DEBUG MODE: Meu Dashboard
==================================================

📋 INFORMAÇÕES:
  ID: abc123
  Tipo: single-file-html
  Porta: 3000
  Status: running

📊 ANÁLISE:
  Score: 85/100
  Problemas: 2

📝 ÚLTIMOS LOGS:
[2025-01-13 10:30:00] [info] App iniciado
[2025-01-13 10:30:05] [info] Request: /
```

---

### 🛠️ Utilitários

#### `aiweaver clear`
Limpa o terminal.

**Aliases:** `clear`, `limpar`, `cls`

**Exemplo:**
```bash
$ aiweaver clear
```

---

#### `aiweaver install <arquivo> [nome]`
Instala um app (via PowerShell direto).

**Status:** ⚠️ Use API REST ou PowerShell direto

**Exemplo:**
```bash
$ aiweaver install app.html "Meu App"
```

**Alternativas:**
1. Use a API REST
2. Use o frontend do AI Web Weaver
3. Use PowerShell: `.\aiweaver.ps1 install app.html`

---

## 🌐 Comandos em Português

Todos os comandos têm aliases em português:

```bash
# Informações
ajuda              → aiweaver help
versao             → aiweaver version

# Gerenciamento
listar             → aiweaver list
iniciar <id>       → aiweaver start <id>
parar <id>         → aiweaver stop <id>
remover <id>       → aiweaver remove <id>
deletar <id>       → aiweaver remove <id>

# Análise
analisar <id>      → aiweaver analyze <id>
debugar <id>       → aiweaver debug <id>

# Utilitários
limpar             → aiweaver clear
```

---

## 💡 Linguagem Natural

O Maestro de IA interpreta comandos em linguagem natural:

```bash
# Exemplos que funcionam:
$ listar todos os apps
$ mostrar os apps instalados
$ iniciar o app abc123
$ parar o dashboard
$ ver logs do último app
$ analisar o código
$ me ajuda
$ limpar a tela
```

---

## 🎯 Atalhos Rápidos

```bash
?          → aiweaver help
ls         → aiweaver list
cls        → aiweaver clear
info       → aiweaver status
```

---

## 📊 Códigos de Saída

- `0` - Sucesso
- `1` - Erro (comando inválido, app não encontrado, etc)

---

## 🎨 Cores no Output

- 🔵 **Azul** - Comandos
- ⚪ **Branco** - Output normal
- 🔴 **Vermelho** - Erros
- 🟢 **Verde** - Sugestões
- 🟡 **Amarelo** - Info

---

## 🔥 Exemplos Práticos

### Fluxo Completo

```bash
# 1. Ver status
$ aiweaver status

# 2. Listar apps
$ aiweaver list

# 3. Iniciar app
$ aiweaver start abc123

# 4. Ver logs
$ aiweaver logs abc123

# 5. Analisar código
$ aiweaver analyze abc123

# 6. Debug completo
$ aiweaver debug abc123

# 7. Parar app
$ aiweaver stop abc123
```

---

### Troubleshooting

```bash
# Ver status do sistema
$ aiweaver status

# Ver logs de erro
$ aiweaver logs abc123 100

# Análise de código
$ aiweaver analyze abc123

# Debug completo
$ aiweaver debug abc123
```

---

### Manutenção

```bash
# Listar apps
$ aiweaver list

# Remover app antigo
$ aiweaver remove old123

# Limpar terminal
$ aiweaver clear
```

---

## 🚀 Próximos Comandos

### Em Desenvolvimento

- `aiweaver restart <id>` - Reiniciar app
- `aiweaver update <id>` - Atualizar app
- `aiweaver backup` - Backup de todos os apps
- `aiweaver restore <backup>` - Restaurar backup
- `aiweaver deploy <id>` - Deploy para produção
- `aiweaver test <id>` - Executar testes

---

## 📚 Documentação

- **Guia Completo:** `cli/README.md`
- **Integração:** `cli/INTEGRATION.md`
- **Testes:** `cli/TEST_GUIDE.md`
- **Resumo:** `cli/FINAL_SUMMARY.md`

---

**Feito com ❤️ para AI Web Weaver**
