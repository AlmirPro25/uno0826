
# 👻 GHOST PROTOCOL
### Arquiteto de Engajamento Invisível

> "A distinção entre humano e máquina é apenas uma questão de timing."

O **Ghost Protocol** não é um chatbot. É um **Exoesqueleto de Presença Digital**. Um sistema de engenharia social automatizada projetado para mimetizar o comportamento humano no WhatsApp com fidelidade extrema, permitindo intervenção humana granular (Míssil Teleguiado).

![Status](https://img.shields.io/badge/Status-Operational-green)
![Docker](https://img.shields.io/badge/Container-Docker-blue)
![Brain](https://img.shields.io/badge/AI-Gemini-purple)

## 🧠 Arquitetura

O sistema opera em três camadas:

1.  **Kernel (Backend Node.js)**:
    - Gerencia `whatsapp-web.js` (Chrome Headless).
    - Simula latência humana, digitação e erros.
    - Persistência via SQLite + Prisma.
2.  **Cortex (AI Layer)**:
    - Integração com Gemini API para análise semântica.
    - Define o "Perfil Psicológico" do alvo.
3.  **Command Center (Frontend React)**:
    - Dashboard em tempo real (WebSockets).
    - Controle de intervenção ("Pausar AI", "Enviar Diretiva").

## 🚀 Como Iniciar (Dev)

```bash
# 1. Subir a infraestrutura
docker-compose up -d

# 2. Acessar o Centro de Comando
# Abra http://localhost:8080

# 3. Escanear o QR Code
# O sistema iniciará a sincronização da memória.
```

## 🧪 Estrutura de Pastas

```
ghost-protocol/
├── backend/            # O Cérebro (Node.js + Prisma)
├── frontend/           # O Rosto (React + Tailwind)
├── shared/             # A Verdade (Tipos compartilhados)
├── docker/             # Configurações de Container
├── data/               # Persistência (SQLite)
└── tests/              # Testes E2E (Playwright)
```

## ⚖️ Manifesto Ético

Esta ferramenta foi construída para **gerenciamento de relacionamento**, não para spam.
1. O sistema prioriza a **qualidade** da interação sobre a quantidade.
2. O uso de delays e imperfeições é mandatório para preservar a humanidade.
3. A intervenção humana é soberana.
