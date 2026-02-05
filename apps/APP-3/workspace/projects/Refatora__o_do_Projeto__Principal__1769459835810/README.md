
# LUXE DIGITAL AUTOMOTIVE

![Status](https://img.shields.io/badge/Status-Production%20Ready-onyx?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Enabled-0055ff?style=for-the-badge)

> "The fusion of elite design and industrial engineering."

Uma plataforma de vendas automotivas de alto padrão, construída com arquitetura monolítica distribuída (Frontend desacoplado), tipagem estrita e orquestração via containers.

## 🏗️ Arquitetura

*   **Frontend:** React (Vite), Tailwind CSS, Zustand, TypeScript.
*   **Backend:** Node.js, Express, SQLite3 (Zero-Config).
*   **DevOps:** Docker Multi-stage, Nginx Reverse Proxy, GitHub Actions.

## 🚀 Quick Start (Dev)

Pré-requisitos: Docker e Docker Compose instalados.

```bash
# 1. Clonar repositório
git clone https://github.com/luxe-digital/core.git

# 2. Inicializar Ambiente
docker-compose up --build
```

Acesse:
*   Frontend: `http://localhost:5173`
*   API: `http://localhost:3000`

## 📦 Estrutura do Projeto

```
/
├── backend/            # Express Server & DB Logic
├── frontend/           # React SPA
├── docker/             # Dockerfiles
├── .github/            # CI/CD Pipelines
└── docker-compose.yml  # Orchestration
```

## 🛡️ Decisões de Engenharia

1.  **SQLite como Data Engine:** Escolhido pela portabilidade extrema e zero latência de rede em arquiteturas de nó único.
2.  **Nginx Proxy:** O container de produção serve os estáticos E faz o proxy reverso para a API, eliminando problemas de CORS em produção.
3.  **Zustand Store:** Gerenciamento de estado atômico para evitar *re-renders* desnecessários em interfaces ricas.
