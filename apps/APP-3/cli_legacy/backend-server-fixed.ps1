# ============================================
# AI WEB WEAVER - BACKEND SERVER EM POWERSHELL
# ============================================
# Servidor HTTP completo para gerenciar apps

param(
    [int]$Port = 5000,
    [switch]$Debug
)

# ============================================
# CONFIGURAÇÕES
# ============================================

$Global:SERVER_PORT = $Port
$Global:APPS_DIR = "$HOME\.aiweaver\apps"
$Global:DB_FILE = "$HOME\.aiweaver\apps.db"
$Global:LOGS_DIR = "$HOME\.aiweaver\logs"

# ============================================
# FUNÇÕES DE BANCO DE DADOS
# ============================================

function Get-Database {
    if (Test-Path $DB_FILE) {
        return Get-Content $DB_FILE | ConvertFrom-Json
    }
    return @{ apps = @(); installations = @(); logs = @() }
}

function Save-Database {
    param($Database)
    $Database | ConvertTo-Json -Depth 10 | Out-File -FilePath $DB_FILE -Encoding UTF8
}

function Get-App {
    param([string]$AppId)
    $db = Get-Database
    return $db.apps | Where-Object { $_.id -eq $AppId }
}

function Get-AllApps {
    $db = Get-Database
    return $db.apps
}

function Add-App {
    param($AppData)
    $db = Get-Database
    $db.apps += $AppData
    Save-Database -Database $db
    return $AppData
}

function Update-App {
    param([string]$AppId, $Updates)
    $db = Get-Database
    $app = $db.apps | Where-Object { $_.id -eq $AppId }
    
    if ($app) {
        $Updates.PSObject.Properties | ForEach-Object {
            $app.$($_.Name) = $_.Value
        }
        Save-Database -Database $db
        return $app
    }
    return $null
}

function Remove-AppFromDb {
    param([string]$AppId)
    $db = Get-Database
    $db.apps = $db.apps | Where-Object { $_.id -ne $AppId }
    Save-Database -Database $db
}

function Add-Log {
    param([string]$AppId, [string]$Message, [string]$Level = "info")
    
    $db = Get-Database
    $log = @{
        appId = $AppId
        message = $Message
        level = $Level
        timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    }
    $db.logs += $log
    Save-Database -Database $db
    
    # Também salvar em arquivo
    $logFile = Join-Path $LOGS_DIR "$AppId.log"
    "[$($log.timestamp)] [$Level] $Message" | Out-File -FilePath $logFile -Append -Encoding UTF8
}

# ============================================
# FUNÇÕES DE API
# ============================================

function Execute-CliCommand {
    param([hashtable]$Body)
    
    try {
        $command = $Body.command
        $startTime = Get-Date
        
        Write-Host "Executando: $command" -ForegroundColor Cyan
        
        # Executar comando e capturar output
        $output = ""
        $exitCode = 0
        
        # Normalizar comando (aliases e português)
        $command = $command.ToLower().Trim()
        
        # Aliases em português
        $command = $command -replace "^listar", "aiweaver list"
        $command = $command -replace "^iniciar\s+", "aiweaver start "
        $command = $command -replace "^parar\s+", "aiweaver stop "
        $command = $command -replace "^remover\s+", "aiweaver remove "
        $command = $command -replace "^deletar\s+", "aiweaver remove "
        $command = $command -replace "^analisar\s+", "aiweaver analyze "
        $command = $command -replace "^debugar\s+", "aiweaver debug "
        $command = $command -replace "^ajuda", "aiweaver help"
        $command = $command -replace "^versao", "aiweaver version"
        $command = $command -replace "^limpar", "aiweaver clear"
        
        # Detectar tipo de comando
        if ($command -match "^aiweaver\s+(\w+)") {
            $action = $Matches[1]
            
            switch ($action) {
                "list" {
                    $apps = Get-AllApps
                    if ($apps.Count -eq 0) {
                        $output = "📱 Nenhum app instalado.`n`nUse 'aiweaver install <arquivo>' para instalar um app."
                    } else {
                        $output = "📱 APPS INSTALADOS:`n" + ("=" * 50) + "`n`n"
                        $apps | ForEach-Object {
                            $statusIcon = if ($_.status -eq "running") { "🟢" } else { "⚪" }
                            $output += "$statusIcon $($_.name)`n"
                            $output += "   ID: $($_.id)`n"
                            $output += "   Tipo: $($_.type)`n"
                            $output += "   Porta: $($_.port)`n"
                            $output += "   Status: $($_.status)`n"
                            $output += "   Instalado: $($_.installedAt)`n`n"
                        }
                    }
                }
                "start" {
                    # Extrair ID do comando
                    if ($command -match "start\s+(\w+)") {
                        $appId = $Matches[1]
                        $result = Start-AppFromApi -AppId $appId
                        $resultObj = $result | ConvertFrom-Json
                        
                        if ($resultObj.success) {
                            $output = "✅ App iniciado com sucesso!`n`n"
                            $output += "🌐 URL: $($resultObj.url)`n"
                            $output += "📊 Job ID: $($resultObj.jobId)`n`n"
                            $output += "💡 Use 'aiweaver logs $appId' para ver os logs"
                        } else {
                            $output = "❌ Erro ao iniciar app: $($resultObj.error)"
                            $exitCode = 1
                        }
                    } else {
                        $output = "❌ Uso: aiweaver start <app-id>`n`n💡 Use 'aiweaver list' para ver os IDs dos apps"
                        $exitCode = 1
                    }
                }
                "stop" {
                    if ($command -match "stop\s+(\w+)") {
                        $appId = $Matches[1]
                        $result = Stop-AppFromApi -AppId $appId
                        $resultObj = $result | ConvertFrom-Json
                        
                        if ($resultObj.success) {
                            $output = "✅ App parado com sucesso!"
                        } else {
                            $output = "❌ Erro ao parar app: $($resultObj.error)"
                            $exitCode = 1
                        }
                    } else {
                        $output = "❌ Uso: aiweaver stop <app-id>"
                        $exitCode = 1
                    }
                }
                "logs" {
                    if ($command -match "logs\s+(\w+)(?:\s+(\d+))?") {
                        $appId = $Matches[1]
                        $lines = if ($Matches[2]) { [int]$Matches[2] } else { 50 }
                        $result = Get-AppLogs -AppId $appId -Lines $lines
                        $resultObj = $result | ConvertFrom-Json
                        
                        if ($resultObj.success) {
                            $output = "📝 LOGS DO APP: $appId`n" + ("=" * 50) + "`n`n"
                            $output += ($resultObj.logs -join "`n")
                        } else {
                            $output = "❌ Erro: $($resultObj.error)"
                            $exitCode = 1
                        }
                    } else {
                        $output = "❌ Uso: aiweaver logs <app-id> [linhas]`n`nExemplo: aiweaver logs abc123 100"
                        $exitCode = 1
                    }
                }
                "analyze" {
                    if ($command -match "analyze\s+(\w+)") {
                        $appId = $Matches[1]
                        $result = Analyze-AppCode -AppId $appId
                        $resultObj = $result | ConvertFrom-Json
                        
                        if ($resultObj.success) {
                            $analysis = $resultObj.analysis
                            $output = "📊 ANÁLISE DE CÓDIGO`n" + ("=" * 50) + "`n`n"
                            $output += "📝 Linhas: $($analysis.lines)`n"
                            $output += "🔧 Funções: $($analysis.functions)`n"
                            $output += "📦 Variáveis: $($analysis.variables)`n"
                            $output += "💬 Comentários: $($analysis.comments)`n"
                            $output += "🌐 APIs Externas: $($analysis.externalApis.Count)`n"
                            $output += "⭐ Score: $($analysis.score)/100`n`n"
                            
                            if ($analysis.issues.Count -gt 0) {
                                $output += "⚠️  PROBLEMAS ENCONTRADOS:`n"
                                $analysis.issues | ForEach-Object {
                                    $output += "  - $_`n"
                                }
                            } else {
                                $output += "✅ Nenhum problema encontrado!"
                            }
                        } else {
                            $output = "❌ Erro: $($resultObj.error)"
                            $exitCode = 1
                        }
                    } else {
                        $output = "❌ Uso: aiweaver analyze <app-id>"
                        $exitCode = 1
                    }
                }
                "remove" {
                    if ($command -match "remove\s+(\w+)") {
                        $appId = $Matches[1]
                        $app = Get-App -AppId $appId
                        
                        if ($app) {
                            Remove-AppFromDb -AppId $appId
                            
                            # Remover diretório
                            if (Test-Path $app.path) {
                                Remove-Item -Path $app.path -Recurse -Force -ErrorAction SilentlyContinue
                            }
                            
                            $output = "✅ App '$($app.name)' removido com sucesso!"
                        } else {
                            $output = "❌ App não encontrado: $appId`n`n💡 Use 'aiweaver list' para ver apps disponíveis"
                            $exitCode = 1
                        }
                    } else {
                        $output = "❌ Uso: aiweaver remove <app-id>"
                        $exitCode = 1
                    }
                }
                "install" {
                    # Comando install precisa de arquivo
                    # Por enquanto, mostrar instruções para usar API
                    $output = "📦 INSTALAR APP`n" + ("=" * 50) + "`n`n"
                    $output += "⚠️  O comando 'install' via terminal requer upload de arquivo.`n`n"
                    $output += "💡 OPÇÕES:`n`n"
                    $output += "1️⃣ Use a API REST diretamente:`n"
                    $output += "   POST http://localhost:5000/api/apps`n"
                    $output += "   Body: { name, fileName, content, type, port }`n`n"
                    $output += "2️⃣ Use o frontend do AI Web Weaver:`n"
                    $output += "   - Gere o código no editor`n"
                    $output += "   - Clique em 'Deploy Local'`n`n"
                    $output += "3️⃣ Use o PowerShell diretamente:`n"
                    $output += "   cd cli`n"
                    $output += "   .\aiweaver.ps1 install <arquivo> [nome]`n`n"
                    $output += "📚 Documentação: cli/README.md"
                }
                "debug" {
                    if ($command -match "debug\s+(\w+)") {
                        $appId = $Matches[1]
                        $app = Get-App -AppId $appId
                        
                        if ($app) {
                            # Análise + Logs
                            $analysisResult = Analyze-AppCode -AppId $appId
                            $logsResult = Get-AppLogs -AppId $appId -Lines 20
                            
                            $analysisObj = $analysisResult | ConvertFrom-Json
                            $logsObj = $logsResult | ConvertFrom-Json
                            
                            $output = "🐛 DEBUG MODE: $($app.name)`n" + ("=" * 50) + "`n`n"
                            $output += "📋 INFORMAÇÕES:`n"
                            $output += "  ID: $appId`n"
                            $output += "  Tipo: $($app.type)`n"
                            $output += "  Porta: $($app.port)`n"
                            $output += "  Status: $($app.status)`n`n"
                            
                            if ($analysisObj.success) {
                                $analysis = $analysisObj.analysis
                                $output += "📊 ANÁLISE:`n"
                                $output += "  Score: $($analysis.score)/100`n"
                                $output += "  Problemas: $($analysis.issues.Count)`n`n"
                            }
                            
                            if ($logsObj.success -and $logsObj.logs.Count -gt 0) {
                                $output += "📝 ÚLTIMOS LOGS:`n"
                                $output += ($logsObj.logs[-5..-1] -join "`n")
                            } else {
                                $output += "📝 Nenhum log disponível"
                            }
                        } else {
                            $output = "❌ App não encontrado: $appId"
                            $exitCode = 1
                        }
                    } else {
                        $output = "❌ Uso: aiweaver debug <app-id>"
                        $exitCode = 1
                    }
                }
                "help" {
                    $output = @"
📚 AI WEB WEAVER CLI - COMANDOS DISPONÍVEIS

GERENCIAMENTO DE APPS:
  aiweaver install <arquivo> [nome]  - Instalar um app
  aiweaver start <id>                - Iniciar um app
  aiweaver stop <id>                 - Parar um app
  aiweaver debug <id>                - Debug com análise de código
  aiweaver list                      - Listar todos os apps
  aiweaver remove <id>               - Remover um app

ANÁLISE E LOGS:
  aiweaver logs <id> [linhas]        - Ver logs de um app
  aiweaver analyze <arquivo>         - Analisar código
  
INFORMAÇÕES:
  aiweaver help                      - Esta ajuda
  aiweaver version                   - Versão do CLI

💡 DICA: Você também pode usar linguagem natural!
   Exemplos:
   - "instalar meu app"
   - "listar todos os apps"
   - "debugar o app abc123"
   - "ver logs do último app"

🌐 Backend API: http://localhost:5000
📚 Documentação: cli/README.md
"@
                }
                "version" {
                    $output = "🚀 AI Web Weaver CLI`n" + ("=" * 50) + "`n`n"
                    $output += "CLI Version: 1.0.0`n"
                    $output += "Backend Server: 1.0.0`n"
                    $output += "PowerShell: $($PSVersionTable.PSVersion)`n"
                    $output += "OS: $($PSVersionTable.OS)`n`n"
                    $output += "📚 Documentação: cli/README.md`n"
                    $output += "🌐 Backend: http://localhost:5000"
                }
                "status" {
                    $apps = Get-AllApps
                    $runningApps = $apps | Where-Object { $_.status -eq "running" }
                    
                    $output = "📊 STATUS DO SISTEMA`n" + ("=" * 50) + "`n`n"
                    $output += "🟢 Backend: Online`n"
                    $output += "📱 Apps Instalados: $($apps.Count)`n"
                    $output += "🚀 Apps Rodando: $($runningApps.Count)`n"
                    $output += "💾 Banco de Dados: $DB_FILE`n"
                    $output += "📁 Diretório Apps: $APPS_DIR`n`n"
                    
                    if ($runningApps.Count -gt 0) {
                        $output += "🟢 APPS RODANDO:`n"
                        $runningApps | ForEach-Object {
                            $output += "  - $($_.name) (porta $($_.port))`n"
                        }
                    }
                }
                "clear" {
                    $output = "`n`n`n`n`n`n`n`n`n`n" # Simular clear
                    $output += "🚀 Terminal limpo`n`n"
                    $output += "Digite 'aiweaver help' para ver comandos disponíveis"
                }
                default {
                    # Comando não implementado ainda
                    $output = "⚠️  Comando '$action' detectado mas ainda não implementado no backend.`n`n"
                    $output += "📋 Comandos disponíveis:`n"
                    $output += "  - list (listar apps)`n"
                    $output += "  - help (ajuda)`n"
                    $output += "  - version (versão)`n`n"
                    $output += "🚧 Em desenvolvimento:`n"
                    $output += "  - install, start, stop, debug, remove, logs, analyze`n`n"
                    $output += "💡 Use a API REST diretamente:`n"
                    $output += "  POST /api/apps - Instalar app`n"
                    $output += "  POST /api/apps/:id/start - Iniciar app`n"
                    $output += "  GET /api/apps/:id/logs - Ver logs"
                }
            }
        } else {
            # Comando não reconhecido
            $output = "❌ Comando não reconhecido: $command`n`n"
            $output += "💡 Digite 'aiweaver help' para ver comandos disponíveis"
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

function Get-AppsList {
    $apps = Get-AllApps
    return @{
        success = $true
        count = $apps.Count
        apps = $apps
    } | ConvertTo-Json -Depth 10
}

function Get-AppDetails {
    param([string]$AppId)
    
    $app = Get-App -AppId $AppId
    
    if ($app) {
        # Adicionar informações extras
        $appPath = Join-Path $APPS_DIR $AppId
        $size = (Get-ChildItem $appPath -Recurse | Measure-Object -Property Length -Sum).Sum
        
        $app | Add-Member -NotePropertyName "sizeBytes" -NotePropertyValue $size -Force
        $app | Add-Member -NotePropertyName "sizeMB" -NotePropertyValue ([math]::Round($size / 1MB, 2)) -Force
        
        return @{
            success = $true
            app = $app
        } | ConvertTo-Json -Depth 10
    }
    
    return @{
        success = $false
        error = "App não encontrado"
    } | ConvertTo-Json
}

function Install-AppFromApi {
    param([hashtable]$Body)
    
    try {
        $appId = [guid]::NewGuid().ToString().Substring(0, 8)
        $appDir = Join-Path $APPS_DIR $appId
        New-Item -ItemType Directory -Path $appDir -Force | Out-Null
        
        # Salvar conteúdo do app
        $fileName = if ($Body.fileName) { $Body.fileName } else { "index.html" }
        $filePath = Join-Path $appDir $fileName
        $Body.content | Out-File -FilePath $filePath -Encoding UTF8
        
        # Criar registro no banco
        $app = @{
            id = $appId
            name = $Body.name
            path = $appDir
            file = $fileName
            type = $Body.type
            port = if ($Body.port) { $Body.port } else { 3000 }
            installedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            status = "installed"
            version = "1.0.0"
        }
        
        Add-App -AppData $app
        Add-Log -AppId $appId -Message "App instalado via API" -Level "info"
        
        return @{
            success = $true
            message = "App instalado com sucesso"
            app = $app
        } | ConvertTo-Json -Depth 10
    }
    catch {
        return @{
            success = $false
            error = $_.Exception.Message
        } | ConvertTo-Json
    }
}

function Start-AppFromApi {
    param([string]$AppId)
    
    $app = Get-App -AppId $AppId
    
    if (-not $app) {
        return @{
            success = $false
            error = "App não encontrado"
        } | ConvertTo-Json
    }
    
    try {
        # Iniciar app em background job
        $job = Start-Job -Name "App-$AppId" -ScriptBlock {
            param($AppPath, $AppFile, $Port)
            
            $listener = New-Object System.Net.HttpListener
            $listener.Prefixes.Add("http://localhost:$Port/")
            $listener.Start()
            
            while ($listener.IsListening) {
                $context = $listener.GetContext()
                $response = $context.Response
                
                $filePath = Join-Path $AppPath $AppFile
                $content = Get-Content $filePath -Raw -Encoding UTF8
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
                
                $response.ContentLength64 = $buffer.Length
                $response.ContentType = "text/html; charset=utf-8"
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
                $response.Close()
            }
        } -ArgumentList $app.path, $app.file, $app.port
        
        Update-App -AppId $AppId -Updates @{ status = "running"; jobId = $job.Id }
        Add-Log -AppId $AppId -Message "App iniciado" -Level "info"
        
        return @{
            success = $true
            message = "App iniciado com sucesso"
            url = "http://localhost:$($app.port)"
            jobId = $job.Id
        } | ConvertTo-Json
    }
    catch {
        return @{
            success = $false
            error = $_.Exception.Message
        } | ConvertTo-Json
    }
}

function Stop-AppFromApi {
    param([string]$AppId)
    
    $app = Get-App -AppId $AppId
    
    if (-not $app) {
        return @{
            success = $false
            error = "App não encontrado"
        } | ConvertTo-Json
    }
    
    try {
        if ($app.jobId) {
            Stop-Job -Id $app.jobId -ErrorAction SilentlyContinue
            Remove-Job -Id $app.jobId -ErrorAction SilentlyContinue
        }
        
        Update-App -AppId $AppId -Updates @{ status = "stopped"; jobId = $null }
        Add-Log -AppId $AppId -Message "App parado" -Level "info"
        
        return @{
            success = $true
            message = "App parado com sucesso"
        } | ConvertTo-Json
    }
    catch {
        return @{
            success = $false
            error = $_.Exception.Message
        } | ConvertTo-Json
    }
}

function Get-AppLogs {
    param([string]$AppId, [int]$Lines = 50)
    
    $logFile = Join-Path $LOGS_DIR "$AppId.log"
    
    if (Test-Path $logFile) {
        $logs = Get-Content $logFile -Tail $Lines
        return @{
            success = $true
            logs = $logs
        } | ConvertTo-Json
    }
    
    return @{
        success = $false
        error = "Nenhum log encontrado"
    } | ConvertTo-Json
}

function Analyze-AppCode {
    param([string]$AppId)
    
    $app = Get-App -AppId $AppId
    
    if (-not $app) {
        return @{
            success = $false
            error = "App não encontrado"
        } | ConvertTo-Json
    }
    
    $filePath = Join-Path $app.path $app.file
    $content = Get-Content $filePath -Raw
    
    $analysis = @{
        lines = ($content -split "`n").Count
        characters = $content.Length
        functions = ([regex]::Matches($content, "function\s+\w+|const\s+\w+\s*=\s*\(")).Count
        variables = ([regex]::Matches($content, "let\s+\w+|const\s+\w+|var\s+\w+")).Count
        comments = ([regex]::Matches($content, "//.*|/\*[\s\S]*?\*/")).Count
        externalApis = @()
        issues = @()
        score = 100
    }
    
    # Detectar APIs externas
    $apiMatches = [regex]::Matches($content, "fetch\(['\`"]([^'\`"]+)['\`"]|axios\.[a-z]+\(['\`"]([^'\`"]+)['\`"]")
    $apiMatches | ForEach-Object {
        if ($_.Groups[1].Value) { $analysis.externalApis += $_.Groups[1].Value }
        if ($_.Groups[2].Value) { $analysis.externalApis += $_.Groups[2].Value }
    }
    
    # Detectar problemas
    if ($content -match "console\.log") {
        $analysis.issues += "Console.log encontrado (remover em produção)"
        $analysis.score -= 5
    }
    
    if ($content -match "TODO|FIXME") {
        $analysis.issues += "TODOs/FIXMEs encontrados"
        $analysis.score -= 10
    }
    
    if ($content -notmatch "<!DOCTYPE html>") {
        $analysis.issues += "DOCTYPE HTML ausente"
        $analysis.score -= 15
    }
    
    if ($content -notmatch '<meta\s+name=["\']viewport["\']') {
        $analysis.issues += "Meta viewport ausente (não responsivo)"
        $analysis.score -= 10
    }
    
    $imgMatches = [regex]::Matches($content, "<img[^>]*>")
    $imgsWithoutAlt = $imgMatches | Where-Object { $_.Value -notmatch 'alt=' }
    if ($imgsWithoutAlt.Count -gt 0) {
        $analysis.issues += "$($imgsWithoutAlt.Count) imagem(ns) sem atributo alt (acessibilidade)"
        $analysis.score -= ($imgsWithoutAlt.Count * 5)
    }
    
    $analysis.score = [Math]::Max(0, $analysis.score)
    
    return @{
        success = $true
        analysis = $analysis
    } | ConvertTo-Json -Depth 10
}

# ============================================
# ROTEADOR HTTP
# ============================================

function Handle-Request {
    param($Context)
    
    $request = $Context.Request
    $response = $Context.Response
    
    $method = $request.HttpMethod
    $path = $request.Url.LocalPath
    
    Write-Host "[$method] $path" -ForegroundColor Cyan
    
    # Parse body para POST/PUT
    $body = $null
    if ($method -eq "POST" -or $method -eq "PUT") {
        $reader = New-Object System.IO.StreamReader($request.InputStream)
        $bodyText = $reader.ReadToEnd()
        $reader.Close()
        
        if ($bodyText) {
            $body = $bodyText | ConvertFrom-Json -AsHashtable
        }
    }
    
    # Roteamento
    $responseText = ""
    
    switch -Regex ($path) {
        "^/api/apps$" {
            if ($method -eq "GET") {
                $responseText = Get-AppsList
            }
            elseif ($method -eq "POST") {
                $responseText = Install-AppFromApi -Body $body
            }
        }
        "^/api/apps/([^/]+)$" {
            $appId = $Matches[1]
            
            if ($method -eq "GET") {
                $responseText = Get-AppDetails -AppId $appId
            }
            elseif ($method -eq "DELETE") {
                Remove-AppFromDb -AppId $appId
                $responseText = @{ success = $true; message = "App removido" } | ConvertTo-Json
            }
        }
        "^/api/apps/([^/]+)/start$" {
            $appId = $Matches[1]
            $responseText = Start-AppFromApi -AppId $appId
        }
        "^/api/apps/([^/]+)/stop$" {
            $appId = $Matches[1]
            $responseText = Stop-AppFromApi -AppId $appId
        }
        "^/api/apps/([^/]+)/logs$" {
            $appId = $Matches[1]
            $lines = if ($request.QueryString["lines"]) { [int]$request.QueryString["lines"] } else { 50 }
            $responseText = Get-AppLogs -AppId $appId -Lines $lines
        }
        "^/api/apps/([^/]+)/analyze$" {
            $appId = $Matches[1]
            $responseText = Analyze-AppCode -AppId $appId
        }
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
        default {
            $responseText = @{
                success = $false
                error = "Endpoint não encontrado"
            } | ConvertTo-Json
            $response.StatusCode = 404
        }
    }
    
    # Enviar resposta
    $buffer = [System.Text.Encoding]::UTF8.GetBytes($responseText)
    $response.ContentLength64 = $buffer.Length
    $response.ContentType = "application/json; charset=utf-8"
    $response.Headers.Add("Access-Control-Allow-Origin", "*")
    $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
    
    $response.OutputStream.Write($buffer, 0, $buffer.Length)
    $response.Close()
}

# ============================================
# SERVIDOR PRINCIPAL
# ============================================

Write-Host ""
Write-Host "╔═══════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║                                           ║" -ForegroundColor Magenta
Write-Host "║   AI WEB WEAVER - BACKEND SERVER         ║" -ForegroundColor Magenta
Write-Host "║                                           ║" -ForegroundColor Magenta
Write-Host "╚═══════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

$Global:StartTime = Get-Date

Write-Host "🚀 Iniciando servidor na porta $SERVER_PORT..." -ForegroundColor Cyan

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$SERVER_PORT/")

try {
    $listener.Start()
    Write-Host "✅ Servidor rodando em: http://localhost:$SERVER_PORT" -ForegroundColor Green
    Write-Host ""
    Write-Host "📚 ENDPOINTS DISPONÍVEIS:" -ForegroundColor Yellow
    Write-Host "  GET    /api/health              - Status do servidor" -ForegroundColor White
    Write-Host "  GET    /api/apps                - Listar apps" -ForegroundColor White
    Write-Host "  POST   /api/apps                - Instalar app" -ForegroundColor White
    Write-Host "  GET    /api/apps/:id            - Detalhes do app" -ForegroundColor White
    Write-Host "  DELETE /api/apps/:id            - Remover app" -ForegroundColor White
    Write-Host "  POST   /api/apps/:id/start      - Iniciar app" -ForegroundColor White
    Write-Host "  POST   /api/apps/:id/stop       - Parar app" -ForegroundColor White
    Write-Host "  GET    /api/apps/:id/logs       - Ver logs" -ForegroundColor White
    Write-Host "  GET    /api/apps/:id/analyze    - Analisar código" -ForegroundColor White
    Write-Host ""
    Write-Host "⌨️  Pressione Ctrl+C para parar o servidor" -ForegroundColor Yellow
    Write-Host ""
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        Handle-Request -Context $context
    }
}
catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    $listener.Stop()
    Write-Host ""
    Write-Host "🛑 Servidor parado." -ForegroundColor Yellow
}
