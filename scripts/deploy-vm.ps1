<#
.SYNOPSIS
    Deploy Backend v3.0 para VM Oracle/Google Cloud
.EXAMPLE
    .\scripts\deploy-vm.ps1
    .\scripts\deploy-vm.ps1 -HostName "192.168.1.50"
#>

param(
    [string]$HostName = "api.prostqs.com.br",
    [string]$User = "ubuntu"
)

$BinBackend = "bin\prostqs-backend-linux-amd64"
$BinSeed = "bin\seed-tenant-linux-amd64"
$RemoteDir = "~/apps/uno0826/backend"

if (-not (Test-Path $BinBackend)) {
    Write-Host "Binario nao encontrado: $BinBackend" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "DEPLOY V3.0 PARA: $HostName" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Upload
Write-Host "[1/3] Enviando binarios..." -ForegroundColor Yellow
scp $BinBackend "${User}@${HostName}:${RemoteDir}/prostqs-api-new"
scp $BinSeed "${User}@${HostName}:${RemoteDir}/seed-tenant"

# 2. Restart
Write-Host "[2/3] Reiniciando servico..." -ForegroundColor Yellow
ssh "${User}@${HostName}" "cd ${RemoteDir}; cp prostqs-api prostqs-api.bak; mv prostqs-api-new prostqs-api; chmod +x prostqs-api seed-tenant; sudo systemctl restart prostqs"

# 3. Check
Write-Host "[3/3] Verificando..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
ssh "${User}@${HostName}" "sudo systemctl status prostqs --no-pager"

Write-Host ""
Write-Host "DEPLOY CONCLUIDO!" -ForegroundColor Green
Write-Host "Para criar o primeiro Tenant:" -ForegroundColor White
Write-Host "  ssh ${User}@${HostName} 'cd ${RemoteDir} && ./seed-tenant'"
Write-Host ""
