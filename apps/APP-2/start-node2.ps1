# Script para iniciar um segundo nó Nexus em portas diferentes
# Use para testar P2P localmente

$env:NEXUS_API_PORT = "8081"
$env:NEXUS_P2P_PORT = "4002"
$env:NEXUS_IDENTITY_FILE = "nexus_identity_node2.key"
$env:NEXUS_DATABASE_PATH = "nexus_data_node2.db"

Write-Host "Iniciando Nexus Node 2..." -ForegroundColor Cyan
Write-Host "  API: http://localhost:8081" -ForegroundColor Green
Write-Host "  P2P: porta 4002" -ForegroundColor Green

Set-Location nexus-node
.\nexusd.exe
