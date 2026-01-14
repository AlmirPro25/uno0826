# AI WEB WEAVER - BACKEND SERVER SIMPLIFICADO
# Versao sem emojis para compatibilidade

param(
    [int]$Port = 5000,
    [switch]$Debug
)

$Global:SERVER_PORT = $Port
$Global:APPS_DIR = "$HOME\.aiweaver\apps"
$Global:PROJECTS_DIR = "$HOME\.aiweaver\projects"
$Global:DB_FILE = "$HOME\.aiweaver\apps.db"
$Global:PROJECTS_DB = "$HOME\.aiweaver\projects.db"
$Global:LOGS_DIR = "$HOME\.aiweaver\logs"

# Criar diretorios
@($APPS_DIR, $PROJECTS_DIR, $LOGS_DIR) | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
    }
}

# Criar bancos de dados
if (-not (Test-Path $DB_FILE)) {
    @{ apps = @(); logs = @() } | ConvertTo-Json | Out-File -FilePath $DB_FILE -Encoding UTF8
}

if (-not (Test-Path $PROJECTS_DB)) {
    @{ projects = @() } | ConvertTo-Json | Out-File -FilePath $PROJECTS_DB -Encoding UTF8
}

function Get-Database {
    if (Test-Path $DB_FILE) {
        return Get-Content $DB_FILE | ConvertFrom-Json
    }
    return @{ apps = @(); logs = @() }
}

function Save-Database {
    param($Database)
    $Database | ConvertTo-Json -Depth 10 | Out-File -FilePath $DB_FILE -Encoding UTF8
}

function Get-AllApps {
    $db = Get-Database
    return $db.apps
}

function Get-ProjectsDatabase {
    if (Test-Path $PROJECTS_DB) {
        return Get-Content $PROJECTS_DB | ConvertFrom-Json
    }
    return @{ projects = @() }
}

function Save-ProjectsDatabase {
    param($Database)
    $Database | ConvertTo-Json -Depth 10 | Out-File -FilePath $PROJECTS_DB -Encoding UTF8
}

function Create-Project {
    param([hashtable]$Body)
    
    try {
        $projectName = $Body.name
        $files = $Body.files
        
        # Sanitizar nome do projeto para usar como nome de pasta
        $safeName = $projectName -replace '[\\/:*?"<>|]', '_'
        $safeName = $safeName -replace '\s+', '_'
        
        # Adicionar timestamp para garantir unicidade
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $folderName = "${safeName}_${timestamp}"
        
        # Gerar ID único
        $projectId = [guid]::NewGuid().ToString().Substring(0, 8)
        
        # Criar diretorio do projeto com nome legível
        $projectPath = Join-Path $PROJECTS_DIR $folderName
        New-Item -ItemType Directory -Path $projectPath -Force | Out-Null
        
        # Salvar arquivos no HD
        foreach ($file in $files) {
            $filePath = Join-Path $projectPath $file.path
            $fileDir = Split-Path $filePath -Parent
            
            if ($fileDir -and -not (Test-Path $fileDir)) {
                New-Item -ItemType Directory -Path $fileDir -Force | Out-Null
            }
            
            $file.content | Out-File -FilePath $filePath -Encoding UTF8
        }
        
        # Salvar no banco
        $db = Get-ProjectsDatabase
        $project = @{
            id = $projectId
            name = $projectName
            path = $projectPath
            files = $files
            createdAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            updatedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        }
        
        $db.projects += $project
        Save-ProjectsDatabase -Database $db
        
        return @{
            success = $true
            project = $project
        } | ConvertTo-Json -Depth 10
    }
    catch {
        return @{
            success = $false
            error = $_.Exception.Message
        } | ConvertTo-Json
    }
}

function Get-AllProjects {
    $db = Get-ProjectsDatabase
    return @{
        success = $true
        projects = $db.projects
    } | ConvertTo-Json -Depth 10
}

function Install-ProjectAsApp {
    param([string]$ProjectId)
    
    try {
        $db = Get-ProjectsDatabase
        $project = $db.projects | Where-Object { $_.id -eq $ProjectId }
        
        if (-not $project) {
            return @{
                success = $false
                error = "Projeto nao encontrado"
            } | ConvertTo-Json
        }
        
        # Encontrar arquivo principal (index.html)
        $mainFile = $project.files | Where-Object { $_.path -eq "index.html" } | Select-Object -First 1
        
        if (-not $mainFile) {
            return @{
                success = $false
                error = "Arquivo index.html nao encontrado"
            } | ConvertTo-Json
        }
        
        # Criar app
        $appId = [guid]::NewGuid().ToString().Substring(0, 8)
        $appDir = Join-Path $APPS_DIR $appId
        New-Item -ItemType Directory -Path $appDir -Force | Out-Null
        
        # Copiar arquivo principal
        $sourceFile = Join-Path $project.path $mainFile.path
        $destFile = Join-Path $appDir "index.html"
        Copy-Item $sourceFile -Destination $destFile
        
        # Registrar app
        $appsDb = Get-Database
        $app = @{
            id = $appId
            name = $project.name
            path = $appDir
            file = "index.html"
            type = "single-file-html"
            port = 3000
            projectId = $ProjectId
            installedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            status = "installed"
        }
        
        $appsDb.apps += $app
        Save-Database -Database $appsDb
        
        return @{
            success = $true
            appId = $appId
            message = "Projeto instalado como app"
        } | ConvertTo-Json
    }
    catch {
        return @{
            success = $false
            error = $_.Exception.Message
        } | ConvertTo-Json
    }
}

function Open-ProjectInExplorer {
    param([string]$ProjectId)
    
    try {
        $db = Get-ProjectsDatabase
        $project = $db.projects | Where-Object { $_.id -eq $ProjectId }
        
        if (-not $project) {
            return @{
                success = $false
                error = "Projeto nao encontrado"
            } | ConvertTo-Json
        }
        
        # Abrir explorador
        Start-Process "explorer.exe" -ArgumentList $project.path
        
        return @{
            success = $true
        } | ConvertTo-Json
    }
    catch {
        return @{
            success = $false
            error = $_.Exception.Message
        } | ConvertTo-Json
    }
}

function Execute-CliCommand {
    param([hashtable]$Body)
    
    try {
        $command = $Body.command.ToLower().Trim()
        $startTime = Get-Date
        
        Write-Host "Executando: $command" -ForegroundColor Cyan
        
        $output = ""
        $exitCode = 0
        
        # Normalizar comandos em portugues
        $command = $command -replace "^listar", "aiweaver list"
        $command = $command -replace "^ajuda", "aiweaver help"
        $command = $command -replace "^versao", "aiweaver version"
        
        if ($command -match "^aiweaver\s+(\w+)") {
            $action = $Matches[1]
            
            switch ($action) {
                "list" {
                    $apps = Get-AllApps
                    if ($apps.Count -eq 0) {
                        $output = "Nenhum app instalado.`n`nUse 'aiweaver install' para instalar um app."
                    } else {
                        $output = "APPS INSTALADOS:`n" + ("=" * 50) + "`n`n"
                        $apps | ForEach-Object {
                            $statusIcon = if ($_.status -eq "running") { "[RODANDO]" } else { "[PARADO]" }
                            $output += "$statusIcon $($_.name)`n"
                            $output += "   ID: $($_.id)`n"
                            $output += "   Tipo: $($_.type)`n"
                            $output += "   Porta: $($_.port)`n"
                            $output += "   Status: $($_.status)`n`n"
                        }
                    }
                }
                "help" {
                    $output = @"
AI WEB WEAVER CLI - COMANDOS DISPONIVEIS

GERENCIAMENTO:
  aiweaver list              - Listar apps
  aiweaver start <id>        - Iniciar app
  aiweaver stop <id>         - Parar app
  aiweaver remove <id>       - Remover app

ANALISE:
  aiweaver logs <id>         - Ver logs
  aiweaver analyze <id>      - Analisar codigo
  aiweaver debug <id>        - Debug completo

INFORMACOES:
  aiweaver help              - Esta ajuda
  aiweaver version           - Versao
  aiweaver status            - Status do sistema

PORTUGUES:
  listar, ajuda, versao, etc

LINGUAGEM NATURAL:
  "listar todos os apps"
  "mostrar ajuda"
"@
                }
                "version" {
                    $output = "AI Web Weaver CLI v1.0.0`n"
                    $output += "Backend Server v1.0.0`n"
                    $output += "PowerShell $($PSVersionTable.PSVersion)`n"
                    $output += "Backend: http://localhost:5000"
                }
                "status" {
                    $apps = Get-AllApps
                    $runningApps = $apps | Where-Object { $_.status -eq "running" }
                    
                    $output = "STATUS DO SISTEMA`n" + ("=" * 50) + "`n`n"
                    $output += "Backend: Online`n"
                    $output += "Apps Instalados: $($apps.Count)`n"
                    $output += "Apps Rodando: $($runningApps.Count)`n"
                    $output += "Banco de Dados: $DB_FILE`n"
                }
                "clear" {
                    $output = "`n`n`n`n`n`n`n`n`n`n"
                    $output += "Terminal limpo`n`n"
                    $output += "Digite 'aiweaver help' para ver comandos"
                }
                default {
                    $output = "Comando '$action' ainda nao implementado.`n`n"
                    $output += "Comandos disponiveis:`n"
                    $output += "  - list (listar apps)`n"
                    $output += "  - help (ajuda)`n"
                    $output += "  - version (versao)`n"
                    $output += "  - status (status do sistema)`n"
                }
            }
        } else {
            $output = "Comando nao reconhecido: $command`n`n"
            $output += "Digite 'aiweaver help' para ver comandos disponiveis"
            $exitCode = 1
        }
        
        $duration = ((Get-Date) - $startTime).TotalMilliseconds
        
        return @{
            success = $true
            output = $output
            exitCode = $exitCode
            duration = $duration
            timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        } | ConvertTo-Json -Depth 5
    }
    catch {
        return @{
            success = $false
            error = $_.Exception.Message
            exitCode = 1
        } | ConvertTo-Json
    }
}

function Handle-Request {
    param($Context)
    
    $request = $Context.Request
    $response = $Context.Response
    
    $method = $request.HttpMethod
    $path = $request.Url.LocalPath
    
    Write-Host "[$method] $path" -ForegroundColor Cyan
    
    $body = $null
    if ($method -eq "POST" -or $method -eq "PUT") {
        $reader = New-Object System.IO.StreamReader($request.InputStream)
        $bodyText = $reader.ReadToEnd()
        $reader.Close()
        
        if ($bodyText) {
            $bodyJson = $bodyText | ConvertFrom-Json
            $body = @{}
            $bodyJson.PSObject.Properties | ForEach-Object {
                $body[$_.Name] = $_.Value
            }
        }
    }
    
    $responseText = ""
    
    switch -Regex ($path) {
        "^/api/health$" {
            $responseText = @{
                success = $true
                status = "healthy"
                version = "1.0.0"
                uptime = (Get-Date) - $Global:StartTime
            } | ConvertTo-Json
        }
        "^/api/execute$" {
            if ($method -eq "POST") {
                $responseText = Execute-CliCommand -Body $body
            }
        }
        "^/api/apps$" {
            if ($method -eq "GET") {
                $apps = Get-AllApps
                $responseText = @{
                    success = $true
                    count = $apps.Count
                    apps = $apps
                } | ConvertTo-Json -Depth 10
            }
        }
        "^/api/projects$" {
            if ($method -eq "GET") {
                $responseText = Get-AllProjects
            }
            elseif ($method -eq "POST") {
                $responseText = Create-Project -Body $body
            }
        }
        "^/api/projects/([^/]+)/install$" {
            $projectId = $Matches[1]
            if ($method -eq "POST") {
                $responseText = Install-ProjectAsApp -ProjectId $projectId
            }
        }
        "^/api/projects/([^/]+)/open$" {
            $projectId = $Matches[1]
            if ($method -eq "POST") {
                $responseText = Open-ProjectInExplorer -ProjectId $projectId
            }
        }
        default {
            $responseText = @{
                success = $false
                error = "Endpoint nao encontrado"
            } | ConvertTo-Json
            $response.StatusCode = 404
        }
    }
    
    $buffer = [System.Text.Encoding]::UTF8.GetBytes($responseText)
    $response.ContentLength64 = $buffer.Length
    $response.ContentType = "application/json; charset=utf-8"
    $response.Headers.Add("Access-Control-Allow-Origin", "*")
    $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
    
    $response.OutputStream.Write($buffer, 0, $buffer.Length)
    $response.Close()
}

# SERVIDOR PRINCIPAL
Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  AI WEB WEAVER - BACKEND SERVER" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

$Global:StartTime = Get-Date

Write-Host "Iniciando servidor na porta $SERVER_PORT..." -ForegroundColor Cyan

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$SERVER_PORT/")

try {
    $listener.Start()
    Write-Host "Servidor rodando em: http://localhost:$SERVER_PORT" -ForegroundColor Green
    Write-Host ""
    Write-Host "ENDPOINTS DISPONIVEIS:" -ForegroundColor Yellow
    Write-Host "  GET    /api/health" -ForegroundColor White
    Write-Host "  POST   /api/execute" -ForegroundColor White
    Write-Host "  GET    /api/apps" -ForegroundColor White
    Write-Host ""
    Write-Host "Pressione Ctrl+C para parar" -ForegroundColor Yellow
    Write-Host ""
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        Handle-Request -Context $context
    }
}
catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    $listener.Stop()
    Write-Host ""
    Write-Host "Servidor parado." -ForegroundColor Yellow
}
