# 🚀 DEVOPS CLOUD COMMANDER

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- DevOps, CI/CD, pipeline, deploy, deployment
- Docker, Dockerfile, container, containerização
- Kubernetes, K8s, Helm, kubectl, pods, services
- Terraform, IaC, Infrastructure as Code
- GitHub Actions, GitLab CI, Jenkins, CircleCI
- AWS, EC2, ECS, EKS, Lambda, S3, RDS
- GCP, Google Cloud, Cloud Run, GKE
- Azure, AKS, DigitalOcean, Vercel, Railway
- Nginx, Traefik, Load Balancer, Reverse Proxy
- Monitoring, Prometheus, Grafana, Datadog

## FILOSOFIA
> "Infraestrutura é código. Deploy é automático. Falhas são recuperáveis."

### Princípios Invioláveis
1. **Infrastructure as Code (IaC)** - Tudo versionado, tudo reproduzível
2. **Immutable Infrastructure** - Não modifique, substitua
3. **GitOps** - Git como fonte única da verdade
4. **Shift Left** - Segurança e testes desde o início
5. **Observability First** - Se não pode medir, não pode melhorar
6. **Zero Downtime** - Deploys sem interrupção
7. **Fail Fast, Recover Faster** - Rollback automático

## ARQUITETURA

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVOPS PIPELINE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [DEV] ──▶ [BUILD] ──▶ [TEST] ──▶ [SCAN] ──▶ [DEPLOY]          │
│    │         │          │          │           │               │
│    ▼         ▼          ▼          ▼           ▼               │
│   Git     Docker      Jest      Trivy      K8s/ECS             │
│           Image       Vitest    Snyk       Cloud Run           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## DOCKER

### Best Practices
- Use multi-stage builds para imagens menores
- Use .dockerignore para excluir arquivos desnecessários
- Não rode como root - use USER
- Use imagens base oficiais e específicas (não :latest)
- Ordene instruções do menos ao mais mutável (cache)
- Use HEALTHCHECK para verificação de saúde

### Dockerfile Node.js (Multi-Stage)
```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system nodejs && adduser --system appuser
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
USER appuser
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## KUBERNETES

### Conceitos Essenciais
- **Pod**: Menor unidade deployável
- **Deployment**: Gerencia ReplicaSets e rolling updates
- **Service**: Expõe pods como serviço de rede
- **Ingress**: Gerencia acesso externo HTTP/HTTPS
- **ConfigMap**: Configurações não-sensíveis
- **Secret**: Dados sensíveis (base64)
- **HPA**: Horizontal Pod Autoscaler

### Deployment Template
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    spec:
      containers:
        - name: app
          image: myregistry/myapp:v1.0.0
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
```

## TERRAFORM

### Best Practices
- Use remote state (S3 + DynamoDB for locking)
- Use workspaces ou directories para ambientes
- Use modules para código reutilizável
- Sempre faça `terraform plan` antes de `apply`
- Versione providers e modules

## GITHUB ACTIONS

### CI/CD Pipeline Completo
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  test:
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:coverage

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to ECS
        run: aws ecs update-service --cluster myapp --service myapp-service --force-new-deployment
```

## CLOUD PROVIDERS

### AWS (Enterprise, Global Scale)
- Compute: EC2, ECS, EKS, Lambda, Fargate
- Database: RDS, Aurora, DynamoDB
- Storage: S3, EBS, EFS
- Networking: VPC, ALB, CloudFront, Route53

### GCP (ML/AI, Kubernetes)
- Compute: GKE, Cloud Run, Cloud Functions
- Database: Cloud SQL, Firestore, Spanner
- Storage: Cloud Storage

### Simpler Options
- **Vercel**: Next.js, Frontend, Serverless
- **Railway**: Full-stack apps, Quick deploys
- **Render**: Web services, Static sites
- **Fly.io**: Global distribution, Edge computing

## OBSERVABILITY

### Três Pilares
1. **Metrics**: Prometheus, Grafana, Datadog
2. **Logs**: Loki, ELK Stack, CloudWatch Logs
3. **Traces**: Jaeger, Zipkin, AWS X-Ray

### Key Metrics
- Request rate (RPS)
- Error rate (%)
- Latency (p50, p95, p99)
- CPU/Memory usage
- Saturation

## SECURITY

### Secrets Management
- HashiCorp Vault
- AWS Secrets Manager
- Azure Key Vault
- GCP Secret Manager

### Container Security
- Scan images: Trivy, Snyk, Clair
- Use minimal base images (alpine, distroless)
- Run as non-root user
- Use read-only filesystem

## CHECKLIST

### Docker
- [ ] Multi-stage build implementado?
- [ ] .dockerignore configurado?
- [ ] Rodando como non-root?
- [ ] HEALTHCHECK definido?
- [ ] Imagem base específica (não :latest)?

### Kubernetes
- [ ] Resource limits definidos?
- [ ] Liveness e readiness probes?
- [ ] HPA configurado?
- [ ] Network policies aplicadas?
- [ ] Secrets não em plain text?

### CI/CD
- [ ] Testes automatizados no pipeline?
- [ ] Security scanning (SAST/DAST)?
- [ ] Container image scanning?
- [ ] Rollback automático?
- [ ] Notificações configuradas?

## ANTI-PATTERNS

❌ **NUNCA** configure servidores manualmente (snowflake servers)
❌ **NUNCA** faça deploy por SSH
❌ **NUNCA** commite secrets no git
❌ **NUNCA** use :latest em produção
❌ **NUNCA** rode containers como root
❌ **NUNCA** faça deploy sem plano de rollback
