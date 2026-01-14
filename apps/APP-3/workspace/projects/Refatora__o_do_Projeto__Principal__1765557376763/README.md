
# 🚀 TaskFlow: Aplicativo de Gerenciamento de Tarefas

Este é um aplicativo fullstack moderno para gerenciamento de tarefas, construído com uma arquitetura de alta performance. O backend utiliza **Go (Gin Framework)** para velocidade e eficiência, enquanto o frontend é desenvolvido em **React** com **TypeScript** e **Tailwind CSS** para uma experiência de usuário fluida e responsiva.

## 🌟 Stack Tecnológica

*   **Backend:** Go (Gin Framework)
*   **Frontend:** React com TypeScript e Vite
*   **Banco de Dados:** PostgreSQL (via Docker)
*   **ORM:** Gorm
*   **Containerização:** Docker e Docker Compose

## 📦 Estrutura do Projeto

```text
taskflow/
├── backend/                  # Servidor Go de alta performance
│   ├── cmd/
│   │   └── api/
│   │       └── main.go       # Lógica principal do servidor (rotas, DB)
│   ├── go.mod                # Dependências do Go
│   ├── Dockerfile            # Configuração Docker para o backend
│   └── .env.example          # Variáveis de ambiente
├── frontend/                 # Aplicação React
│   ├── src/
│   │   ├── components/       # Componentes React reutilizáveis (formulários, itens de lista)
│   │   ├── pages/            # Telas da aplicação (Dashboard, Login/Registro)
│   │   ├── services/         # Cliente API para comunicação com o backend
│   │   ├── App.tsx           # Configuração de rotas e estado global
│   │   └── main.tsx          # Ponto de entrada do React
│   ├── public/               # Assets estáticos
│   ├── package.json          # Dependências do frontend
│   ├── vite.config.ts        # Configuração do Vite/React
│   ├── postcss.config.js     # Configuração do Tailwind CSS
│   └── tailwind.config.js    # Configuração do Tailwind CSS
├── docker-compose.yml        # Orquestração de containers
└── README.md
```

## 🚀 Como Executar o Aplicativo

Siga estes passos para ter o TaskFlow rodando em sua máquina local.

1.  **Pré-requisitos:** Certifique-se de ter o Docker e o Docker Compose instalados.

2.  **Configuração do Banco de Dados:**
    *   Crie uma cópia do arquivo de exemplo de ambiente no diretório `backend`:
        ```bash
        cp backend/.env.example backend/.env
        ```
    *   Edite o arquivo `backend/.env` e configure suas credenciais do PostgreSQL.

3.  **Execução com Docker Compose:**
    *   No diretório raiz do projeto (`taskflow/`), execute o seguinte comando:
        ```bash
        docker-compose up --build
        ```
    *   Este comando fará o download da imagem do PostgreSQL, construirá a imagem do backend Go, construirá a imagem do frontend React e iniciará todos os serviços.

4.  **Acessar a Aplicação:**
    *   Após a inicialização, o frontend React estará acessível em: `http://localhost:3000`
    *   O backend Go estará rodando na porta `8080`.

## ⚙️ Funcionalidades Implementadas

*   **Autenticação JWT:** Sistema de registro e login de usuários com proteção de rotas.
*   **CRUD de Tarefas:** Crie, visualize, atualize (marcar como concluída) e exclua tarefas.
*   **Persistência de Dados:** As tarefas são salvas no banco de dados PostgreSQL.
*   **Interface Responsiva:** A interface se adapta a dispositivos móveis e desktops.

## 🎨 Design System e Acessibilidade

O design segue os princípios do Manifesto do Artesão Digital.

*   **Estilo Adaptativo:** Usa Tailwind CSS para layout responsivo (mobile-first) e cores coesas.
*   **Acessibilidade (ARIA):** Elementos interativos como botões e links possuem atributos `aria-label` e `role` para garantir a navegação por leitores de tela e a usabilidade para todos os usuários.
*   **Performance:** A arquitetura modular e o pipeline de build otimizado do Vite garantem carregamento rápido e transições fluidas.

---

<script type="text/plain" data-path="docker-compose.yml">
version: '3.8'

services:
  # Serviço de banco de dados PostgreSQL
  db:
    image: postgres:14-alpine
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password}
      POSTGRES_DB: ${POSTGRES_DB:-taskdb}
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

  # Serviço do backend em Go (Gin Framework)
  backend:
    build: ./backend
    restart: always
    ports:
      - "8080:8080"
    depends_on:
      - db
    env_file:
      - ./backend/.env
    environment:
      DATABASE_URL: postgres://${POSTGRES_USER:-user}:${POSTGRES_PASSWORD:-password}@db:5432/${POSTGRES_DB:-taskdb}?sslmode=disable
      JWT_SECRET: ${JWT_SECRET:-supersecretkey}

  # Serviço do frontend em React (Vite)
  frontend:
    build: ./frontend
    restart: always
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      VITE_API_BASE_URL: http://backend:8080

volumes:
  postgres-data:
