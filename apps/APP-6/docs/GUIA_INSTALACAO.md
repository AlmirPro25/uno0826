# 📦 Guia de Instalação - Prox AI Studio

Guia completo para instalar e configurar o Prox AI Studio.

---

## 📋 Pré-requisitos

### Software Necessário

- **Node.js** 18.0.0 ou superior
  - [Download Node.js](https://nodejs.org/)
  - Verificar versão: `node --version`

- **npm** 9.0.0 ou superior (vem com Node.js)
  - Verificar versão: `npm --version`

- **Git** (opcional, para clonar o repositório)
  - [Download Git](https://git-scm.com/)

### Chave API do Google Gemini

1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

---

## 🚀 Instalação Rápida (Windows)

### Opção 1: Script Automático

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/prox-ai-studio.git
cd prox-ai-studio

# 2. Execute o instalador
instalar-e-iniciar.bat
```

O script vai:
- ✅ Instalar dependências do frontend
- ✅ Instalar dependências do backend
- ✅ Instalar Playwright
- ✅ Configurar variáveis de ambiente
- ✅ Iniciar o sistema

---

## 📝 Instalação Manual

### Passo 1: Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/prox-ai-studio.git
cd prox-ai-studio
```

### Passo 2: Instalar Dependências do Frontend

```bash
npm install
```

### Passo 3: Instalar Dependências do Backend

```bash
cd backend
npm install
cd ..
```

### Passo 4: Instalar Playwright

```bash
cd backend
npx playwright install
cd ..
```

### Passo 5: Configurar Variáveis de Ambiente

#### Backend (.env)

Crie o arquivo `backend/.env`:

```env
# API Key do Google Gemini
GEMINI_API_KEY=sua_chave_aqui

# Porta do backend
PORT=3002

# URL do frontend
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)

Crie o arquivo `.env` na raiz:

```env
# API Key do Google Gemini
VITE_GEMINI_API_KEY=sua_chave_aqui
```

### Passo 6: Iniciar o Sistema

#### Opção A: Script Automático (Windows)
```bash
INICIAR.bat
```

#### Opção B: Manual

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Passo 7: Acessar o Sistema

Abra o navegador em:
```
http://localhost:3000
```

---

## 🐧 Instalação no Linux/Mac

### Passo 1: Clonar e Instalar

```bash
# Clone
git clone https://github.com/seu-usuario/prox-ai-studio.git
cd prox-ai-studio

# Instale frontend
npm install

# Instale backend
cd backend
npm install
npx playwright install
cd ..
```

### Passo 2: Configurar Variáveis

```bash
# Backend
cat > backend/.env << EOF
GEMINI_API_KEY=sua_chave_aqui
PORT=3002
FRONTEND_URL=http://localhost:3000
EOF

# Frontend
cat > .env << EOF
VITE_GEMINI_API_KEY=sua_chave_aqui
EOF
```

### Passo 3: Iniciar

```bash
# Terminal 1
cd backend && npm start

# Terminal 2 (nova aba)
npm run dev
```

---

## 🔧 Verificação da Instalação

### 1. Verificar Backend

```bash
curl http://localhost:3002/health
```

**Resposta esperada:**
```json
{"status":"ok"}
```

### 2. Verificar Frontend

Abra `http://localhost:3000` no navegador.

Você deve ver a interface do chat.

### 3. Testar Busca Visual

Digite no chat:
```
Busque informações sobre Python
```

Se funcionar, a instalação está completa! ✅

---

## 🐛 Problemas Comuns

### Erro: "Cannot find module"

**Solução:**
```bash
# Reinstalar dependências
rm -rf node_modules
npm install

cd backend
rm -rf node_modules
npm install
```

### Erro: "Port 3002 already in use"

**Solução:**
```bash
# Windows
netstat -ano | findstr :3002
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3002 | xargs kill -9
```

### Erro: "Playwright not installed"

**Solução:**
```bash
cd backend
npx playwright install
```

### Erro: "API key not valid"

**Solução:**
1. Verifique se a chave está correta
2. Verifique se está no arquivo `.env` correto
3. Reinicie o backend

---

## 📊 Estrutura de Pastas Após Instalação

```
prox-ai-studio/
├── node_modules/          # Dependências frontend
├── backend/
│   ├── node_modules/      # Dependências backend
│   ├── .env              # ✅ Configuração backend
│   └── ...
├── .env                  # ✅ Configuração frontend
├── package.json
└── ...
```

---

## 🔄 Atualização

### Atualizar para Nova Versão

```bash
# 1. Baixar atualizações
git pull origin main

# 2. Atualizar dependências
npm install
cd backend
npm install
cd ..

# 3. Reiniciar sistema
INICIAR.bat
```

---

## 🗑️ Desinstalação

```bash
# 1. Parar processos
# Feche os terminais ou Ctrl+C

# 2. Remover pasta
cd ..
rm -rf prox-ai-studio

# 3. Limpar cache (opcional)
npm cache clean --force
```

---

## 📞 Suporte

Problemas na instalação?

- 📧 Email: suporte@exemplo.com
- 🐛 [Reportar Problema](https://github.com/seu-usuario/prox-ai-studio/issues)
- 💬 [Discussões](https://github.com/seu-usuario/prox-ai-studio/discussions)

---

## ✅ Checklist de Instalação

- [ ] Node.js 18+ instalado
- [ ] Repositório clonado
- [ ] Dependências frontend instaladas
- [ ] Dependências backend instaladas
- [ ] Playwright instalado
- [ ] Arquivo `.env` do backend criado
- [ ] Arquivo `.env` do frontend criado
- [ ] Chave API do Gemini configurada
- [ ] Backend iniciado (porta 3002)
- [ ] Frontend iniciado (porta 3000)
- [ ] Sistema acessível no navegador
- [ ] Teste de busca funcionando

---

**Instalação concluída com sucesso!** 🎉

[⬆ Voltar ao topo](#-guia-de-instalação---prox-ai-studio)
