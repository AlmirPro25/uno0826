# 🚀 UNO Sovereign Kernel v2.0 - Quick Start Guide

> **Enterprise-Grade Agent Operating System**  
> Built with Go, Redis, PostgreSQL, and OpenTelemetry

---

## 🎯 What You're Getting

A **production-ready autonomous agent platform** with:

- ✅ **AI Governance** - Gemini with budget control and hallucination prevention
- ✅ **Universal Commerce Protocol (UCP)** - Agent-to-agent transactions
- ✅ **Digital Signatures** - Ed25519 cryptographic manifest authentication
- ✅ **Distributed Caching** - Redis-backed session persistence
- ✅ **Full Observability** - OpenTelemetry distributed tracing
- ✅ **Cost Protection** - Multi-tier AI budget enforcement

---

## ⚡ Quick Start (5 minutes)

### Prerequisites

```bash
- Go 1.21+
- Docker & Docker Compose
- PostgreSQL 14+ (or SQLite for dev)
```

### 1. Clone & Setup

```bash
git clone <your-repo>
cd UNO-main/backend

# Install dependencies
go mod download

# Copy environment template
cp .env.example .env
```

### 2. Start Observability Stack

```bash
# Start Redis + Jaeger in Docker
docker-compose up -d

# Verify services
docker ps
# Should show: redis:alpine, jaegertracing/all-in-one
```

### 3. Configure Environment

Edit `.env`:

```bash
# Database
DATABASE_URL=postgres://user:pass@localhost:5432/prostqs
# or for SQLite:
# DATABASE_URL=sqlite:./prostqs.db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# OpenTelemetry
OTEL_ENABLED=true
OTEL_ENDPOINT=localhost:4318
OTEL_SAMPLE_RATE=0.1

# Gemini API (optional for mock mode)
GEMINI_API_KEY=your_key_here

# AI Budget
AI_GLOBAL_DAILY_LIMIT_USD=50.00
AI_DEFAULT_AGENT_DAILY_USD=5.00
```

### 4. Run Migrations

```bash
# Auto-migrate on first run, or manually:
go run cmd/api/main.go migrate
```

### 5. Start Kernel

```bash
go run cmd/api/main.go

# Or build and run:
go build -o kernel cmd/api/main.go
./kernel
```

### 6. Verify Installation

```bash
# Health check
curl http://localhost:8080/health

# View traces
open http://localhost:16686  # Jaeger UI

# Test Redis
redis-cli ping
```

---

## 🧪 Testing the System

### Test UCP Discovery

```bash
# Start demo UCP store
cd ../external_demo_store
go run main.go  # Runs on :9090

# Trigger discovery
curl -X POST http://localhost:8080/api/mcp/dispatch \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "procurement-ops-agent-001",
    "command": "procurement:sourcing:search",
    "params": {
      "query": "laptop",
      "targets": ["http://localhost:9090"]
    }
  }'
```

### Test Signature Verification

```bash
# Generate keypair
curl http://localhost:8080/api/admin/security/generate-keypair

# Sign manifest
curl -X POST http://localhost:8080/api/admin/security/sign \
  -H "Content-Type: application/json" \
  -d '{"data": {"merchant": {"id": "test-001"}}}'

# Verify signature
curl -X POST http://localhost:8080/api/admin/security/verify \
  -H "Content-Type: application/json" \
  -d '{<signed_payload>}'
```

### Test Budget Control

```bash
# Check budget
curl http://localhost:8080/api/admin/cognitive/budget/stats

# Test throttling (call Think() 100 times rapidly)
for i in {1..100}; do
  curl -X POST http://localhost:8080/api/mcp/dispatch \
    -H "Content-Type: application/json" \
    -d '{
      "agent_id": "sales-negotiator-001",
      "command": "sales:negotiation:analyze",
      "params": {"deal_id": "test-'$i'"}
    }'
done
```

### View Distributed Traces

1. Open Jaeger UI: `http://localhost:16686`
2. Select service: `prost-qs-kernel`
3. Find operation: `agent.execution`
4. See full waterfall: Discovery → Catalog → Negotiation

---

## 📦 Docker Compose (Full Stack)

For one-command deployment:

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: prostqs
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"  # UI
      - "4318:4318"    # OTLP HTTP

  kernel:
    build: .
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis
      - jaeger
    environment:
      DATABASE_URL: postgres://admin:secret@postgres:5432/prostqs
      REDIS_HOST: redis
      REDIS_PORT: 6379
      OTEL_ENDPOINT: jaeger:4318

volumes:
  pgdata:
```

```bash
docker-compose up -d
```

---

## 📊 Admin Dashboard Quick Tour

1. **War Observability:** `http://localhost:8080/admin/warobs`
   - Real-time RED metrics (Rate, Errors, Duration)
   - DEFCON status
   - Pressure gauge

2. **Cognitive Oracle:** `http://localhost:8080/admin/cognitive`
   - Budget stats per agent
   - AI call history
   - Throttling status

3. **Trust Analytics:** `http://localhost:8080/admin/ucp/trust`
   - Discovered UCP endpoints
   - Trust scores
   - Blacklist

4. **Trace Viewer:** `http://localhost:16686`
   - Distributed traces
   - Latency analysis
   - Error propagation

---

## 🔧 Common Operations

### Add New Agent

```go
// In cmd/api/main.go
import "your-package/agents/myagent"

agent := myagent.NewMyAgent(db, redis)
kernel.Register(agent)
```

### Set Agent Budget

```bash
curl -X PUT http://localhost:8080/api/admin/cognitive/budget/sales-001 \
  -H "Content-Type: application/json" \
  -d '{
    "daily_usd": 10.00,
    "hourly_usd": 2.00,
    "monthly_usd": 200.00
  }'
```

### Blacklist UCP Endpoint

```bash
curl -X POST http://localhost:8080/api/admin/ucp/blacklist \
  -H "Content-Type: application/json" \
  -d '{
    "target_url": "https://scam-site.com",
    "reason": "spoofed manifest detected"
  }'
```

### Emergency Stop

```bash
# Activate kill switch
curl -X POST http://localhost:8080/api/admin/policy/killswitch/activate \
  -H "Content-Type: application/json" \
  -d '{"reason": "security incident detected"}'

# Resume operations
curl -X POST http://localhost:8080/api/admin/policy/killswitch/deactivate
```

---

## 🧠 Understanding the Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Admin Dashboard                      │
│           (War UX + Cognitive Oracle + Trust)           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  MCP Dispatcher                         │
│   (Zero Trust Gate + Circuit Breakers + Audit)          │
└─┬──────────┬──────────┬──────────┬──────────────────────┘
  │          │          │          │
  ▼          ▼          ▼          ▼
Sales    Procurement  Memory   Billing
Agent       Agent     Agent    Agent
  │          │          │          │
  └──────────┴──────────┴──────────┘
             │
       ┌─────▼─────┐
       │  Gemini   │◄───── Budget Manager
       │  Engine   │
       └─────┬─────┘
             │
       ┌─────▼─────┐
       │ Validator │◄───── Safety Rules
       └───────────┘

External:
  ┌──────────┐
  │   UCP    │◄───── Trust Engine + Signatures
  │  Client  │
  └──────────┘

Storage:
  ┌──────────┬──────────┬──────────┐
  │  Redis   │ Postgres │  Jaeger  │
  │ (Cache)  │  (Data)  │ (Traces) │
  └──────────┴──────────┴──────────┘
```

---

## 📚 Documentation

- **System Status Report:** `docs/SYSTEM-STATUS-REPORT-v1.0.md`
- **Infrastructure Upgrade:** `docs/INFRASTRUCTURE-UPGRADE-v2.0.md`
- **UCP Protocol Spec:** `docs/UCP-PROTOCOL-SPEC.md`
- **API Reference:** `API_MAP_V1.md`

---

## 🐛 Troubleshooting

### Redis Connection Fails

```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli ping

# Restart Redis
docker restart redis
```

### Traces Not Showing in Jaeger

```bash
# Check OTLP endpoint
curl http://localhost:4318/v1/traces

# Verify OTEL_ENABLED=true in .env

# Restart Jaeger
docker restart jaeger
```

### Budget Not Enforcing

```bash
# Check budget config
curl http://localhost:8080/api/admin/cognitive/budget/stats

# Reset throttle
curl -X POST http://localhost:8080/api/admin/cognitive/budget/sales-001/reset
```

### Database Migration Errors

```bash
# Drop and recreate
psql -U admin -d prostqs -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Re-run migrations
go run cmd/api/main.go migrate
```

---

## 🚀 Production Deployment

### Environment Variables (Production)

```bash
# Security
SESSION_SECRET=<64-char-random>
ALLOWED_ORIGINS=https://yourdomain.com

# Database (replicated)
DATABASE_URL=postgres://user:pass@primary:5432/prostqs?sslmode=require
DATABASE_REPLICA_URL=postgres://user:pass@replica:5432/prostqs?sslmode=require

# Redis (cluster)
REDIS_HOST=redis-cluster.internal
REDIS_PASSWORD=<strong-password>

# OpenTelemetry (production collector)
OTEL_ENDPOINT=otel-collector.internal:4318
OTEL_SAMPLE_RATE=0.01  # 1% sampling in prod

# AI Budget (production limits)
AI_GLOBAL_DAILY_LIMIT_USD=500.00
AI_DEFAULT_AGENT_DAILY_USD=20.00
```

### Health Checks

```yaml
# Kubernetes liveness probe
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10

# Readiness probe
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
```

---

## 🎓 Next Steps

1. **Read the Docs:** Start with `SYSTEM-STATUS-REPORT-v1.0.md`
2. **Run Tests:** `go test ./...`
3. **Explore UCP:** Start the demo store and test discovery
4. **View Traces:** Open Jaeger and trace an execution
5. **Monitor Budget:** Call the budget stats API
6. **Deploy to Production:** Use the docker-compose file

---

## 🤝 Contributing

This is a reference implementation of the UNO Sovereign Kernel architecture. Contributions welcome!

1. Fork the repo
2. Create a feature branch
3. Run tests: `go test ./...`
4. Submit a PR

---

## 📄 License

MIT License - See LICENSE file

---

## 🙏 Credits

**Built by:** Antigravity AI  
**Architecture:** UNO Sovereign Kernel v2.0  
**Core Tech:** Go, Redis, PostgreSQL, OpenTelemetry, Ed25519  
**AI Engine:** Google Gemini Pro (with governance)

---

**You are now running a 10/10 production-grade autonomous agent platform. Welcome to the future of digital sovereignty.**
