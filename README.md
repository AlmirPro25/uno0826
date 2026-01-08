
# 🚀 Prost-QS: Sovereign Cognitive State Kernel

Este projeto implementa o **Prost-QS**, um Kernel de Estado Cognitivo Soberano, local-first, replicável e governado por IA, utilizando SQLite como seu núcleo fundamental. Ele serve como uma fundação universal para autenticação, pagamento e identidade, permitindo que uma "legião" de aplicações independentes seja criada rapidamente, sem a necessidade de depender de infraestruturas alheias.

## 🌟 Visão Geral

O Prost-QS é um organismo computacional que usa SQLite não como um banco de dados tradicional, mas como o próprio kernel de estado, um ledger determinístico e a base de raciocínio para a IA.

**Características Principais:**
- **Local-First:** Cada instância possui seu próprio arquivo SQLite, com WAL ativado e escrita atômica.
- **Orientado a Eventos:** `Command → Event → State` garante um ledger imutável e estado derivado.
- **Governança por IA:** A IA (simulada aqui, mas projetada para Google Gemini) cria, evolui schemas, valida comandos, e resolve conflitos.
- **Identidade Soberana:** Atua como Identity Provider global para a "legião de apps".
- **Pagamentos como Estado:** Eventos financeiros soberanos com ledger imutável.
- **Replicação Soberana:** Sincronização de eventos e `diffs` entre nós, não compartilhamento de banco.
- **Frontend Plug-in:** Aplicação Mobile Android (WebView) que "pluga" no kernel e herda autenticação e permissões.

## 🎨 Stack Tecnológica

**Backend:** Go (Gin Framework)
**Frontend:** HTML, TailwindCSS, JavaScript (para Android WebView)
**Banco de Dados:** SQLite3 (como Kernel de Estado)
**Inteligência Artificial:** Google Gemini (simulado)
**Containerização:** Docker, Docker Compose

## 📦 Estrutura do Projeto

```
prost-qs/
├── backend/
│   ├── cmd/
│   │   └── api/
│   │       └── main.go                 # Ponto de entrada do backend Go
│   ├── internal/
│   │   ├── auth/                       # Lógica de autenticação e tokens
│   │   ├── command/                    # Processamento de comandos
│   │   ├── event/                      # Armazenamento e projeção de eventos
│   │   ├── identity/                   # Gerenciamento de identidade do usuário
│   │   ├── ai/                         # Módulo de governança por IA (simulado)
│   │   ├── payment/                    # Processamento de pagamentos
│   │   └── replication/                # Lógica de replicação
│   ├── pkg/
│   │   ├── db/
│   │   │   └── sqlite.go               # Conexão e migrações SQLite
│   │   ├── middleware/                 # Middlewares (autenticação JWT, rate limit)
│   │   └── utils/                      # Funções utilitárias (JWT, criptografia)
│   ├── go.mod                          # Dependências Go
│   ├── go.sum
│   └── Dockerfile                      # Dockerfile para o backend Go
├── frontend/
│   ├── index.html                      # Frontend principal para WebView
│   ├── src/
│   │   ├── main.js                     # Lógica JavaScript do frontend
│   │   └── styles.css                  # CSS gerado pelo Tailwind
│   └── tailwind.config.js              # Configuração do TailwindCSS
├── .github/
│   └── workflows/
│       └── ci.yml                      # Workflow de CI/CD (GitHub Actions)
├── docker-compose.yml                  # Orquestração Docker
├── .env.example                        # Variáveis de ambiente de exemplo
├── .gitignore                          # Arquivos e pastas a serem ignorados pelo Git
└── README.md                           # Este arquivo
```

## 🚀 Como Rodar o Projeto

### Pré-requisitos

*   Docker e Docker Compose instalados.
*   Go (versão 1.22 ou superior) - *Opcional, para desenvolvimento local do backend.*
*   Node.js e npm/yarn - *Opcional, para desenvolvimento local do frontend e TailwindCSS.*

### 1. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto, baseado no `.env.example`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e preencha as variáveis.
**Exemplo de `.env`:**

```env
# Backend Go
SERVER_PORT=8080
JWT_SECRET="sua_chave_secreta_muito_forte_para_jwt_aqui_1234567890"
AES_SECRET_KEY="sua_chave_aes_de_32_bytes_aqui_1234567890123" # 32 bytes para AES-256
SQLITE_DB_PATH=/app/data/prostqs.db # Caminho para o arquivo SQLite dentro do container

# Frontend
FRONTEND_PORT=3000
# Em ambiente WebView, a API será acessada via localhost ou IP do servidor.
# Para teste local em navegador, pode ser http://localhost:8080
API_BASE_URL=http://localhost:8080
```

### 2. Levantar o Projeto com Docker Compose

Na raiz do projeto, execute:

```bash
docker-compose up --build -d
```

Este comando irá:
1.  Construir a imagem Docker do backend Go.
2.  Construir a imagem Docker do frontend (que serve o `index.html` estaticamente).
3.  Iniciar o servidor Go na porta `8080` (ou `SERVER_PORT` configurada).
4.  Iniciar o servidor de frontend na porta `3000` (ou `FRONTEND_PORT` configurada).
5.  O backend criará o arquivo SQLite `prostqs.db` no volume persistente `./backend/data`.

### 3. Acessar o Aplicativo

*   **Frontend (WebView):** Abra seu navegador e acesse `http://localhost:3000`. Você verá a interface do aplicativo.
*   **Backend (API):** A API estará disponível em `http://localhost:8080/api/v1`. Você pode testá-la usando ferramentas como Postman, Insomnia ou `curl`.

### 4. Parar o Projeto

Para derrubar os containers:

```bash
docker-compose down
```

Para remover volumes (e o banco de dados SQLite persistido):

```bash
docker-compose down --volumes
```

## 🧪 Testes

### Backend Go (Unitários e Integração)

Na pasta `backend`, você pode rodar os testes Go:

```bash
cd backend
go test ./... -v
```

### Frontend (Manual/E2E)

Os testes de frontend são principalmente manuais e via E2E em um ambiente WebView real. Para testes de UI:

1.  Abra `http://localhost:3000` em um navegador.
2.  Use as ferramentas de desenvolvedor para inspecionar e testar a responsividade e interatividade.
3.  Simule o ambiente Android WebView no console do navegador (se possível) para testar `window.AndroidInterface`.

## ⚙️ CI/CD (GitHub Actions)

O arquivo `.github/workflows/ci.yml` contém um workflow básico para GitHub Actions. Ele irá:
- Fazer o build e testar o backend Go.
- Fazer o build e lint do frontend.

Este workflow pode ser expandido para incluir deployment automático para ambientes de staging ou produção.

## 🔒 Segurança

O projeto incorpora as seguintes práticas de segurança:
*   **OWASP Top 10:** Atenção aos riscos comuns de segurança.
*   **Hashing de Senhas:** `bcrypt` é usado para armazenar senhas de forma segura.
*   **JWT:** Tokens de acesso são assinados e protegidos por segredo.
*   **AES:** (Conceitual no `utils/crypto.go`) Para dados sensíveis ou tokens de autenticação internos.
*   **Rate Limiting:** Implementado para proteger endpoints contra ataques de força bruta.
*   **Validação de Entrada:** Todas as entradas da API são validadas.
*   **HTTPS/TLS:** Recomendado para implantações em produção (geralmente configurado em um proxy reverso como Nginx ou Caddy).

## 📊 Observabilidade

*   **Logging:** O backend Go usa o logger padrão do Gin, que fornece logs estruturados para requisições e erros.
*   **Health Checks:** `docker-compose` pode ser estendido com health checks para monitorar a saúde dos serviços.

---

## Detalhes da Implementação

### Backend Go (Prost-QS Core)

O backend Go é a espinha dorsal do Prost-QS. Ele gerencia o estado do kernel SQLite, processa comandos, gera eventos e projeta o estado atual.

*   **`main.go`:** Configura o servidor Gin, inicializa a conexão com o SQLite, executa migrações e define as rotas da API.
*   **`pkg/db/sqlite.go`:** Contém a lógica para inicializar a conexão GORM com SQLite e executar as migrações automáticas das tabelas (`User`, `Event`, `Payment`, `AISchemaVersion`, `ReplicationState`).
*   **`internal/auth/`:** Lida com registro, login e renovação de tokens. Usa `bcrypt` para senhas e `jwt-go` para tokens.
*   **`internal/identity/`:** Gerencia perfis de usuário e escopos de aplicação.
*   **`internal/event/`:** O coração do Event Sourcing. Comandos são processados e convertidos em eventos imutáveis, que são persistidos no SQLite. O estado atual é projetado a partir desses eventos.
*   **`internal/payment/`:** Gerencia o ledger de pagamentos como eventos.
*   **`internal/ai/`:** Um módulo simulado para a "IA Arquiteta", que demonstrará a evolução de schemas e a resolução de conflitos. Em uma implementação real, se integraria com o Google Gemini.
*   **`pkg/middleware/auth.go`:** Middleware para proteger rotas com autenticação JWT.
*   **`pkg/middleware/ratelimit.go`:** Middleware simples de rate limiting.
*   **`pkg/utils/jwt.go`:** Funções auxiliares para geração e validação de tokens JWT.
*   **`pkg/utils/crypto.go`:** (Esboçado) Funções para criptografia AES (para tokens internos ou dados sensíveis).

### Frontend (Mobile WebView)

O frontend é uma aplicação web leve e responsiva, projetada para ser carregada dentro de um Android WebView.

*   **`index.html`:** O arquivo principal HTML que define a estrutura da UI, inclui TailwindCSS via CDN e o script `main.js`.
*   **`tailwind.config.js`:** Configura o TailwindCSS com a paleta de cores `system2_cognitive_flow`, tipografia (`Exo 2`, `Roboto`, `Fira Code`) e animações.
*   **`src/styles.css`:** O output do TailwindCSS, gerado automaticamente para incluir apenas os estilos utilizados.
*   **`src/main.js`:** Contém a lógica JavaScript para:
    *   Gerenciar a navegação da UI (usando um roteador simples baseado em hash/estados).
    *   Interagir com a API do backend (via `fetch` ou `axios` - aqui `fetch` é usado por simplicidade).
    *   Manipular as funcionalidades nativas do Android (via o objeto `window.AndroidInterface` simulado).
    *   Implementar feedback visual (loaders, toasts, ripple effects).
    *   Gerenciamento de estado local (`localStorage`).

#### Funcionalidades Nativas Android (Simulação)

Para que o frontend possa ser desenvolvido e testado em um navegador padrão, o `main.js` inclui uma simulação do objeto `window.AndroidInterface`.

```javascript
// Simulação de window.AndroidInterface para desenvolvimento no navegador
if (typeof window.AndroidInterface === 'undefined') {
    window.AndroidInterface = {
        showToast: (message) => console.log(`[Android Toast]: ${message}`),
        vibrate: (duration) => console.log(`[Android Vibrate]: ${duration}ms`),
        shareText: (text) => console.log(`[Android Share]: ${text}`),
    };
}
```

Em um ambiente Android WebView real, este mock seria substituído pela interface JavaScript exposta do seu aplicativo Android nativo.

---
