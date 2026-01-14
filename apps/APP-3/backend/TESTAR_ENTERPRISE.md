# 🧪 TESTE RÁPIDO - Arquitetura Enterprise

## 1. Iniciar o Servidor Enterprise

```bash
cd backend
npm run dev:enterprise
```

Você verá:
```
╔══════════════════════════════════════════════════════════════╗
║   🏦 NEXUS BANK API - Enterprise Grade                       ║
║   Status: OPERATIONAL                                        ║
╚══════════════════════════════════════════════════════════════╝
```

## 2. Testar Health Check

```bash
curl http://localhost:3001/api/v2/health
```

Resposta esperada:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-...",
    "uptime": 5.123
  },
  "requestId": "uuid-..."
}
```

## 3. Testar Registro (com validação de senha forte)

```bash
# Senha fraca - deve falhar
curl -X POST http://localhost:3001/api/v2/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123"}'

# Resposta: erro de validação

# Senha forte - deve funcionar
curl -X POST http://localhost:3001/api/v2/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"SecurePass123"}'
```

## 4. Testar Rate Limiting

```bash
# Execute 6 vezes rapidamente
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/v2/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"wrong@test.com","password":"wrong"}'
  echo ""
done
```

Na 6ª tentativa você verá:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later."
  }
}
```

## 5. Testar CRUD de Projetos

```bash
# 1. Login primeiro
TOKEN=$(curl -s -X POST http://localhost:3001/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"SecurePass123"}' | jq -r '.data.accessToken')

# 2. Criar projeto
curl -X POST http://localhost:3001/api/v2/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Meu Projeto","htmlCode":"<h1>Hello</h1>"}'

# 3. Listar projetos
curl http://localhost:3001/api/v2/projects \
  -H "Authorization: Bearer $TOKEN"

# 4. Buscar projeto específico
curl http://localhost:3001/api/v2/projects/{ID} \
  -H "Authorization: Bearer $TOKEN"
```

## 6. Verificar Logs Estruturados

No console do servidor você verá logs JSON:
```json
{"timestamp":"2024-...","level":"INFO","message":"HTTP POST /api/v2/auth/login","context":{"requestId":"...","method":"POST","statusCode":200,"duration":45}}
```

## 7. Verificar Headers de Segurança

```bash
curl -I http://localhost:3001/api/v2/health
```

Headers esperados:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
X-Request-ID: uuid-...
X-RateLimit-Remaining: 99
```

---

## ✅ Checklist de Validação

- [ ] Servidor inicia sem erros
- [ ] Health check responde
- [ ] Registro valida senha forte
- [ ] Login funciona com credenciais corretas
- [ ] Rate limiting bloqueia após 5 tentativas
- [ ] CRUD de projetos funciona
- [ ] Logs são estruturados em JSON
- [ ] Headers de segurança presentes
- [ ] Request ID em todas as respostas

---

**Parabéns! Seu sistema agora está no nível Tech Lead do Itaú! 🏦**
