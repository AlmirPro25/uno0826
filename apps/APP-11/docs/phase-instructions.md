
# Phase 2 Instructions: Backend - Sovereign Kernel Implementation

Este documento prescreve o plano de execução para a implementação do Kernel Soberano em Go. A precisão e a aderência a estes princípios são não-negociáveis.

## 1. Setup do Ambiente Go

1.  **Inicialização do Módulo Go:**
    *   Navegue até `backend/`.
    *   Execute `go mod init ai-web-weaver/backend`.
2.  **Configuração de Ferramentas:**
    *   Instale `go-swagger` (para gerar documentação a partir do código, se necessário, ou usar o `openapi.yaml` como fonte primária).
    *   Instale `go-playground/validator` para validação de requisições.
    *   Instale `chi` (ou `gin`) para roteamento HTTP.
    *   Instale a biblioteca de JWT (`github.com/golang-jwt/jwt/v5`).
    *   Instale a biblioteca de hashing de senhas (`golang.org/x/crypto/bcrypt`).
    *   Instale o driver PostgreSQL (`github.com/jackc/pgx/v5`).
    *   Instale uma biblioteca de UUID (`github.com/google/uuid`).
    *   Instale uma biblioteca de logging estruturado (`go.uber.org/zap` ou `sirupsen/logrus`).
    *   Instale `godotenv` para carregar variáveis de ambiente local.
3.  **Configuração do Docker:**
    *   Crie um `Dockerfile` na raiz do `backend/` para a aplicação Go.
    *   Crie um `docker-compose.yml` na raiz do projeto para orquestrar o PostgreSQL e Redis para desenvolvimento local.

## 2. Implementação da Arquitetura Limpa (Clean Architecture)

Siga rigorosamente a estrutura definida em `docs/project-structure.md`. Cada serviço (`auth`, `beta`, `user`, etc.) deve ter suas camadas de `handler`, `service`, e `repository` bem definidas.

### Camada `model` (`internal/model/`)

*   **Defina os modelos (structs) Go:** Crie structs para `User`, `Session`, `BetaSubscription`, `Project`, `Plan`, `UserSubscription` conforme `prisma/schema.prisma` e `docs/openapi.yaml`.
*   **Validação de Entidades:** Adicione tags de validação (`validator` library) aos campos das structs para validação inicial.

### Camada `repository` (`internal/{service}/repository.go`)

*   **Interfaces:** Defina interfaces claras para cada repositório (ex: `UserRepository`, `BetaSubscriptionRepository`). Isso é crucial para a Inversão de Dependência (D de SOLID) e para facilitar testes unitários com mocks.
*   **Implementação PostgreSQL:** Implemente os métodos de persistência para cada repositório usando `pgx/v5` ou `database/sql` para interagir com o PostgreSQL.
    *   **AES-256:** Para `Session.refreshToken` e qualquer outro dado sensível, garanta que seja criptografado com AES-256 antes de persistir no banco de dados e descriptografado ao ser recuperado. As chaves de criptografia devem vir das variáveis de ambiente.
*   **Tratamento de Erros:** Retorne erros específicos e bem definidos (custom error types de `pkg/errors`) que possam ser tratados pelas camadas superiores.

### Camada `service` (`internal/{service}/service.go`)

*   **Interfaces:** Defina interfaces para cada serviço (ex: `AuthService`, `BetaService`). Isso isola a lógica de negócio e permite diferentes implementações.
*   **Lógica de Negócio:** Implemente a lógica de negócio conforme definido nos requisitos.
    *   **AuthService:**
        *   `Register(name, email, password)`: Hash de senha (bcrypt), criação de usuário, retorno de JWT. Verificação de email duplicado.
        *   `Login(email, password)`: Verificação de credenciais, geração de JWT (access e refresh tokens), persistência do refresh token no Redis (ou DB).
        *   `Refresh(refreshToken)`: Validação do refresh token, geração de novo access token.
        *   `GetUserProfile(userID)`: Recupera perfil do usuário.
        *   `UpdateUserProfile(userID, updateRequest)`: Atualiza perfil do usuário (incluindo mudança de senha com re-hashing).
    *   **BetaService:**
        *   `Subscribe(name, email)`: Validação de entrada, persistência da inscrição. Verificação de email duplicado.
    *   **ProjectService (Placeholder):**
        *   `CreateProject(userID, CreateProjectRequest)`: Validação, criação de registro de projeto com status `DRAFT` ou `GENERATING`. Simular a chamada a um serviço de IA ou iniciar um job em background.
        *   `GetProjects(userID)`: Recupera projetos do usuário.
*   **Validação:** Use o `go-playground/validator` para validar os DTOs de entrada antes de aplicar a lógica de negócio.
*   **Orquestração:** Coordene as interações entre os repositórios, cache (Redis) e outros serviços.
*   **Tratamento de Erros:** Mapeie erros do repositório para erros de negócio apropriados.

### Camada `handler` (`internal/{service}/handler.go`)

*   **APIs RESTful:** Implemente os handlers HTTP para cada endpoint definido em `docs/openapi.yaml`.
*   **Parsing de Requisições:** Analise JSON de entrada e parâmetros de URL/query.
*   **Validação:** Use o `go-playground/validator` para validar os DTOs de entrada *após* o parsing.
*   **Invocação de Serviço:** Chame os métodos apropriados da camada de serviço.
*   **Respostas HTTP:** Formate respostas JSON e defina os códigos de status HTTP corretos (200, 201, 400, 401, 403, 404, 409, 500).
*   **Tratamento de Erros:** Capture erros retornados pelo serviço e traduza-os em respostas HTTP amigáveis ao cliente, com mensagens de erro claras e códigos internos se aplicável. Use `pkg/errors` para isso.

## 3. Configuração Central (`internal/config/config.go`)

*   Carregue variáveis de ambiente (DB_URL, REDIS_ADDR, JWT_SECRET, AES_KEY, etc.) de `.env.local` (para dev) e do ambiente.
*   Valide as configurações necessárias no startup da aplicação.

## 4. Middleware (`internal/middleware/`)

*   **Autenticação JWT (`auth.go`):** Middleware para validar o `Authorization` header (Bearer Token), extrair o JWT e definir o contexto do usuário autenticado para as requisições subsequentes. Deve verificar tanto o `accessToken` quanto, opcionalmente, o `refreshToken`.
*   **Logging (`logger.go`):** Middleware para logar todas as requisições HTTP (método, URL, status, tempo de resposta, IP, user agent) com logs estruturados.
*   **CORS (`security.go`):** Configure cabeçalhos CORS apropriados para permitir requisições do frontend.
*   **Segurança (`security.go`):** Adicione headers de segurança (ex: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Strict-Transport-Security`).

## 5. Ponto de Entrada da Aplicação (`cmd/api/main.go`)

*   Inicialize o logger.
*   Carregue as configurações.
*   Conecte-se ao PostgreSQL.
*   Conecte-se ao Redis.
*   Crie instâncias de repositórios, serviços e handlers, injetando as dependências.
*   Configure o roteador HTTP (`chi` ou `gin`) e aplique os middlewares.
*   Inicie o servidor HTTP.
*   Implemente um `graceful shutdown` para lidar com interrupções (ex: `SIGINT`, `SIGTERM`).

## 6. Testes

*   **Testes Unitários:** Crie testes unitários abrangentes para todas as camadas de `service` e `repository` (usando mocks para as dependências). Cobertura de teste > 80% é o mínimo.
*   **Testes de Integração:** Crie testes para os `handlers` que interagem com o serviço e, idealmente, com um banco de dados de teste (ou contêineres Docker para CI).

## 7. Documentação

*   Garanta que todos os endpoints e modelos Go correspondam perfeitamente ao `docs/openapi.yaml`.
*   Adicione comentários explicativos no código, especialmente para a lógica de negócio complexa ou decisões de segurança.

**Regras Invioláveis para esta Fase:**

*   **ZERO vazamento de lógica de negócio para o frontend.**
*   **TODO tratamento de erro deve ser explícito e robusto.** O "happy path" não é o único caminho.
*   **Segurança é a prioridade #1.** Criptografia, validação e autorização devem ser auditadas mentalmente em cada linha.
*   **Performance:** A arquitetura em Go, juntamente com o uso estratégico de Redis, deve garantir respostas de API em milissegundos.

O sucesso desta fase é a base para o valor de milhões que o AI Web Weaver entregará.
