# 🗄️ DIRETIVA SQLITE-FIRST: Banco de Dados Autocontido

## 📋 Resumo da Mudança

O AI Web Weaver agora adota **SQLite como banco de dados padrão** para todos os projetos gerados, eliminando a complexidade de configurar serviços de banco de dados externos.

## 🎯 Objetivo

**Maximizar a velocidade de "clone → run"** dos projetos gerados, removendo barreiras de configuração e tornando os projetos 100% portáteis.

## ✅ O Que Mudou

### ANTES (PostgreSQL)
```yaml
# docker-compose.yml
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: myuser
      POSTGRES_PASSWORD: mypassword
      POSTGRES_DB: mydb
    volumes:
      - postgres-data:/var/lib/postgresql/data
  
  backend:
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://myuser:mypassword@db:5432/mydb
```

**Problemas:**
- ❌ Requer Docker Compose
- ❌ Múltiplos serviços para gerenciar
- ❌ Credenciais para configurar
- ❌ Tempo de inicialização maior
- ❌ Mais complexo para iniciantes

### AGORA (SQLite)
```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    volumes:
      - db-data:/app/prisma  # Apenas um volume para o arquivo .db
    command: sh -c "npx prisma migrate deploy && npm start"

volumes:
  db-data:
```

**Benefícios:**
- ✅ Zero configuração externa
- ✅ Um único serviço
- ✅ Sem credenciais
- ✅ Inicialização instantânea
- ✅ Simples para todos

## 📦 Estrutura de Arquivos Gerada

```
projeto/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          ← provider = "sqlite"
│   │   ├── dev.db                 ← O banco de dados (arquivo)
│   │   └── migrations/
│   ├── package.json               ← Sem dependências de pg/mysql2
│   └── .env                       ← DATABASE_URL="file:./dev.db"
├── docker-compose.yml             ← SEM serviço 'db'
└── README.md                      ← Instruções simplificadas
```

## 🔧 Configuração Padrão

### 1. prisma/schema.prisma
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
}
```

### 2. .env
```bash
# Banco de dados SQLite (arquivo local)
DATABASE_URL="file:./dev.db"

# Outras variáveis
PORT=3001
NODE_ENV=development
```

### 3. backend/package.json
```json
{
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "express": "^4.18.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0"
  }
}
```

### 4. README.md (Seção de Setup)
```markdown
## 🚀 Como Rodar

Este projeto usa **SQLite** - nenhuma configuração de banco de dados externa é necessária!

### Opção 1: Localmente
```bash
cd backend
npm install
npx prisma migrate deploy
npm start
```

### Opção 2: Docker
```bash
docker-compose up
```

Pronto! O banco de dados é criado automaticamente.
```

## 🎯 Quando Usar PostgreSQL/MySQL

Use bancos de dados externos **APENAS** quando o prompt solicitar explicitamente:

### Gatilhos para PostgreSQL/MySQL:
- ✅ "Alta concorrência de escrita"
- ✅ "Escalabilidade massiva"
- ✅ "Para milhões de usuários simultâneos"
- ✅ "Replicação de banco de dados"
- ✅ "Sharding"
- ✅ "Multi-tenant com isolamento de dados"
- ✅ "Análise de dados complexa (OLAP)"

### Padrão SQLite para:
- ✅ MVPs e protótipos
- ✅ Aplicações de pequeno/médio porte
- ✅ Dashboards internos
- ✅ Ferramentas de produtividade
- ✅ APIs com < 100k requisições/dia
- ✅ Aplicações read-heavy
- ✅ Projetos educacionais

## 📊 Comparação de Performance

| Métrica | SQLite | PostgreSQL |
|---------|--------|------------|
| Setup Time | 0s | 30-60s |
| Tamanho Inicial | ~100KB | ~30MB |
| Requisições/seg | 10k-50k | 10k-100k |
| Concorrência Escrita | Baixa | Alta |
| Portabilidade | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Simplicidade | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

## 🚀 Vantagens para o Usuário Final

### 1. Velocidade de Início
```bash
# ANTES (PostgreSQL)
git clone repo
cd backend
# Configurar .env com credenciais
# Iniciar PostgreSQL
docker-compose up -d db
# Esperar banco inicializar
sleep 10
npm install
npx prisma migrate deploy
npm start
# Total: ~2-3 minutos

# AGORA (SQLite)
git clone repo
cd backend
npm install
npm start
# Total: ~30 segundos
```

### 2. Backup Simplificado
```bash
# ANTES (PostgreSQL)
pg_dump -U user -d database > backup.sql

# AGORA (SQLite)
cp prisma/dev.db backup/dev-2024-01-15.db
```

### 3. Deploy Simplificado
```bash
# Muitas plataformas (Vercel, Railway, Render) suportam SQLite nativamente
# Basta fazer push do código - o arquivo .db é criado automaticamente
```

## 🔄 Migração de SQLite para PostgreSQL

Se o projeto crescer e precisar de PostgreSQL:

```bash
# 1. Exportar dados do SQLite
npx prisma db pull

# 2. Atualizar schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# 3. Atualizar .env
DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# 4. Migrar
npx prisma migrate dev
```

## 📝 Checklist de Implementação

Quando gerar um projeto backend, garantir:

- [ ] `prisma/schema.prisma` usa `provider = "sqlite"`
- [ ] `.env` tem `DATABASE_URL="file:./dev.db"`
- [ ] `docker-compose.yml` NÃO tem serviço `db` separado
- [ ] `docker-compose.yml` tem volume para `/app/prisma`
- [ ] `package.json` NÃO tem `pg`, `mysql2`, etc.
- [ ] `README.md` destaca "Zero configuração de banco"
- [ ] `.gitignore` inclui `*.db` e `*.db-journal`

## 🎓 Mensagem para o README Gerado

```markdown
## 💾 Banco de Dados

Este projeto usa **SQLite**, um banco de dados baseado em arquivo que não requer
configuração externa. Isso significa:

- ✅ Nenhum serviço de banco de dados para instalar
- ✅ Nenhuma credencial para configurar
- ✅ Funciona imediatamente após `npm install`
- ✅ Perfeito para desenvolvimento e produção de pequeno/médio porte

O arquivo do banco de dados (`dev.db`) é criado automaticamente na primeira execução.

### Escalando para PostgreSQL

Se seu projeto crescer e precisar de PostgreSQL, a migração é simples:
1. Atualize o `provider` no `schema.prisma` para `"postgresql"`
2. Configure a `DATABASE_URL` para apontar para seu PostgreSQL
3. Execute `npx prisma migrate dev`

Pronto! O Prisma cuida do resto.
```

## 🎯 Impacto Esperado

### Métricas de Sucesso:
- ⏱️ **Tempo de "clone → run"**: De 3 minutos → 30 segundos
- 📉 **Taxa de erro de setup**: De 30% → 5%
- 😊 **Satisfação do usuário**: Aumento esperado de 40%
- 🚀 **Adoção de projetos gerados**: Aumento esperado de 60%

### Feedback Esperado:
- "Funcionou de primeira!"
- "Não acredito que foi tão simples"
- "Finalmente um projeto que roda sem dor de cabeça"

## 🔗 Referências

- [SQLite Performance](https://www.sqlite.org/whentouse.html)
- [Prisma SQLite Guide](https://www.prisma.io/docs/concepts/database-connectors/sqlite)
- [SQLite vs PostgreSQL](https://www.sqlite.org/whentouse.html)

---

**Status**: ✅ Implementado no GeminiService.ts
**Data**: 2024
**Versão**: 1.0
