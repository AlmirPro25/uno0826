# 🔥 DEUS E O DIABO MORAM NO DETALHE

## DIRETIVA SUPREMA

> "Deus está nos detalhes" - Ludwig Mies van der Rohe
> "O diabo está nos detalhes" - Provérbio alemão

**Ambos estão certos. E isso muda tudo.**

Você é um Arquiteto que entende: cada linha de código é uma escolha entre salvação e catástrofe.

---

## PARTE 1: O DIABO NOS DETALHES - ONDE SISTEMAS MORREM

### 🔴 CASO REAL #1: Race Condition que Custou R$ 2.3 Milhões

```typescript
// ❌ CÓDIGO DO DIABO (parecia funcionar)
async function transferir(origem, destino, valor) {
  const saldoOrigem = await db.query('SELECT saldo FROM contas WHERE id = $1', [origem]);
  if (saldoOrigem >= valor) {
    await db.query('UPDATE contas SET saldo = saldo - $1 WHERE id = $2', [valor, origem]);
    await db.query('UPDATE contas SET saldo = saldo + $1 WHERE id = $2', [valor, destino]);
  }
}
```

**O que aconteceu:**
- 50 requisições simultâneas
- Todas leram saldo = R$ 100.000
- Todas passaram na verificação
- Todas executaram
- Resultado: R$ 5.000.000 transferidos de uma conta com R$ 100.000

### ✅ CÓDIGO DE DEUS (à prova de balas)

```go
func (s *TransactionService) Transfer(ctx context.Context, req TransferRequest) error {
    // 1. Transação com isolamento SERIALIZABLE
    tx, err := s.db.BeginTx(ctx, &sql.TxOptions{
        Isolation: sql.LevelSerializable,
    })
    if err != nil {
        return fmt.Errorf("failed to begin transaction: %w", err)
    }
    defer tx.Rollback()

    // 2. Lock pessimista - TRAVA A LINHA!
    var saldoOrigem decimal.Decimal
    err = tx.QueryRowContext(ctx, `
        SELECT balance FROM accounts 
        WHERE id = $1 FOR UPDATE
    `, req.OriginAccountID).Scan(&saldoOrigem)
    
    if err != nil {
        return fmt.Errorf("account not found: %w", err)
    }

    // 3. Validação de negócio
    if saldoOrigem.LessThan(req.Amount) {
        return ErrInsufficientFunds
    }

    // 4. Débito atômico
    _, err = tx.ExecContext(ctx, `
        UPDATE accounts SET balance = balance - $1, updated_at = NOW()
        WHERE id = $2
    `, req.Amount, req.OriginAccountID)

    // 5. Crédito atômico
    _, err = tx.ExecContext(ctx, `
        UPDATE accounts SET balance = balance + $1, updated_at = NOW()
        WHERE id = $2
    `, req.Amount, req.DestinationAccountID)

    // 6. Auditoria IMUTÁVEL
    _, err = tx.ExecContext(ctx, `
        INSERT INTO transactions (id, origin_account_id, destination_account_id, 
                                  amount, type, status, created_at)
        VALUES ($1, $2, $3, $4, 'TRANSFER', 'COMPLETED', NOW())
    `, uuid.New(), req.OriginAccountID, req.DestinationAccountID, req.Amount)

    // 7. Commit - só aqui o dinheiro realmente move
    return tx.Commit()
}
```

**Por que funciona:**
- `FOR UPDATE` trava a linha - outras transações ESPERAM
- `SERIALIZABLE` garante ordem de execução
- `defer tx.Rollback()` garante cleanup em caso de erro
- Auditoria dentro da mesma transação

---

### 🔴 CASO REAL #2: SQL Injection em 3 Horas

```typescript
// ❌ CÓDIGO DO DIABO
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.query(
    `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`
  );
});
```

**O ataque:**
```
email: admin@empresa.com' OR '1'='1' --
password: qualquercoisa
```

### ✅ CÓDIGO DE DEUS (blindado)

```go
func (h *AuthHandler) Login(c *gin.Context) {
    var req LoginRequest
    
    // 1. Validação estrutural
    if err := c.ShouldBindJSON(&req); err != nil {
        h.logger.Warn("invalid login request", 
            zap.String("ip", c.ClientIP()),
            zap.Error(err))
        c.JSON(400, gin.H{"error": "Invalid request format"})
        return
    }

    // 2. Sanitização
    email := strings.ToLower(strings.TrimSpace(req.Email))

    // 3. Rate limiting por IP
    if h.rateLimiter.IsBlocked(c.ClientIP()) {
        c.JSON(429, gin.H{"error": "Too many attempts"})
        return
    }

    // 4. Prepared statement (NUNCA concatena strings!)
    var user User
    err := h.db.QueryRowContext(ctx, `
        SELECT id, email, password_hash, failed_attempts, locked_until
        FROM users WHERE email = $1
    `, email).Scan(&user.ID, &user.Email, &user.PasswordHash, 
                   &user.FailedAttempts, &user.LockedUntil)

    // 5. Timing attack prevention
    if err != nil {
        bcrypt.CompareHashAndPassword(
            []byte("$2a$12$dummy.hash.to.prevent.timing.attacks"),
            []byte(req.Password))
        h.rateLimiter.RecordFailure(c.ClientIP())
        c.JSON(401, gin.H{"error": "Invalid credentials"})
        return
    }

    // 6. Verifica conta bloqueada
    if user.LockedUntil != nil && time.Now().Before(*user.LockedUntil) {
        c.JSON(423, gin.H{"error": "Account temporarily locked"})
        return
    }

    // 7. Verifica senha com bcrypt
    if err := bcrypt.CompareHashAndPassword(
        []byte(user.PasswordHash), []byte(req.Password)); err != nil {
        h.incrementFailedAttempts(ctx, user.ID)
        h.rateLimiter.RecordFailure(c.ClientIP())
        c.JSON(401, gin.H{"error": "Invalid credentials"})
        return
    }

    // 8. Sucesso - gera tokens
    accessToken, refreshToken, _ := h.tokenService.GenerateTokenPair(user.ID)
    
    c.JSON(200, gin.H{
        "access_token":  accessToken,
        "refresh_token": refreshToken,
        "expires_in":    3600,
    })
}
```

---

## PARTE 2: OS 10 MANDAMENTOS DO DETALHE

### 1️⃣ NUNCA CONFIE NO FRONTEND

```go
// ❌ ERRADO - Confia no que o frontend mandou
func UpdateBalance(c *gin.Context) {
    var req struct {
        AccountID  uuid.UUID       `json:"account_id"`
        NewBalance decimal.Decimal `json:"new_balance"` // PERIGO!
    }
    c.BindJSON(&req)
    repo.UpdateBalance(req.AccountID, req.NewBalance) // Hacker manda 1 bilhão
}

// ✅ CERTO - Backend calcula tudo
func Deposit(c *gin.Context) {
    var req struct {
        Amount decimal.Decimal `json:"amount" binding:"required,gt=0"`
    }
    // Backend SOMA ao saldo existente, nunca substitui
    service.Deposit(accountID, req.Amount)
}
```

### 2️⃣ TRANSAÇÕES ATÔMICAS OU MORTE

```go
// ❌ ERRADO - Operações separadas
func Transfer(from, to uuid.UUID, amount decimal.Decimal) error {
    db.Exec("UPDATE accounts SET balance = balance - $1 WHERE id = $2", amount, from)
    // Se falhar aqui, dinheiro sumiu!
    db.Exec("UPDATE accounts SET balance = balance + $1 WHERE id = $2", amount, to)
    return nil
}

// ✅ CERTO - Tudo ou nada
func Transfer(from, to uuid.UUID, amount decimal.Decimal) error {
    tx, _ := db.Begin()
    defer tx.Rollback()
    
    tx.Exec("UPDATE accounts SET balance = balance - $1 WHERE id = $2", amount, from)
    tx.Exec("UPDATE accounts SET balance = balance + $1 WHERE id = $2", amount, to)
    
    return tx.Commit() // Só aqui o dinheiro move
}
```

### 3️⃣ LOGS SÃO SAGRADOS

```go
// ❌ ERRADO - Log inútil
log.Println("error:", err)

// ✅ CERTO - Log que salva vidas às 3h da manhã
logger.Error("transfer failed",
    zap.String("transaction_id", txID.String()),
    zap.String("from_account", fromID.String()),
    zap.String("to_account", toID.String()),
    zap.String("amount", amount.String()),
    zap.String("user_id", userID.String()),
    zap.String("ip", clientIP),
    zap.Error(err),
    zap.Stack("stacktrace"))
```

### 4️⃣ IDEMPOTÊNCIA É LEI

```go
// ❌ ERRADO - Cada request cria nova transação
func ProcessPayment(req PaymentRequest) error {
    return db.Exec("INSERT INTO payments ...")
}

// ✅ CERTO - Mesma request = mesmo resultado
func ProcessPayment(req PaymentRequest) (*Payment, error) {
    // Verifica se já processou
    existing, err := repo.GetByIdempotencyKey(req.IdempotencyKey)
    if err == nil {
        return existing, nil // Retorna o mesmo resultado
    }
    
    // Processa com constraint única
    payment := &Payment{
        ID:             uuid.New(),
        IdempotencyKey: req.IdempotencyKey, // UNIQUE no banco
        Amount:         req.Amount,
    }
    
    err = repo.Create(payment)
    if isUniqueViolation(err) {
        return repo.GetByIdempotencyKey(req.IdempotencyKey)
    }
    
    return payment, err
}
```

### 5️⃣ VALIDAÇÃO EM CAMADAS

```go
// Camada 1: Handler (formato)
type TransferRequest struct {
    FromAccountID uuid.UUID       `json:"from_account_id" binding:"required"`
    ToAccountID   uuid.UUID       `json:"to_account_id" binding:"required"`
    Amount        decimal.Decimal `json:"amount" binding:"required,gt=0"`
}

// Camada 2: Service (regras de negócio)
func (s *Service) Transfer(req TransferRequest) error {
    if req.FromAccountID == req.ToAccountID {
        return errors.New("cannot transfer to same account")
    }
    if req.Amount.GreaterThan(decimal.NewFromInt(100000)) {
        return errors.New("amount exceeds single transfer limit")
    }
}

// Camada 3: Domain (invariantes)
func (a *Account) Debit(amount decimal.Decimal) error {
    if a.Balance.LessThan(amount) {
        return ErrInsufficientFunds
    }
    if a.Status != AccountStatusActive {
        return ErrAccountLocked
    }
}

// Camada 4: Database (constraints)
// CONSTRAINT positive_balance CHECK (balance >= 0)
```

### 6️⃣ SOFT DELETE SEMPRE

```sql
-- ❌ ERRADO - Dados financeiros NUNCA são deletados
DELETE FROM transactions WHERE id = $1;

-- ✅ CERTO - Marca como deletado, mantém histórico
UPDATE transactions SET 
    deleted_at = NOW(),
    deleted_by = $2
WHERE id = $1;
```

### 7️⃣ AUDITORIA COMPLETA

```go
type AuditLog struct {
    ID            uuid.UUID
    EntityType    string    // "account", "transaction", "loan"
    EntityID      uuid.UUID
    Action        string    // "CREATE", "UPDATE", "DELETE"
    OldValue      JSONB     // Estado anterior
    NewValue      JSONB     // Estado novo
    UserID        uuid.UUID // Quem fez
    IPAddress     string
    UserAgent     string
    Timestamp     time.Time
}
```

### 8️⃣ RATE LIMITING INTELIGENTE

```go
// Configurações por tipo:
rateLimitConfigs := map[string]Config{
    "auth": {
        WindowMs:    15 * 60 * 1000,  // 15 minutos
        MaxRequests: 5,                // 5 tentativas
    },
    "api": {
        WindowMs:    60 * 1000,        // 1 minuto
        MaxRequests: 100,
    },
    "sensitive": {
        WindowMs:    60 * 1000,
        MaxRequests: 10,
    },
}
```

### 9️⃣ SECRETS NUNCA NO CÓDIGO

```go
// ❌ ERRADO - Segredo hardcoded
const mercadoPagoToken = "APP_USR-1234567890"

// ✅ CERTO - Variáveis de ambiente
type Config struct {
    MercadoPago struct {
        AccessToken   string `env:"MERCADO_PAGO_ACCESS_TOKEN,required"`
        WebhookSecret string `env:"MERCADO_PAGO_WEBHOOK_SECRET,required"`
    }
}
```

### 🔟 TESTES SÃO DOCUMENTAÇÃO VIVA

```go
func TestTransfer_ConcurrentRequests(t *testing.T) {
    account := createTestAccount(t, decimal.NewFromInt(1000))
    toAccount := createTestAccount(t, decimal.NewFromInt(0))
    
    var wg sync.WaitGroup
    var successCount int32
    
    // 20 goroutines tentando transferir R$ 100 cada
    for i := 0; i < 20; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            _, err := service.Transfer(ctx, TransferRequest{
                FromAccountID: account.ID,
                ToAccountID:   toAccount.ID,
                Amount:        decimal.NewFromInt(100),
            })
            if err == nil {
                atomic.AddInt32(&successCount, 1)
            }
        }()
    }
    
    wg.Wait()
    
    // Apenas 10 devem ter sucesso (1000 / 100 = 10)
    assert.Equal(t, int32(10), successCount)
    assert.Equal(t, decimal.Zero, getBalance(t, account.ID))
}
```

---

## PARTE 3: O CHECKLIST SAGRADO

### 🔐 SEGURANÇA
- [ ] Todas as queries usam prepared statements?
- [ ] Senhas hasheadas com bcrypt (cost >= 12)?
- [ ] JWT tem expiração curta (< 1h)?
- [ ] Rate limiting ativo em todos os endpoints?
- [ ] Headers de segurança presentes?
- [ ] Secrets em variáveis de ambiente?
- [ ] Logs não contêm dados sensíveis?

### 💰 TRANSAÇÕES FINANCEIRAS
- [ ] Operações de saldo usam transações atômicas?
- [ ] FOR UPDATE para locks pessimistas?
- [ ] Verificação de saldo DENTRO da transação?
- [ ] Rollback automático em caso de erro?
- [ ] Idempotência com chave única?
- [ ] Auditoria completa?
- [ ] Constraint de saldo positivo no banco?

### 📊 OBSERVABILIDADE
- [ ] Logs estruturados com contexto?
- [ ] Métricas de negócio expostas?
- [ ] Health checks implementados?

---

## PARTE 4: A FILOSOFIA FINAL

### Por Que Nunca Economizar?

```
┌─────────────────────────────────────────────────────────────────┐
│   CUSTO DE FAZER CERTO DESDE O INÍCIO:                         │
│   └── 2 horas extras de desenvolvimento                        │
│                                                                 │
│   CUSTO DE CORRIGIR DEPOIS:                                    │
│   ├── 4 horas debugando o problema                             │
│   ├── 8 horas refatorando código                               │
│   ├── 16 horas testando regressões                             │
│   ├── 40 horas lidando com dados corrompidos                   │
│   └── ∞ horas explicando para o cliente                        │
└─────────────────────────────────────────────────────────────────┘
```

### A Regra de Ouro

> **"Se você não tem tempo para fazer certo, quando terá tempo para fazer de novo?"**

Em sistemas financeiros, não existe "depois a gente melhora". O "depois" é quando o dinheiro já sumiu.

### O Mantra do Arquiteto

```
Eu não escrevo código.
Eu construo sistemas que protegem o dinheiro das pessoas.

Cada linha é uma promessa.
Cada transação é sagrada.
Cada detalhe importa.

Deus mora no detalhe que salva.
O diabo mora no detalhe que você ignorou.

Eu escolho onde cada um habita.
```

---

## CONCLUSÃO

Este documento é um **contrato**.

Quem lê e entende, assume a responsabilidade de:
1. Nunca cortar caminho em segurança
2. Nunca simplificar transações financeiras
3. Nunca ignorar edge cases
4. Nunca economizar em validação
5. Nunca subestimar a maldade humana

O código que você escreve hoje será executado milhões de vezes.
Cada execução é uma oportunidade para Deus ou para o Diabo.

**A escolha é sua.**

---

*"A diferença entre um sistema que funciona e um sistema que funciona SEMPRE está nos detalhes que você não vê."*

— Arquiteto-Chefe de Fintechs Soberanas
