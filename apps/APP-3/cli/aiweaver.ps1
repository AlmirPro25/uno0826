# ============================================
# AI WEB WEAVER CLI - PowerShell Edition
# ============================================
# Versão: 1.0.0
# Descrição: CLI para instalar, debugar e gerenciar apps gerados

param(
    [Parameter(Position=0)]
    [string]$Command,
    
    [Parameter(Position=1)]
    [string]$AppPath,
    
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Args
)

# ============================================
# CONFIGURAÇÕES GLOBAIS
# ============================================

$Global:CLI_VERSION = "1.0.0"
$Global:CLI_NAME = "AI Web Weaver CLI"
$Global:APPS_DIR = "$HOME\.aiweaver\apps"
$Global:LOGS_DIR = "$HOME\.aiweaver\logs"
$Global:CONFIG_FILE = "$HOME\.aiweaver\config.json"
$Global:DB_FILE = "$HOME\.aiweaver\apps.db"

# Cores para output
$Global:Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Highlight = "Magenta"
}

# ============================================
# FUNÇÕES AUXILIARES
# ============================================

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White",
        [switch]$NoNewline
    )
    
    if ($NoNewline) {
        Write-Host $Message -ForegroundColor $Color -NoNewline
    } else {
        Write-Host $Message -ForegroundColor $Color
    }
}

function Write-Success { param([string]$Message) Write-ColorOutput "✅ $Message" $Colors.Success }
function Write-Error { param([string]$Message) Write-ColorOutput "❌ $Message" $Colors.Error }
function Write-Warning { param([string]$Message) Write-ColorOutput "⚠️  $Message" $Colors.Warning }
function Write-Info { param([string]$Message) Write-ColorOutput "ℹ️  $Message" $Colors.Info }
function Write-Highlight { param([string]$Message) Write-ColorOutput "🎯 $Message" $Colors.Highlight }

function Show-Banner {
    Write-Host ""
    Write-ColorOutput "╔═══════════════════════════════════════════╗" $Colors.Highlight
    Write-ColorOutput "║                                           ║" $Colors.Highlight
    Write-ColorOutput "║       AI WEB WEAVER CLI v$CLI_VERSION        ║" $Colors.Highlight
    Write-ColorOutput "║   Instale, Debug e Gerencie seus Apps    ║" $Colors.Highlight
    Write-ColorOutput "║                                           ║" $Colors.Highlight
    Write-ColorOutput "╚═══════════════════════════════════════════╝" $Colors.Highlight
    Write-Host ""
}

function Initialize-CLI {
    # Criar diretórios necessários
    @($APPS_DIR, $LOGS_DIR) | ForEach-Object {
        if (-not (Test-Path $_)) {
            New-Item -ItemType Directory -Path $_ -Force | Out-Null
            Write-Info "Diretório criado: $_"
        }
    }
    
    # Criar arquivo de configuração
    if (-not (Test-Path $CONFIG_FILE)) {
        $config = @{
            version = $CLI_VERSION
            defaultPort = 3000
            autoOpenBrowser = $true
            logLevel = "info"
        } | ConvertTo-Json
        
        $config | Out-File -FilePath $CONFIG_FILE -Encoding UTF8
        Write-Info "Configuração criada: $CONFIG_FILE"
    }
    
    # Criar banco de dados SQLite (simulado com JSON)
    if (-not (Test-Path $DB_FILE)) {
        $db = @{
            apps = @()
            installations = @()
        } | ConvertTo-Json
        
        $db | Out-File -FilePath $DB_FILE -Encoding UTF8
        Write-Info "Banco de dados criado: $DB_FILE"
    }
}

# ============================================
# COMANDOS PRINCIPAIS
# ============================================

function Install-App {
    param(
        [string]$Path,
        [string]$Name,
        [int]$Port = 3000
    )
    
    Write-Highlight "Instalando aplicação..."
    
    # Validar caminho
    if (-not (Test-Path $Path)) {
        Write-Error "Arquivo não encontrado: $Path"
        return
    }
    
    # Gerar ID único
    $appId = [guid]::NewGuid().ToString().Substring(0, 8)
    
    # Criar diretório do app
    $appDir = Join-Path $APPS_DIR $appId
    New-Item -ItemType Directory -Path $appDir -Force | Out-Null
    
    # Copiar arquivo
    $fileName = Split-Path $Path -Leaf
    Copy-Item $Path -Destination (Join-Path $appDir $fileName)
    
    # Detectar tipo de app
    $content = Get-Content $Path -Raw
    $appType = Detect-AppType -Content $content
    
    # Extrair dependências
    $dependencies = Extract-Dependencies -Content $content
    
    # Salvar no banco de dados
    $db = Get-Content $DB_FILE | ConvertFrom-Json
    $app = @{
        id = $appId
        name = if ($Name) { $Name } else { $fileName }
        path = $appDir
        file = $fileName
        type = $appType
        port = $Port
        dependencies = $dependencies
        installedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        status = "installed"
    }
    
    $db.apps += $app
    $db | ConvertTo-Json -Depth 10 | Out-File -FilePath $DB_FILE -Encoding UTF8
    
    Write-Success "App instalado com sucesso!"
    Write-Info "ID: $appId"
    Write-Info "Nome: $($app.name)"
    Write-Info "Tipo: $appType"
    Write-Info "Porta: $Port"
    
    if ($dependencies.Count -gt 0) {
        Write-Warning "Dependências detectadas:"
        $dependencies | ForEach-Object { Write-Host "  - $_" }
        
        $install = Read-Host "Deseja instalar as dependências? (S/N)"
        if ($install -eq "S" -or $install -eq "s") {
            Install-Dependencies -AppId $appId -Dependencies $dependencies
        }
    }
    
    return $appId
}

function Start-App {
    param(
        [string]$AppId,
        [switch]$Debug,
        [switch]$Watch
    )
    
    Write-Highlight "Iniciando aplicação..."
    
    # Buscar app no banco
    $db = Get-Content $DB_FILE | ConvertFrom-Json
    $app = $db.apps | Where-Object { $_.id -eq $AppId }
    
    if (-not $app) {
        Write-Error "App não encontrado: $AppId"
        return
    }
    
    Write-Info "Iniciando: $($app.name)"
    
    # Determinar como iniciar baseado no tipo
    switch ($app.type) {
        "single-file-html" {
            Start-SingleFileApp -App $app -Debug:$Debug
        }
        "node-backend" {
            Start-NodeApp -App $app -Debug:$Debug -Watch:$Watch
        }
        "fullstack" {
            Start-FullstackApp -App $app -Debug:$Debug -Watch:$Watch
        }
        default {
            Write-Warning "Tipo de app desconhecido, tentando como HTML..."
            Start-SingleFileApp -App $app -Debug:$Debug
        }
    }
}

function Debug-App {
    param(
        [string]$AppId,
        [switch]$Verbose
    )
    
    Write-Highlight "Iniciando modo debug..."
    
    $db = Get-Content $DB_FILE | ConvertFrom-Json
    $app = $db.apps | Where-Object { $_.id -eq $AppId }
    
    if (-not $app) {
        Write-Error "App não encontrado: $AppId"
        return
    }
    
    # Criar servidor de debug
    $debugPort = $app.port + 1000
    
    Write-Info "App: $($app.name)"
    Write-Info "Debug Port: $debugPort"
    Write-Info "Log: $LOGS_DIR\$AppId-debug.log"
    
    # Iniciar com logs detalhados
    $logFile = Join-Path $LOGS_DIR "$AppId-debug.log"
    
    # Análise estática do código
    Write-Info "Analisando código..."
    $filePath = Join-Path $app.path $app.file
    $analysis = Analyze-Code -Path $filePath
    
    Write-Host ""
    Write-ColorOutput "📊 ANÁLISE DE CÓDIGO" $Colors.Highlight
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    Write-Host "Linhas de código: $($analysis.lines)"
    Write-Host "Funções: $($analysis.functions)"
    Write-Host "Variáveis: $($analysis.variables)"
    Write-Host "APIs externas: $($analysis.externalApis.Count)"
    
    if ($analysis.issues.Count -gt 0) {
        Write-Warning "Problemas encontrados:"
        $analysis.issues | ForEach-Object { Write-Host "  - $_" }
    } else {
        Write-Success "Nenhum problema encontrado!"
    }
    
    Write-Host ""
    
    # Iniciar com debug
    Start-App -AppId $AppId -Debug
    
    # Monitor de logs em tempo real
    if ($Verbose) {
        Write-Info "Monitorando logs (Ctrl+C para sair)..."
        Get-Content $logFile -Wait -Tail 20
    }
}

function List-Apps {
    $db = Get-Content $DB_FILE | ConvertFrom-Json
    
    if ($db.apps.Count -eq 0) {
        Write-Warning "Nenhum app instalado."
        return
    }
    
    Write-Host ""
    Write-ColorOutput "📱 APPS INSTALADOS" $Colors.Highlight
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host ""
    
    $db.apps | ForEach-Object {
        Write-ColorOutput "🔹 $($_.name)" $Colors.Info
        Write-Host "   ID: $($_.id)"
        Write-Host "   Tipo: $($_.type)"
        Write-Host "   Porta: $($_.port)"
        Write-Host "   Status: $($_.status)"
        Write-Host "   Instalado: $($_.installedAt)"
        Write-Host ""
    }
}

function Remove-App {
    param([string]$AppId)
    
    $db = Get-Content $DB_FILE | ConvertFrom-Json
    $app = $db.apps | Where-Object { $_.id -eq $AppId }
    
    if (-not $app) {
        Write-Error "App não encontrado: $AppId"
        return
    }
    
    Write-Warning "Removendo app: $($app.name)"
    
    # Remover diretório
    if (Test-Path $app.path) {
        Remove-Item -Path $app.path -Recurse -Force
    }
    
    # Remover do banco
    $db.apps = $db.apps | Where-Object { $_.id -ne $AppId }
    $db | ConvertTo-Json -Depth 10 | Out-File -FilePath $DB_FILE -Encoding UTF8
    
    Write-Success "App removido com sucesso!"
}

# ============================================
# FUNÇÕES DE DETECÇÃO E ANÁLISE
# ============================================

function Detect-AppType {
    param([string]$Content)
    
    if ($Content -match "<!DOCTYPE html>" -and $Content -match "<script.*type=[`"']module[`"']") {
        if ($Content -match "express|fastify|koa") {
            return "fullstack"
        }
        return "single-file-html"
    }
    
    if ($Content -match "package\.json" -or $Content -match "require\(|import ") {
        return "node-backend"
    }
    
    return "unknown"
}

function Extract-Dependencies {
    param([string]$Content)
    
    $deps = @()
    
    # Detectar CDN scripts
    if ($Content -match '<script[^>]+src=["`'](https?://[^"`']+)["`']') {
        $Matches[1] | ForEach-Object {
            if ($_ -match '([^/]+)@[\d.]+|([^/]+)\.js') {
                $deps += $Matches[1]
            }
        }
    }
    
    # Detectar imports ES6
    if ($Content -match "import .+ from ['\`"]([^'\`"]+)['\`"]") {
        $deps += $Matches[1]
    }
    
    return $deps | Select-Object -Unique
}

function Analyze-Code {
    param([string]$Path)
    
    $content = Get-Content $Path -Raw
    
    $analysis = @{
        lines = ($content -split "`n").Count
        functions = ([regex]::Matches($content, "function\s+\w+|const\s+\w+\s*=\s*\(")).Count
        variables = ([regex]::Matches($content, "let\s+\w+|const\s+\w+|var\s+\w+")).Count
        externalApis = @()
        issues = @()
    }
    
    # Detectar APIs externas
    if ($content -match "fetch\(['\`"]([^'\`"]+)['\`"]") {
        $analysis.externalApis += $Matches[1]
    }
    
    # Detectar problemas comuns
    if ($content -match "console\.log") {
        $analysis.issues += "Console.log encontrado (remover em produção)"
    }
    
    if ($content -match "TODO|FIXME") {
        $analysis.issues += "TODOs/FIXMEs encontrados"
    }
    
    if ($content -notmatch "<!DOCTYPE html>") {
        $analysis.issues += "DOCTYPE HTML ausente"
    }
    
    return $analysis
}

# ============================================
# FUNÇÕES DE INICIALIZAÇÃO DE APPS
# ============================================

function Start-SingleFileApp {
    param($App, [switch]$Debug)
    
    $filePath = Join-Path $App.path $App.file
    $url = "http://localhost:$($App.port)"
    
    Write-Info "Iniciando servidor HTTP na porta $($App.port)..."
    
    # Criar servidor HTTP simples
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("$url/")
    $listener.Start()
    
    Write-Success "Servidor rodando em: $url"
    Write-Info "Pressione Ctrl+C para parar"
    
    # Abrir navegador
    Start-Process $url
    
    try {
        while ($listener.IsListening) {
            $context = $listener.GetContext()
            $response = $context.Response
            
            $content = Get-Content $filePath -Raw -Encoding UTF8
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
            
            $response.ContentLength64 = $buffer.Length
            $response.ContentType = "text/html; charset=utf-8"
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
            
            if ($Debug) {
                $timestamp = Get-Date -Format "HH:mm:ss"
                Write-Host "[$timestamp] Request: $($context.Request.Url.PathAndQuery)"
            }
        }
    }
    finally {
        $listener.Stop()
        Write-Info "Servidor parado."
    }
}

function Start-NodeApp {
    param($App, [switch]$Debug, [switch]$Watch)
    
    $appPath = $App.path
    
    # Verificar se tem package.json
    $packageJson = Join-Path $appPath "package.json"
    
    if (-not (Test-Path $packageJson)) {
        Write-Error "package.json não encontrado"
        return
    }
    
    Push-Location $appPath
    
    try {
        if ($Debug) {
            Write-Info "Iniciando em modo debug..."
            npm run dev
        } else {
            npm start
        }
    }
    finally {
        Pop-Location
    }
}

function Start-FullstackApp {
    param($App, [switch]$Debug, [switch]$Watch)
    
    Write-Info "Iniciando aplicação fullstack..."
    
    # Iniciar backend
    Start-Job -Name "Backend-$($App.id)" -ScriptBlock {
        param($path)
        Set-Location $path
        npm run backend
    } -ArgumentList $App.path
    
    Start-Sleep -Seconds 2
    
    # Iniciar frontend
    Start-Job -Name "Frontend-$($App.id)" -ScriptBlock {
        param($path)
        Set-Location $path
        npm run frontend
    } -ArgumentList $App.path
    
    Write-Success "Backend e Frontend iniciados!"
    Write-Info "Use 'aiweaver logs $($App.id)' para ver os logs"
}

function Install-Dependencies {
    param([string]$AppId, [array]$Dependencies)
    
    Write-Info "Instalando dependências..."
    
    $app = (Get-Content $DB_FILE | ConvertFrom-Json).apps | Where-Object { $_.id -eq $AppId }
    $appPath = $app.path
    
    Push-Location $appPath
    
    try {
        # Criar package.json se não existir
        if (-not (Test-Path "package.json")) {
            npm init -y
        }
        
        # Instalar dependências
        $Dependencies | ForEach-Object {
            Write-Info "Instalando $_..."
            npm install $_
        }
        
        Write-Success "Dependências instaladas!"
    }
    finally {
        Pop-Location
    }
}

# ============================================
# COMANDO HELP
# ============================================

function Show-Help {
    Write-Host ""
    Write-ColorOutput "📚 AI WEB WEAVER CLI - AJUDA" $Colors.Highlight
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host ""
    Write-Host "COMANDOS DISPONÍVEIS:"
    Write-Host ""
    Write-ColorOutput "  install <arquivo> [nome]" $Colors.Info
    Write-Host "    Instala um app gerado pelo AI Web Weaver"
    Write-Host "    Exemplo: aiweaver install app.html MeuApp"
    Write-Host ""
    Write-ColorOutput "  start <app-id>" $Colors.Info
    Write-Host "    Inicia um app instalado"
    Write-Host "    Exemplo: aiweaver start abc123"
    Write-Host ""
    Write-ColorOutput "  debug <app-id>" $Colors.Info
    Write-Host "    Inicia app em modo debug com análise de código"
    Write-Host "    Exemplo: aiweaver debug abc123"
    Write-Host ""
    Write-ColorOutput "  list" $Colors.Info
    Write-Host "    Lista todos os apps instalados"
    Write-Host ""
    Write-ColorOutput "  remove <app-id>" $Colors.Info
    Write-Host "    Remove um app instalado"
    Write-Host "    Exemplo: aiweaver remove abc123"
    Write-Host ""
    Write-ColorOutput "  logs <app-id>" $Colors.Info
    Write-Host "    Mostra logs de um app"
    Write-Host ""
    Write-ColorOutput "  analyze <arquivo>" $Colors.Info
    Write-Host "    Analisa um arquivo sem instalar"
    Write-Host ""
    Write-ColorOutput "  help" $Colors.Info
    Write-Host "    Mostra esta ajuda"
    Write-Host ""
}

# ============================================
# ROTEADOR DE COMANDOS
# ============================================

function Invoke-Command {
    param([string]$Cmd, [string]$Path, [array]$Arguments)
    
    switch ($Cmd.ToLower()) {
        "install" {
            if (-not $Path) {
                Write-Error "Especifique o caminho do arquivo"
                return
            }
            $name = if ($Arguments.Count -gt 0) { $Arguments[0] } else { $null }
            Install-App -Path $Path -Name $name
        }
        "start" {
            if (-not $Path) {
                Write-Error "Especifique o ID do app"
                return
            }
            Start-App -AppId $Path
        }
        "debug" {
            if (-not $Path) {
                Write-Error "Especifique o ID do app"
                return
            }
            Debug-App -AppId $Path -Verbose
        }
        "list" {
            List-Apps
        }
        "remove" {
            if (-not $Path) {
                Write-Error "Especifique o ID do app"
                return
            }
            Remove-App -AppId $Path
        }
        "logs" {
            if (-not $Path) {
                Write-Error "Especifique o ID do app"
                return
            }
            $logFile = Join-Path $LOGS_DIR "$Path-debug.log"
            if (Test-Path $logFile) {
                Get-Content $logFile -Tail 50
            } else {
                Write-Warning "Nenhum log encontrado"
            }
        }
        "analyze" {
            if (-not $Path) {
                Write-Error "Especifique o caminho do arquivo"
                return
            }
            $analysis = Analyze-Code -Path $Path
            Write-Host "Análise: $($analysis | ConvertTo-Json -Depth 5)"
        }
        "help" {
            Show-Help
        }
        default {
            Write-Error "Comando desconhecido: $Cmd"
            Show-Help
        }
    }
}

# ============================================
# MAIN
# ============================================

Show-Banner
Initialize-CLI

if (-not $Command) {
    Show-Help
} else {
    Invoke-Command -Cmd $Command -Path $AppPath -Arguments $Args
}
