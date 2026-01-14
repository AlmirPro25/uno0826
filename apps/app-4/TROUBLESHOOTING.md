# 🔧 Troubleshooting - MediSync

Guia para resolver problemas comuns no MediSync.

---

## 🚨 Problemas Comuns

### 1. Backend não inicia

**Erro:** `panic: failed to connect to database`

**Solução:**
```bash
# Verificar se o arquivo .env existe
ls -la backend/.env

# Verificar configuração do banco
cat backend/.env | grep DATABASE

# Para SQLite, garantir que USE_SQLITE=true
USE_SQLITE=true
```

**Erro:** `listen tcp :8080: bind: address already in use`

**Solução:**
```bash
# Windows - encontrar processo na porta 8080
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :8080
kill -9 <PID>

# Ou mudar a porta no .env
PORT=8081
```

---

### 2. Frontend não conecta ao Backend

**Erro:** `Network Error` ou `CORS error`

**Solução:**
1. Verificar se o backend está rodando:
```bash
curl http://localhost:8080/health
```

2. Verificar configuração do axios em `frontend/src/api/axios.ts`:
```typescript
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
});
```

3. Verificar CORS no backend (deve permitir localhost:3000)

---

### 3. Erro de Autenticação

**Erro:** `401 Unauthorized` ou `Token inválido`

**Causas e Soluções:**

1. **Token expirado:**
   - Faça logout e login novamente
   - O token expira em 24h

2. **JWT_SECRET diferente:**
   - Verificar se o JWT_SECRET é o mesmo em todas as instâncias
   - Após mudar JWT_SECRET, todos os tokens antigos são invalidados

3. **Cookies não sendo enviados:**
   ```typescript
   // Verificar se withCredentials está ativo
   axios.defaults.withCredentials = true;
   ```

---

### 4. Emails não são enviados

**Verificar configuração SMTP:**
```bash
# Testar conexão SMTP
telnet smtp.gmail.com 587
```

**Configuração correta:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-de-app  # NÃO use a senha normal!
SMTP_FROM=seu-email@gmail.com
```

**Para Gmail:**
1. Ative verificação em 2 etapas
2. Crie uma "Senha de App" em: Conta Google > Segurança > Senhas de app
3. Use essa senha no SMTP_PASSWORD

**Logs de email:**
```bash
# Ver logs do backend para erros de email
docker-compose logs backend | grep -i email
```

---

### 5. Videochamada não funciona

**Problema:** Jitsi não carrega

**Soluções:**
1. Verificar se está usando HTTPS (Jitsi requer HTTPS em produção)
2. Verificar permissões de câmera/microfone no navegador
3. Testar em outro navegador (Chrome recomendado)

**Problema:** WebSocket não conecta

```javascript
// Verificar URL do WebSocket
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';
```

Para HTTPS, usar `wss://` em vez de `ws://`

---

### 6. Erro de Criptografia

**Erro:** `crypto/aes: invalid key size`

**Solução:**
A ENCRYPTION_KEY deve ter exatamente 32 caracteres:
```env
# ERRADO (menos de 32)
ENCRYPTION_KEY=chave-curta

# CORRETO (exatamente 32)
ENCRYPTION_KEY=12345678901234567890123456789012
```

**Gerar chave correta:**
```bash
# Linux/Mac
openssl rand -base64 24 | head -c 32

# Windows PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

---

### 7. Banco de Dados

**Erro:** `database is locked` (SQLite)

**Solução:**
SQLite não suporta múltiplas escritas simultâneas. Para produção, use PostgreSQL:
```env
USE_SQLITE=false
DATABASE_URL=postgres://user:pass@host:5432/medisync
```

**Erro:** `relation "users" does not exist`

**Solução:**
As tabelas são criadas automaticamente pelo GORM. Se não foram criadas:
```bash
# Reiniciar o backend para rodar migrations
go run cmd/api/main.go
```

**Resetar banco (desenvolvimento):**
```bash
# SQLite - deletar arquivo
rm backend/medisync.db

# PostgreSQL
DROP DATABASE medisync;
CREATE DATABASE medisync;
```

---

### 8. Problemas de Performance

**Frontend lento:**
1. Verificar se está em modo desenvolvimento (`npm run dev` é mais lento)
2. Para produção: `npm run build && npm start`
3. Verificar Network tab no DevTools para requisições lentas

**Backend lento:**
1. Adicionar índices no banco:
```sql
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_date ON appointments(date_time);
```

2. Verificar logs para queries lentas
3. Considerar cache Redis para dados frequentes

---

### 9. Erros de Build

**Frontend:**
```bash
# Limpar cache e reinstalar
rm -rf node_modules .next
npm install
npm run build
```

**Backend:**
```bash
# Limpar cache do Go
go clean -cache
go mod tidy
go build -o medisync-backend cmd/api/main.go
```

---

### 10. Docker

**Erro:** `Cannot connect to the Docker daemon`

```bash
# Windows - iniciar Docker Desktop
# Linux
sudo systemctl start docker
```

**Erro:** `port is already allocated`

```bash
# Parar containers antigos
docker-compose down
docker ps -a  # ver containers
docker stop <container_id>
```

**Rebuild completo:**
```bash
docker-compose down -v  # remove volumes também
docker-compose build --no-cache
docker-compose up -d
```

---

## 🔍 Logs e Debug

### Ver logs do Backend
```bash
# Desenvolvimento
go run cmd/api/main.go 2>&1 | tee backend.log

# Docker
docker-compose logs -f backend
```

### Ver logs do Frontend
```bash
# Abrir DevTools no navegador (F12)
# Aba Console para erros JavaScript
# Aba Network para requisições HTTP
```

### Ativar modo debug
```env
# Backend
GIN_MODE=debug
LOG_LEVEL=debug

# Frontend (next.config.js)
module.exports = {
  reactStrictMode: true,
}
```

---

## 🔐 Problemas de Segurança

### Rate Limiting bloqueando
Se você está sendo bloqueado por rate limiting:
```bash
# Aguardar 1 minuto ou reiniciar o backend
# Limite padrão: 100 requisições/minuto por IP
```

### CORS bloqueando
Verificar origens permitidas no backend:
```go
// backend/pkg/middleware/cors.go
AllowOrigins: []string{
    "http://localhost:3000",
    "https://seudominio.com",
},
```

---

## 📱 Problemas Mobile

### Layout quebrado
1. Verificar viewport meta tag em `_document.tsx`
2. Testar em modo responsivo do DevTools (F12 > Toggle device toolbar)

### Touch não funciona
Verificar se eventos de touch estão implementados nos componentes interativos.

---

## 🆘 Ainda com problemas?

1. **Verificar logs** - A maioria dos erros está nos logs
2. **Reiniciar serviços** - Às vezes resolve
3. **Limpar cache** - Browser, npm, go
4. **Verificar .env** - Variáveis de ambiente corretas
5. **Atualizar dependências** - `npm update` / `go get -u`

### Reportar Bug
Se nada funcionar, abra uma issue com:
- Descrição do problema
- Passos para reproduzir
- Logs de erro
- Sistema operacional
- Versões (Node, Go, navegador)

---

## 📋 Checklist de Diagnóstico

```bash
# 1. Backend está rodando?
curl http://localhost:8080/health

# 2. Frontend está rodando?
curl http://localhost:3000

# 3. Banco está conectado?
curl http://localhost:8080/health/ready

# 4. Variáveis de ambiente?
cat backend/.env

# 5. Portas estão livres?
netstat -an | grep -E "8080|3000"

# 6. Docker está rodando?
docker ps

# 7. Logs de erro?
docker-compose logs --tail=50
```

---

**MediSync - Suporte técnico! 🏥**
