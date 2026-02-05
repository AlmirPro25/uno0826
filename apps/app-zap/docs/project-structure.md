
# Estrutura do Projeto - GhostProtocol

```
ghost-protocol/
├── docs/
│   ├── architecture.json      # Blueprint do Sistema
│   ├── openapi.yaml           # Contrato da API
│   ├── phase2-instructions.md # Instruções para o Backend Dev
│   └── project-structure.md   # Este arquivo
├── prisma/
│   ├── schema.prisma          # Banco de dados SQLite
│   └── dev.db                 # (Gerado automaticamente)
├── public/                    # Frontend (Dashboard)
│   ├── index.html             # Single Page App
│   ├── css/
│   │   └── style.css          # Tailwind Output / Custom
│   └── js/
│       ├── app.js             # Lógica principal do Dashboard
│       └── socket-client.js   # Manipulação de WebSockets
├── src/
│   ├── config/
│   │   └── env.js             # Variáveis de ambiente
│   ├── core/
│   │   ├── whatsapp.js        # Wrapper do whatsapp-web.js
│   │   ├── gemini.js          # Integração com AI
│   │   └── rhythm.js          # Engine de Delay e "Esquecimento"
│   ├── database/
│   │   └── repository.js      # Acesso ao Prisma
│   ├── events/
│   │   └── bus.js             # Event Emitter central
│   ├── routes/
│   │   └── api.js             # Rotas Express (baseado no OpenAPI)
│   └── server.js              # Entrypoint (Express + Socket.io)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```
