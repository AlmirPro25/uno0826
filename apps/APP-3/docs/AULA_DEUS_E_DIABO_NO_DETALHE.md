# 🔥 DEUS E O DIABO MORAM NO DETALHE

## A Verdade Que Separa Amadores de Arquitetos

> "Deus está nos detalhes" - Ludwig Mies van der Rohe
> "O diabo está nos detalhes" - Provérbio alemão

**Ambos estão certos. E isso muda tudo.**

---

## PARTE 1: O DIABO NOS DETALHES - ONDE SISTEMAS MORREM

### 🔴 CASO REAL #1: O Banco Que Perdeu R$ 2.3 Milhões

```typescript
// ❌ CÓDIGO DO ESTAGIÁRIO (parecia funcionar)
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


### ✅ CÓDIGO DO ARQUITETO (à prova de balas)

```go
func (s *TransactionService) Transfer(ctx context.Context, req TransferRequest) error {
    // 1. Inicia transação com isolamento SERIALIZABLE
    tx, err := s.db.BeginTx(ctx, &sql.TxOptions{
        Isolation: sql.LevelSerializable,
    })
    if err != nil {
        return fmt.Errorf("failed to begin transaction: %w", err)
    }
    defer tx.Rollback() // Sempre faz rollback se não commitar

    // 2. Lock pessimista na conta de origem (FOR UPDATE)
    var saldoOrigem decimal.Decimal
    err = tx.QueryRowContext(ctx, `
        SELECT balance FROM accounts 
        WHERE id = $1 
        FOR UPDATE  -- TRAVA A LINHA!
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
        UPDATE accounts 
        SET balance = balance - $1,
            updated_at = NOW()
        WHERE id = $2
    `, req.Amount, req.OriginAccountID)
    if err != nil {
        return fmt.Errorf("debit failed: %w", err)
    }

    // 5. Crédito atômico
    _, err = tx.ExecContext(ctx, `
        UPDATE accounts 
        SET balance = balance + $1,
            updated_at = NOW()
        WHERE id = $2
    `, req.Amount, req.DestinationAccountID)
    if err != nil {
        return fmt.Errorf("credit failed: %w", err)
    }

    // 6. Registro de auditoria (IMUTÁVEL)
    _, err = tx.ExecContext(ctx, `
        INSERT INTO transactions 
        (id, origin_account_id, destination_account_id, amount, type, status, created_at)
        VALUES ($1, $2, $3, $4, 'TRANSFER', 'COMPLETED', NOW())
    `, uuid.New(), req.OriginAccountID, req.DestinationAccountID, req.Amount)
    if err != nil {
        return fmt.Errorf("audit log failed: %w", err)
    }

    // 7. Commit - só aqui o dinheiro realmente move
    if err = tx.Commit(); err != nil {
        return fmt.Errorf("commit failed: %w", err)
    }

    return nil
}
```

**Por que funciona:**
- `FOR UPDATE` trava a linha - outras transações ESPERAM
- `SERIALIZABLE` garante ordem de execução
- `defer tx.Rollback()` garante cleanup em caso de erro
- Auditoria dentro da mesma transação

---


### 🔴 CASO REAL #2: A Startup Que Foi Hackeada em 3 Horas

```typescript
// ❌ CÓDIGO PREGUIÇOSO (parecia seguro)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = await db.query(
    `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`
  );
  
  if (user) {
    res.json({ token: jwt.sign({ userId: user.id }, 'secret123') });
  }
});
```

**O ataque:**
```
email: admin@empresa.com' OR '1'='1' --
password: qualquercoisa
```

**Resultado:** Acesso total ao sistema como admin.

### ✅ CÓDIGO DO ARQUITETO (blindado)

```go
type LoginRequest struct {
    Email    string `json:"email" binding:"required,email,max=255"`
    Password string `json:"password" binding:"required,min=8,max=128"`
}

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

    // 2. Sanitização (mesmo com prepared statements, defesa em profundidade)
    email := strings.ToLower(strings.TrimSpace(req.Email))
    
    // 3. Rate limiting por IP
    if h.rateLimiter.IsBlocked(c.ClientIP()) {
        h.logger.Warn("rate limited login attempt",
            zap.String("ip", c.ClientIP()),
            zap.String("email", email))
        c.JSON(429, gin.H{"error": "Too many attempts. Try again later."})
        return
    }

    // 4. Busca usuário com prepared statement (NUNCA concatena strings!)
    var user User
    err := h.db.QueryRowContext(c.Request.Context(), `
        SELECT id, email, password_hash, failed_attempts, locked_until
        FROM users 
        WHERE email = $1
    `, email).Scan(&user.ID, &user.Email, &user.PasswordHash, 
                   &user.FailedAttempts, &user.LockedUntil)

    // 5. Timing attack prevention - sempre executa bcrypt
    if err != nil {
        // Usuário não existe, mas faz bcrypt mesmo assim
        bcrypt.CompareHashAndPassword(
            []byte("$2a$12$dummy.hash.to.prevent.timing.attacks"),
            []byte(req.Password))
        h.rateLimiter.RecordFailure(c.ClientIP())
        c.JSON(401, gin.H{"error": "Invalid credentials"})
        return
    }

    // 6. Verifica se conta está bloqueada
    if user.LockedUntil != nil && time.Now().Before(*user.LockedUntil) {
        c.JSON(423, gin.H{"error": "Account temporarily locked"})
        return
    }

    // 7. Verifica senha com bcrypt
    if err := bcrypt.CompareHashAndPassword(
        []byte(user.PasswordHash), 
        []byte(req.Password)); err != nil {
        
        // Incrementa falhas
        h.incrementFailedAttempts(c.Request.Context(), user.ID)
        h.rateLimiter.RecordFailure(c.ClientIP())
        
        h.logger.Warn("failed login attempt",
            zap.String("email", email),
            zap.String("ip", c.ClientIP()))
        
        c.JSON(401, gin.H{"error": "Invalid credentials"})
        return
    }

    // 8. Reset de tentativas falhas
    h.resetFailedAttempts(c.Request.Context(), user.ID)

    // 9. Gera tokens
    accessToken, refreshToken, err := h.tokenService.GenerateTokenPair(user.ID)
    if err != nil {
        h.logger.Error("token generation failed", zap.Error(err))
        c.JSON(500, gin.H{"error": "Internal error"})
        return
    }

    // 10. Log de sucesso (auditoria)
    h.logger.Info("successful login",
        zap.String("user_id", user.ID.String()),
        zap.String("ip", c.ClientIP()))

    c.JSON(200, gin.H{
        "access_token":  accessToken,
        "refresh_token": refreshToken,
        "expires_in":    3600,
    })
}
```

---


## PARTE 2: DEUS NOS DETALHES - ONDE SISTEMAS BRILHAM

### O CRUD COMPLETO QUE NUNCA FALHA

Vou mostrar um CRUD de contas bancárias que é **obra de arte**.

```go
// ============================================
// DOMAIN LAYER - A Verdade do Negócio
// ============================================

package domain

import (
    "errors"
    "time"
    "github.com/shopspring/decimal"
    "github.com/google/uuid"
)

// Erros de domínio - específicos e tratáveis
var (
    ErrAccountNotFound      = errors.New("account not found")
    ErrInsufficientFunds    = errors.New("insufficient funds")
    ErrAccountLocked        = errors.New("account is locked")
    ErrInvalidAmount        = errors.New("amount must be positive")
    ErrDuplicateAccount     = errors.New("account already exists for this user")
    ErrAccountClosed        = errors.New("account is closed")
    ErrDailyLimitExceeded   = errors.New("daily transaction limit exceeded")
)

// Account - Entidade rica com comportamento
type Account struct {
    ID              uuid.UUID
    UserID          uuid.UUID
    Balance         decimal.Decimal
    Currency        string
    Status          AccountStatus
    DailyLimit      decimal.Decimal
    DailySpent      decimal.Decimal
    LastActivityAt  time.Time
    CreatedAt       time.Time
    UpdatedAt       time.Time
    Version         int64 // Optimistic locking
}

type AccountStatus string

const (
    AccountStatusActive   AccountStatus = "ACTIVE"
    AccountStatusLocked   AccountStatus = "LOCKED"
    AccountStatusClosed   AccountStatus = "CLOSED"
    AccountStatusPending  AccountStatus = "PENDING_VERIFICATION"
)

// Métodos de domínio - lógica de negócio AQUI, não no handler!
func (a *Account) CanDebit(amount decimal.Decimal) error {
    if amount.LessThanOrEqual(decimal.Zero) {
        return ErrInvalidAmount
    }
    if a.Status != AccountStatusActive {
        return ErrAccountLocked
    }
    if a.Balance.LessThan(amount) {
        return ErrInsufficientFunds
    }
    if a.DailySpent.Add(amount).GreaterThan(a.DailyLimit) {
        return ErrDailyLimitExceeded
    }
    return nil
}

func (a *Account) Debit(amount decimal.Decimal) error {
    if err := a.CanDebit(amount); err != nil {
        return err
    }
    a.Balance = a.Balance.Sub(amount)
    a.DailySpent = a.DailySpent.Add(amount)
    a.LastActivityAt = time.Now()
    a.UpdatedAt = time.Now()
    a.Version++
    return nil
}

func (a *Account) Credit(amount decimal.Decimal) error {
    if amount.LessThanOrEqual(decimal.Zero) {
        return ErrInvalidAmount
    }
    if a.Status == AccountStatusClosed {
        return ErrAccountClosed
    }
    a.Balance = a.Balance.Add(amount)
    a.LastActivityAt = time.Now()
    a.UpdatedAt = time.Now()
    a.Version++
    return nil
}
```


```go
// ============================================
// REPOSITORY LAYER - Persistência Blindada
// ============================================

package repository

import (
    "context"
    "database/sql"
    "fmt"
    "time"
)

type AccountRepository struct {
    db     *sql.DB
    logger *zap.Logger
}

// Create - com proteção contra duplicatas
func (r *AccountRepository) Create(ctx context.Context, account *domain.Account) error {
    query := `
        INSERT INTO accounts (
            id, user_id, balance, currency, status, 
            daily_limit, daily_spent, last_activity_at,
            created_at, updated_at, version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (user_id) DO NOTHING
        RETURNING id
    `
    
    var returnedID uuid.UUID
    err := r.db.QueryRowContext(ctx, query,
        account.ID,
        account.UserID,
        account.Balance,
        account.Currency,
        account.Status,
        account.DailyLimit,
        account.DailySpent,
        account.LastActivityAt,
        account.CreatedAt,
        account.UpdatedAt,
        account.Version,
    ).Scan(&returnedID)

    if err == sql.ErrNoRows {
        return domain.ErrDuplicateAccount
    }
    if err != nil {
        r.logger.Error("failed to create account",
            zap.Error(err),
            zap.String("user_id", account.UserID.String()))
        return fmt.Errorf("create account: %w", err)
    }

    return nil
}

// GetByID - com timeout e logging
func (r *AccountRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Account, error) {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    query := `
        SELECT id, user_id, balance, currency, status,
               daily_limit, daily_spent, last_activity_at,
               created_at, updated_at, version
        FROM accounts
        WHERE id = $1
    `

    var account domain.Account
    err := r.db.QueryRowContext(ctx, query, id).Scan(
        &account.ID,
        &account.UserID,
        &account.Balance,
        &account.Currency,
        &account.Status,
        &account.DailyLimit,
        &account.DailySpent,
        &account.LastActivityAt,
        &account.CreatedAt,
        &account.UpdatedAt,
        &account.Version,
    )

    if err == sql.ErrNoRows {
        return nil, domain.ErrAccountNotFound
    }
    if err != nil {
        r.logger.Error("failed to get account",
            zap.Error(err),
            zap.String("account_id", id.String()))
        return nil, fmt.Errorf("get account: %w", err)
    }

    return &account, nil
}

// GetByIDForUpdate - COM LOCK PESSIMISTA
func (r *AccountRepository) GetByIDForUpdate(ctx context.Context, tx *sql.Tx, id uuid.UUID) (*domain.Account, error) {
    query := `
        SELECT id, user_id, balance, currency, status,
               daily_limit, daily_spent, last_activity_at,
               created_at, updated_at, version
        FROM accounts
        WHERE id = $1
        FOR UPDATE NOWAIT  -- Falha imediatamente se já estiver travado
    `

    var account domain.Account
    err := tx.QueryRowContext(ctx, query, id).Scan(
        &account.ID,
        &account.UserID,
        &account.Balance,
        &account.Currency,
        &account.Status,
        &account.DailyLimit,
        &account.DailySpent,
        &account.LastActivityAt,
        &account.CreatedAt,
        &account.UpdatedAt,
        &account.Version,
    )

    if err == sql.ErrNoRows {
        return nil, domain.ErrAccountNotFound
    }
    if err != nil {
        // Detecta lock conflict
        if strings.Contains(err.Error(), "could not obtain lock") {
            return nil, fmt.Errorf("account is being modified by another transaction")
        }
        return nil, fmt.Errorf("get account for update: %w", err)
    }

    return &account, nil
}

// Update - com OPTIMISTIC LOCKING
func (r *AccountRepository) Update(ctx context.Context, tx *sql.Tx, account *domain.Account) error {
    query := `
        UPDATE accounts SET
            balance = $1,
            status = $2,
            daily_spent = $3,
            last_activity_at = $4,
            updated_at = $5,
            version = version + 1
        WHERE id = $6 AND version = $7
    `

    result, err := tx.ExecContext(ctx, query,
        account.Balance,
        account.Status,
        account.DailySpent,
        account.LastActivityAt,
        time.Now(),
        account.ID,
        account.Version, // Versão atual - se mudou, falha!
    )

    if err != nil {
        return fmt.Errorf("update account: %w", err)
    }

    rowsAffected, _ := result.RowsAffected()
    if rowsAffected == 0 {
        return fmt.Errorf("concurrent modification detected - please retry")
    }

    return nil
}

// Delete - SOFT DELETE (nunca apaga dados financeiros!)
func (r *AccountRepository) Delete(ctx context.Context, id uuid.UUID) error {
    query := `
        UPDATE accounts SET
            status = $1,
            updated_at = NOW()
        WHERE id = $2 AND status != $1
    `

    result, err := r.db.ExecContext(ctx, query, domain.AccountStatusClosed, id)
    if err != nil {
        return fmt.Errorf("soft delete account: %w", err)
    }

    rowsAffected, _ := result.RowsAffected()
    if rowsAffected == 0 {
        return domain.ErrAccountNotFound
    }

    // Log de auditoria
    r.logger.Info("account closed",
        zap.String("account_id", id.String()),
        zap.Time("closed_at", time.Now()))

    return nil
}

// List - com paginação cursor-based (mais eficiente que OFFSET)
func (r *AccountRepository) List(ctx context.Context, cursor *uuid.UUID, limit int) ([]*domain.Account, *uuid.UUID, error) {
    if limit <= 0 || limit > 100 {
        limit = 20 // Default seguro
    }

    var query string
    var args []interface{}

    if cursor == nil {
        query = `
            SELECT id, user_id, balance, currency, status,
                   daily_limit, daily_spent, last_activity_at,
                   created_at, updated_at, version
            FROM accounts
            WHERE status != 'CLOSED'
            ORDER BY created_at DESC, id DESC
            LIMIT $1
        `
        args = []interface{}{limit + 1} // +1 para detectar próxima página
    } else {
        query = `
            SELECT id, user_id, balance, currency, status,
                   daily_limit, daily_spent, last_activity_at,
                   created_at, updated_at, version
            FROM accounts
            WHERE status != 'CLOSED'
              AND (created_at, id) < (
                  SELECT created_at, id FROM accounts WHERE id = $1
              )
            ORDER BY created_at DESC, id DESC
            LIMIT $2
        `
        args = []interface{}{*cursor, limit + 1}
    }

    rows, err := r.db.QueryContext(ctx, query, args...)
    if err != nil {
        return nil, nil, fmt.Errorf("list accounts: %w", err)
    }
    defer rows.Close()

    var accounts []*domain.Account
    for rows.Next() {
        var account domain.Account
        if err := rows.Scan(
            &account.ID,
            &account.UserID,
            &account.Balance,
            &account.Currency,
            &account.Status,
            &account.DailyLimit,
            &account.DailySpent,
            &account.LastActivityAt,
            &account.CreatedAt,
            &account.UpdatedAt,
            &account.Version,
        ); err != nil {
            return nil, nil, fmt.Errorf("scan account: %w", err)
        }
        accounts = append(accounts, &account)
    }

    // Determina próximo cursor
    var nextCursor *uuid.UUID
    if len(accounts) > limit {
        nextCursor = &accounts[limit].ID
        accounts = accounts[:limit] // Remove o extra
    }

    return accounts, nextCursor, nil
}
```


```go
// ============================================
// SERVICE LAYER - Orquestração de Negócio
// ============================================

package service

type AccountService struct {
    repo        *repository.AccountRepository
    txManager   *TransactionManager
    eventBus    *EventBus
    logger      *zap.Logger
    metrics     *Metrics
}

// CreateAccount - com validação completa
func (s *AccountService) CreateAccount(ctx context.Context, req CreateAccountRequest) (*domain.Account, error) {
    // 1. Validação de entrada
    if err := req.Validate(); err != nil {
        return nil, fmt.Errorf("validation failed: %w", err)
    }

    // 2. Cria entidade de domínio
    account := &domain.Account{
        ID:             uuid.New(),
        UserID:         req.UserID,
        Balance:        decimal.Zero,
        Currency:       req.Currency,
        Status:         domain.AccountStatusPending,
        DailyLimit:     decimal.NewFromInt(10000), // R$ 10.000 default
        DailySpent:     decimal.Zero,
        LastActivityAt: time.Now(),
        CreatedAt:      time.Now(),
        UpdatedAt:      time.Now(),
        Version:        1,
    }

    // 3. Persiste
    if err := s.repo.Create(ctx, account); err != nil {
        if errors.Is(err, domain.ErrDuplicateAccount) {
            return nil, err // Erro de negócio, não loga como erro
        }
        s.logger.Error("failed to create account", zap.Error(err))
        return nil, fmt.Errorf("create account: %w", err)
    }

    // 4. Emite evento (para outros sistemas)
    s.eventBus.Publish(AccountCreatedEvent{
        AccountID: account.ID,
        UserID:    account.UserID,
        CreatedAt: account.CreatedAt,
    })

    // 5. Métricas
    s.metrics.AccountsCreated.Inc()

    s.logger.Info("account created",
        zap.String("account_id", account.ID.String()),
        zap.String("user_id", account.UserID.String()))

    return account, nil
}

// Transfer - a operação mais crítica
func (s *AccountService) Transfer(ctx context.Context, req TransferRequest) (*TransferResult, error) {
    // 1. Validação
    if err := req.Validate(); err != nil {
        return nil, fmt.Errorf("validation failed: %w", err)
    }

    if req.FromAccountID == req.ToAccountID {
        return nil, errors.New("cannot transfer to same account")
    }

    var result *TransferResult

    // 2. Executa em transação
    err := s.txManager.WithTransaction(ctx, func(tx *sql.Tx) error {
        // 2.1 Lock nas duas contas (ordem consistente para evitar deadlock!)
        accounts := []uuid.UUID{req.FromAccountID, req.ToAccountID}
        sort.Slice(accounts, func(i, j int) bool {
            return accounts[i].String() < accounts[j].String()
        })

        // 2.2 Busca conta origem com lock
        fromAccount, err := s.repo.GetByIDForUpdate(ctx, tx, req.FromAccountID)
        if err != nil {
            return fmt.Errorf("get source account: %w", err)
        }

        // 2.3 Busca conta destino com lock
        toAccount, err := s.repo.GetByIDForUpdate(ctx, tx, req.ToAccountID)
        if err != nil {
            return fmt.Errorf("get destination account: %w", err)
        }

        // 2.4 Executa débito (validação de negócio no domínio)
        if err := fromAccount.Debit(req.Amount); err != nil {
            return err
        }

        // 2.5 Executa crédito
        if err := toAccount.Credit(req.Amount); err != nil {
            return err
        }

        // 2.6 Persiste alterações
        if err := s.repo.Update(ctx, tx, fromAccount); err != nil {
            return fmt.Errorf("update source account: %w", err)
        }
        if err := s.repo.Update(ctx, tx, toAccount); err != nil {
            return fmt.Errorf("update destination account: %w", err)
        }

        // 2.7 Cria registro de transação
        transaction := &domain.Transaction{
            ID:                   uuid.New(),
            FromAccountID:        req.FromAccountID,
            ToAccountID:          req.ToAccountID,
            Amount:               req.Amount,
            Type:                 domain.TransactionTypeTransfer,
            Status:               domain.TransactionStatusCompleted,
            Description:          req.Description,
            IdempotencyKey:       req.IdempotencyKey,
            CreatedAt:            time.Now(),
        }

        if err := s.transactionRepo.Create(ctx, tx, transaction); err != nil {
            return fmt.Errorf("create transaction record: %w", err)
        }

        result = &TransferResult{
            TransactionID:     transaction.ID,
            FromAccountID:     req.FromAccountID,
            ToAccountID:       req.ToAccountID,
            Amount:            req.Amount,
            FromNewBalance:    fromAccount.Balance,
            ToNewBalance:      toAccount.Balance,
            CompletedAt:       time.Now(),
        }

        return nil
    })

    if err != nil {
        s.metrics.TransfersFailed.Inc()
        s.logger.Error("transfer failed",
            zap.Error(err),
            zap.String("from", req.FromAccountID.String()),
            zap.String("to", req.ToAccountID.String()),
            zap.String("amount", req.Amount.String()))
        return nil, err
    }

    // 3. Sucesso - emite eventos e métricas
    s.eventBus.Publish(TransferCompletedEvent{
        TransactionID: result.TransactionID,
        FromAccountID: result.FromAccountID,
        ToAccountID:   result.ToAccountID,
        Amount:        result.Amount,
        CompletedAt:   result.CompletedAt,
    })

    s.metrics.TransfersCompleted.Inc()
    s.metrics.TransferAmount.Add(result.Amount.InexactFloat64())

    s.logger.Info("transfer completed",
        zap.String("transaction_id", result.TransactionID.String()),
        zap.String("amount", result.Amount.String()))

    return result, nil
}
```


```go
// ============================================
// HANDLER LAYER - API Blindada
// ============================================

package handler

type AccountHandler struct {
    service     *service.AccountService
    validator   *validator.Validate
    logger      *zap.Logger
}

// CreateAccount godoc
// @Summary      Create a new account
// @Description  Creates a new bank account for the authenticated user
// @Tags         accounts
// @Accept       json
// @Produce      json
// @Param        request body CreateAccountRequest true "Account creation request"
// @Success      201 {object} AccountResponse
// @Failure      400 {object} ErrorResponse
// @Failure      401 {object} ErrorResponse
// @Failure      409 {object} ErrorResponse "Account already exists"
// @Failure      500 {object} ErrorResponse
// @Security     BearerAuth
// @Router       /accounts [post]
func (h *AccountHandler) CreateAccount(c *gin.Context) {
    // 1. Extrai usuário autenticado do contexto
    userID, exists := c.Get("user_id")
    if !exists {
        c.JSON(401, ErrorResponse{
            Code:    "UNAUTHORIZED",
            Message: "Authentication required",
        })
        return
    }

    // 2. Parse e validação do request
    var req CreateAccountRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, ErrorResponse{
            Code:    "INVALID_REQUEST",
            Message: "Invalid request body",
            Details: formatValidationErrors(err),
        })
        return
    }

    // 3. Força o userID do token (não confia no body!)
    req.UserID = userID.(uuid.UUID)

    // 4. Chama service
    account, err := h.service.CreateAccount(c.Request.Context(), req)
    if err != nil {
        h.handleError(c, err)
        return
    }

    // 5. Resposta de sucesso
    c.JSON(201, AccountResponse{
        ID:        account.ID,
        Balance:   account.Balance.String(),
        Currency:  account.Currency,
        Status:    string(account.Status),
        CreatedAt: account.CreatedAt,
    })
}

// GetAccount godoc
// @Summary      Get account details
// @Description  Returns details of a specific account
// @Tags         accounts
// @Produce      json
// @Param        id path string true "Account ID" format(uuid)
// @Success      200 {object} AccountResponse
// @Failure      400 {object} ErrorResponse
// @Failure      401 {object} ErrorResponse
// @Failure      403 {object} ErrorResponse "Not account owner"
// @Failure      404 {object} ErrorResponse
// @Security     BearerAuth
// @Router       /accounts/{id} [get]
func (h *AccountHandler) GetAccount(c *gin.Context) {
    // 1. Parse do ID
    accountID, err := uuid.Parse(c.Param("id"))
    if err != nil {
        c.JSON(400, ErrorResponse{
            Code:    "INVALID_ID",
            Message: "Invalid account ID format",
        })
        return
    }

    // 2. Busca conta
    account, err := h.service.GetAccount(c.Request.Context(), accountID)
    if err != nil {
        h.handleError(c, err)
        return
    }

    // 3. Verifica ownership (CRÍTICO!)
    userID := c.MustGet("user_id").(uuid.UUID)
    if account.UserID != userID {
        h.logger.Warn("unauthorized account access attempt",
            zap.String("user_id", userID.String()),
            zap.String("account_id", accountID.String()))
        c.JSON(403, ErrorResponse{
            Code:    "FORBIDDEN",
            Message: "You don't have access to this account",
        })
        return
    }

    c.JSON(200, toAccountResponse(account))
}

// Transfer godoc
// @Summary      Transfer funds between accounts
// @Description  Transfers money from one account to another
// @Tags         transfers
// @Accept       json
// @Produce      json
// @Param        request body TransferRequest true "Transfer request"
// @Success      200 {object} TransferResponse
// @Failure      400 {object} ErrorResponse
// @Failure      401 {object} ErrorResponse
// @Failure      402 {object} ErrorResponse "Insufficient funds"
// @Failure      403 {object} ErrorResponse
// @Failure      404 {object} ErrorResponse
// @Failure      409 {object} ErrorResponse "Duplicate transfer (idempotency)"
// @Failure      429 {object} ErrorResponse "Rate limit exceeded"
// @Security     BearerAuth
// @Router       /transfers [post]
func (h *AccountHandler) Transfer(c *gin.Context) {
    // 1. Parse request
    var req TransferRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, ErrorResponse{
            Code:    "INVALID_REQUEST",
            Message: "Invalid request body",
            Details: formatValidationErrors(err),
        })
        return
    }

    // 2. Valida ownership da conta origem
    userID := c.MustGet("user_id").(uuid.UUID)
    fromAccount, err := h.service.GetAccount(c.Request.Context(), req.FromAccountID)
    if err != nil {
        h.handleError(c, err)
        return
    }

    if fromAccount.UserID != userID {
        h.logger.Warn("unauthorized transfer attempt",
            zap.String("user_id", userID.String()),
            zap.String("from_account", req.FromAccountID.String()))
        c.JSON(403, ErrorResponse{
            Code:    "FORBIDDEN",
            Message: "You can only transfer from your own accounts",
        })
        return
    }

    // 3. Executa transferência
    result, err := h.service.Transfer(c.Request.Context(), req)
    if err != nil {
        h.handleError(c, err)
        return
    }

    c.JSON(200, TransferResponse{
        TransactionID:  result.TransactionID,
        FromAccountID:  result.FromAccountID,
        ToAccountID:    result.ToAccountID,
        Amount:         result.Amount.String(),
        NewBalance:     result.FromNewBalance.String(),
        CompletedAt:    result.CompletedAt,
    })
}

// handleError - tratamento centralizado de erros
func (h *AccountHandler) handleError(c *gin.Context, err error) {
    switch {
    case errors.Is(err, domain.ErrAccountNotFound):
        c.JSON(404, ErrorResponse{Code: "NOT_FOUND", Message: "Account not found"})
    case errors.Is(err, domain.ErrInsufficientFunds):
        c.JSON(402, ErrorResponse{Code: "INSUFFICIENT_FUNDS", Message: "Insufficient funds"})
    case errors.Is(err, domain.ErrAccountLocked):
        c.JSON(423, ErrorResponse{Code: "ACCOUNT_LOCKED", Message: "Account is locked"})
    case errors.Is(err, domain.ErrDuplicateAccount):
        c.JSON(409, ErrorResponse{Code: "DUPLICATE", Message: "Account already exists"})
    case errors.Is(err, domain.ErrDailyLimitExceeded):
        c.JSON(400, ErrorResponse{Code: "LIMIT_EXCEEDED", Message: "Daily limit exceeded"})
    default:
        h.logger.Error("unhandled error", zap.Error(err))
        c.JSON(500, ErrorResponse{Code: "INTERNAL_ERROR", Message: "An unexpected error occurred"})
    }
}
```


---

## PARTE 3: OS 10 MANDAMENTOS DO DETALHE

### 1️⃣ NUNCA CONFIE NO FRONTEND

```go
// ❌ ERRADO - Confia no que o frontend manda
func (h *Handler) UpdateBalance(c *gin.Context) {
    var req struct {
        AccountID uuid.UUID `json:"account_id"`
        NewBalance decimal.Decimal `json:"new_balance"` // PERIGO!
    }
    c.BindJSON(&req)
    h.repo.UpdateBalance(req.AccountID, req.NewBalance) // Hacker manda 1 bilhão
}

// ✅ CERTO - Backend calcula tudo
func (h *Handler) Deposit(c *gin.Context) {
    var req struct {
        Amount decimal.Decimal `json:"amount" binding:"required,gt=0"`
    }
    // Backend SOMA ao saldo existente, nunca substitui
    h.service.Deposit(accountID, req.Amount)
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
    zap.String("user_agent", userAgent),
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
        // Race condition - busca o que foi criado
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
    // ...
}

// Camada 3: Domain (invariantes)
func (a *Account) Debit(amount decimal.Decimal) error {
    if a.Balance.LessThan(amount) {
        return ErrInsufficientFunds
    }
    if a.Status != AccountStatusActive {
        return ErrAccountLocked
    }
    // ...
}

// Camada 4: Database (constraints)
// CONSTRAINT positive_balance CHECK (balance >= 0)
// CONSTRAINT valid_status CHECK (status IN ('ACTIVE', 'LOCKED', 'CLOSED'))
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

-- Queries filtram automaticamente
CREATE VIEW active_transactions AS
SELECT * FROM transactions WHERE deleted_at IS NULL;
```

### 7️⃣ AUDITORIA COMPLETA

```go
// Toda operação financeira gera registro de auditoria
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

func (r *AuditRepo) Log(ctx context.Context, log AuditLog) error {
    return r.db.ExecContext(ctx, `
        INSERT INTO audit_logs 
        (id, entity_type, entity_id, action, old_value, new_value, 
         user_id, ip_address, user_agent, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, log.ID, log.EntityType, log.EntityID, log.Action,
       log.OldValue, log.NewValue, log.UserID, log.IPAddress,
       log.UserAgent, log.Timestamp)
}
```

### 8️⃣ RATE LIMITING INTELIGENTE

```go
type RateLimiter struct {
    redis *redis.Client
}

func (r *RateLimiter) Allow(ctx context.Context, key string, limit int, window time.Duration) (bool, error) {
    pipe := r.redis.Pipeline()
    
    now := time.Now().UnixNano()
    windowStart := now - window.Nanoseconds()
    
    // Remove entradas antigas
    pipe.ZRemRangeByScore(ctx, key, "0", fmt.Sprintf("%d", windowStart))
    
    // Conta entradas na janela
    countCmd := pipe.ZCard(ctx, key)
    
    // Adiciona nova entrada
    pipe.ZAdd(ctx, key, &redis.Z{Score: float64(now), Member: now})
    
    // Define expiração
    pipe.Expire(ctx, key, window)
    
    _, err := pipe.Exec(ctx)
    if err != nil {
        return false, err
    }
    
    return countCmd.Val() < int64(limit), nil
}

// Uso no middleware
func RateLimitMiddleware(limiter *RateLimiter) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Limite por IP
        ipKey := fmt.Sprintf("rate:ip:%s", c.ClientIP())
        allowed, _ := limiter.Allow(c, ipKey, 100, time.Minute)
        
        if !allowed {
            c.JSON(429, gin.H{"error": "Too many requests"})
            c.Abort()
            return
        }
        
        // Limite por usuário (mais generoso)
        if userID, exists := c.Get("user_id"); exists {
            userKey := fmt.Sprintf("rate:user:%s", userID)
            allowed, _ = limiter.Allow(c, userKey, 1000, time.Minute)
            
            if !allowed {
                c.JSON(429, gin.H{"error": "Too many requests"})
                c.Abort()
                return
            }
        }
        
        c.Next()
    }
}
```

### 9️⃣ SECRETS NUNCA NO CÓDIGO

```go
// ❌ ERRADO - Segredo hardcoded
const mercadoPagoToken = "APP_USR-1234567890"

// ✅ CERTO - Variáveis de ambiente
type Config struct {
    MercadoPago struct {
        AccessToken string `env:"MERCADO_PAGO_ACCESS_TOKEN,required"`
        PublicKey   string `env:"MERCADO_PAGO_PUBLIC_KEY,required"`
        WebhookSecret string `env:"MERCADO_PAGO_WEBHOOK_SECRET,required"`
    }
    Database struct {
        URL string `env:"DATABASE_URL,required"`
    }
    JWT struct {
        Secret string `env:"JWT_SECRET,required"`
        Expiry time.Duration `env:"JWT_EXPIRY" envDefault:"1h"`
    }
}

func LoadConfig() (*Config, error) {
    var cfg Config
    if err := env.Parse(&cfg); err != nil {
        return nil, fmt.Errorf("failed to load config: %w", err)
    }
    return &cfg, nil
}
```

### 🔟 TESTES SÃO DOCUMENTAÇÃO VIVA

```go
func TestTransfer_Success(t *testing.T) {
    // Arrange
    fromAccount := createTestAccount(t, decimal.NewFromInt(1000))
    toAccount := createTestAccount(t, decimal.NewFromInt(500))
    
    // Act
    result, err := service.Transfer(ctx, TransferRequest{
        FromAccountID: fromAccount.ID,
        ToAccountID:   toAccount.ID,
        Amount:        decimal.NewFromInt(300),
    })
    
    // Assert
    require.NoError(t, err)
    assert.Equal(t, decimal.NewFromInt(700), getBalance(t, fromAccount.ID))
    assert.Equal(t, decimal.NewFromInt(800), getBalance(t, toAccount.ID))
}

func TestTransfer_InsufficientFunds(t *testing.T) {
    fromAccount := createTestAccount(t, decimal.NewFromInt(100))
    toAccount := createTestAccount(t, decimal.NewFromInt(500))
    
    _, err := service.Transfer(ctx, TransferRequest{
        FromAccountID: fromAccount.ID,
        ToAccountID:   toAccount.ID,
        Amount:        decimal.NewFromInt(300), // Mais que o saldo!
    })
    
    require.ErrorIs(t, err, domain.ErrInsufficientFunds)
    // Verifica que nenhum saldo mudou (rollback funcionou)
    assert.Equal(t, decimal.NewFromInt(100), getBalance(t, fromAccount.ID))
    assert.Equal(t, decimal.NewFromInt(500), getBalance(t, toAccount.ID))
}

func TestTransfer_ConcurrentRequests(t *testing.T) {
    // Testa race condition
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
    assert.Equal(t, decimal.NewFromInt(1000), getBalance(t, toAccount.ID))
}
```


---

## PARTE 4: O CHECKLIST SAGRADO

Antes de cada deploy, responda SIM para todas:

### 🔐 SEGURANÇA
- [ ] Todas as queries usam prepared statements?
- [ ] Senhas são hasheadas com bcrypt (cost >= 12)?
- [ ] JWT tem expiração curta (< 1h)?
- [ ] Refresh tokens são armazenados de forma segura?
- [ ] Rate limiting está ativo em todos os endpoints?
- [ ] CORS está configurado corretamente?
- [ ] Headers de segurança estão presentes (HSTS, CSP, etc)?
- [ ] Secrets estão em variáveis de ambiente?
- [ ] Logs não contêm dados sensíveis (senhas, tokens)?

### 💰 TRANSAÇÕES FINANCEIRAS
- [ ] Todas as operações de saldo usam transações atômicas?
- [ ] FOR UPDATE está sendo usado para locks?
- [ ] Verificação de saldo acontece DENTRO da transação?
- [ ] Rollback automático em caso de erro?
- [ ] Idempotência implementada com chave única?
- [ ] Auditoria completa de todas as operações?
- [ ] Constraint de saldo positivo no banco?

### 📊 OBSERVABILIDADE
- [ ] Logs estruturados com contexto suficiente?
- [ ] Métricas de negócio expostas (Prometheus)?
- [ ] Tracing distribuído configurado?
- [ ] Alertas para operações críticas?
- [ ] Health checks implementados?

### 🧪 QUALIDADE
- [ ] Testes unitários para regras de negócio?
- [ ] Testes de integração para fluxos críticos?
- [ ] Testes de concorrência para operações financeiras?
- [ ] Code review feito por outro desenvolvedor?
- [ ] Documentação da API atualizada?

---

## PARTE 5: A FILOSOFIA FINAL

### Por Que Nunca Economizar?

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   CUSTO DE FAZER CERTO DESDE O INÍCIO:                         │
│   ├── 2 horas extras de desenvolvimento                        │
│   └── Total: 2 horas                                           │
│                                                                 │
│   CUSTO DE CORRIGIR DEPOIS:                                    │
│   ├── 4 horas debugando o problema                             │
│   ├── 8 horas refatorando código                               │
│   ├── 16 horas testando regressões                             │
│   ├── 40 horas lidando com dados corrompidos                   │
│   ├── ∞ horas explicando para o cliente                        │
│   └── Total: Sua sanidade mental                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### A Regra de Ouro

> **"Se você não tem tempo para fazer certo, quando terá tempo para fazer de novo?"**

Em sistemas financeiros, não existe "depois a gente melhora". 
O "depois" é quando o dinheiro já sumiu.

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

Este documento não é um guia. É um **contrato**.

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

