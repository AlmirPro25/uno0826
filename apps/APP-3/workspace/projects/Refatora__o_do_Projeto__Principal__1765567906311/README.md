
# AETHER - Mercado de Futuros da Terra

## 🚀 Visão Geral do Projeto

O AETHER é um mercado financeiro de ativos regenerativos de próxima geração, com foco em tokenização de recursos naturais. Este MVP (Mínimo Produto Viável) apresenta o dashboard do investidor, implementado com uma arquitetura full-stack moderna e de alto desempenho.

**Stack Tecnológico:**
*   **Frontend:** React (usando Tremor.so para visualização de dados) e Tailwind CSS para a estética Glassmorphism. O frontend agora inclui um fluxo de autenticação real (Login/Registro) e lida com chamadas API protegidas.
*   **Backend:** Go (Golang) com o framework Fiber, seguindo uma arquitetura limpa (Hexagonal) para performance e escalabilidade. O backend agora implementa a lógica de transações de compra e busca dados reais (persistidos no banco) em vez de dados simulados.
*   **Banco de Dados:** PostgreSQL para integridade de dados.
*   **Orquestração:** Docker Compose.

## 📦 Estrutura do Projeto

\`\`\`
aether-market/
├── backend/                  # Código do servidor Go
│   ├── cmd/api/main.go       # Ponto de entrada do servidor e seed de dados
│   ├── internal/             # Lógica de negócio e handlers
│   │   ├── handlers/         # Funções para rotas HTTP (auth, dashboard, market, portfolio)
│   │   ├── models/           # Estruturas de dados (GORM models)
│   │   └── database/         # Conexão e migração do banco de dados
│   ├── Dockerfile            # Configuração Docker para o Go backend
│   └── .env.example          # Variáveis de ambiente
├── frontend/                 # Código do frontend (React)
├── docker-compose.yml        # Orquestração de serviços Docker
└── README.md                 # Documentação do projeto
\`\`\`

## 🛠️ Como Executar o Aplicativo

Siga estas instruções para subir o aplicativo completo com Docker Compose.

**Pré-requisitos:**
*   Docker e Docker Compose instalados em sua máquina.

### Passo 1: Configurar Variáveis de Ambiente

Crie um arquivo \`.env\` na pasta \`backend\` e preencha com as variáveis do arquivo \`.env.example\`.

\`\`\`bash
cd backend
cp .env.example .env
\`\`\`

**Conteúdo de .env:**
\`\`\`ini
PORT=8080
JWT_SECRET=aether-super-secret-key-for-jwt
DATABASE_URL=postgres://user:password@db:5432/aether_db?sslmode=disable
\`\`\`

### Passo 2: Inicializar o Backend e o Banco de Dados

Suba os contêineres do backend (Go) e do banco de dados (PostgreSQL) com um único comando. O banco de dados será populado automaticamente com dados iniciais (seed) na primeira execução.

\`\`\`bash
docker-compose up --build
\`\`\`

### Passo 3: Acessar a Aplicação

1.  **Backend API:** A API do Go estará rodando em \`http://localhost:8080\`.
    *   Para testar, você pode usar ferramentas como cURL ou Postman.
    *   Endpoints de exemplo: \`http://localhost:8080/api/v1/dashboard/kpis\` (requer autenticação JWT).

2.  **Frontend Dashboard:** O frontend React (contido no arquivo \`index.html\` e implementado com CDNs) pode ser visualizado diretamente no navegador.
    *   Abra o arquivo \`index.html\` no seu navegador (ex: \`file:///caminho/para/o/projeto/index.html\` ou use uma extensão de "Live Server").
    *   O frontend tentará se conectar à API Go rodando em \`http://localhost:8080\`.

## ⚙️ Testando as Funcionalidades

**1. Fluxo de Autenticação Completo:**

*   **Registro (Frontend):** Clique em "Registre-se" no frontend. Preencha o email e senha. O backend criará o usuário no PostgreSQL com um saldo inicial de $10.000 (configurado no código).
*   **Login (Frontend):** Use as credenciais recém-criadas para fazer login. O frontend armazenará o token JWT e redirecionará para o dashboard.

**2. Transação de Compra (Frontend/Backend):**

*   **Marketplace:** Navegue até a seção "Mercado". Você verá uma lista de projetos disponíveis (buscados no banco de dados).
*   **Comprar Ativo:** Clique no botão "Comprar" de um projeto. O frontend enviará uma requisição POST para o backend.
*   **Lógica Real:** O backend (\`market.go\`) verificará o saldo do usuário, calculará o custo total, atualizará o saldo do usuário e registrará a transação no banco de dados.

**3. Visualização do Portfólio (Frontend/Backend):**

*   **Minha Carteira:** Navegue para "Minha Carteira". O frontend fará uma chamada API para \`/portfolio/assets\` e exibirá os ativos que você comprou, o valor atual e o retorno total (calculado dinamicamente no backend).

**4. Teste do Glassmorphism e Responsividade:**

*   Redimensione a janela do navegador para ver como o layout se adapta (responsividade mobile-first).
*   Observe os efeitos de blur e transparência nos cartões e na barra lateral.

## 📈 Próximos Passos (Evolução do Projeto)

*   **Real-time:** Integrar WebSockets para atualizações de preço em tempo real no dashboard e notificações.
*   **Pagamentos:** Integrar Stripe para processamento de pagamentos reais.
*   **UX/UI:** Implementar um modal de compra com validação de quantidade e confirmação de transação.
*   **Acessibilidade:** Implementar feedback tátil e sonoro para as interações.
