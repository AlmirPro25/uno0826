# ============================================
# INSTALADOR DO AI WEB WEAVER CLI
# ============================================

Write-Host ""
Write-Host "╔═══════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║                                           ║" -ForegroundColor Magenta
Write-Host "║   AI WEB WEAVER CLI - INSTALADOR         ║" -ForegroundColor Magenta
Write-Host "║                                           ║" -ForegroundColor Magenta
Write-Host "╚═══════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# Verificar se está rodando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  Este script precisa ser executado como Administrador" -ForegroundColor Yellow
    Write-Host "   Clique com botão direito e selecione 'Executar como Administrador'" -ForegroundColor Yellow
    pause
    exit
}

Write-Host "✅ Executando como Administrador" -ForegroundColor Green
Write-Host ""

# Criar diretório de instalação
$installDir = "$env:ProgramFiles\AIWebWeaver"
Write-Host "📁 Criando diretório de instalação..." -ForegroundColor Cyan

if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
    Write-Host "   ✓ Diretório criado: $installDir" -ForegroundColor Green
} else {
    Write-Host "   ✓ Diretório já existe" -ForegroundColor Green
}

# Copiar arquivo CLI
Write-Host "📋 Copiando arquivos..." -ForegroundColor Cyan
$cliSource = Join-Path $PSScriptRoot "aiweaver.ps1"
$cliDest = Join-Path $installDir "aiweaver.ps1"

Copy-Item $cliSource -Destination $cliDest -Force
Write-Host "   ✓ CLI copiado" -ForegroundColor Green

# Criar alias global
Write-Host "🔗 Criando alias global..." -ForegroundColor Cyan

$profilePath = $PROFILE.AllUsersAllHosts
$profileDir = Split-Path $profilePath

if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}

$aliasCommand = @"

# AI Web Weaver CLI
function aiweaver {
    param([Parameter(ValueFromRemainingArguments=`$true)]`$args)
    & "$cliDest" @args
}

"@

if (Test-Path $profilePath) {
    $content = Get-Content $profilePath -Raw
    if ($content -notmatch "AI Web Weaver CLI") {
        Add-Content -Path $profilePath -Value $aliasCommand
        Write-Host "   ✓ Alias adicionado ao perfil" -ForegroundColor Green
    } else {
        Write-Host "   ✓ Alias já existe" -ForegroundColor Green
    }
} else {
    $aliasCommand | Out-File -FilePath $profilePath -Encoding UTF8
    Write-Host "   ✓ Perfil criado com alias" -ForegroundColor Green
}

# Adicionar ao PATH
Write-Host "🛣️  Adicionando ao PATH..." -ForegroundColor Cyan

$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if ($currentPath -notlike "*$installDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$installDir", "Machine")
    Write-Host "   ✓ Adicionado ao PATH" -ForegroundColor Green
} else {
    Write-Host "   ✓ Já está no PATH" -ForegroundColor Green
}

# Criar diretórios de dados do usuário
Write-Host "📂 Criando diretórios de dados..." -ForegroundColor Cyan

$userDataDir = "$HOME\.aiweaver"
@("$userDataDir\apps", "$userDataDir\logs", "$userDataDir\temp") | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
    }
}
Write-Host "   ✓ Diretórios criados" -ForegroundColor Green

# Criar arquivo de configuração padrão
Write-Host "⚙️  Criando configuração padrão..." -ForegroundColor Cyan

$configFile = "$userDataDir\config.json"
if (-not (Test-Path $configFile)) {
    $config = @{
        version = "1.0.0"
        defaultPort = 3000
        autoOpenBrowser = $true
        logLevel = "info"
        theme = "dark"
        editor = "code"
    } | ConvertTo-Json -Depth 5
    
    $config | Out-File -FilePath $configFile -Encoding UTF8
    Write-Host "   ✓ Configuração criada" -ForegroundColor Green
} else {
    Write-Host "   ✓ Configuração já existe" -ForegroundColor Green
}

# Criar banco de dados
Write-Host "💾 Criando banco de dados..." -ForegroundColor Cyan

$dbFile = "$userDataDir\apps.db"
if (-not (Test-Path $dbFile)) {
    $db = @{
        version = "1.0.0"
        apps = @()
        installations = @()
        logs = @()
    } | ConvertTo-Json -Depth 5
    
    $db | Out-File -FilePath $dbFile -Encoding UTF8
    Write-Host "   ✓ Banco de dados criado" -ForegroundColor Green
} else {
    Write-Host "   ✓ Banco de dados já existe" -ForegroundColor Green
}

Write-Host ""
Write-Host "╔═══════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                           ║" -ForegroundColor Green
Write-Host "║   ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!   ║" -ForegroundColor Green
Write-Host "║                                           ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📝 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Feche e reabra o PowerShell" -ForegroundColor Yellow
Write-Host "2. Execute: aiweaver help" -ForegroundColor Yellow
Write-Host "3. Instale seu primeiro app: aiweaver install app.html" -ForegroundColor Yellow
Write-Host ""

Write-Host "📚 COMANDOS DISPONÍVEIS:" -ForegroundColor Cyan
Write-Host "  aiweaver install <arquivo>  - Instalar app" -ForegroundColor White
Write-Host "  aiweaver start <id>         - Iniciar app" -ForegroundColor White
Write-Host "  aiweaver debug <id>         - Debug app" -ForegroundColor White
Write-Host "  aiweaver list               - Listar apps" -ForegroundColor White
Write-Host "  aiweaver help               - Ajuda completa" -ForegroundColor White
Write-Host ""

pause
