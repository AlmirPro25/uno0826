# 🚀 Aether Local Mode Startup Script
# Este script inicia o servidor backend e o frontend em modo local

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 Aether - Local PowerShell Mode                       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar se Node.js está instalado
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js não encontrado. Por favor, instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Criar diretório workspace se não existir
$workspaceDir = Join-Path $PSScriptRoot "workspace"
if (-not (Test-Path $workspaceDir)) {
    New-Item -ItemType Directory -Path $workspaceDir | Out-Null
    Write-Host "📁 Criado diretório workspace: $workspaceDir" -ForegroundColor Green
}

# Instalar dependências do servidor se necessário
$serverDir = Join-Path $PSScriptRoot "server"
$serverNodeModules = Join-Path $serverDir "node_modules"

if (-not (Test-Path $serverNodeModules)) {
    Write-Host "📦 Instalando dependências do servidor..." -ForegroundColor Yellow
    Push-Location $serverDir
    npm install
    Pop-Location
}

# Instalar dependências do frontend se necessário
$frontendNodeModules = Join-Path $PSScriptRoot "node_modules"
if (-not (Test-Path $frontendNodeModules)) {
    Write-Host "📦 Instalando dependências do frontend..." -ForegroundColor Yellow
    npm install
}

# Função para iniciar processo em nova janela
function Start-ProcessInNewWindow {
    param (
        [string]$Title,
        [string]$Command,
        [string]$WorkingDir
    )
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$WorkingDir'; `$Host.UI.RawUI.WindowTitle = '$Title'; $Command"
}

Write-Host ""
Write-Host "🔧 Iniciando serviços..." -ForegroundColor Cyan
Write-Host ""

# Iniciar servidor backend
Write-Host "  [1/2] Iniciando Backend Server (porta 3001)..." -ForegroundColor Yellow
Start-ProcessInNewWindow -Title "Aether Backend" -Command "npm run dev" -WorkingDir $serverDir

Start-Sleep -Seconds 2

# Iniciar frontend com flag de modo local
Write-Host "  [2/2] Iniciando Frontend (porta 5173)..." -ForegroundColor Yellow
$env:VITE_LOCAL_MODE = "true"
Start-ProcessInNewWindow -Title "Aether Frontend" -Command "`$env:VITE_LOCAL_MODE='true'; npm run dev" -WorkingDir $PSScriptRoot

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  ✅ Serviços iniciados!" -ForegroundColor Green
Write-Host ""
Write-Host "  🌐 Frontend:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "  🔌 Backend:   http://localhost:3001" -ForegroundColor Cyan
Write-Host "  📁 Workspace: $workspaceDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "  💡 O agente agora tem acesso ao PowerShell real!" -ForegroundColor Magenta
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Abrir no navegador após alguns segundos
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"
