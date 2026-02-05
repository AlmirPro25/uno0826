
# AEGIS-VII DEPLOYMENT STRUCTURE

A arquitetura foi condensada para máxima portabilidade tática, agora com robustez empresarial.

## 📂 ROOT
├── 📄 package.json    # (THE MANIFEST) Dependências do backend
├── 📄 server.js       # (THE CORE) Node.js Server + Prisma ORM Logic
├── 📁 prisma/         # Definição do esquema do banco de dados (Prisma)
├── 📁 frontend/       # (THE VIEW) Frontend Tático HUD (React/Vite)
│   ├── 📄 index.html
│   ├── 📄 package.json
│   ├── 📄 vite.config.ts
│   └── 📁 src/         # Código fonte da aplicação React
│       ├── 📁 components/
│       │   └── 📁 auth/    # Login/Register UI
│       ├── 📁 services/
│       ├── 📁 stores/
│       ├── 📁 hooks/
│       └── ...
└── 📁 shared/         # Tipos TypeScript compartilhados entre frontend e backend

## 🛠️ DEPENDÊNCIAS DE BACKEND (Reforçadas)
- `express`: Roteamento de comandos.
- `@prisma/client`: ORM para PostgreSQL.
- `prisma`: Ferramenta CLI para migrações e geração de cliente.
- `cors`: Protocolo de permissão de acesso.
- `body-parser`: Decodificação de payload.
- `uuid`: Geração de IDs únicos para entidades.
- `jsonwebtoken`: Autenticação via JSON Web Tokens.
- `bcryptjs`: Hash de senhas para segurança.
- `express-validator`: Validação de entrada para endpoints da API.

## 🎨 ATIVOS DE FRONTEND (CDN / Bundled)
- React (Componentização)
- React Router DOM (Gerenciamento de rotas)
- Zustand (Gerenciamento de Estado)
- Tailwind CSS v3.0 (Estilização Utilitária)
- Lucide React (Ícones de Interface)
- Google Fonts (Share Tech Mono) - Estética Terminal
- Axios (Cliente HTTP com interceptors)
- **NOVO:** Assets de Áudio (sons para feedback de UI/eventos)
