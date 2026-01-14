# MediSync Frontend

Frontend da plataforma MediSync de telemedicina, construído com Next.js, React e Tailwind CSS.

## Estrutura do Projeto

```
frontend/
├── src/
│   ├── api/              # Serviços de API (axios)
│   ├── components/       # Componentes React reutilizáveis
│   │   └── ui/          # Componentes UI (shadcn/ui)
│   ├── hooks/           # Custom hooks (Zustand stores)
│   ├── lib/             # Utilitários
│   ├── pages/           # Páginas Next.js
│   │   ├── auth/        # Páginas de autenticação
│   │   ├── admin/       # Páginas de administrador
│   │   ├── medico/      # Páginas de médico
│   │   ├── paciente/    # Páginas de paciente
│   │   └── dashboard/   # Dashboard principal
│   ├── styles/          # Estilos globais
│   └── types/           # Tipos TypeScript
└── public/              # Arquivos estáticos
```

## Funcionalidades

### Autenticação
- Login com email e senha
- Registro de novos pacientes
- Persistência de token JWT
- Redirecionamento baseado em papel (role)

### Dashboard
- Dashboard personalizado por papel (Admin, Médico, Paciente)
- Navegação intuitiva com sidebar
- Suporte a mobile com menu responsivo

### Paciente
- Agendar consultas com médicos
- Visualizar histórico médico
- Gerenciar agendamentos

### Médico
- Visualizar agenda de consultas
- Gerenciar sala de espera em tempo real (WebSocket)
- Cancelar consultas

### Administrador
- Gerenciar usuários do sistema
- Criar novos usuários
- Filtrar por papel

## Tecnologias

- **Next.js 14**: Framework React com SSR
- **React 18**: Biblioteca UI
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Estilização
- **Shadcn/UI**: Componentes UI
- **Zustand**: Gerenciamento de estado
- **React Hook Form**: Gerenciamento de formulários
- **Axios**: Cliente HTTP
- **Framer Motion**: Animações
- **Lucide React**: Ícones

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

Acesse http://localhost:3000

## Build

```bash
npm run build
npm start
```

## Variáveis de Ambiente

Crie um arquivo `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Autenticação

### Usuários de Teste

- **Admin**: admin@medisync.com / password123
- **Médico**: medico@medisync.com / password123
- **Paciente**: paciente@medisync.com / password123

## Componentes UI

Componentes shadcn/ui customizados:
- Button
- Card
- Input
- Label
- Alert
- Dialog
- Sheet

## Hooks Customizados

- `useAuthStore`: Gerenciamento de autenticação com Zustand

## Serviços de API

- `authAPI`: Login e registro
- `appointmentsAPI`: Agendamentos
- `medicalRecordsAPI`: Prontuários
- `usersAPI`: Gerenciamento de usuários

## WebSocket

Conexão em tempo real para sala de espera:
- Endpoint: `ws://localhost:8080/ws/waiting-room`
- Notificações de pacientes aguardando
