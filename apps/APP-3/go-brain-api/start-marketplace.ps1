# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                    GO BRAIN API + STARTER KIT MARKETPLACE                     ║
# ║                                                                               ║
# ║              "Cada geração é um ativo econômico reutilizável"                ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    GO BRAIN API + STARTER KIT MARKETPLACE                     ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar Go
$goVersion = go version 2>$null
if (-not $goVersion) {
    Write-Host "[ERRO] Go não encontrado. Instale em: https://golang.org/dl/" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] $goVersion" -ForegroundColor Green

# Criar diretório de dados
if (-not (Test-Path "data")) {
    New-Item -ItemType Directory -Path "data" | Out-Null
    Write-Host "[OK] Diretório data criado" -ForegroundColor Green
}

# Verificar GEMINI_API_KEY
if (-not $env:GEMINI_API_KEY) {
    Write-Host "[AVISO] GEMINI_API_KEY não configurada" -ForegroundColor Yellow
    Write-Host "        Configure com: `$env:GEMINI_API_KEY = 'sua_chave'" -ForegroundColor Yellow
    Write-Host ""
}

# Baixar dependências
Write-Host "[1/3] Baixando dependências..." -ForegroundColor Cyan
go mod tidy

# Compilar
Write-Host "[2/3] Compilando..." -ForegroundColor Cyan
go build -o brain-api.exe .

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha na compilação" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Compilado com sucesso" -ForegroundColor Green

# Iniciar
Write-Host "[3/3] Iniciando servidor..." -ForegroundColor Cyan
Write-Host ""

# Definir porta
if (-not $env:PORT) {
    $env:PORT = "8080"
}

Write-Host "🧠 Brain API: http://localhost:$($env:PORT)" -ForegroundColor Green
Write-Host "🏪 Marketplace: http://localhost:$($env:PORT)/v1/marketplace" -ForegroundColor Green
Write-Host "📊 Stats: http://localhost:$($env:PORT)/v1/marketplace/stats" -ForegroundColor Green
Write-Host ""

./brain-api.exe
