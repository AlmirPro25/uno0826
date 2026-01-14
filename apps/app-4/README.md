# 🏥 MediSync Health Platform

<div align="center">

![MediSync Logo](https://img.shields.io/badge/MediSync-Health%20Platform-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIyIDEyaC00bC0zIDlMOSAzbC0zIDloLTQiLz48L3N2Zz4=)

**Plataforma completa de saúde digital com IA**

[![Go](https://img.shields.io/badge/Go-1.23-00ADD8?style=flat-square&logo=go)](https://golang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.0-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)

[Demo](#demo) • [Features](#-features) • [Instalação](#-instalação) • [Documentação](#-documentação) • [Licença](#-licença)

</div>

---

## 🎯 O que é o MediSync?

MediSync é uma **plataforma de saúde digital completa** que integra telemedicina, triagem inteligente por IA, sistema de filas, acompanhamento fitness e muito mais. Projetado para clínicas e redes de saúde que querem oferecer uma experiência moderna e eficiente.

```
┌─────────────────────────────────────────────────────────────────┐
│                    MEDISYNC HEALTH PLATFORM                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   🎤 TRIAGEM      🩺 CONSULTA     🎫 FILA       🏋️ FITNESS     │
│   INTELIGENTE     VIRTUAL        DIGITAL       & NOVA          │
│   (MediCore)      (NeuroClinic)  (QR Code)     (AI Coach)      │
│                                                                 │
│                    ┌─────────────────┐                          │
│                    │ HEALTH          │                          │
│                    │ INTELLIGENCE    │                          │
│                    │ CORE            │                          │
│                    └─────────────────┘                          │
│                                                                 │
│   📊 MATCH        📋 PRONTUÁRIO    💊 RECEITAS   📹 TELE       │
│   INTELIGENTE     ELETRÔNICO       DIGITAIS      MEDICINA      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## ✨ Features

### 🤖 Inteligência Artificial
- **MediCore Live** - Triagem por voz com Gemini 2.0
- **NeuroClinic AI** - Médico virtual para pré-consulta
- **Match Inteligente** - Conecta paciente ao médico ideal automaticamente
- **NOVA Personal Trainer** - Coach fitness com análise de alimentos por foto

### 🏥 Gestão Clínica
- **Multi-Clínica** - Gerencie múltiplas unidades
- **Fila Digital** - QR Code, TV display, notificações em tempo real
- **Agendamento Inteligente** - Horários disponíveis, bloqueios, recorrência
- **Prontuário Eletrônico** - Criptografado (AES-256)

### 💊 Atendimento
- **Telemedicina** - Videochamada integrada (Jitsi)
- **Receitas Digitais** - PDF com QR Code de validação
- **Atestados Médicos** - Comparecimento, afastamento, aptidão
- **Chat em Tempo Real** - WebSocket

### 📊 Health Intelligence Core
- **Perfil de Saúde Completo** - Medicamentos, vacinas, exames, alergias
- **Tracking Diário** - Sono, água, passos, humor
- **Metas e Conquistas** - Gamificação para engajamento
- **Integração Fitness** - Dados do NOVA alimentam o prontuário

## 🛠️ Tech Stack

| Camada | Tecnologia |
|--------|------------|
| **Backend** | Go 1.23, Gin, GORM, WebSocket |
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Zustand |
| **Database** | PostgreSQL (prod) / SQLite (dev) |
| **AI** | Google Gemini 2.0 (voz, visão, texto) |
| **Real-time** | WebSocket (Gorilla) |
| **Segurança** | JWT, AES-256, LGPD compliant |

## 🚀 Instalação

### Pré-requisitos
- Go 1.23+
- Node.js 18+
- PostgreSQL (opcional, usa SQLite por padrão)

### Quick Start

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/medisync-platform.git
cd medisync-platform

# Backend
cd backend
cp .env.example .env
go run cmd/api/main.go

# Frontend (novo terminal)
cd frontend
npm install
npm run dev
```

Acesse: http://localhost:3000

### Usuários de Teste

| Role | Email | Senha |
|------|-------|-------|
| Admin | admin@medisync.com | password123 |
| Médico | dr.costa@medisync.com | password123 |
| Paciente | joao.silva@email.com | password123 |

## 📁 Estrutura do Projeto

```
medisync-platform/
├── backend/                 # API Go (Arquitetura Hexagonal)
│   ├── cmd/api/            # Entry point
│   ├── internal/
│   │   ├── adapters/       # Controllers, Repositories
│   │   ├── core/           # Domain, Ports
│   │   └── services/       # Business Logic
│   └── pkg/                # Utilities
│
├── frontend/               # Next.js 14
│   ├── src/
│   │   ├── api/           # API clients
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   └── pages/         # Routes
│   └── public/
│
└── docs/                   # Documentação
```

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [SISTEMA_COMPLETO.md](SISTEMA_COMPLETO.md) | Visão geral de todas as features |
| [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) | Guia de instalação detalhado |
| [DEPLOY.md](DEPLOY.md) | Deploy em produção |
| [docs/QUEUE_SYSTEM_GUIDE.md](docs/QUEUE_SYSTEM_GUIDE.md) | Sistema de Fila Digital |
| [docs/NOVA_INTEGRATION.md](docs/NOVA_INTEGRATION.md) | Integração Fitness |
| [docs/openapi.yaml](docs/openapi.yaml) | API Reference (Swagger) |

## 🎯 Roadmap

- [x] Triagem por voz com IA
- [x] Sistema de fila digital
- [x] Match inteligente paciente-médico
- [x] Integração fitness (NOVA)
- [x] Health Intelligence Core
- [ ] App mobile (React Native)
- [ ] Integração com wearables
- [ ] WhatsApp Business API
- [ ] Marketplace de especialistas

## 💰 Modelo de Negócio

| Plano | Preço/mês | Inclui |
|-------|-----------|--------|
| Starter | R$ 500 | 1 clínica, 5 médicos |
| Pro | R$ 1.000 | 3 clínicas, 15 médicos, IA |
| Enterprise | Sob consulta | Ilimitado, white-label |

## ⚠️ Licença Proprietária

**Este software NÃO é open source.**

Este projeto está protegido por direitos autorais e licença proprietária. 
Veja o arquivo [LICENSE](LICENSE) para detalhes completos.

### Proibido sem autorização:
- ❌ Copiar ou reproduzir o código
- ❌ Criar obras derivadas
- ❌ Distribuir ou compartilhar
- ❌ Uso comercial
- ❌ Engenharia reversa

### Para licenciamento comercial:
📧 Entre em contato para discutir parcerias e licenciamento.

## 👨‍💻 Autor

Desenvolvido com ❤️ para revolucionar a saúde digital no Brasil.

---

## 🏢 Comparação com Concorrentes

| Feature | MediSync | Doctoralia | iClinic | Dr. Consulta |
|---------|----------|------------|---------|--------------|
| Triagem por Voz IA | ✅ | ❌ | ❌ | ❌ |
| Match Automático | ✅ | ❌ | ❌ | ❌ |
| Personal Trainer IA | ✅ | ❌ | ❌ | ❌ |
| Fila Digital | ✅ | ❌ | ✅ | ✅ |
| Multi-Clínica | ✅ | ✅ | ✅ | ✅ |
| Health Intelligence | ✅ | ❌ | ❌ | ❌ |

**MediSync é a única plataforma que integra IA de voz, fitness e saúde em um só lugar.**

---

<div align="center">

**[⬆ Voltar ao topo](#-medisync-health-platform)**

</div>
