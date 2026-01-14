# 🚀 Guia Rápido - AI Web Weaver CLI

## ⚡ Instalação em 3 Passos

### 1️⃣ Instalar o CLI

```powershell
# Abra PowerShell como Administrador
cd cli
.\install.ps1
```

### 2️⃣ Reiniciar PowerShell

Feche e abra novamente o PowerShell para carregar o alias.

### 3️⃣ Testar

```powershell
aiweaver help
```

---

## 🎯 Uso Básico

### Instalar um App

```powershell
# Instalar app HTML gerado pelo AI Web Weaver
aiweaver install meu-app.html "Meu Dashboard"
```

**Output:**
```
✅ App instalado com sucesso!
ℹ️  ID: abc123
ℹ️  Nome: Meu Dashboard
ℹ️  Tipo: single-file-html
ℹ️  Porta: 3000
```

---

### Iniciar o App

```powershell
aiweaver start abc123
```

O navegador abrirá automaticamente em `http://localhost:3000`

---

### Ver Apps Instalados

```powershell
aiweaver list
```

---

### Debug de App

```powershell
aiweaver debug abc123
```

**Mostra:**
- 📊 Análise de código
- 🔍 Problemas detectados
- 📝 Logs em tempo real
- ⚡ Score de qualidade

---

## 🌐 Backend Server

### Iniciar Backend

```powershell
.\backend-server.ps1
```

**Servidor rodará em:** `http://localhost:5000`

---

### Testar API

```powershell
# Health check
curl http://localhost:5000/api/health

# Listar apps
curl http://localhost:5000/api/apps
```

---

## 🖥️ Interface Web

### Abrir Interface

```powershell
# Iniciar backend
.\backend-server.ps1

# Em outro terminal, abrir interface
start integration-example.html
```

**Recursos da Interface:**
- ✅ Listar apps instalados
- ✅ Instalar novos apps
- ✅ Iniciar/Parar apps
- ✅ Ver logs em tempo real
- ✅ Analisar código
- ✅ Remover apps

---

## 📝 Exemplo Completo

### Cenário: Instalar e Rodar App de Dashboard

```powershell
# 1. Criar arquivo HTML (ou usar gerado pelo AI Web Weaver)
$html = @"
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meu Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white p-8">
    <h1 class="text-4xl font-bold mb-4">📊 Dashboard</h1>
    <div class="grid grid-cols-3 gap-4">
        <div class="bg-blue-600 p-6 rounded-lg">
            <h2 class="text-2xl font-bold">1,234</h2>
            <p>Usuários</p>
        </div>
        <div class="bg-green-600 p-6 rounded-lg">
            <h2 class="text-2xl font-bold">R$ 45,678</h2>
            <p>Vendas</p>
        </div>
        <div class="bg-purple-600 p-6 rounded-lg">
            <h2 class="text-2xl font-bold">89%</h2>
            <p>Satisfação</p>
        </div>
    </div>
</body>
</html>
"@

# 2. Salvar arquivo
$html | Out-File -FilePath "dashboard.html" -Encoding UTF8

# 3. Instalar
aiweaver install dashboard.html "Dashboard de Vendas"

# 4. Listar para pegar ID
aiweaver list

# 5. Iniciar (substitua abc123 pelo ID real)
aiweaver start abc123

# 6. Debug (opcional)
aiweaver debug abc123
```

---

## 🔥 Comandos Mais Usados

```powershell
# Instalar app
aiweaver install app.html

# Listar apps
aiweaver list

# Iniciar app
aiweaver start <id>

# Debug app
aiweaver debug <id>

# Ver logs
aiweaver logs <id>

# Remover app
aiweaver remove <id>

# Ajuda
aiweaver help
```

---

## 🎓 Dicas Pro

### 1. Usar com AI Web Weaver

```powershell
# No AI Web Weaver, após gerar um app:
# 1. Exportar o HTML
# 2. Instalar via CLI
aiweaver install app-gerado.html "Meu Projeto"

# 3. Iniciar
aiweaver start <id>
```

---

### 2. Debug Automático

```powershell
# Instalar e debugar em um comando
$id = aiweaver install app.html
aiweaver debug $id --verbose
```

---

### 3. Monitorar Múltiplos Apps

```powershell
# Terminal 1: Backend
.\backend-server.ps1

# Terminal 2: App 1
aiweaver start abc123

# Terminal 3: App 2
aiweaver start def456

# Terminal 4: Logs
aiweaver logs abc123 --follow
```

---

### 4. Integração com Frontend

```javascript
// No seu frontend do AI Web Weaver
async function deployApp(htmlContent, appName) {
    const response = await fetch('http://localhost:5000/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: appName,
            fileName: 'index.html',
            content: htmlContent,
            type: 'single-file-html',
            port: 3000
        })
    });
    
    const data = await response.json();
    
    if (data.success) {
        // Iniciar app automaticamente
        await fetch(`http://localhost:5000/api/apps/${data.app.id}/start`, {
            method: 'POST'
        });
        
        // Abrir no navegador
        window.open(`http://localhost:3000`, '_blank');
    }
}
```

---

## 🐛 Troubleshooting Rápido

### Problema: "aiweaver não é reconhecido"

```powershell
# Solução 1: Recarregar perfil
. $PROFILE

# Solução 2: Reinstalar
cd cli
.\install.ps1
```

---

### Problema: "Porta já em uso"

```powershell
# Ver processo na porta
Get-NetTCPConnection -LocalPort 3000

# Matar processo
Stop-Process -Id <PID>

# Ou usar porta diferente
aiweaver start abc123 --port 8080
```

---

### Problema: "Backend não responde"

```powershell
# Verificar se está rodando
Get-Process | Where-Object { $_.ProcessName -like "*powershell*" }

# Reiniciar backend
.\backend-server.ps1
```

---

## 📚 Próximos Passos

1. ✅ **Instale o CLI**: `.\install.ps1`
2. ✅ **Teste com um app**: `aiweaver install exemplo.html`
3. ✅ **Inicie o backend**: `.\backend-server.ps1`
4. ✅ **Abra a interface**: `start integration-example.html`
5. ✅ **Integre com AI Web Weaver**: Use a API REST

---

## 🎯 Recursos Avançados

### Auto-Deploy

Crie um script para auto-deploy:

```powershell
# auto-deploy.ps1
param([string]$HtmlFile)

# Instalar
$output = aiweaver install $HtmlFile | Out-String
$id = ($output -match "ID: (\w+)") ? $Matches[1] : $null

if ($id) {
    # Iniciar
    aiweaver start $id
    
    # Abrir navegador
    Start-Sleep -Seconds 2
    start "http://localhost:3000"
}
```

**Uso:**
```powershell
.\auto-deploy.ps1 meu-app.html
```

---

### Backup Automático

```powershell
# backup.ps1
$backupDir = "$HOME\.aiweaver\backups"
New-Item -ItemType Directory -Path $backupDir -Force

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFile = "$backupDir\backup_$timestamp.zip"

Compress-Archive -Path "$HOME\.aiweaver\apps" -DestinationPath $backupFile
Write-Host "✅ Backup criado: $backupFile"
```

---

### Monitor de Performance

```powershell
# monitor.ps1
param([string]$AppId)

while ($true) {
    Clear-Host
    Write-Host "📊 MONITOR - App: $AppId" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Status
    $app = (Get-Content "$HOME\.aiweaver\apps.db" | ConvertFrom-Json).apps | 
           Where-Object { $_.id -eq $AppId }
    
    Write-Host "Status: $($app.status)"
    Write-Host "Porta: $($app.port)"
    
    # Logs recentes
    Write-Host "`nÚltimos logs:"
    Get-Content "$HOME\.aiweaver\logs\$AppId.log" -Tail 5
    
    Start-Sleep -Seconds 5
}
```

---

**Pronto! Agora você tem um CLI completo para gerenciar seus apps! 🚀**
