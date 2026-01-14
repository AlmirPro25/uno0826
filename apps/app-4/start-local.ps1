# ╔══════════════════════════════════════════════════════════════════════╗
# ║         MediSync - Script de Inicialização Local (Windows)           ║
# ╚══════════════════════════════════════════════════════════════════════╝

param(
    [switch]$WithWhatsApp,
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                  🏥 MediSync Platform                         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. Configurar Ambiente para SQLite (Fallback se Docker falhar)
$env:USE_SQLITE = "true"
$env:SQLITE_FILE = "medisync.db"
$env:PORT = "8080"
# Definir chaves de segurança (DEV ONLY)
$env:JWT_SECRET = "dev-secret-key"
$env:ENCRYPTION_KEY = "12345678901234561234567890123456" 

# 2. Setup (Backend)
if (-not $FrontendOnly) {
    Write-Host "📦 Configurando Backend..." -ForegroundColor Yellow
    if (-not (Test-Path "backend\go.sum")) {
        Push-Location backend
        go mod tidy
        Pop-Location
    }

    # 3. Iniciar Backend (em nova janela)
    Write-Host "🚀 Iniciando Backend (Go + SQLite)..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
        `$env:USE_SQLITE = 'true'
        `$env:SQLITE_FILE = 'medisync.db'
        `$env:PORT = '8080'
        `$env:JWT_SECRET = 'dev-secret-key'
        `$env:ENCRYPTION_KEY = '12345678901234561234567890123456'
        cd backend
        Write-Host '🏥 Backend MediSync rodando na porta 8080' -ForegroundColor Green
        go run cmd/api/main.go
"@
}

# 4. Iniciar Frontend (em nova janela)
if (-not $BackendOnly) {
    Write-Host "🌐 Iniciando Frontend (Next.js)..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
        cd frontend
        Write-Host '🌐 Frontend MediSync rodando na porta 3000' -ForegroundColor Green
        npm run dev
"@
}

# 5. Iniciar WhatsApp Service (opcional)
if ($WithWhatsApp) {
    Write-Host "📱 Iniciando WhatsApp Service..." -ForegroundColor Magenta
    
    # Verificar se existe .env no whatsapp-service
    if (-not (Test-Path "whatsapp-service\.env")) {
        Write-Host "⚠️  Criando .env a partir de .env.example..." -ForegroundColor Yellow
        Copy-Item "whatsapp-service\.env.example" "whatsapp-service\.env"
        Write-Host "📝 Edite whatsapp-service\.env com sua GEMINI_API_KEY!" -ForegroundColor Yellow
    }
    
    # Verificar se node_modules existe
    if (-not (Test-Path "whatsapp-service\node_modules")) {
        Write-Host "📦 Instalando dependências do WhatsApp Service..." -ForegroundColor Yellow
        Push-Location whatsapp-service
        npm install
        Pop-Location
    }
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
        cd whatsapp-service
        Write-Host '📱 WhatsApp Service rodando na porta 3001' -ForegroundColor Magenta
        Write-Host 'Escaneie o QR Code com seu WhatsApp!' -ForegroundColor Cyan
        npm run dev
"@
}

Write-Host ""
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Serviços iniciados!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Endpoints:" -ForegroundColor White
if (-not $FrontendOnly) {
    Write-Host "   Backend:  http://localhost:8080" -ForegroundColor Gray
    Write-Host "   Chat WS:  ws://localhost:8080/ws/chat" -ForegroundColor Gray
}
if (-not $BackendOnly) {
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Gray
}
if ($WithWhatsApp) {
    Write-Host "   WhatsApp: http://localhost:3001" -ForegroundColor Gray
    Write-Host "   Status:   http://localhost:3001/health" -ForegroundColor Gray
}
Write-Host ""
Write-Host "💡 Para iniciar com WhatsApp Service:" -ForegroundColor Yellow
Write-Host "   .\start-local.ps1 -WithWhatsApp" -ForegroundColor Gray
Write-Host ""
