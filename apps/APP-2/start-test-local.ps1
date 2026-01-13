# Script para testar P2P localmente com 2 nós
# Abre 4 terminais: 2 backends + 2 frontends

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NEXUS P2P - Teste Local (2 Nós)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Nó 1
Write-Host "[1/4] Iniciando Backend Nó 1 (porta 8080)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd nexus-node; .\nexusd.exe"

Start-Sleep -Seconds 2

# Nó 2
Write-Host "[2/4] Iniciando Backend Nó 2 (porta 8081)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
`$env:NEXUS_API_PORT = '8081'
`$env:NEXUS_P2P_PORT = '4002'
`$env:NEXUS_IDENTITY_FILE = 'nexus_identity_node2.key'
`$env:NEXUS_DATABASE_PATH = 'nexus_data_node2.db'
cd nexus-node
.\nexusd.exe
"@

Start-Sleep -Seconds 2

# Frontend 1
Write-Host "[3/4] Iniciando Frontend Nó 1 (porta 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd web; npm run dev"

Start-Sleep -Seconds 2

# Frontend 2
Write-Host "[4/4] Iniciando Frontend Nó 2 (porta 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd web; npx vite --config vite.config.node2.ts"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  PRONTO! Abra nos navegadores:" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Nó 1: http://localhost:3000" -ForegroundColor White
Write-Host "  Nó 2: http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "Os nós devem se descobrir automaticamente via mDNS!" -ForegroundColor Cyan
Write-Host ""

# Abrir navegadores
Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"
Start-Process "http://localhost:3001"
