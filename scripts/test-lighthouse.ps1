# ========================================
# PROST-QS Lighthouse Test Script
# Testa endpoints P2P após deploy
# ========================================

param(
    [string]$BaseUrl = "http://localhost:8080"
)

Write-Host "🔦 LIGHTHOUSE P2P TEST" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray
Write-Host ""

$passed = 0
$failed = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [string]$Body = $null
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow -NoNewline
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            ContentType = "application/json"
            TimeoutSec = 10
        }
        
        if ($Body) {
            $params.Body = $Body
        }
        
        $response = Invoke-RestMethod @params
        Write-Host " ✅ PASS" -ForegroundColor Green
        Write-Host "  Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
        return $true
    }
    catch {
        Write-Host " ❌ FAIL" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Test 1: Status
Write-Host ""
Write-Host "📡 1. LIGHTHOUSE STATUS" -ForegroundColor Cyan
if (Test-Endpoint -Name "Status" -Method "GET" -Url "$BaseUrl/api/v1/lighthouse/status") {
    $passed++
} else { $failed++ }

# Test 2: Bootstrap
Write-Host ""
Write-Host "🚀 2. BOOTSTRAP (Discovery)" -ForegroundColor Cyan
if (Test-Endpoint -Name "Bootstrap" -Method "GET" -Url "$BaseUrl/api/v1/lighthouse/bootstrap?region=sa-east") {
    $passed++
} else { $failed++ }

# Test 3: Announce Peer
Write-Host ""
Write-Host "📢 3. ANNOUNCE PEER" -ForegroundColor Cyan
$announceBody = @{
    peer_id = "12D3KooWTestPeer$(Get-Random -Maximum 9999)"
    multiaddrs = @("/ip4/192.168.1.100/tcp/4001")
    region = "sa-east"
    capabilities = @{
        bandwidth = 100
        storage = 1000
        relay_capable = $true
    }
} | ConvertTo-Json

if (Test-Endpoint -Name "Announce" -Method "POST" -Url "$BaseUrl/api/v1/lighthouse/announce" -Body $announceBody) {
    $passed++
} else { $failed++ }

# Test 4: List Peers
Write-Host ""
Write-Host "👥 4. LIST PEERS" -ForegroundColor Cyan
if (Test-Endpoint -Name "List Peers" -Method "GET" -Url "$BaseUrl/api/v1/lighthouse/peers?region=sa-east") {
    $passed++
} else { $failed++ }

# Test 5: Get Relays
Write-Host ""
Write-Host "🔄 5. GET RELAYS (TURN/STUN)" -ForegroundColor Cyan
if (Test-Endpoint -Name "Relays" -Method "GET" -Url "$BaseUrl/api/v1/lighthouse/relays") {
    $passed++
} else { $failed++ }

# Test 6: Heartbeat
Write-Host ""
Write-Host "💓 6. HEARTBEAT" -ForegroundColor Cyan
$heartbeatBody = @{
    peer_id = "12D3KooWTestPeer1234"
} | ConvertTo-Json

if (Test-Endpoint -Name "Heartbeat" -Method "POST" -Url "$BaseUrl/api/v1/lighthouse/heartbeat" -Body $heartbeatBody) {
    $passed++
} else { $failed++ }

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESULTADO: $passed passed, $failed failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
Write-Host "========================================" -ForegroundColor Cyan

if ($failed -eq 0) {
    Write-Host ""
    Write-Host "🎉 Lighthouse está funcionando!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Yellow
    Write-Host "1. Testar conexão entre 2 peers reais"
    Write-Host "2. Enviar primeira mensagem P2P"
    Write-Host "3. Verificar logs no dashboard"
} else {
    Write-Host ""
    Write-Host "⚠️  Alguns testes falharam." -ForegroundColor Yellow
    Write-Host "Verifique se o backend está rodando e acessível." -ForegroundColor Gray
}
