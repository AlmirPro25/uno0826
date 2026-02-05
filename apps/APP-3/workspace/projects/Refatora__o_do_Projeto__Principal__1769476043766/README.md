
# 🔴 AEROSPHERE OS (Protocol Cydonia)

```
      .
     / \
    | | |    SYSTEM STATUS: OPERATIONAL
   /| | |\   ATMOSPHERE: STABLE
  | | | | |  SHIELDING: 98.4%
   \| | |/
    | | |    "Breathing Life into the Iron Dust"
     \ /
```

## 📜 Manifesto
O **Aerosphere** não é apenas software; é a linha tênue entre a civilização e o vácuo. Projetado para a Era da Expansão Ferrosa (2084), este sistema gerencia a homeostase planetária, telemetria biológica e escudos de radiação das primeiras colônias em Marte.

## 🏗 Arquitetura

### Núcleo (Backend)
- **Engine:** Node.js (Event-Loop Síncrono)
- **Memória:** SQLite3 (Embedded/Edge-ready)
- **ORM:** Prisma (Type-safe Database Access)
- **Segurança:** JWT Rígido, Validação Zod

### Retina (Frontend)
- **Framework:** React + Vite
- **Estilo:** Tailwind CSS (Utilitário-primeiro)
- **Visualização:** Canvas API (Renderização de dados ambientais)
- **Comunicação:** Axios (Neural Link)

## 🚀 Inicialização de Sequência (Setup)

### Pré-requisitos
- Node.js v18+
- Docker & Docker Compose (Recomendado para isolamento de radiação)

### Início Rápido (Dev Mode)
```bash
# 1. Clonar repositório
git clone cydonia/aerosphere.git

# 2. Configurar Variáveis de Ambiente
cp .env.example .env

# 3. Iniciar Reatores (Docker)
docker-compose up --build
```

O sistema estará acessível em:
- **Interface Retinal:** `http://localhost:5173`
- **Neural API:** `http://localhost:3000`

## 🧪 Testes de Integridade
Para verificar se os sensores não estão alucinando:
```bash
# Executar testes E2E (Simulação de Cenários)
npm run test:e2e
```

## ⚠️ Protocolos de Segurança
1. **Falha de Rede:** O Frontend entra em modo de cache agressivo.
2. **Crash do Banco:** O SQLite possui journaling WAL para recuperação instantânea.
3. **Erro Humano:** Modulações críticas exigem confirmação dupla.
