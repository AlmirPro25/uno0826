# 🎯 Guia Completo - Gerenciamento de Projetos

## 🎉 Sistema Completo Implementado!

Você agora tem **3 formas** de gerenciar seus projetos:
1. **Interface Web** (ChatView com botões)
2. **CLI PowerShell** (project-manager.ps1)
3. **Dashboard Web** (project-dashboard.html)

---

## 📊 Seus Projetos

### Estatísticas Atuais
- **Total:** 386 projetos
- **Tamanho:** 8.57 MB
- **Localização:** `C:\Users\hkli\.aiweaver\projects\`
- **Criados:** Todos hoje!

---

## 🚀 Método 1: Interface Web (Recomendado)

### Iniciar Sistema
```powershell
# Terminal 1: Backend
cd cli
.\backend-simple.ps1

# Terminal 2: Frontend
npm run dev
```

### Usar Interface
1. Abra http://localhost:5173
2. Vá para modo "Chat"
3. Use os botões:
   - **💾 Salvar** - Salva projeto no HD
   - **📦 Instalar** - Instala como app
   - **📁 Abrir Pasta** - Abre no Explorer

### Vantagens
✅ Interface visual intuitiva
✅ Auto-save automático
✅ Feedback em tempo real
✅ Integração completa

---

## 🔧 Método 2: CLI PowerShell

### Comandos Disponíveis

#### Listar Projetos
```powershell
# Listar 10 mais recentes
.\cli\project-manager.ps1 list -Recent

# Listar todos
.\cli\project-manager.ps1 list -All

# Listar 5 mais recentes
.\cli\project-manager.ps1 list -Recent -Limit 5
```

#### Ver Detalhes
```powershell
# Ver detalhes de um projeto
.\cli\project-manager.ps1 show 70132819
```

#### Abrir Projeto
```powershell
# Abrir no Explorer
.\cli\project-manager.ps1 open 70132819

# Abrir no navegador
.\cli\project-manager.ps1 browser 70132819

# Abrir no VS Code
.\cli\project-manager.ps1 code 70132819
```

#### Gerenciar Projetos
```powershell
# Exportar projeto (ZIP)
.\cli\project-manager.ps1 export 70132819

# Remover projeto
.\cli\project-manager.ps1 remove 70132819

# Buscar projetos
.\cli\project-manager.ps1 search dashboard
```

#### Estatísticas
```powershell
# Ver estatísticas gerais
.\cli\project-manager.ps1 stats
```

#### Ajuda
```powershell
# Ver todos os comandos
.\cli\project-manager.ps1 help
```

### Vantagens
✅ Rápido e direto
✅ Automação fácil
✅ Scripts personalizáveis
✅ Sem dependências

---

## 🌐 Método 3: Dashboard Web

### Iniciar Dashboard

#### Passo 1: Iniciar Backend
```powershell
cd cli
.\backend-simple.ps1
```

#### Passo 2: Abrir Dashboard
```powershell
# Abrir no navegador
start cli\project-dashboard.html
```

### Recursos do Dashboard
- 📊 **Estatísticas em tempo real**
- 🔍 **Busca de projetos**
- 📁 **Visualização em grid**
- 🎨 **Interface moderna**
- ⚡ **Ações rápidas**

### Funcionalidades
1. **Ver todos os projetos** em cards visuais
2. **Buscar** por nome ou ID
3. **Ordenar** por data, nome ou tamanho
4. **Abrir** projeto no Explorer
5. **Instalar** projeto como app
6. **Atualizar** lista em tempo real

### Vantagens
✅ Visual e intuitivo
✅ Estatísticas em tempo real
✅ Busca e filtros
✅ Ações com um clique

---

## 📋 Comparação dos Métodos

| Recurso | Interface Web | CLI PowerShell | Dashboard Web |
|---------|--------------|----------------|---------------|
| Visual | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ |
| Velocidade | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Automação | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Facilidade | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Recursos | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 🎯 Casos de Uso

### Caso 1: Desenvolvimento Diário
**Melhor método:** Interface Web
```
1. npm run dev
2. Criar projetos no chat
3. Auto-save automático
4. Instalar e testar
```

### Caso 2: Gerenciamento Rápido
**Melhor método:** CLI PowerShell
```powershell
# Ver projetos recentes
.\cli\project-manager.ps1 list -Recent -Limit 5

# Abrir o mais recente
.\cli\project-manager.ps1 browser 70132819
```

### Caso 3: Visualização Geral
**Melhor método:** Dashboard Web
```
1. Abrir dashboard
2. Ver estatísticas
3. Buscar projetos
4. Gerenciar visualmente
```

### Caso 4: Automação
**Melhor método:** CLI PowerShell
```powershell
# Script para backup diário
$projects = Get-ChildItem "$HOME\.aiweaver\projects"
$projects | ForEach-Object {
    .\cli\project-manager.ps1 export $_.Name
}
```

---

## 💡 Dicas e Truques

### Dica 1: Atalhos PowerShell
```powershell
# Criar alias
Set-Alias pm ".\cli\project-manager.ps1"

# Usar alias
pm list -Recent
pm open 70132819
```

### Dica 2: Abrir Projeto Mais Recente
```powershell
# PowerShell one-liner
$latest = (Get-ChildItem "$HOME\.aiweaver\projects" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).Name
.\cli\project-manager.ps1 browser $latest
```

### Dica 3: Backup Automático
```powershell
# Adicionar ao Task Scheduler
$trigger = New-ScheduledTaskTrigger -Daily -At 9am
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\path\to\backup-script.ps1"
Register-ScheduledTask -TaskName "Backup AI Weaver" -Trigger $trigger -Action $action
```

### Dica 4: Dashboard como Página Inicial
```
1. Abrir Chrome/Edge
2. Configurações → Ao iniciar
3. Adicionar: file:///C:/path/to/cli/project-dashboard.html
```

---

## 🔥 Workflows Avançados

### Workflow 1: Desenvolvimento Completo
```
1. Interface Web: Criar projeto
2. Auto-save: Salva automaticamente
3. CLI: Abrir no VS Code
4. Editar código
5. CLI: Abrir no navegador
6. Testar
7. Interface Web: Instalar como app
```

### Workflow 2: Gerenciamento em Lote
```powershell
# Exportar todos os projetos de hoje
$today = Get-Date
Get-ChildItem "$HOME\.aiweaver\projects" | 
    Where-Object { $_.LastWriteTime.Date -eq $today.Date } |
    ForEach-Object {
        .\cli\project-manager.ps1 export $_.Name
    }
```

### Workflow 3: Análise de Projetos
```powershell
# Encontrar projetos grandes
Get-ChildItem "$HOME\.aiweaver\projects" -Recurse -File |
    Group-Object Directory |
    Select-Object Name, @{N='Size';E={($_.Group | Measure-Object Length -Sum).Sum}} |
    Sort-Object Size -Descending |
    Select-Object -First 10
```

---

## 📊 Monitoramento

### Ver Crescimento de Projetos
```powershell
# Projetos por dia
Get-ChildItem "$HOME\.aiweaver\projects" |
    Group-Object {$_.LastWriteTime.Date} |
    Select-Object Name, Count |
    Sort-Object Name
```

### Ver Uso de Espaço
```powershell
# Tamanho por projeto
Get-ChildItem "$HOME\.aiweaver\projects" |
    ForEach-Object {
        $size = (Get-ChildItem $_.FullName -Recurse | Measure-Object Length -Sum).Sum
        [PSCustomObject]@{
            Project = $_.Name
            SizeMB = [math]::Round($size/1MB, 2)
        }
    } |
    Sort-Object SizeMB -Descending |
    Select-Object -First 10
```

---

## 🎉 Resumo

Você tem **3 ferramentas poderosas** para gerenciar seus 386 projetos:

1. **Interface Web** - Para desenvolvimento diário
2. **CLI PowerShell** - Para automação e velocidade
3. **Dashboard Web** - Para visualização e gerenciamento

**Escolha a ferramenta certa para cada tarefa!**

---

## 📞 Comandos Rápidos

```powershell
# Ver estatísticas
.\cli\project-manager.ps1 stats

# Listar recentes
.\cli\project-manager.ps1 list -Recent -Limit 5

# Abrir dashboard
start cli\project-dashboard.html

# Abrir projeto
.\cli\project-manager.ps1 browser [ID]

# Exportar projeto
.\cli\project-manager.ps1 export [ID]
```

---

**Criado com ❤️ para AI Web Weaver**
**Data:** 13 de Novembro de 2025
**Status:** Sistema Completo e Funcional!
