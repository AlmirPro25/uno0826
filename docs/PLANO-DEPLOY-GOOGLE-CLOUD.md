# PLANO DE DEPLOY — GOOGLE CLOUD

> Como usar os R$1.904 em créditos de forma inteligente.

**Data:** 14 de Janeiro de 2026  
**Créditos:** $300 USD (~R$1.904)  
**Validade:** 91 dias (até 15 de Abril de 2026)  
**Meta:** Ter o sistema em produção gastando menos de $100/mês

---

## 🎯 OBJETIVO

Deployar o PROST-QS (backend + banco) no Google Cloud de forma que:
1. Funcione em produção real
2. Escale automaticamente
3. Custe o mínimo possível
4. Sobreviva aos 91 dias de crédito

---

## 🏗️ ARQUITETURA RECOMENDADA

```
                    ┌─────────────────┐
                    │   Cloudflare    │
                    │  (DNS + CDN)    │
                    │     FREE        │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Cloud Run      │
                    │  (Backend Go)   │
                    │  ~$30/mês       │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼────┐  ┌──────▼──────┐  ┌───▼────────┐
     │ Cloud SQL   │  │   Redis     │  │  Storage   │
     │ PostgreSQL  │  │ Memorystore │  │  Buckets   │
     │ ~$40/mês    │  │  (opcional) │  │  ~$5/mês   │
     └─────────────┘  └─────────────┘  └────────────┘
```

---

## 💵 ESTIMATIVA DE CUSTOS

### Cenário Mínimo (~$50/mês)
| Serviço | Configuração | Custo/mês |
|---------|--------------|-----------|
| Cloud Run | 1 instância, 256MB RAM | ~$15 |
| Cloud SQL | db-f1-micro, 10GB | ~$25 |
| Cloud Storage | 5GB | ~$1 |
| Networking | Egress básico | ~$5 |
| **Total** | | **~$46** |

### Cenário Confortável (~$80/mês)
| Serviço | Configuração | Custo/mês |
|---------|--------------|-----------|
| Cloud Run | 2 instâncias, 512MB RAM | ~$30 |
| Cloud SQL | db-g1-small, 20GB | ~$40 |
| Cloud Storage | 10GB | ~$2 |
| Networking | Egress moderado | ~$8 |
| **Total** | | **~$80** |

### Com $300 em 91 dias
- Cenário mínimo: $50 × 3 = $150 (sobra $150)
- Cenário confortável: $80 × 3 = $240 (sobra $60)

**Recomendação:** Começar no mínimo, escalar conforme necessidade.

---

## 📋 PASSO A PASSO DO DEPLOY

### FASE 1: Preparação (Dia 1)

#### 1.1 Configurar Projeto
```bash
# No Google Cloud Console ou CLI
gcloud projects create prostqs-prod --name="PROST-QS Production"
gcloud config set project prostqs-prod
```

#### 1.2 Habilitar APIs Necessárias
```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com
```

#### 1.3 Configurar Alertas de Budget
**CRÍTICO: Fazer isso ANTES de criar recursos!**

1. Ir em Billing → Budgets & alerts
2. Criar budget de $100/mês
3. Alertas em 50%, 80%, 100%
4. Email: almirroj50@gmail.com

### FASE 2: Banco de Dados (Dia 1-2)

#### 2.1 Criar Cloud SQL
```bash
gcloud sql instances create prostqs-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=southamerica-east1 \
  --storage-size=10GB \
  --storage-type=SSD
```

#### 2.2 Criar Database e Usuário
```bash
gcloud sql databases create prostqs --instance=prostqs-db

gcloud sql users create prostqs_user \
  --instance=prostqs-db \
  --password=[SENHA_SEGURA]
```

#### 2.3 Configurar Conexão
- Anotar: Connection name (para Cloud Run)
- Formato: `projeto:regiao:instancia`

### FASE 3: Backend (Dia 2-3)

#### 3.1 Preparar Dockerfile
```dockerfile
# backend/Dockerfile.cloudrun
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /api ./cmd/api

FROM alpine:3.19
RUN apk --no-cache add ca-certificates
COPY --from=builder /api /api
EXPOSE 8080
CMD ["/api"]
```

#### 3.2 Build e Push
```bash
# Configurar Artifact Registry
gcloud artifacts repositories create prostqs-repo \
  --repository-format=docker \
  --location=southamerica-east1

# Build
gcloud builds submit --tag \
  southamerica-east1-docker.pkg.dev/prostqs-prod/prostqs-repo/api:v1
```

#### 3.3 Deploy no Cloud Run
```bash
gcloud run deploy prostqs-api \
  --image=southamerica-east1-docker.pkg.dev/prostqs-prod/prostqs-repo/api:v1 \
  --platform=managed \
  --region=southamerica-east1 \
  --memory=256Mi \
  --min-instances=0 \
  --max-instances=2 \
  --add-cloudsql-instances=prostqs-prod:southamerica-east1:prostqs-db \
  --set-env-vars="DB_HOST=/cloudsql/prostqs-prod:southamerica-east1:prostqs-db" \
  --allow-unauthenticated
```

### FASE 4: Domínio (Dia 3-4)

#### 4.1 Mapear Domínio Custom
```bash
gcloud run domain-mappings create \
  --service=prostqs-api \
  --domain=api.prostqs.com.br \
  --region=southamerica-east1
```

#### 4.2 Configurar DNS no Cloudflare
- Tipo: CNAME
- Nome: api
- Destino: ghs.googlehosted.com
- Proxy: OFF (importante para SSL do Google)

### FASE 5: Secrets (Dia 4)

#### 5.1 Criar Secrets
```bash
# JWT Secret
echo -n "sua-chave-jwt-super-secreta" | \
  gcloud secrets create jwt-secret --data-file=-

# Stripe Key
echo -n "sk_live_xxx" | \
  gcloud secrets create stripe-key --data-file=-

# Database Password
echo -n "senha-do-banco" | \
  gcloud secrets create db-password --data-file=-
```

#### 5.2 Dar Acesso ao Cloud Run
```bash
gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:prostqs-prod@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🔧 VARIÁVEIS DE AMBIENTE

```env
# Produção - Cloud Run
ENV=production
PORT=8080

# Database (Cloud SQL)
DB_HOST=/cloudsql/prostqs-prod:southamerica-east1:prostqs-db
DB_USER=prostqs_user
DB_NAME=prostqs
DB_PASSWORD=${DB_PASSWORD}  # Do Secret Manager

# Auth
JWT_SECRET=${JWT_SECRET}  # Do Secret Manager
JWT_EXPIRY=24h

# Stripe
STRIPE_KEY=${STRIPE_KEY}  # Do Secret Manager
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}

# URLs
API_URL=https://api.prostqs.com.br
FRONTEND_URL=https://prostqs.com.br
```

---

## 📊 MONITORAMENTO

### Dashboards Essenciais
1. **Cloud Run Metrics**
   - Request count
   - Latency (p50, p95, p99)
   - Error rate
   - Instance count

2. **Cloud SQL Metrics**
   - CPU utilization
   - Memory utilization
   - Connections
   - Storage used

3. **Billing**
   - Daily spend
   - Projected monthly
   - Credits remaining

### Alertas Recomendados
| Métrica | Threshold | Ação |
|---------|-----------|------|
| Error rate | > 5% | Email |
| Latency p99 | > 2s | Email |
| CPU (SQL) | > 80% | Email |
| Budget | > 80% | Email + SMS |

---

## 🚨 PLANO DE CONTINGÊNCIA

### Se Créditos Acabarem Antes do Esperado
1. **Imediato:** Reduzir Cloud SQL para db-f1-micro
2. **Curto prazo:** Migrar para Supabase free tier (500MB)
3. **Médio prazo:** VPS barata (Hetzner ~$4/mês)

### Se Google for Startups For Aprovado
1. Manter arquitetura atual
2. Escalar conforme demanda
3. Adicionar Redis para cache
4. Considerar Cloud CDN

### Se Não For Aprovado
1. Avaliar receita até abril
2. Se tiver receita: manter no Google Cloud
3. Se não tiver: migrar para alternativa barata

---

## 🔄 ALTERNATIVAS DE BAIXO CUSTO

### Opção B: Railway ($5/mês)
- Hobby plan: $5/mês
- PostgreSQL incluído
- Deploy simples
- Limitado mas funcional

### Opção C: Fly.io ($0-10/mês)
- Free tier generoso
- PostgreSQL $0 (1GB)
- Bom para começar

### Opção D: VPS Manual (~$5/mês)
- Hetzner/Contabo
- Mais trabalho, mais controle
- Backup manual necessário

---

## ✅ CHECKLIST PRÉ-DEPLOY

### Código
- [ ] Testes passando
- [ ] Build sem erros
- [ ] Dockerfile funcionando localmente
- [ ] Variáveis de ambiente documentadas

### Infraestrutura
- [ ] Projeto GCP criado
- [ ] APIs habilitadas
- [ ] Budget alerts configurados
- [ ] Service account com permissões

### Banco de Dados
- [ ] Cloud SQL criado
- [ ] Database criada
- [ ] Usuário criado
- [ ] Migrations prontas

### Segurança
- [ ] Secrets no Secret Manager
- [ ] HTTPS configurado
- [ ] CORS configurado
- [ ] Rate limiting ativo

### DNS
- [ ] Domínio verificado
- [ ] Registros DNS criados
- [ ] SSL certificado emitido

---

## 📅 CRONOGRAMA SUGERIDO

| Dia | Tarefa | Duração |
|-----|--------|---------|
| 1 | Setup projeto + Budget alerts | 2h |
| 1 | Criar Cloud SQL | 1h |
| 2 | Preparar Dockerfile | 2h |
| 2 | Primeiro deploy Cloud Run | 2h |
| 3 | Configurar secrets | 1h |
| 3 | Testar endpoints | 2h |
| 4 | Configurar domínio | 1h |
| 4 | Testar em produção | 2h |
| 5 | Monitoramento + alertas | 2h |

**Total estimado: 2-3 dias de trabalho focado**

---

## 🎯 DEFINIÇÃO DE SUCESSO

### Deploy bem-sucedido significa:
1. ✅ API respondendo em `api.prostqs.com.br`
2. ✅ Health check passando
3. ✅ Banco conectado e funcionando
4. ✅ Autenticação funcionando
5. ✅ Gastando menos de $100/mês
6. ✅ Alertas configurados

---

*Documento criado em 14/01/2026*
*Próxima revisão: após primeiro deploy*
