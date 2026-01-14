# Script para instalar node-pty no Windows
# Requer: Node.js, Python, Visual Studio Build Tools

Write-Host "🔧 Installing node-pty dependencies..." -ForegroundColor Cyan

# Verificar se npm está disponível
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Instalar windows-build-tools se necessário (requer admin)
Write-Host "📦 Installing build tools..." -ForegroundColor Yellow
npm install --global windows-build-tools 2>$null

# Instalar node-pty
Write-Host "📦 Installing node-pty..." -ForegroundColor Yellow
npm install node-pty

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ node-pty installed successfully!" -ForegroundColor Green
    Write-Host "🚀 You can now run: npm run dev" -ForegroundColor Cyan
} else {
    Write-Host "⚠️ node-pty installation failed. Trying with rebuild..." -ForegroundColor Yellow
    npm install node-pty --build-from-source
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ node-pty installed with rebuild!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install node-pty." -ForegroundColor Red
        Write-Host "   The terminal will work in fallback mode (less features)." -ForegroundColor Yellow
        Write-Host "   To fix, install Visual Studio Build Tools and try again." -ForegroundColor Yellow
    }
}
