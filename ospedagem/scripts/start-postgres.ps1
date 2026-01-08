# Inicia PostgreSQL via Docker (para desenvolvimento)
Write-Host "Iniciando PostgreSQL..." -ForegroundColor Cyan

docker run -d `
  --name sce-postgres `
  -e POSTGRES_USER=sce_admin `
  -e POSTGRES_PASSWORD=sce_password_secure_2024 `
  -e POSTGRES_DB=sce_cloud `
  -p 5432:5432 `
  postgres:15-alpine

Write-Host ""
Write-Host "PostgreSQL rodando na porta 5432" -ForegroundColor Green
Write-Host "Connection: postgresql://sce_admin:sce_password_secure_2024@localhost:5432/sce_cloud" -ForegroundColor DarkGray
