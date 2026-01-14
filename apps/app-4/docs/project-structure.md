# Estrutura do Projeto MediSync

A arquitetura do projeto segue o padrão Hexagonal para o backend em Go e a separação de responsabilidades para o frontend em Next.js.

```text
/medisync-platform
├── .gitignore
├── Dockerfile          # Configuração Docker para a aplicação Go
├── docker-compose.yml  # Orquestração de contêineres (Go, Postgres, Redis)
├── README.md           # Documentação principal do projeto
├── go.mod              # Módulos Go
├── go.sum

├── backend             # Backend em Go (Arquitetura Hexagonal)
│   ├── cmd             # Módulo principal (main)
│   │   └── api         # Entrada da aplicação (main.go)
│   │       └── main.go
│   ├── internal        # Lógica de negócio e adaptadores internos
│   │   ├── core        # Domínio da aplicação (regras de negócio)
│   │   │   ├── domain  # Entidades do domínio (User, Appointment, MedicalRecord)
│   │   │   │   ├── user.go
│   │   │   │   ├── appointment.go
│   │   │   │   └── medical_record.go
│   │   │   └── ports   # Interfaces para a camada de adaptadores
│   │   │       ├── services.go     # Interfaces para services (e.g., UserService)
│   │   │       └── repositories.go # Interfaces para persistência (e.g., AppointmentRepository)
│   │   ├── services    # Implementação dos serviços de domínio
│   │   │   ├── user_service.go
│   │   │   ├── appointment_service.go
│   │   │   ├── medical_record_service.go
│   │   │   └── websocket_service.go
│   │   └── adapters    # Adaptadores de infraestrutura (API, Banco de Dados, Cache)
│   │       ├── api         # Implementação da API REST (controladores Gin)
│   │       │   ├── controllers     # Controladores HTTP
│   │       │   │   ├── auth_controller.go
│   │       │   │   ├── user_controller.go
│   │       │   │   ├── appointment_controller.go
│   │       │   │   └── medical_record_controller.go
│   │       │   └── routes.go       # Definição de rotas e middlewares (RBAC)
│   │       └── repository  # Implementação do repositório de dados (GORM/PostgreSQL)
│   │           ├── gorm_repository.go # Implementação genérica de GORM
│   │           ├── user_repository.go
│   │           └── appointment_repository.go
│   ├── pkg             # Pacotes utilitários e compartilhados
│   │   ├── security    # Funções de hash de senha, JWT
│   │   └── utils       # Funções auxiliares
│   └── config          # Configurações de ambiente e variáveis de sistema
│       └── config.go

├── frontend            # Frontend em Next.js (React, Tailwind CSS, Shadcn/UI)
│   ├── public          # Arquivos estáticos
│   ├── src             # Código fonte principal
│   │   ├── styles      # Estilos globais
│   │   │   └── globals.css
│   │   ├── components  # Componentes reutilizáveis
│   │   │   ├── ui      # Componentes Shadcn/UI customizados
│   │   │   └── layouts # Layouts de dashboard
│   │   ├── pages       # Rotas Next.js (Pages Router)
│   │   │   ├── _app.tsx
│   │   │   ├── index.tsx
│   │   │   ├── auth    # Login, Register pages
│   │   │   ├── dashboard # Dashboard principal
│   │   │   ├── appointments # Agendamento
│   │   │   └── records # Prontuários
│   │   ├── services    # Lógica de comunicação com a API (fetch, axios)
│   │   ├── store       # Gerenciamento de estado (e.g., Zustand)
│   │   └── types       # Definições de tipos TypeScript
│   └── tailwind.config.js # Configuração do Tailwind
├── infra               # Arquivos de infraestrutura e deployment
│   ├── docker          # Docker Compose para ambiente local/produção
│   │   └── docker-compose.yml
│   └── scripts         # Scripts de inicialização do banco de dados (migrações)

└── docs                # Documentação do projeto
    ├── architecture.json
    ├── openapi.yaml
    ├── project-structure.md
    └── phase2-instructions.md

└── prisma              # Arquivos de definição do banco de dados (Prisma CLI)
    └── schema.prisma   # Schema de dados (base para GORM)
```
