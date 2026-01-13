# Nexus Sovereign Build Script for Windows
# Requires: Go 1.20+, Node.js 18+, Wails CLI

param(
    [string]$Mode = "dev"
)

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  NEXUS SOVEREIGN - Build System" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
function Check-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

Write-Host "[1/5] Verificando pré-requisitos..." -ForegroundColor Yellow

if (-not (Check-Command "go")) {
    Write-Host "ERRO: Go não encontrado. Instale em https://go.dev/dl/" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Go encontrado: $(go version)" -ForegroundColor Green

if (-not (Check-Command "node")) {
    Write-Host "ERRO: Node.js não encontrado. Instale em https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Node.js encontrado: $(node --version)" -ForegroundColor Green

if (-not (Check-Command "wails")) {
    Write-Host "  ! Wails CLI não encontrado. Instalando..." -ForegroundColor Yellow
    go install github.com/wailsapp/wails/v2/cmd/wails@latest
}
Write-Host "  ✓ Wails CLI disponível" -ForegroundColor Green

# Install frontend dependencies
Write-Host ""
Write-Host "[2/5] Instalando dependências do frontend..." -ForegroundColor Yellow
Push-Location web
npm install
Pop-Location
Write-Host "  ✓ Dependências instaladas" -ForegroundColor Green

# Install Go dependencies
Write-Host ""
Write-Host "[3/5] Instalando dependências do backend..." -ForegroundColor Yellow
Push-Location nexus-node
go mod tidy
Pop-Location
Write-Host "  ✓ Módulos Go sincronizados" -ForegroundColor Green

# Build based on mode
Write-Host ""
Write-Host "[4/5] Compilando aplicação (modo: $Mode)..." -ForegroundColor Yellow

if ($Mode -eq "dev") {
    Write-Host "  Iniciando modo desenvolvimento..." -ForegroundColor Cyan
    wails dev
} elseif ($Mode -eq "build") {
    Write-Host "  Compilando binário de produção..." -ForegroundColor Cyan
    wails build -clean -platform windows/amd64
    
    Write-Host ""
    Write-Host "[5/5] Build concluído!" -ForegroundColor Green
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  Binário gerado em: build/bin/NexusSovereign.exe" -ForegroundColor White
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
} elseif ($Mode -eq "docker") {
    Write-Host "  Iniciando via Docker Compose..." -ForegroundColor Cyan
    docker-compose up --build -d
    Write-Host ""
    Write-Host "  ✓ Containers iniciados" -ForegroundColor Green
    Write-Host "  → Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "  → API: http://localhost:8080" -ForegroundColor White
} else {
    Write-Host "Modo inválido. Use: dev, build, ou docker" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Concluído!" -ForegroundColor Green
