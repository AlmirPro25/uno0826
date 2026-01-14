/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      🚀 DEVOPS CLOUD COMMANDER MANIFEST - O COMANDANTE DA NUVEM 🚀          ║
 * ║                                                                              ║
 * ║         "Do código ao deploy em um comando. Infraestrutura como código."    ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Manifesto completo para DevOps, CI/CD, Containerização e Cloud Infrastructure.
 * Suporta: Docker, Kubernetes, Terraform, GitHub Actions, AWS, GCP, Azure
 * 
 * @author Micro SaaS Factory
 * @version 1.0.0
 */

export const DEVOPS_CLOUD_COMMANDER_MANIFEST = {
  id: 'devops-cloud-commander',
  name: 'DevOps Cloud Commander',
  version: '1.0.0',
  description: 'Especialista em DevOps, CI/CD, Containerização e Infraestrutura Cloud',
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // PALAVRAS-CHAVE PARA ATIVAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════════
  keywords: [
    'devops', 'cicd', 'ci/cd', 'pipeline', 'deploy', 'deployment',
    'docker', 'dockerfile', 'container', 'containerização',
    'kubernetes', 'k8s', 'helm', 'kubectl', 'pods', 'services',
    'terraform', 'iac', 'infrastructure as code', 'provisioning',
    'github actions', 'gitlab ci', 'jenkins', 'circleci',
    'aws', 'ec2', 'ecs', 'eks', 'lambda', 's3', 'rds', 'cloudfront',
    'gcp', 'google cloud', 'cloud run', 'gke',
    'azure', 'aks', 'azure devops',
    'digitalocean', 'vercel', 'railway', 'render', 'fly.io',
    'nginx', 'traefik', 'load balancer', 'reverse proxy',
    'monitoring', 'prometheus', 'grafana', 'datadog',
    'logging', 'elk', 'loki', 'fluentd',
    'secrets', 'vault', 'environment variables'
  ],

  // ═══════════════════════════════════════════════════════════════════════════════
  // FILOSOFIA
  // ═══════════════════════════════════════════════════════════════════════════════
  philosophy: {
    core: 'Infraestrutura é código. Deploy é automático. Falhas são recuperáveis.',
    principles: [
      'Infrastructure as Code (IaC) - Tudo versionado, tudo reproduzível',
      'Immutable Infrastructure - Não modifique, substitua',
      'GitOps - Git como fonte única da verdade',
      'Shift Left - Segurança e testes desde o início',
      'Observability First - Se não pode medir, não pode melhorar',
      'Zero Downtime - Deploys sem interrupção',
      'Fail Fast, Recover Faster - Rollback automático'
    ],
    antiPatterns: [
      'Snowflake servers - Servidores configurados manualmente',
      'Configuration drift - Ambientes diferentes',
      'Manual deployments - Deploy por SSH',
      'Secrets in code - Credenciais hardcoded',
      'No rollback plan - Deploy sem plano B',
      'Monolithic pipelines - CI/CD sem paralelismo'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ARQUITETURA
  // ═══════════════════════════════════════════════════════════════════════════════
  architecture: `
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        DEVOPS CLOUD ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │   DEV       │───▶│   BUILD     │───▶│   TEST      │───▶│   DEPLOY    │      │
│  │  (Code)     │    │  (Docker)   │    │  (CI/CD)    │    │  (K8s/Cloud)│      │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘      │
│        │                  │                  │                  │              │
│        ▼                  ▼                  ▼                  ▼              │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         GIT REPOSITORY                                  │   │
│  │  ├── src/                    (Application Code)                         │   │
│  │  ├── Dockerfile              (Container Definition)                     │   │
│  │  ├── docker-compose.yml      (Local Development)                        │   │
│  │  ├── .github/workflows/      (CI/CD Pipelines)                          │   │
│  │  ├── terraform/              (Infrastructure as Code)                   │   │
│  │  ├── k8s/                    (Kubernetes Manifests)                     │   │
│  │  └── helm/                   (Helm Charts)                              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         CI/CD PIPELINE                                  │   │
│  │                                                                         │   │
│  │  [Push] ──▶ [Lint] ──▶ [Test] ──▶ [Build] ──▶ [Scan] ──▶ [Deploy]      │   │
│  │                                                                         │   │
│  │  Stages:                                                                │   │
│  │  1. Code Quality (ESLint, Prettier, TypeCheck)                          │   │
│  │  2. Unit Tests (Jest, Vitest)                                           │   │
│  │  3. Build Docker Image                                                  │   │
│  │  4. Security Scan (Trivy, Snyk)                                         │   │
│  │  5. Push to Registry (ECR, GCR, Docker Hub)                             │   │
│  │  6. Deploy to Environment (Staging → Production)                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         CLOUD INFRASTRUCTURE                            │   │
│  │                                                                         │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │   │
│  │  │   CDN       │    │   Load      │    │   Container │                  │   │
│  │  │ CloudFront  │───▶│  Balancer   │───▶│   Cluster   │                  │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘                  │   │
│  │                                              │                          │   │
│  │                           ┌──────────────────┼──────────────────┐       │   │
│  │                           ▼                  ▼                  ▼       │   │
│  │                    ┌───────────┐      ┌───────────┐      ┌───────────┐  │   │
│  │                    │  Pod 1    │      │  Pod 2    │      │  Pod N    │  │   │
│  │                    │  (App)    │      │  (App)    │      │  (App)    │  │   │
│  │                    └───────────┘      └───────────┘      └───────────┘  │   │
│  │                           │                  │                  │       │   │
│  │                           └──────────────────┼──────────────────┘       │   │
│  │                                              ▼                          │   │
│  │                    ┌─────────────────────────────────────────────────┐  │   │
│  │                    │  Database (RDS/CloudSQL) │ Cache (Redis/Memcached) │   │
│  │                    └─────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         OBSERVABILITY                                   │   │
│  │                                                                         │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │   │
│  │  │  Metrics    │    │   Logs      │    │   Traces    │                  │   │
│  │  │ Prometheus  │    │   Loki      │    │   Jaeger    │                  │   │
│  │  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                  │   │
│  │         └──────────────────┼──────────────────┘                         │   │
│  │                            ▼                                            │   │
│  │                    ┌─────────────┐                                      │   │
│  │                    │   Grafana   │                                      │   │
│  │                    │ Dashboards  │                                      │   │
│  │                    └─────────────┘                                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
`,

  // ═══════════════════════════════════════════════════════════════════════════════
  // DOCKER
  // ═══════════════════════════════════════════════════════════════════════════════
  docker: {
    bestPractices: [
      'Use multi-stage builds para imagens menores',
      'Use .dockerignore para excluir arquivos desnecessários',
      'Não rode como root - use USER',
      'Use imagens base oficiais e específicas (não :latest)',
      'Ordene instruções do menos ao mais mutável (cache)',
      'Use HEALTHCHECK para verificação de saúde',
      'Minimize o número de layers',
      'Use ARG para build-time e ENV para runtime'
    ],
    
    templates: {
      nodeMultiStage: `# ═══════════════════════════════════════════════════════════════
# DOCKERFILE - Node.js Multi-Stage Build (Otimizado)
# ═══════════════════════════════════════════════════════════════

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Runner (Production)
FROM node:20-alpine AS runner
WORKDIR /app

# Security: Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Copy only necessary files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Switch to non-root user
USER appuser

EXPOSE 3000
CMD ["node", "dist/index.js"]`,

      goMultiStage: `# ═══════════════════════════════════════════════════════════════
# DOCKERFILE - Go Multi-Stage Build (Minimal)
# ═══════════════════════════════════════════════════════════════

# Stage 1: Builder
FROM golang:1.22-alpine AS builder
WORKDIR /app

# Install dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Download dependencies first (cache layer)
COPY go.mod go.sum ./
RUN go mod download

# Build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \\
    -ldflags="-w -s -X main.version=\${VERSION}" \\
    -o /app/server ./cmd/server

# Stage 2: Runner (Scratch - minimal)
FROM scratch
WORKDIR /app

# Copy certificates and timezone data
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Copy binary
COPY --from=builder /app/server /app/server

# Set environment
ENV TZ=UTC

EXPOSE 8080
ENTRYPOINT ["/app/server"]`,

      pythonMultiStage: `# ═══════════════════════════════════════════════════════════════
# DOCKERFILE - Python Multi-Stage Build
# ═══════════════════════════════════════════════════════════════

# Stage 1: Builder
FROM python:3.12-slim AS builder
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential \\
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Runner
FROM python:3.12-slim AS runner
WORKDIR /app

# Copy virtual environment
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Create non-root user
RUN useradd --create-home --shell /bin/bash appuser
USER appuser

# Copy application
COPY --chown=appuser:appuser . .

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`
    },

    dockerCompose: {
      development: `# ═══════════════════════════════════════════════════════════════
# DOCKER-COMPOSE - Development Environment
# ═══════════════════════════════════════════════════════════════
version: '3.8'

services:
  # Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: builder  # Use builder stage for dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules  # Preserve node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/app
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    command: npm run dev

  # PostgreSQL Database
  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Adminer (Database UI)
  adminer:
    image: adminer
    ports:
      - "8080:8080"
    depends_on:
      - db

volumes:
  postgres_data:
  redis_data:`,

      production: `# ═══════════════════════════════════════════════════════════════
# DOCKER-COMPOSE - Production Environment
# ═══════════════════════════════════════════════════════════════
version: '3.8'

services:
  # Application (with replicas)
  app:
    image: \${REGISTRY}/\${IMAGE_NAME}:\${IMAGE_TAG}
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      rollback_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    environment:
      - NODE_ENV=production
      - DATABASE_URL=\${DATABASE_URL}
      - REDIS_URL=\${REDIS_URL}
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - app-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Nginx Load Balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - app-network

networks:
  app-network:
    driver: overlay`
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // KUBERNETES
  // ═══════════════════════════════════════════════════════════════════════════════
  kubernetes: {
    concepts: {
      pod: 'Menor unidade deployável - um ou mais containers',
      deployment: 'Gerencia ReplicaSets e rolling updates',
      service: 'Expõe pods como serviço de rede',
      ingress: 'Gerencia acesso externo HTTP/HTTPS',
      configMap: 'Configurações não-sensíveis',
      secret: 'Dados sensíveis (base64 encoded)',
      pvc: 'Persistent Volume Claim - storage persistente',
      hpa: 'Horizontal Pod Autoscaler - escala automática'
    },

    templates: {
      deployment: `# ═══════════════════════════════════════════════════════════════
# KUBERNETES DEPLOYMENT
# ═══════════════════════════════════════════════════════════════
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deployment
  labels:
    app: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: app
          image: myregistry/myapp:v1.0.0
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: database-url
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
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          securityContext:
            runAsNonRoot: true
            runAsUser: 1000
            readOnlyRootFilesystem: true
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: app
                      operator: In
                      values:
                        - myapp
                topologyKey: kubernetes.io/hostname`,

      service: `# ═══════════════════════════════════════════════════════════════
# KUBERNETES SERVICE
# ═══════════════════════════════════════════════════════════════
apiVersion: v1
kind: Service
metadata:
  name: app-service
spec:
  type: ClusterIP
  selector:
    app: myapp
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000`,

      ingress: `# ═══════════════════════════════════════════════════════════════
# KUBERNETES INGRESS (with TLS)
# ═══════════════════════════════════════════════════════════════
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
    - hosts:
        - myapp.example.com
      secretName: myapp-tls
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: app-service
                port:
                  number: 80`,

      hpa: `# ═══════════════════════════════════════════════════════════════
# HORIZONTAL POD AUTOSCALER
# ═══════════════════════════════════════════════════════════════
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15`
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // TERRAFORM (Infrastructure as Code)
  // ═══════════════════════════════════════════════════════════════════════════════
  terraform: {
    bestPractices: [
      'Use remote state (S3 + DynamoDB for locking)',
      'Use workspaces ou directories para ambientes',
      'Use modules para código reutilizável',
      'Use variables e locals para configuração',
      'Use data sources para recursos existentes',
      'Sempre faça terraform plan antes de apply',
      'Use terraform fmt e terraform validate',
      'Versione providers e modules'
    ],

    templates: {
      awsEcs: `# ═══════════════════════════════════════════════════════════════
# TERRAFORM - AWS ECS Fargate
# ═══════════════════════════════════════════════════════════════

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "terraform"
    }
  }
}

# Variables
variable "aws_region" {
  default = "us-east-1"
}

variable "environment" {
  default = "production"
}

variable "project_name" {
  default = "myapp"
}

# VPC
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
  
  name = "\${var.project_name}-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["\${var.aws_region}a", "\${var.aws_region}b", "\${var.aws_region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  
  enable_nat_gateway = true
  single_nat_gateway = var.environment != "production"
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "\${var.project_name}-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = "\${var.project_name}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn
  
  container_definitions = jsonencode([
    {
      name  = "app"
      image = "\${aws_ecr_repository.app.repository_url}:latest"
      
      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]
      
      environment = [
        { name = "NODE_ENV", value = "production" }
      ]
      
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = aws_secretsmanager_secret.db_url.arn
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.app.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
      
      healthCheck = {
        command     = ["CMD-SHELL", "wget -q --spider http://localhost:3000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])
}

# ECS Service
resource "aws_ecs_service" "app" {
  name            = "\${var.project_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 2
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = 3000
  }
  
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
}

# Application Load Balancer
resource "aws_lb" "app" {
  name               = "\${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets
}

# Outputs
output "alb_dns_name" {
  value = aws_lb.app.dns_name
}

output "ecr_repository_url" {
  value = aws_ecr_repository.app.repository_url
}`
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // GITHUB ACTIONS (CI/CD)
  // ═══════════════════════════════════════════════════════════════════════════════
  githubActions: {
    bestPractices: [
      'Use reusable workflows para DRY',
      'Use matrix builds para múltiplas versões',
      'Cache dependencies (npm, pip, go)',
      'Use secrets para credenciais',
      'Use environments para aprovações',
      'Use concurrency para evitar deploys simultâneos',
      'Use artifacts para compartilhar entre jobs'
    ],

    templates: {
      cicd: `# ═══════════════════════════════════════════════════════════════
# GITHUB ACTIONS - Complete CI/CD Pipeline
# ═══════════════════════════════════════════════════════════════
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ═══════════════════════════════════════════════════════════════
  # JOB 1: Code Quality
  # ═══════════════════════════════════════════════════════════════
  quality:
    name: Code Quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type Check
        run: npm run typecheck
      
      - name: Format Check
        run: npm run format:check

  # ═══════════════════════════════════════════════════════════════
  # JOB 2: Tests
  # ═══════════════════════════════════════════════════════════════
  test:
    name: Tests
    runs-on: ubuntu-latest
    needs: quality
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Tests
        run: npm run test:coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v4
        with:
          token: \${{ secrets.CODECOV_TOKEN }}

  # ═══════════════════════════════════════════════════════════════
  # JOB 3: Build & Push Docker Image
  # ═══════════════════════════════════════════════════════════════
  build:
    name: Build & Push
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push'
    permissions:
      contents: read
      packages: write
    outputs:
      image-tag: \${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch
            type=semver,pattern={{version}}
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:sha-\${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

  # ═══════════════════════════════════════════════════════════════
  # JOB 4: Deploy to Staging
  # ═══════════════════════════════════════════════════════════════
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.myapp.com
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \\
            --cluster myapp-staging \\
            --service myapp-service \\
            --force-new-deployment

  # ═══════════════════════════════════════════════════════════════
  # JOB 5: Deploy to Production
  # ═══════════════════════════════════════════════════════════════
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://myapp.com
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \\
            --cluster myapp-production \\
            --service myapp-service \\
            --force-new-deployment
      
      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \\
            --cluster myapp-production \\
            --services myapp-service
      
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "🚀 Deployed to production: \${{ github.sha }}"
            }
        env:
          SLACK_WEBHOOK_URL: \${{ secrets.SLACK_WEBHOOK }}`
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // CLOUD PROVIDERS
  // ═══════════════════════════════════════════════════════════════════════════════
  cloudProviders: {
    aws: {
      name: 'Amazon Web Services',
      services: {
        compute: ['EC2', 'ECS', 'EKS', 'Lambda', 'Fargate', 'App Runner'],
        database: ['RDS', 'Aurora', 'DynamoDB', 'ElastiCache', 'DocumentDB'],
        storage: ['S3', 'EBS', 'EFS'],
        networking: ['VPC', 'ALB', 'NLB', 'CloudFront', 'Route53', 'API Gateway'],
        security: ['IAM', 'Secrets Manager', 'KMS', 'WAF', 'Shield'],
        monitoring: ['CloudWatch', 'X-Ray', 'CloudTrail'],
        cicd: ['CodePipeline', 'CodeBuild', 'CodeDeploy']
      },
      bestFor: ['Enterprise', 'Complex architectures', 'Global scale']
    },
    gcp: {
      name: 'Google Cloud Platform',
      services: {
        compute: ['Compute Engine', 'GKE', 'Cloud Run', 'Cloud Functions', 'App Engine'],
        database: ['Cloud SQL', 'Firestore', 'Bigtable', 'Spanner', 'Memorystore'],
        storage: ['Cloud Storage', 'Persistent Disk'],
        networking: ['VPC', 'Cloud Load Balancing', 'Cloud CDN', 'Cloud DNS'],
        security: ['IAM', 'Secret Manager', 'Cloud KMS'],
        monitoring: ['Cloud Monitoring', 'Cloud Logging', 'Cloud Trace'],
        cicd: ['Cloud Build', 'Cloud Deploy']
      },
      bestFor: ['ML/AI workloads', 'Kubernetes', 'Data analytics']
    },
    azure: {
      name: 'Microsoft Azure',
      services: {
        compute: ['Virtual Machines', 'AKS', 'Container Apps', 'Functions', 'App Service'],
        database: ['Azure SQL', 'Cosmos DB', 'Cache for Redis'],
        storage: ['Blob Storage', 'Managed Disks'],
        networking: ['VNet', 'Load Balancer', 'Front Door', 'DNS'],
        security: ['Azure AD', 'Key Vault'],
        monitoring: ['Azure Monitor', 'Application Insights'],
        cicd: ['Azure DevOps', 'GitHub Actions']
      },
      bestFor: ['Enterprise', '.NET workloads', 'Hybrid cloud']
    },
    simpler: {
      vercel: {
        bestFor: ['Next.js', 'Frontend', 'Serverless'],
        features: ['Zero config', 'Edge functions', 'Preview deployments']
      },
      railway: {
        bestFor: ['Full-stack apps', 'Databases', 'Quick deploys'],
        features: ['GitHub integration', 'Automatic deploys', 'Built-in databases']
      },
      render: {
        bestFor: ['Web services', 'Static sites', 'Databases'],
        features: ['Free tier', 'Auto-scaling', 'Managed databases']
      },
      flyio: {
        bestFor: ['Global distribution', 'Edge computing', 'Containers'],
        features: ['Multi-region', 'Fly Machines', 'Built-in Postgres']
      },
      digitalocean: {
        bestFor: ['Simple VMs', 'Kubernetes', 'App Platform'],
        features: ['Predictable pricing', 'Simple UI', 'Good docs']
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // MONITORING & OBSERVABILITY
  // ═══════════════════════════════════════════════════════════════════════════════
  observability: {
    pillars: {
      metrics: {
        tools: ['Prometheus', 'Grafana', 'Datadog', 'CloudWatch'],
        keyMetrics: [
          'Request rate (RPS)',
          'Error rate (%)',
          'Latency (p50, p95, p99)',
          'CPU/Memory usage',
          'Saturation'
        ]
      },
      logs: {
        tools: ['Loki', 'ELK Stack', 'CloudWatch Logs', 'Datadog'],
        bestPractices: [
          'Structured logging (JSON)',
          'Correlation IDs',
          'Log levels (DEBUG, INFO, WARN, ERROR)',
          'Centralized aggregation'
        ]
      },
      traces: {
        tools: ['Jaeger', 'Zipkin', 'AWS X-Ray', 'Datadog APM'],
        concepts: ['Spans', 'Trace ID', 'Parent-child relationships']
      }
    },

    prometheusConfig: `# ═══════════════════════════════════════════════════════════════
# PROMETHEUS - Configuration
# ═══════════════════════════════════════════════════════════════
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

rule_files:
  - /etc/prometheus/rules/*.yml

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'app'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\\d+)?;(\\d+)
        replacement: \$1:\$2
        target_label: __address__`,

    alertRules: `# ═══════════════════════════════════════════════════════════════
# PROMETHEUS - Alert Rules
# ═══════════════════════════════════════════════════════════════
groups:
  - name: app-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ \$value | humanizePercentage }} for {{ \$labels.instance }}"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "P95 latency is {{ \$value }}s for {{ \$labels.instance }}"

      - alert: PodCrashLooping
        expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Pod is crash looping"
          description: "Pod {{ \$labels.pod }} is restarting frequently"

      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ \$value | humanizePercentage }} for {{ \$labels.pod }}"`
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // SECURITY
  // ═══════════════════════════════════════════════════════════════════════════════
  security: {
    secretsManagement: {
      tools: ['HashiCorp Vault', 'AWS Secrets Manager', 'Azure Key Vault', 'GCP Secret Manager'],
      bestPractices: [
        'Never commit secrets to git',
        'Use environment variables or secret managers',
        'Rotate secrets regularly',
        'Use least privilege access',
        'Audit secret access'
      ]
    },
    containerSecurity: {
      scanning: ['Trivy', 'Snyk', 'Clair', 'Anchore'],
      bestPractices: [
        'Use minimal base images (alpine, distroless)',
        'Run as non-root user',
        'Use read-only filesystem',
        'Scan images in CI/CD',
        'Sign images (cosign)'
      ]
    },
    networkSecurity: {
      practices: [
        'Use private subnets for workloads',
        'Implement network policies in K8s',
        'Use WAF for public endpoints',
        'Enable TLS everywhere',
        'Use VPN for admin access'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // NGINX CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════════
  nginx: {
    reverseProxy: `# ═══════════════════════════════════════════════════════════════
# NGINX - Reverse Proxy Configuration
# ═══════════════════════════════════════════════════════════════
upstream app_servers {
    least_conn;
    server app1:3000 weight=5;
    server app2:3000 weight=5;
    server app3:3000 weight=5;
    keepalive 32;
}

server {
    listen 80;
    server_name myapp.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name myapp.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript;

    # Rate Limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;

    location / {
        proxy_pass http://app_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 90;
    }

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://app_servers;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
}`
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // CHECKLIST
  // ═══════════════════════════════════════════════════════════════════════════════
  checklist: {
    docker: [
      'Multi-stage build implementado?',
      '.dockerignore configurado?',
      'Rodando como non-root?',
      'HEALTHCHECK definido?',
      'Imagem base específica (não :latest)?',
      'Layers otimizadas para cache?'
    ],
    kubernetes: [
      'Resource limits definidos?',
      'Liveness e readiness probes?',
      'Pod anti-affinity configurado?',
      'HPA configurado?',
      'Network policies aplicadas?',
      'Secrets não em plain text?'
    ],
    cicd: [
      'Testes automatizados no pipeline?',
      'Security scanning (SAST/DAST)?',
      'Container image scanning?',
      'Environments com aprovação?',
      'Rollback automático?',
      'Notificações configuradas?'
    ],
    security: [
      'Secrets em secret manager?',
      'TLS em todas as conexões?',
      'WAF configurado?',
      'Rate limiting ativo?',
      'Logs de auditoria?',
      'Backup automatizado?'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // TROUBLESHOOTING
  // ═══════════════════════════════════════════════════════════════════════════════
  troubleshooting: {
    docker: {
      'Container não inicia': [
        'Verificar logs: docker logs <container>',
        'Verificar se porta está em uso',
        'Verificar variáveis de ambiente',
        'Verificar permissões de arquivos'
      ],
      'Build muito lento': [
        'Otimizar ordem das instruções (cache)',
        'Usar .dockerignore',
        'Usar multi-stage builds',
        'Usar BuildKit: DOCKER_BUILDKIT=1'
      ],
      'Imagem muito grande': [
        'Usar imagem base alpine ou distroless',
        'Multi-stage build',
        'Remover arquivos desnecessários',
        'Combinar RUN commands'
      ]
    },
    kubernetes: {
      'Pod em CrashLoopBackOff': [
        'kubectl logs <pod> --previous',
        'kubectl describe pod <pod>',
        'Verificar liveness probe',
        'Verificar recursos (OOMKilled?)'
      ],
      'Pod em Pending': [
        'kubectl describe pod <pod>',
        'Verificar recursos disponíveis no cluster',
        'Verificar node selectors/affinity',
        'Verificar PVC se usar storage'
      ],
      'Service não acessível': [
        'kubectl get endpoints <service>',
        'Verificar selector do service',
        'Verificar network policies',
        'Testar com kubectl port-forward'
      ]
    },
    cicd: {
      'Pipeline falhando': [
        'Verificar logs do job',
        'Verificar secrets/variáveis',
        'Testar localmente primeiro',
        'Verificar permissões do runner'
      ],
      'Deploy não atualiza': [
        'Verificar se imagem tag mudou',
        'Forçar rollout: kubectl rollout restart',
        'Verificar imagePullPolicy',
        'Verificar registry credentials'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════════
  helpers: {
    generateDockerfile: (config: { language: string; framework?: string }) => {
      const templates: Record<string, string> = {
        node: 'Use nodeMultiStage template',
        go: 'Use goMultiStage template',
        python: 'Use pythonMultiStage template'
      };
      return templates[config.language] || 'Template not found';
    },
    
    generateGitHubAction: (config: { type: string; cloud?: string }) => {
      return 'Use cicd template and customize for your needs';
    },
    
    generateK8sManifests: (config: { name: string; replicas: number }) => {
      return 'Use kubernetes templates and customize';
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════
export interface DevOpsConfig {
  projectName: string;
  language: 'node' | 'go' | 'python' | 'java';
  framework?: string;
  cloud: 'aws' | 'gcp' | 'azure' | 'digitalocean' | 'vercel' | 'railway';
  containerOrchestration: 'docker-compose' | 'kubernetes' | 'ecs' | 'cloud-run';
  cicd: 'github-actions' | 'gitlab-ci' | 'jenkins' | 'circleci';
  monitoring?: 'prometheus' | 'datadog' | 'cloudwatch';
}

export interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  replicas: number;
  resources: {
    cpu: string;
    memory: string;
  };
  autoscaling?: {
    minReplicas: number;
    maxReplicas: number;
    targetCPU: number;
  };
}

export default DEVOPS_CLOUD_COMMANDER_MANIFEST;
