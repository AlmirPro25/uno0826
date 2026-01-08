# PROST-QS - Arquitetura do Frontend

## Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                        INTERNET                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   FRONTEND      │  │   FRONTEND      │  │   FRONTEND      │
│   (Static)      │  │   (Static)      │  │   (Static)      │
│                 │  │                 │  │                 │
│  admin.prost.io │  │  app.prost.io   │  │  dev.prost.io   │
│  ou             │  │  ou             │  │  ou             │
│  /admin         │  │  /app           │  │  /dev           │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   BACKEND API   │
                    │                 │
                    │ api.prost.io    │
                    │ ou              │
                    │ uno0826.onrender│
                    │ .com            │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   SQLite DB     │
                    │   (Render Disk) │
                    └─────────────────┘
```

## Estrutura Atual do Frontend

```
frontend/
├── index.html              # Landing/Mobile App
├── tailwind.config.js      # Config do Tailwind
│
├── admin/                  # Console Administrativo
│   ├── index.html          # Dashboard principal
│   └── src/
│       └── ...             # Assets
│
├── dev-portal/             # Portal do Desenvolvedor
│   └── index.html          # Criar apps, API keys
│
└── user-app/               # App do Usuário Final
    ├── index.html          # Interface do usuário
    └── src/
        └── ...             # Assets
```

## Opções de Hospedagem (GRATUITAS)

### Opção 1: Render Static Site (RECOMENDADO)
- Mesmo lugar do backend
- Deploy automático do GitHub
- HTTPS gratuito
- Domínio customizado

### Opção 2: GitHub Pages
- Gratuito para sempre
- Deploy via GitHub Actions
- Domínio: usuario.github.io/repo

### Opção 3: Vercel/Netlify
- Gratuito para projetos pessoais
- Deploy automático
- Domínio customizado

## Como Conectar Frontend ao Backend

### 1. Configurar URL da API

Cada HTML precisa saber onde está o backend. Adicione no início do JavaScript:

```javascript
// Configuração da API
const API_BASE_URL = 'https://uno0826.onrender.com';

// Ou para desenvolvimento local:
// const API_BASE_URL = 'http://localhost:8080';
```

### 2. Exemplo de Chamada à API

```javascript
// Login
async function login(username, password) {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    localStorage.setItem('token', data.token);
    return data;
}

// Chamada autenticada
async function fetchWithAuth(endpoint) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    return response.json();
}
```

### 3. Navegação Entre Páginas

```html
<!-- No admin/index.html -->
<nav>
    <a href="/admin/">Dashboard</a>
    <a href="/dev-portal/">Dev Portal</a>
    <a href="/user-app/">User App</a>
</nav>
```

## Deploy no Render (Passo a Passo)

### 1. Criar Static Site no Render

1. Dashboard Render → New → Static Site
2. Conectar ao repositório GitHub
3. Configurar:
   - Name: `prost-qs-frontend`
   - Branch: `main`
   - Root Directory: `frontend`
   - Build Command: (deixar vazio)
   - Publish Directory: `.`

### 2. Configurar Rotas

Criar arquivo `frontend/_redirects`:
```
/admin/*    /admin/index.html    200
/dev/*      /dev-portal/index.html    200
/app/*      /user-app/index.html    200
```

### 3. Configurar CORS no Backend

O backend já está configurado para aceitar requisições do frontend.
Se precisar adicionar novos domínios, edite `main.go`:

```go
AllowOrigins: []string{
    "http://localhost:3000",
    "https://prost-qs-frontend.onrender.com",
    "https://seu-dominio.com",
},
```

## Estrutura de URLs Final

```
https://prost-qs-frontend.onrender.com/           → Landing
https://prost-qs-frontend.onrender.com/admin/     → Console Admin
https://prost-qs-frontend.onrender.com/dev-portal/→ Dev Portal
https://prost-qs-frontend.onrender.com/user-app/  → User App

https://uno0826.onrender.com/api/v1/...           → Backend API
```

## Por Que NÃO Refazer em React?

| Aspecto | HTML Puro | React |
|---------|-----------|-------|
| Complexidade | Baixa | Alta |
| Build | Não precisa | Precisa |
| Hospedagem | Qualquer lugar | Precisa Node |
| Performance | Excelente | Boa |
| Manutenção | Simples | Complexa |
| Dependências | Zero | Muitas |

**Conclusão:** Para um admin panel, HTML puro com Tailwind é a escolha certa.
React faz sentido para apps complexos com muito estado compartilhado.

## Próximos Passos

1. ✅ Backend em produção (uno0826.onrender.com)
2. ⏳ Criar Static Site no Render para frontend
3. ⏳ Configurar URL da API nos HTMLs
4. ⏳ Testar login e navegação
5. ⏳ Configurar domínio customizado (opcional)

## Fluxo de Uso

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Usuário    │────▶│   Frontend   │────▶│   Backend    │
│   (Browser)  │     │   (HTML)     │     │   (Go API)   │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │  1. Acessa URL     │                    │
       │─────────────────▶  │                    │
       │                    │                    │
       │  2. Recebe HTML    │                    │
       │◀─────────────────  │                    │
       │                    │                    │
       │  3. Faz login      │  4. POST /login    │
       │─────────────────▶  │─────────────────▶  │
       │                    │                    │
       │                    │  5. Token JWT      │
       │  6. Salva token    │◀─────────────────  │
       │◀─────────────────  │                    │
       │                    │                    │
       │  7. Usa sistema    │  8. GET /apps      │
       │─────────────────▶  │─────────────────▶  │
       │                    │  (com token)       │
       │                    │                    │
       │  10. Mostra dados  │  9. JSON response  │
       │◀─────────────────  │◀─────────────────  │
       │                    │                    │
```
