# AI WEB WEAVER - GERENCIADOR DE PROJETOS
# Ferramenta para gerenciar projetos salvos

param(
    [Parameter(Position=0)]
    [string]$Action = "list",
    
    [Parameter(Position=1)]
    [string]$ProjectId,
    
    [switch]$All,
    [switch]$Recent,
    [int]$Limit = 10
)

$PROJECTS_DIR = "$HOME\.aiweaver\projects"
$PROJECTS_DB = "$HOME\.aiweaver\projects.db"

function Get-ProjectsDatabase {
    if (Test-Path $PROJECTS_DB) {
        return Get-Content $PROJECTS_DB | ConvertFrom-Json
    }
    return @{ projects = @() }
}

function Show-ProjectsList {
    param([switch]$ShowAll, [switch]$ShowRecent, [int]$MaxItems = 10)
    
    $projects = Get-ChildItem $PROJECTS_DIR -Directory
    
    if ($ShowRecent) {
        $projects = $projects | Sort-Object LastWriteTime -Descending
    }
    
    if (-not $ShowAll) {
        $projects = $projects | Select-Object -First $MaxItems
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  PROJETOS SALVOS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Total: $($projects.Count) projetos" -ForegroundColor Yellow
    Write-Host ""
    
    $projects | ForEach-Object {
        $projectPath = $_.FullName
        $projectId = $_.Name
        $files = Get-ChildItem $projectPath -File
        $size = ($files | Measure-Object -Property Length -Sum).Sum
        $sizeKB = [math]::Round($size / 1KB, 2)
        
        Write-Host "ID: $projectId" -ForegroundColor Green
        Write-Host "   Pasta: $projectPath" -ForegroundColor Gray
        Write-Host "   Arquivos: $($files.Count)" -ForegroundColor Gray
        Write-Host "   Tamanho: $sizeKB KB" -ForegroundColor Gray
        Write-Host "   Modificado: $($_.LastWriteTime)" -ForegroundColor Gray
        Write-Host ""
    }
}

function Show-ProjectDetails {
    param([string]$Id)
    
    $projectPath = Join-Path $PROJECTS_DIR $Id
    
    if (-not (Test-Path $projectPath)) {
        Write-Host "Erro: Projeto '$Id' nao encontrado" -ForegroundColor Red
        return
    }
    
    $files = Get-ChildItem $projectPath -Recurse -File
    $totalSize = ($files | Measure-Object -Property Length -Sum).Sum
    $sizeMB = [math]::Round($totalSize / 1MB, 2)
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  DETALHES DO PROJETO" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "ID: $Id" -ForegroundColor Green
    Write-Host "Pasta: $projectPath" -ForegroundColor Gray
    Write-Host "Total de Arquivos: $($files.Count)" -ForegroundColor Yellow
    Write-Host "Tamanho Total: $sizeMB MB" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "ARQUIVOS:" -ForegroundColor Cyan
    
    $files | ForEach-Object {
        $relativePath = $_.FullName.Replace($projectPath, "").TrimStart("\")
        $fileSize = [math]::Round($_.Length / 1KB, 2)
        Write-Host "  $relativePath ($fileSize KB)" -ForegroundColor Gray
    }
    
    Write-Host ""
}

function Open-ProjectInExplorer {
    param([string]$Id)
    
    $projectPath = Join-Path $PROJECTS_DIR $Id
    
    if (-not (Test-Path $projectPath)) {
        Write-Host "Erro: Projeto '$Id' nao encontrado" -ForegroundColor Red
        return
    }
    
    Write-Host "Abrindo projeto no Explorer..." -ForegroundColor Cyan
    Start-Process "explorer.exe" -ArgumentList $projectPath
    Write-Host "Projeto aberto!" -ForegroundColor Green
}

function Open-ProjectInBrowser {
    param([string]$Id)
    
    $projectPath = Join-Path $PROJECTS_DIR $Id
    $indexPath = Join-Path $projectPath "index.html"
    
    if (-not (Test-Path $indexPath)) {
        Write-Host "Erro: index.html nao encontrado no projeto '$Id'" -ForegroundColor Red
        return
    }
    
    Write-Host "Abrindo projeto no navegador..." -ForegroundColor Cyan
    Start-Process $indexPath
    Write-Host "Projeto aberto!" -ForegroundColor Green
}

function Open-ProjectInVSCode {
    param([string]$Id)
    
    $projectPath = Join-Path $PROJECTS_DIR $Id
    
    if (-not (Test-Path $projectPath)) {
        Write-Host "Erro: Projeto '$Id' nao encontrado" -ForegroundColor Red
        return
    }
    
    Write-Host "Abrindo projeto no VS Code..." -ForegroundColor Cyan
    code $projectPath
    Write-Host "Projeto aberto!" -ForegroundColor Green
}

function Remove-Project {
    param([string]$Id)
    
    $projectPath = Join-Path $PROJECTS_DIR $Id
    
    if (-not (Test-Path $projectPath)) {
        Write-Host "Erro: Projeto '$Id' nao encontrado" -ForegroundColor Red
        return
    }
    
    Write-Host "ATENCAO: Isso vai deletar o projeto permanentemente!" -ForegroundColor Yellow
    $confirm = Read-Host "Tem certeza? (s/N)"
    
    if ($confirm -eq "s" -or $confirm -eq "S") {
        Remove-Item $projectPath -Recurse -Force
        Write-Host "Projeto '$Id' removido com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "Operacao cancelada." -ForegroundColor Yellow
    }
}

function Export-Project {
    param([string]$Id)
    
    $projectPath = Join-Path $PROJECTS_DIR $Id
    
    if (-not (Test-Path $projectPath)) {
        Write-Host "Erro: Projeto '$Id' nao encontrado" -ForegroundColor Red
        return
    }
    
    $exportPath = "$HOME\Desktop\projeto-$Id-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').zip"
    
    Write-Host "Exportando projeto..." -ForegroundColor Cyan
    Compress-Archive -Path $projectPath -DestinationPath $exportPath
    Write-Host "Projeto exportado para: $exportPath" -ForegroundColor Green
}

function Search-Projects {
    param([string]$Query)
    
    Write-Host "Buscando projetos com '$Query'..." -ForegroundColor Cyan
    Write-Host ""
    
    $results = Get-ChildItem $PROJECTS_DIR -Recurse -Filter "*.html" | 
        Select-String -Pattern $Query -SimpleMatch | 
        Select-Object -ExpandProperty Path | 
        ForEach-Object { Split-Path (Split-Path $_) -Leaf } | 
        Get-Unique
    
    if ($results.Count -eq 0) {
        Write-Host "Nenhum projeto encontrado." -ForegroundColor Yellow
        return
    }
    
    Write-Host "Encontrados $($results.Count) projetos:" -ForegroundColor Green
    Write-Host ""
    
    $results | ForEach-Object {
        Write-Host "  - $_" -ForegroundColor Gray
    }
    
    Write-Host ""
}

function Show-Statistics {
    $projects = Get-ChildItem $PROJECTS_DIR -Directory
    $totalFiles = (Get-ChildItem $PROJECTS_DIR -Recurse -File).Count
    $totalSize = (Get-ChildItem $PROJECTS_DIR -Recurse -File | Measure-Object -Property Length -Sum).Sum
    $sizeMB = [math]::Round($totalSize / 1MB, 2)
    
    $today = (Get-ChildItem $PROJECTS_DIR -Directory | Where-Object { $_.LastWriteTime.Date -eq (Get-Date).Date }).Count
    $thisWeek = (Get-ChildItem $PROJECTS_DIR -Directory | Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-7) }).Count
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  ESTATISTICAS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Total de Projetos: $($projects.Count)" -ForegroundColor Green
    Write-Host "Total de Arquivos: $totalFiles" -ForegroundColor Yellow
    Write-Host "Tamanho Total: $sizeMB MB" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Projetos Hoje: $today" -ForegroundColor Cyan
    Write-Host "Projetos Esta Semana: $thisWeek" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Localizacao: $PROJECTS_DIR" -ForegroundColor Gray
    Write-Host ""
}

function Show-Help {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  GERENCIADOR DE PROJETOS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "USO:" -ForegroundColor Yellow
    Write-Host "  .\project-manager.ps1 <acao> [opcoes]" -ForegroundColor Gray
    Write-Host ""
    Write-Host "ACOES:" -ForegroundColor Yellow
    Write-Host "  list              - Listar projetos" -ForegroundColor Gray
    Write-Host "  show <id>         - Ver detalhes do projeto" -ForegroundColor Gray
    Write-Host "  open <id>         - Abrir no Explorer" -ForegroundColor Gray
    Write-Host "  browser <id>      - Abrir no navegador" -ForegroundColor Gray
    Write-Host "  code <id>         - Abrir no VS Code" -ForegroundColor Gray
    Write-Host "  remove <id>       - Remover projeto" -ForegroundColor Gray
    Write-Host "  export <id>       - Exportar projeto (ZIP)" -ForegroundColor Gray
    Write-Host "  search <query>    - Buscar projetos" -ForegroundColor Gray
    Write-Host "  stats             - Ver estatisticas" -ForegroundColor Gray
    Write-Host "  help              - Esta ajuda" -ForegroundColor Gray
    Write-Host ""
    Write-Host "OPCOES:" -ForegroundColor Yellow
    Write-Host "  -All              - Mostrar todos os projetos" -ForegroundColor Gray
    Write-Host "  -Recent           - Ordenar por mais recentes" -ForegroundColor Gray
    Write-Host "  -Limit <n>        - Limitar resultados (padrao: 10)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "EXEMPLOS:" -ForegroundColor Yellow
    Write-Host "  .\project-manager.ps1 list -Recent" -ForegroundColor Gray
    Write-Host "  .\project-manager.ps1 show abc12345" -ForegroundColor Gray
    Write-Host "  .\project-manager.ps1 open abc12345" -ForegroundColor Gray
    Write-Host "  .\project-manager.ps1 browser abc12345" -ForegroundColor Gray
    Write-Host "  .\project-manager.ps1 search dashboard" -ForegroundColor Gray
    Write-Host ""
}

# MAIN
switch ($Action.ToLower()) {
    "list" {
        Show-ProjectsList -ShowAll:$All -ShowRecent:$Recent -MaxItems $Limit
    }
    "show" {
        if (-not $ProjectId) {
            Write-Host "Erro: ID do projeto nao fornecido" -ForegroundColor Red
            Write-Host "Uso: .\project-manager.ps1 show <id>" -ForegroundColor Yellow
            exit 1
        }
        Show-ProjectDetails -Id $ProjectId
    }
    "open" {
        if (-not $ProjectId) {
            Write-Host "Erro: ID do projeto nao fornecido" -ForegroundColor Red
            exit 1
        }
        Open-ProjectInExplorer -Id $ProjectId
    }
    "browser" {
        if (-not $ProjectId) {
            Write-Host "Erro: ID do projeto nao fornecido" -ForegroundColor Red
            exit 1
        }
        Open-ProjectInBrowser -Id $ProjectId
    }
    "code" {
        if (-not $ProjectId) {
            Write-Host "Erro: ID do projeto nao fornecido" -ForegroundColor Red
            exit 1
        }
        Open-ProjectInVSCode -Id $ProjectId
    }
    "remove" {
        if (-not $ProjectId) {
            Write-Host "Erro: ID do projeto nao fornecido" -ForegroundColor Red
            exit 1
        }
        Remove-Project -Id $ProjectId
    }
    "export" {
        if (-not $ProjectId) {
            Write-Host "Erro: ID do projeto nao fornecido" -ForegroundColor Red
            exit 1
        }
        Export-Project -Id $ProjectId
    }
    "search" {
        if (-not $ProjectId) {
            Write-Host "Erro: Query de busca nao fornecida" -ForegroundColor Red
            exit 1
        }
        Search-Projects -Query $ProjectId
    }
    "stats" {
        Show-Statistics
    }
    "help" {
        Show-Help
    }
    default {
        Write-Host "Acao desconhecida: $Action" -ForegroundColor Red
        Write-Host "Use '.\project-manager.ps1 help' para ver comandos disponiveis" -ForegroundColor Yellow
    }
}
