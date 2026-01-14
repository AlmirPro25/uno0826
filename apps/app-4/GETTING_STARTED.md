# MediSync - Guia de Início Rápido

## 🚀 Iniciando o Sistema

### Pré-requisitos
- Node.js 18+
- Go 1.23+
- npm ou yarn

### 1. Instalar Dependências

#### Backend
```bash
cd backend
go mod tidy
```

#### Frontend
```bash
cd frontend
npm install
```

### 2. Executar o Sistema

#### Opção 1: Script PowerShell (Windows)
```bash
.\start-local.ps1
```

#### Opção 2: Manualmente

**Terminal 1 - Backend:**
```bash
cd backend
go run cmd/api/main.go
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 3. Acessar a Aplicação

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080

## 👤 Usuários de Teste

### Admin
- Email: `admin@medisync.com`
- Senha: `password123`
- Acesso: Gerenciamento de usuários

### Médico
- Email: `medico@medisync.com`
- Senha: `password123`
- Acesso: Agenda, sala de espera, prontuários

### Paciente
- Email: `paciente@medisync.com`
- Senha: `password123`
- Acesso: Agendamento, histórico médico

## 📋 Funcionalidades Principais

### Para Pacientes
1. **Agendar Consulta** - Selecione médico, data e hora
2. **Meus Agendamentos** - Visualize e gerencie suas consultas
3. **Histórico Médico** - Acesse prontuários e diagnósticos
4. **Minhas Receitas** - Visualize receitas digitais, baixe PDF
5. **Meus Atestados** - Visualize atestados médicos, baixe PDF
6. **Pagamentos** - Gerencie pagamentos de consultas
7. **Videochamada** - Participe de teleconsultas

### Para Médicos
1. **Minha Agenda** - Visualize consultas agendadas
2. **Sala de Espera** - Veja pacientes em tempo real (WebSocket)
3. **Receitas** - Crie receitas digitais com múltiplos medicamentos
4. **Atestados** - Emita atestados (comparecimento, afastamento, aptidão)
5. **Estatísticas** - Dashboard com métricas de desempenho
6. **Videochamada** - Realize teleconsultas
7. **Prontuário** - Crie prontuários criptografados

### Para Administradores
1. **Gerenciar Usuários** - CRUD completo de usuários
2. **Estatísticas** - Dashboard com visão geral do sistema
3. **Relatórios** - Consultas por status, gráficos semanais

## 🔧 Configuração

### Variáveis de Ambiente

#### Backend (backend/.env ou variáveis do sistema)
```bash
# Servidor
PORT=8080

# Banco de Dados
USE_SQLITE=true
SQLITE_FILE=medisync.db

# Segurança
JWT_SECRET=dev-secret-key
ENCRYPTION_KEY=12345678901234561234567890123456

# Email (opcional - deixe vazio para desabilitar)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-de-app
SMTP_FROM=noreply@medisync.com

# Pagamentos (opcional - deixe vazio para modo simulação)
STRIPE_SECRET_KEY=sk_test_...
CONSULT_PRICE_CENTS=15000
```

#### Frontend (frontend/.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 📁 Estrutura do Projeto

```
medisync-platform/
├── backend/                 # API Go com Gin
│   ├── cmd/api/            # Ponto de entrada
│   ├── config/             # Configuração
│   ├── internal/
│   │   ├── adapters/       # Adaptadores (API, Repositórios)
│   │   ├── core/           # Domínio e Portas
│   │   └── services/       # Lógica de negócio
│   └── pkg/                # Pacotes compartilhados
├── frontend/               # App Next.js
│   ├── src/
│   │   ├── api/           # Serviços de API
│   │   ├── components/    # Componentes React
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Páginas Next.js
│   │   ├── styles/        # Estilos globais
│   │   └── types/         # Tipos TypeScript
│   └── public/            # Arquivos estáticos
├── prisma/                # Schema do banco (referência)
├── docs/                  # Documentação
└── docker-compose.yml     # Configuração Docker
```

## 🗄️ Banco de Dados

### SQLite (Desenvolvimento)
- Arquivo: `medisync.db`
- Criado automaticamente na primeira execução
- Dados de teste inseridos automaticamente

### Tabelas
- `roles`: Papéis de usuário
- `users`: Usuários do sistema
- `appointments`: Agendamentos
- `medical_records`: Prontuários
- `prescriptions`: Receitas digitais
- `medical_certificates`: Atestados médicos
- `payments`: Pagamentos
- `notifications`: Notificações
- `chat_messages`: Mensagens do chat
- `waiting_lists`: Fila de espera

## 🔐 Segurança

- **JWT**: Autenticação com tokens JWT
- **Criptografia**: Dados sensíveis criptografados com AES
- **CORS**: Configurado para desenvolvimento
- **Validação**: Validação de entrada em todas as rotas

## 🐛 Troubleshooting

### Porta 8080 já em uso
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :8080
kill -9 <PID>
```

### Erro de conexão com banco de dados
- Verifique se `medisync.db` existe
- Delete o arquivo e reinicie (será recriado)
- Verifique permissões de escrita na pasta

### Frontend não conecta ao backend
- Verifique se backend está rodando em http://localhost:8080
- Verifique `NEXT_PUBLIC_API_URL` em `.env.local`
- Verifique CORS no backend

### Erro de módulo não encontrado
```bash
# Frontend
npm install

# Backend
go mod tidy
```

## 📚 Documentação

- **OpenAPI**: `docs/openapi.yaml`
- **Arquitetura**: `docs/architecture.json`
- **Estrutura**: `docs/project-structure.md`

## 🚀 Deploy

### Docker
```bash
docker-compose up
```

### Produção
1. Build frontend: `npm run build`
2. Build backend: `go build -o medisync cmd/api/main.go`
3. Configure variáveis de ambiente
4. Execute em servidor

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique a documentação em `docs/`
2. Consulte os logs do backend e frontend
3. Verifique as variáveis de ambiente

## ✅ Checklist de Verificação

- [ ] Backend rodando em http://localhost:8080
- [ ] Frontend rodando em http://localhost:3000
- [ ] Banco de dados criado (medisync.db)
- [ ] Consegue fazer login com usuário de teste
- [ ] Dashboard carrega corretamente
- [ ] Pode agendar consulta
- [ ] Pode visualizar histórico médico
- [ ] Sala de espera conecta via WebSocket
- [ ] Pode criar receitas digitais (médico)
- [ ] Pode emitir atestados (médico)
- [ ] Pode baixar PDF de receitas/atestados
- [ ] Estatísticas carregam corretamente
- [ ] Chat funciona em tempo real

## 🎉 Pronto!

Seu sistema MediSync está pronto para uso. Acesse http://localhost:3000 e comece a explorar!
