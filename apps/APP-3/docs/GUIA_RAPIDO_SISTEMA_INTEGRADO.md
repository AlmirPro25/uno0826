# 🚀 GUIA RÁPIDO - SISTEMA INTEGRADO

## Início em 3 Passos

### 1️⃣ Iniciar o Sistema

**Windows:**
```bash
INICIAR_SISTEMA_COMPLETO.bat
```

**Mac/Linux:**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
npm run dev
```

### 2️⃣ Acessar o Sistema

Abra no navegador:
```
http://localhost:5173
```

### 3️⃣ Fazer Login

- **Registre-se** se for a primeira vez
- **Faça login** para obter o token JWT

---

## 🎯 Comandos de Teste

### Teste 1: Listar Arquivos
```
"Liste os arquivos do projeto"
```

**O que acontece:**
- IA detecta intent: `run_command`
- Gera comando: `ls` ou `dir`
- Backend executa
- Retorna lista de arquivos

### Teste 2: Instalar Pacote
```
"Instale o axios"
```

**O que acontece:**
- IA gera comando: `npm install axios`
- Backend executa no workspace
- Retorna saída da instalação

### Teste 3: Criar Projeto React
```
"Crie um projeto React com TypeScript e rode o servidor"
```

**O que acontece:**
1. IA gera arquivos (package.json, index.html, App.tsx)
2. Backend escreve arquivos no workspace
3. Backend executa `npm install`
4. Backend executa `npm run dev`
5. Se der erro, Self-Healing corrige automaticamente

### Teste 4: Fintech Completa (Identidade Soberana)
```
"Forje o Nexus Bank"
```

**O que acontece:**
1. IA ativa Identidade Soberana (Arquiteto-Chefe de Fintechs)
2. Gera backend Go completo com transações atômicas
3. Gera frontend React com aviso BACEN
4. Gera schema PostgreSQL (accounts, transactions, loans)
5. Gera docker-compose.yml
6. Backend escreve TUDO no workspace
7. Backend executa `docker-compose up -d`
8. Se der erro (porta ocupada, etc.), Self-Healing corrige
9. Sistema financeiro completo rodando!

---

## 🏗️ Estrutura do Workspace

Após executar comandos, o workspace terá:

```
workspace/
├── project/              # Projetos gerados
│   ├── package.json
│   ├── index.html
│   ├── src/
│   │   └── App.tsx
│   └── node_modules/
├── nexus-bank/          # Fintech gerada (se usar "Forje o Nexus Bank")
│   ├── backend/
│   │   ├── main.go
│   │   ├── routes/
│   │   ├── services/
│   │   └── repositories/
│   ├── frontend/
│   │   ├── src/
│   │   └── package.json
│   ├── docker-compose.yml
│   └── schema.sql
└── ...
```

---

## 🔒 Segurança

### Comandos Permitidos
✅ npm, node, npx, yarn, pnpm  
✅ docker, docker-compose  
✅ git, go, cargo, python  
✅ ls, dir, mkdir, cat, echo

### Comandos Bloqueados
⛔ rm, del, rmdir  
⛔ sudo, chmod, chown

### Sandbox
Todos os comandos operam dentro de `workspace/`  
Tentativas de sair do diretório são bloqueadas

---

## 🚑 Self-Healing em Ação

### Exemplo: Porta Ocupada

```
Você: "Suba o Docker na porta 3000"

1. IA gera docker-compose.yml (porta 3000)
2. Backend escreve arquivo
3. Backend executa: docker-compose up -d
4. Erro: "port 3000 already in use"
5. Self-Healing detecta erro crítico
6. IA analisa: "Porta ocupada"
7. IA gera solução: Mudar para porta 3001
8. Backend escreve novo docker-compose.yml
9. Backend executa novamente
10. ✅ Sucesso!
11. Notificação: "✅ Erro corrigido automaticamente!"
```

---

## 📊 Monitoramento

### Ver Logs do Backend
Janela "AI Web Weaver - Backend" mostra:
- Requisições HTTP
- Comandos executados
- Erros e avisos

### Ver Logs do Frontend
Janela "AI Web Weaver - Frontend" mostra:
- Build do Vite
- Hot reload
- Erros de compilação

### Ver Histórico de Self-Healing
No frontend, clique no painel flutuante:
```
🟢 Self-Healing Engine
5 tentativas • 80% sucesso
```

---

## 🔧 Troubleshooting

### "Backend Terminal não disponível"
**Solução:** Certifique-se de que o backend está rodando
```bash
cd backend
npm run dev
```

### "401 Unauthorized"
**Solução:** Faça login novamente no frontend

### "Comando não permitido"
**Solução:** Verifique se o comando está na lista de permitidos  
Edite: `backend/src/api/controllers/terminalController.ts`

### "Porta 5000 ou 5173 ocupada"
**Solução:** Mate o processo ou mude a porta
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

---

## 🎯 Casos de Uso Avançados

### 1. Criar API REST Completa
```
"Crie uma API REST com Express, TypeScript e PostgreSQL para gerenciar usuários"
```

### 2. Criar Dashboard Admin
```
"Crie um dashboard administrativo com React, Tailwind e gráficos"
```

### 3. Criar Sistema de Autenticação
```
"Crie um sistema de autenticação completo com JWT, bcrypt e refresh tokens"
```

### 4. Criar Microserviço
```
"Crie um microserviço em Go com Docker, Redis e gRPC"
```

### 5. Criar Game 2D
```
"Crie um jogo de plataforma 2D com HTML5 Canvas e física realista"
```

---

## 📚 Documentação Completa

- `INTEGRACAO_BACKEND_COMPLETA.md` - Arquitetura e API
- `SELF_HEALING_IMPLEMENTADO.md` - Self-Healing Engine
- `SISTEMA_AUTONOMO_COMPLETO.md` - Visão geral
- `TERMINAL_AI_GUIDE.md` - Terminal AI (Local Bridge CLI)

---

## 🎉 Recursos Disponíveis

### ✅ Implementado
- [x] Geração de código (100/100 obrigatório)
- [x] Execução de comandos via backend
- [x] Escrita de arquivos no disco
- [x] Leitura de arquivos
- [x] Listagem de diretórios
- [x] Self-Healing automático
- [x] Detecção de 9 padrões de erro
- [x] Retry automático (até 3x)
- [x] Autenticação JWT
- [x] SAFE HANDS Protocol
- [x] Sandbox de segurança
- [x] Identidade Soberana (Fintech)
- [x] Excellence Engine
- [x] Personas Especializadas
- [x] Monitoramento em tempo real

### 🚧 Próximas Fases
- [ ] Terminal integrado no frontend
- [ ] Visualização de logs em tempo real
- [ ] Gráficos de performance
- [ ] Comandos interativos (vim, nano)
- [ ] Modo "Human-in-the-Loop"

---

## 💡 Dicas

### Maximize a Qualidade
A IA sempre gera código com score 100/100. Se não atingir, ela refina automaticamente.

### Use Personas
Para projetos específicos, mencione a área:
- "Crie um sistema de pagamentos" → Ativa Payment Integrator
- "Crie um sistema seguro" → Ativa Security Architect
- "Crie uma API escalável" → Ativa Scalability Expert

### Aproveite o Self-Healing
Não se preocupe com erros. O sistema detecta e corrige automaticamente.

### Explore a Identidade Fintech
Use "Forje o Nexus Bank" para ver a IA criar um banco digital completo com:
- Transações atômicas
- Integração Mercado Pago
- Aviso regulatório BACEN
- Schema PostgreSQL completo
- Docker Compose orquestrado

---

🚀 **Sistema pronto para uso. Comece a criar!**

**Versão:** 3.0.0  
**Status:** OPERACIONAL  
**Data:** 18/11/2025
