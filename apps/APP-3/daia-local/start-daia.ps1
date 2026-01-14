# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                    DAIA - Database AI Apprentice                             ║
# ║                                                                              ║
# ║              Script de Inicialização para PowerShell                         ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

$Host.UI.RawUI.WindowTitle = "DAIA - Database AI Apprentice"

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║                                                                              ║" -ForegroundColor Cyan
Write-Host "  ║                    🧠 DAIA - Database AI Apprentice 🧠                       ║" -ForegroundColor Cyan
Write-Host "  ║                                                                              ║" -ForegroundColor Cyan
Write-Host "  ║              'O Modelo Local que Aprende com Seus Códigos'                  ║" -ForegroundColor Cyan
Write-Host "  ║                                                                              ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verifica Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "[OK] $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERRO] Python não encontrado!" -ForegroundColor Red
    Write-Host "Por favor, instale Python 3.10+ de https://python.org" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verifica ambiente virtual
if (-not (Test-Path "venv")) {
    Write-Host "[INFO] Criando ambiente virtual..." -ForegroundColor Yellow
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha ao criar ambiente virtual!" -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
        exit 1
    }
}

# Ativa ambiente virtual
Write-Host "[INFO] Ativando ambiente virtual..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Verifica dependências
$fastapiInstalled = pip show fastapi 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[INFO] Instalando dependências..." -ForegroundColor Yellow
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha ao instalar dependências!" -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
        exit 1
    }
}

# Cria diretórios
if (-not (Test-Path "database")) { New-Item -ItemType Directory -Path "database" | Out-Null }
if (-not (Test-Path "models\cache")) { New-Item -ItemType Directory -Path "models\cache" -Force | Out-Null }

Write-Host ""
Write-Host "[INFO] Iniciando servidor DAIA..." -ForegroundColor Green
Write-Host "[INFO] Acesse: http://localhost:8765" -ForegroundColor Cyan
Write-Host "[INFO] Pressione Ctrl+C para parar" -ForegroundColor Yellow
Write-Host ""

# Inicia servidor
python server.py

Read-Host "Pressione Enter para sair"
