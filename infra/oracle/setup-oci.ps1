# Script de instalacao do OCI CLI
# Autor: Antigravity Assistant

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OCI CLI Setup - Oracle Cloud" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Criar diretorio .oci se nao existir
$ociDir = "$env:USERPROFILE\.oci"
if (-not (Test-Path $ociDir)) {
    New-Item -ItemType Directory -Path $ociDir -Force | Out-Null
    Write-Host "[OK] Diretorio .oci criado" -ForegroundColor Green
}

# Gerar chave RSA
Write-Host "[...] Gerando par de chaves RSA..." -ForegroundColor Yellow
$keyPath = "$ociDir\oci_api_key.pem"
$pubKeyPath = "$ociDir\oci_api_key_public.pem"

try {
    # Gerar chave privada RSA 2048 bits usando .NET
    $rsa = [System.Security.Cryptography.RSA]::Create(2048)
    
    # Exportar chave privada em formato PEM
    $privateKeyBytes = $rsa.ExportRSAPrivateKey()
    $privateKeyBase64 = [Convert]::ToBase64String($privateKeyBytes)
    $privateKeyPem = "-----BEGIN RSA PRIVATE KEY-----`n"
    for ($i = 0; $i -lt $privateKeyBase64.Length; $i += 64) {
        $privateKeyPem += $privateKeyBase64.Substring($i, [Math]::Min(64, $privateKeyBase64.Length - $i)) + "`n"
    }
    $privateKeyPem += "-----END RSA PRIVATE KEY-----"
    
    # Exportar chave publica em formato PEM
    $publicKeyBytes = $rsa.ExportSubjectPublicKeyInfo()
    $publicKeyBase64 = [Convert]::ToBase64String($publicKeyBytes)
    $publicKeyPem = "-----BEGIN PUBLIC KEY-----`n"
    for ($i = 0; $i -lt $publicKeyBase64.Length; $i += 64) {
        $publicKeyPem += $publicKeyBase64.Substring($i, [Math]::Min(64, $publicKeyBase64.Length - $i)) + "`n"
    }
    $publicKeyPem += "-----END PUBLIC KEY-----"
    
    # Salvar chaves
    $privateKeyPem | Out-File -FilePath $keyPath -Encoding ascii -NoNewline
    $publicKeyPem | Out-File -FilePath $pubKeyPath -Encoding ascii -NoNewline
    
    Write-Host "[OK] Chaves RSA geradas com sucesso!" -ForegroundColor Green
}
catch {
    Write-Host "[ERRO] Falha ao gerar chaves: $_" -ForegroundColor Red
    exit 1
}

# Criar arquivo de configuracao
$configPath = "$ociDir\config"
$configContent = @"
[DEFAULT]
user=ocid1.user.oc1..aaaaaaaa7myh2ct5jswbcphesifdi7sk7g34pftbxhxotkdnw3wve4wx476q
fingerprint=PENDING
tenancy=ocid1.tenancy.oc1..aaaaaaaaeak2g7unxk6sxl4dbamn67bdvv3gqyqvkmd5dcusfqezjx3fa42q
region=sa-saopaulo-1
key_file=$keyPath
"@

$configContent | Out-File -FilePath $configPath -Encoding ascii
Write-Host "[OK] Arquivo de configuracao criado" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  CONFIGURACAO CONCLUIDA!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "PROXIMO PASSO IMPORTANTE:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Copie o conteudo da CHAVE PUBLICA abaixo:" -ForegroundColor White
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor DarkGray
Get-Content $pubKeyPath
Write-Host "----------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host "2. Va no Oracle Cloud Console:" -ForegroundColor White
Write-Host "   - Clique no seu PERFIL (canto superior direito)" -ForegroundColor White
Write-Host "   - Va em 'Chaves de API' ou 'API Keys'" -ForegroundColor White
Write-Host "   - Clique em 'Adicionar chave de API'" -ForegroundColor White
Write-Host "   - Escolha 'Colar chave publica'" -ForegroundColor White
Write-Host "   - Cole a chave publica acima" -ForegroundColor White
Write-Host ""
Write-Host "3. Depois de adicionar, copie o FINGERPRINT que aparecer" -ForegroundColor White
Write-Host "   e me manda aqui que eu atualizo a configuracao!" -ForegroundColor White
Write-Host ""
Write-Host "Arquivo da chave publica: $pubKeyPath" -ForegroundColor Cyan
