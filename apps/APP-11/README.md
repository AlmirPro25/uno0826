
# Project Genesis: AI Web Weaver

## Título do Projeto
**Project Genesis: AI Web Weaver - Frontend Blueprint Refactor**
(Em alinhamento com a filosofia "MANIFEST-ARCHITECT" e o objetivo de construir uma empresa de excelência, este refatoramento estabelece as fundações perfeitas para a plataforma AI Web Weaver.)

## Visão Geral
O **AI Web Weaver** é um sistema fullstack de última geração projetado para resolver a dor crítica de empresas que necessitam de interfaces web de altíssima fidelidade, performance extrema e acessibilidade total, geradas por inteligência artificial. Como Arquiteto-Fundador da Nova Era, meu foco é construir um ecossistema digital resiliente, escalável e esteticamente impecável, onde "o código medíocre é o custo técnico do fracasso; o código de excelência é o alicerce da fortuna."

## Problema de Mercado Resolvido
Empresas gastam fortunas e tempo precioso no desenvolvimento manual de interfaces web complexas, muitas vezes resultando em produtos que carecem de performance, acessibilidade e design de ponta. O AI Web Weaver democratiza o acesso a websites de nível empresarial, permitindo que qualquer negócio gere e personalize interfaces digitais impecáveis com a velocidade e inteligência da IA.

## Funcionalidades Principais
*   **Geração de UI por IA:** Transforme requisitos de texto em interfaces web de alta fidelidade.
*   **Performance Extrema:** Sites otimizados para Core Web Vitals, garantindo carregamento ultrarrápido.
*   **Acessibilidade Total:** Conformidade com WCAG 2.1 para inclusão de todos os usuários.
*   **Design Customizável:** Múltiplos estilos de design (Moderno, Minimalista, Corporativo, etc.) e opções de personalização.
*   **Dashboard do Usuário:** Gerencie projetos, visualize o status da geração e acesse o código gerado.
*   **Autenticação e Autorização:** Sistema robusto de usuários e sessões.
*   **Inscrição Beta:** Formulário para acesso antecipado ao produto.

## Arquitetura do Sistema
O AI Web Weaver é construído com uma arquitetura de microsserviços e padrões de design rigorosos para garantir escalabilidade, manutenibilidade e resiliência.

*   **Frontend (Interface do Usuário):**
    *   **Framework:** Next.js 15 (App Router)
    *   **Linguagem:** TypeScript rigoroso
    *   **Estilização:** Tailwind CSS (compilado), Shadcn/UI (componentes acessíveis)
    *   **Animações:** Framer Motion
    *   **Estado:** Zustand (para gerenciamento de estado global leve e performático)
    *   **Validação:** Zod
    *   **Requisições API:** Axios com interceptores para autenticação e tratamento de erros.

*   **Backend (Kernel Soberano):**
    *   **Linguagem:** Go (Golang)
    *   **Framework Web:** Chi (roteador HTTP leve)
    *   **Arquitetura:** PROST-QS (SOLID, Clean Architecture, Design Patterns: Repository, Service, Factory, Observer)
    *   **Autenticação:** JWT (JSON Web Tokens) com Refresh Tokens criptografados (AES-256).
    *   **Banco de Dados:** PostgreSQL (via `pgx` ou ORM leve)
    *   **Cache/Sessões:** Redis
    *   **Validação:** `go-playground/validator`
    *   **Logging:** Zap
    *   **Gerenciamento de Dependências:** Go Modules

*   **Banco de Dados:**
    *   PostgreSQL
    *   **Schema:** Definido via Prisma DSL (representação canônica, o Go interage diretamente com PostgreSQL).

*   **DevOps & Infraestrutura:**
    *   **Containerização:** Docker, Docker Compose
    *   **CI/CD:** GitHub Actions
    *   **Testes E2E:** Playwright
    *   **Monitoramento:** Health Checks integrados
    *   **Segurança:** Mentalidade Zero Trust, OWASP compliance, HTTPS, Content Security Policy (CSP), Subresource Integrity (SRI).

### Diagrama de Alto Nível
```mermaid
graph TD
    User[Usuário] -->|Requisições Web| CloudflareCDN[Cloudflare CDN / Edge]
    CloudflareCDN -->|HTTPS| Frontend[Frontend: Next.js (3000)]
    Frontend -->|API Calls (HTTP/S)| Backend[Backend: Go Lang (8080)]
    Backend -->|Database Queries| PostgreSQL[Database: PostgreSQL]
    Backend -->|Caching / Sessions| Redis[Cache: Redis]
    Backend -->|AI Gen Request| AIModel[Serviço AI (Ex: OpenAI, Anthropic)]
    AIModel -->|Generated Code| Storage[Storage: S3/Cloud Storage]
    Storage -->|Preview Image| Frontend

    subgraph CI/CD
        GitHubRepo[GitHub Repository] -- Push/PR --> GitHubActionsCI[GitHub Actions CI]
        GitHubActionsCI -- Build & Test --> DockerRegistry[Docker Registry]
        DockerRegistry -- Deploy Trigger --> GitHubActionsCD[GitHub Actions CD]
        GitHubActionsCD --> ProdServer[Servidor de Produção]
    end

    ProdServer -- Docker Compose --> Frontend
    ProdServer -- Docker Compose --> Backend
    ProdServer -- Docker Compose --> PostgreSQL
    ProdServer -- Docker Compose --> Redis
```
*(Nota: O diagrama acima é conceitual e pode ser renderizado por ferramentas compatíveis com Mermaid JS.)*

## Primeiros Passos

### Pré-requisitos
*   Git
*   Docker & Docker Compose (v3.8+)
*   Node.js (v20+) & npm (para desenvolvimento frontend local, opcional se usar apenas Docker)
*   Go (v1.22+) (para desenvolvimento backend local, opcional se usar apenas Docker)

### 1. Clonar o Repositório
```bash
git clone https://github.com/your-org/ai-web-weaver.git
cd ai-web-weaver
```

### 2. Configuração de Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto, baseado no `.env.example`:
```bash
cp .env.example .env
```
Preencha as variáveis em `.env` com valores apropriados para o desenvolvimento local.

Exemplo de `.env`:
```env
#
