/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║        🏗️ MANIFESTO ARQUITETURA HÍBRIDA: HONO + GO 🏗️                      ║
 * ║                                                                              ║
 * ║              "MELHOR DOS DOIS MUNDOS - BFF + CORE BACKEND"                  ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const HYBRID_ARCHITECTURE_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║        🏗️ MANIFESTO ARQUITETURA HÍBRIDA: HONO + GO 🏗️                      ║
║                                                                              ║
║              "MELHOR DOS DOIS MUNDOS - BFF + CORE BACKEND"                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
🎯 FILOSOFIA PRIMÁRIA: ARQUITETURA EM CAMADAS
═══════════════════════════════════════════════════════════════════════════════

Para sistemas **complexos** e **críticos** (especialmente Fintechs), você SEMPRE usa:

┌─────────────────────────────────────────┐
│         FRONTEND (React)                │
│         - Interface do usuário          │
│         - TypeScript                    │
└─────────────────┬───────────────────────┘
                  │ HTTP/RPC
                  ↓
┌─────────────────────────────────────────┐
│      BFF (Backend for Frontend)        │
│      - Hono.js + Bun                    │
│      - Agrega dados                     │
│      - RPC Type-Safe                    │
│      - Cache (Redis)                    │
│      - Porta: 3001                      │
└─────────────────┬───────────────────────┘
                  │ HTTP/gRPC
                  ↓
┌─────────────────────────────────────────┐
│      CORE BACKEND (Go + Gin)            │
│      - Transações financeiras           │
│      - Lógica de negócio crítica        │
│      - PostgreSQL + Redis               │
│      - Porta: 8080                      │
└─────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
📊 RESPONSABILIDADES DE CADA CAMADA
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ CAMADA 1: FRONTEND (React + TypeScript)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ RESPONSABILIDADES:                                                          │
│ ✅ Interface do usuário                                                     │
│ ✅ Validação de formulários (client-side)                                  │
│ ✅ Estado da aplicação (Zustand/Redux)                                     │
│ ✅ Comunicação com BFF via RPC Type-Safe                                   │
│                                                                             │
│ NÃO FAZ:                                                                    │
│ ❌ Lógica de negócio                                                        │
│ ❌ Acesso direto ao banco de dados                                         │
│ ❌ Transações financeiras                                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ CAMADA 2: BFF - Backend for Frontend (Hono.js + Bun)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ RESPONSABILIDADES:                                                          │
│ ✅ Agregação de dados de múltiplos serviços                                │
│ ✅ Transformação de dados para o Frontend                                  │
│ ✅ Cache de respostas (Redis)                                              │
│ ✅ RPC Type-Safe com Frontend                                              │
│ ✅ Autenticação JWT (validação)                                            │
│ ✅ Rate limiting                                                            │
│ ✅ Logs e monitoramento                                                     │
│                                                                             │
│ NÃO FAZ:                                                                    │
│ ❌ Transações financeiras diretas                                          │
│ ❌ Acesso direto ao PostgreSQL                                             │
│ ❌ Lógica de negócio crítica                                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ CAMADA 3: CORE BACKEND (Go + Gin)                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ RESPONSABILIDADES:                                                          │
│ ✅ Transações financeiras (ACID)                                           │
│ ✅ Lógica de negócio crítica                                               │
│ ✅ Acesso ao PostgreSQL                                                     │
│ ✅ Criptografia (AES-256)                                                   │
│ ✅ Validação de saldo                                                       │
│ ✅ Auditoria e logs imutáveis                                              │
│ ✅ Integração com APIs externas (Mercado Pago, etc.)                       │
│                                                                             │
│ NÃO FAZ:                                                                    │
│ ❌ Servir Frontend                                                          │
│ ❌ Agregação de dados para UI                                              │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
📁 ESTRUTURA DE PROJETO HÍBRIDO
═══════════════════════════════════════════════════════════════════════════════

projeto-fintech/
├── frontend/                           # React + TypeScript
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts              # Cliente RPC Type-Safe
│   │   ├── components/
│   │   ├── pages/
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── bff/                                # Hono.js + Bun
│   ├── src/
│   │   ├── index.ts                   # Entry point
│   │   ├── routes/
│   │   │   ├── users.ts               # Rotas agregadas
│   │   │   └── transactions.ts
│   │   ├── services/
│   │   │   └── CoreBackendClient.ts   # Cliente HTTP para Go
│   │   ├── cache/
│   │   │   └── redis.ts               # Cache Redis
│   │   └── middleware/
│   │       └── auth.ts                # Validação JWT
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                            # Go + Gin
│   ├── cmd/
│   │   └── api/
│   │       └── main.go                # Entry point Go
│   ├── internal/
│   │   ├── core/                      # Lógica de negócio
│   │   ├── handlers/                  # Controllers
│   │   └── models/                    # Models + Repository
│   ├── pkg/
│   │   └── database/
│   │       └── postgres.go
│   ├── go.mod
│   └── go.sum
│
├── docker-compose.yml                  # Orquestração completa
└── README.md

═══════════════════════════════════════════════════════════════════════════════
📝 EXEMPLO 1: FLUXO DE TRANSFERÊNCIA PIX
═══════════════════════════════════════════════════════════════════════════════

1️⃣ FRONTEND (React)

// frontend/src/pages/Transfer.tsx
import { hc } from 'hono/client'
import type { AppType } from '../../../bff/src/index'

const client = hc<AppType>('http://localhost:3001')

async function transferirPix() {
  const res = await client.pix.transferir.$post({
    json: {
      chavePix: 'chave@pix.com',
      valor: 100.00,
      descricao: 'Pagamento'
    }
  })
  
  const data = await res.json()
  // TypeScript sabe o tipo exato!
  console.log(data.transacao)
}

2️⃣ BFF (Hono.js)

// bff/src/routes/pix.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { CoreBackendClient } from '../services/CoreBackendClient'
import { authMiddleware } from '../middleware/auth'

const pix = new Hono()

pix.use('*', authMiddleware)

const pixSchema = z.object({
  chavePix: z.string(),
  valor: z.number().positive(),
  descricao: z.string().optional()
})

pix.post('/transferir', zValidator('json', pixSchema), async (c) => {
  const user = c.get('user')
  const dados = c.req.valid('json')
  
  // Gera chave de idempotência
  const idempotencyKey = crypto.randomUUID()
  
  try {
    // Chama o Core Backend (Go)
    const coreClient = new CoreBackendClient()
    const resultado = await coreClient.transferirPix({
      userId: user.userId,
      chavePix: dados.chavePix,
      valor: dados.valor,
      descricao: dados.descricao,
      idempotencyKey
    })
    
    // Invalida cache do saldo
    await c.env.redis.del(\`saldo:\${user.userId}\`)
    
    return c.json({
      sucesso: true,
      transacao: resultado
    })
    
  } catch (error) {
    return c.json({
      sucesso: false,
      erro: error.message
    }, 500)
  }
})

// Exporta o tipo para o Frontend
export type PixRoutes = typeof pix

3️⃣ CORE BACKEND (Go)

// backend/internal/handlers/pixHandler.go
package handlers

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "github.com/nexus/backend/internal/core"
)

type PixTransferRequest struct {
    UserID          string  \`json:"userId" binding:"required"\`
    ChavePix        string  \`json:"chavePix" binding:"required"\`
    Valor           float64 \`json:"valor" binding:"required,gt=0"\`
    Descricao       string  \`json:"descricao"\`
    IdempotencyKey  string  \`json:"idempotencyKey" binding:"required"\`
}

func TransferirPix(c *gin.Context) {
    var req PixTransferRequest
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // Verifica idempotência no Redis
    if exists := core.RedisClient.Exists(ctx, "idem:"+req.IdempotencyKey).Val(); exists > 0 {
        c.JSON(http.StatusConflict, gin.H{"error": "Transação já processada"})
        return
    }
    
    // Inicia transação atômica
    tx := models.DB.Begin()
    defer tx.Rollback()
    
    // 1. Busca conta com lock
    var conta models.Account
    if err := tx.Where("user_id = ?", req.UserID).Set("gorm:query_option", "FOR UPDATE").First(&conta).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Conta não encontrada"})
        return
    }
    
    // 2. Verifica saldo
    if conta.Balance < req.Valor {
        c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "Saldo insuficiente"})
        return
    }
    
    // 3. Debita conta
    conta.Balance -= req.Valor
    if err := tx.Save(&conta).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao debitar"})
        return
    }
    
    // 4. Registra transação
    transacao := models.Transaction{
        AccountID:      conta.ID,
        Type:           "DEBIT",
        Amount:         req.Valor,
        Status:         "COMPLETED",
        DestinationKey: core.EncryptKey(req.ChavePix),
        ExternalRefID:  req.IdempotencyKey,
    }
    
    if err := tx.Create(&transacao).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao registrar"})
        return
    }
    
    // 5. Commit
    if err := tx.Commit().Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao confirmar"})
        return
    }
    
    // 6. Marca idempotência
    core.RedisClient.Set(ctx, "idem:"+req.IdempotencyKey, transacao.ID, 24*time.Hour)
    
    c.JSON(http.StatusOK, transacao)
}

═══════════════════════════════════════════════════════════════════════════════
📝 EXEMPLO 2: CLIENTE HTTP DO BFF PARA GO
═══════════════════════════════════════════════════════════════════════════════

// bff/src/services/CoreBackendClient.ts
export class CoreBackendClient {
  private baseURL = process.env.CORE_BACKEND_URL || 'http://localhost:8080'
  
  async transferirPix(dados: {
    userId: string
    chavePix: string
    valor: number
    descricao?: string
    idempotencyKey: string
  }) {
    const response = await fetch(\`\${this.baseURL}/api/v1/pix/transferir\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': dados.idempotencyKey
      },
      body: JSON.stringify(dados)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao transferir')
    }
    
    return await response.json()
  }
  
  async buscarSaldo(userId: string) {
    const response = await fetch(\`\${this.baseURL}/api/v1/accounts/\${userId}/balance\`)
    
    if (!response.ok) {
      throw new Error('Erro ao buscar saldo')
    }
    
    return await response.json()
  }
  
  async buscarExtrato(userId: string, limit = 10, offset = 0) {
    const response = await fetch(
      \`\${this.baseURL}/api/v1/transactions/statement?userId=\${userId}&limit=\${limit}&offset=\${offset}\`
    )
    
    if (!response.ok) {
      throw new Error('Erro ao buscar extrato')
    }
    
    return await response.json()
  }
}

═══════════════════════════════════════════════════════════════════════════════
📝 EXEMPLO 3: CACHE NO BFF
═══════════════════════════════════════════════════════════════════════════════

// bff/src/routes/users.ts
import { Hono } from 'hono'
import { CoreBackendClient } from '../services/CoreBackendClient'
import { redis } from '../cache/redis'

const users = new Hono()

users.get('/:id/saldo', async (c) => {
  const userId = c.req.param('id')
  
  // 1. Tenta buscar do cache
  const cached = await redis.get(\`saldo:\${userId}\`)
  if (cached) {
    console.log('✅ Cache HIT')
    return c.json(JSON.parse(cached))
  }
  
  console.log('❌ Cache MISS - Buscando do Core Backend')
  
  // 2. Busca do Core Backend (Go)
  const coreClient = new CoreBackendClient()
  const saldo = await coreClient.buscarSaldo(userId)
  
  // 3. Salva no cache (TTL: 30 segundos)
  await redis.setex(\`saldo:\${userId}\`, 30, JSON.stringify(saldo))
  
  return c.json(saldo)
})

═══════════════════════════════════════════════════════════════════════════════
📝 EXEMPLO 4: DOCKER COMPOSE COMPLETO
═══════════════════════════════════════════════════════════════════════════════

# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: nexus
      POSTGRES_PASSWORD: nexus
      POSTGRES_DB: nexus_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
  
  # Redis
  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
  
  # Core Backend (Go)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      JWT_SECRET: \${JWT_SECRET}
      AES_SECRET_KEY: \${AES_SECRET_KEY}
      PG_DSN: "host=postgres user=nexus password=nexus dbname=nexus_db port=5432 sslmode=disable"
      REDIS_ADDR: "redis:6379"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
  
  # BFF (Hono.js)
  bff:
    build:
      context: ./bff
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      CORE_BACKEND_URL: "http://backend:8080"
      REDIS_URL: "redis://redis:6379"
      JWT_SECRET: \${JWT_SECRET}
    depends_on:
      - backend
      - redis
  
  # Frontend (React)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      VITE_BFF_URL: "http://localhost:3001"
    depends_on:
      - bff

volumes:
  postgres_data:

═══════════════════════════════════════════════════════════════════════════════
🚀 QUANDO GERAR ARQUITETURA HÍBRIDA, VOCÊ SEMPRE:
═══════════════════════════════════════════════════════════════════════════════

1. ✅ Gera **3 projetos separados** (frontend, bff, backend)
2. ✅ Frontend usa **React + TypeScript**
3. ✅ BFF usa **Hono.js + Bun**
4. ✅ Core Backend usa **Go + Gin**
5. ✅ BFF se comunica com Go via **HTTP/REST**
6. ✅ Frontend se comunica com BFF via **RPC Type-Safe**
7. ✅ BFF implementa **cache com Redis**
8. ✅ Go implementa **transações atômicas**
9. ✅ Gera **docker-compose.yml** completo
10. ✅ Gera **testes para todas as camadas**

═══════════════════════════════════════════════════════════════════════════════
🎯 REGRA DE OURO: SEPARAÇÃO DE RESPONSABILIDADES
═══════════════════════════════════════════════════════════════════════════════

**Frontend** = Interface
**BFF (Hono)** = Agregação + Cache
**Core (Go)** = Transações Críticas

Sempre que o usuário pedir:
- "Criar um sistema completo de fintech"
- "Criar uma aplicação full-stack"
- "Criar um sistema com frontend e backend"

Você DEVE usar **Arquitetura Híbrida** automaticamente.

SEMPRE SEPARE AS RESPONSABILIDADES. SEMPRE.

╔══════════════════════════════════════════════════════════════════════════════╗
║                    FIM DO MANIFESTO ARQUITETURA HÍBRIDA                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;
