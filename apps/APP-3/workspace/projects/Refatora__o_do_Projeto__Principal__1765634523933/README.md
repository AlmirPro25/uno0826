
# Landing Page Aurora - Arquiteto de Software Autônomo

Esta é a landing page oficial do Aurora, desenvolvida com Next.js 15 (App Router), Tailwind CSS e Framer Motion. O objetivo principal é capturar e-mails para uma lista de espera exclusiva, posicionando o Aurora como uma ferramenta superior de arquitetura de software para engenheiros sêniores e empresas.

**Esta versão foi aprimorada de um protótipo para um aplicativo completo e funcional, com persistência real de dados em um banco de dados SQLite usando Prisma.**

## 🚀 Stack Tecnológica

*   **Framework:** Next.js 15 (App Router)
*   **Linguagem:** TypeScript
*   **Estilo:** Tailwind CSS (com tema Dark Mode e gradientes Neon)
*   **Animações:** Framer Motion
*   **Ícones:** Lucide React
*   **Banco de Dados:** SQLite (com Prisma ORM)
*   **Infraestrutura:** Docker e Docker Compose

## 💡 Recursos de Destaque

*   **Design Futurista:** Tema "Aurora Borealis" com fundo escuro, gradientes de neon (roxo, ciano, verde) e efeitos de glassmorphism.
*   **Animações Sofisticadas:** Utiliza Framer Motion para animações de entrada de componentes, scroll reveal e microinterações no CTA (Call to Action).
*   **Terminal Interativo:** Simulação de um terminal com animação de digitação que demonstra a funcionalidade do Aurora em tempo real.
*   **Waitlist Funcional (Real):** O formulário de e-mail agora salva os dados em um banco de dados SQLite através de um Next.js API Route handler robusto e validado com Zod.
*   **SEO Otimizado:** Metatags completas para SEO e compartilhamento social (OpenGraph, Twitter Cards).

## 🛠️ Como Executar o Projeto com Docker (Recomendado)

Siga os passos abaixo para rodar a aplicação em seu ambiente local usando Docker Compose.

### 1. Pré-requisitos

Certifique-se de ter o Docker e o Docker Compose instalados em seu sistema.

### 2. Configuração do Banco de Dados

Crie o arquivo `.env` baseado no `.env.example`:

\`\`\`bash
cp .env.example .env
\`\`\`

Gere o esquema do banco de dados e as migrações:

\`\`\`bash
npx prisma migrate dev --name init
\`\`\`

### 3. Execução do Servidor de Desenvolvimento

Inicie o contêiner do Docker Compose:

\`\`\`bash
docker-compose up --build
\`\`\`

### 4. Visualização no Navegador

Abra seu navegador e acesse: `http://localhost:3000`

A landing page estará pronta para visualização e teste com persistência de dados.

## 📂 Estrutura de Pastas

\`\`\`
aurora-landing-page/
├── app/
│   ├── api/
│   │   └── waitlist/
│   │       └── join/
│   │           └── route.ts  # Next.js API Route para a lista de espera (persistência de dados real)
│   └── page.tsx            # Componente principal da Landing Page
├── prisma/
│   └── schema.prisma       # Configuração do banco de dados Prisma
├── public/                 # Assets (imagens, favicon, etc.)
├── tailwind.config.ts      # Configuração do Tailwind CSS
├── postcss.config.js       # Configuração do PostCSS
├── package.json            # Dependências e scripts
├── tsconfig.json           # Configuração do TypeScript
├── Dockerfile              # Imagem Docker para o Next.js
├── docker-compose.yml      # Orquestração de contêineres
└── README.md
\`\`\`

## 📝 Próximos Passos (Evolução do Projeto)

Para levar este projeto para um nível enterprise:

1.  **Integração de CRM:** Conectar a API de waitlist com um serviço de e-mail marketing (por exemplo, Mailchimp, SendGrid ou Brevo) para notificar a equipe sobre novos leads e iniciar a automação de e-mails de acompanhamento.
2.  **Mudar Banco de Dados:** Migrar de SQLite para PostgreSQL ou MongoDB Atlas para um ambiente de produção escalável.
3.  **Deploy:** Publicar o projeto em um serviço de hospedagem como Vercel ou Netlify, que são otimizados para Next.js.
