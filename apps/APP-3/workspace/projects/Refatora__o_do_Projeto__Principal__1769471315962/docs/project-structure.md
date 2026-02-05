
# TITAN LOGISTICS // ESTRUTURA DE COMANDO

A estrutura de arquivos foi projetada para portabilidade máxima sem sacrificar a separação de interesses lógica dentro do código.

```text
/titan-logistics
│
├── docs/                       # Documentação Arquitetural e Contratos
│   ├── architecture.json
│   ├── openapi.yaml
│   ├── phase2-instructions.md
│   └── project-structure.md
│
├── prisma/                     # Camada de Persistência
│   ├── schema.prisma           # Fonte da Verdade do Banco de Dados
│   └── migrations/             # (Gerado auto) Histórico de mudanças
│
├── public/                     # Ativos Estáticos (se necessário, ou via CDN)
│
├── index.html                  # O FRONTEND (Titanium Interface)
│                               # Contém: HTML, Tailwind config, JS Controller, Leaflet Logic
│
├── server.js                   # O BACKEND (Node.js Monolith)
│                               # Contém: Express App, Socket.IO, Prisma Client, Simulation Loop
│
├── package.json                # Manifesto de Dependências
├── Dockerfile                  # Containerização de Elite
└── .env                        # Segredos de Configuração
```

## Nota do Arquiteto
A simplicidade desta estrutura é enganosa. Toda a complexidade reside na orquestração interna de `server.js` e na reatividade de `index.html`. Não adicione pastas desnecessárias. Mantenha a superfície de ataque mínima.
