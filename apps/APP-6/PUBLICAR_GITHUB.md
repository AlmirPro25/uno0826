# 🚀 Guia de Publicação no GitHub

Passo a passo para publicar o Prox AI Studio no GitHub.

---

## 📋 Pré-requisitos

- [ ] Git instalado
- [ ] Conta no GitHub
- [ ] Código limpo e testado
- [ ] Documentação completa

---

## 🔧 Preparação

### 1. Limpar Arquivos Sensíveis

```bash
# Remover arquivos .env (se existirem)
rm .env
rm backend/.env

# Verificar se .gitignore está correto
cat .gitignore
```

### 2. Verificar Estrutura

```bash
# Listar arquivos que serão enviados
git status
```

**Arquivos que NÃO devem ser enviados:**
- ❌ `.env`
- ❌ `backend/.env`
- ❌ `node_modules/`
- ❌ Chaves API
- ❌ Dados sensíveis

**Arquivos que DEVEM ser enviados:**
- ✅ `.env.example`
- ✅ `backend/.env.example`
- ✅ `README.md`
- ✅ `docs/`
- ✅ Código fonte

---

## 🚀 Publicação

### Passo 1: Inicializar Git (se ainda não foi)

```bash
git init
```

### Passo 2: Adicionar Arquivos

```bash
# Adicionar todos os arquivos (exceto os do .gitignore)
git add .

# Verificar o que será commitado
git status
```

### Passo 3: Fazer Commit

```bash
git commit -m "🎉 Initial commit: Prox AI Studio com Busca Visual Inteligente"
```

### Passo 4: Criar Repositório no GitHub

1. Acesse [GitHub](https://github.com)
2. Clique em "New repository"
3. Configure:
   - **Nome:** `prox-ai-studio`
   - **Descrição:** `Assistente de IA com Busca Visual Inteligente e Navegação Autônoma`
   - **Visibilidade:** Public ou Private
   - **NÃO** marque "Initialize with README" (já temos)
4. Clique em "Create repository"

### Passo 5: Conectar ao GitHub

```bash
# Adicionar remote (substitua SEU_USUARIO pelo seu usuário do GitHub)
git remote add origin https://github.com/SEU_USUARIO/prox-ai-studio.git

# Verificar
git remote -v
```

### Passo 6: Enviar Código

```bash
# Enviar para o GitHub
git push -u origin main

# Se der erro de branch, tente:
git branch -M main
git push -u origin main
```

---

## ✅ Verificação

Após o push, verifique no GitHub:

- [ ] README.md aparece na página inicial
- [ ] Documentação está na pasta `docs/`
- [ ] Código fonte está completo
- [ ] `.env` NÃO está no repositório
- [ ] `.env.example` ESTÁ no repositório

---

## 🎨 Personalização do Repositório

### 1. Adicionar Topics

No GitHub, vá em "About" → "Settings" e adicione:
- `ai`
- `gemini`
- `chatbot`
- `visual-search`
- `playwright`
- `react`
- `typescript`
- `nodejs`

### 2. Adicionar Descrição

```
🤖 Assistente de IA com Busca Visual Inteligente - Navega em sites reais, captura screenshots e analisa com Gemini Vision
```

### 3. Adicionar Website

```
https://seu-usuario.github.io/prox-ai-studio
```

---

## 📝 Atualizações Futuras

### Fazer Mudanças

```bash
# 1. Fazer alterações no código

# 2. Adicionar mudanças
git add .

# 3. Commit
git commit -m "✨ Adiciona nova funcionalidade X"

# 4. Push
git push
```

### Tipos de Commit

Use emojis para commits mais claros:

- `🎉` - Initial commit
- `✨` - Nova funcionalidade
- `🐛` - Correção de bug
- `📚` - Documentação
- `🎨` - Melhorias de UI
- `⚡` - Performance
- `🔧` - Configuração
- `🚀` - Deploy

---

## 🌟 Tornar o Projeto Público

### 1. Criar GitHub Pages (opcional)

```bash
# Criar branch gh-pages
git checkout -b gh-pages

# Build do projeto
npm run build

# Commit e push
git add dist/
git commit -m "🚀 Deploy to GitHub Pages"
git push origin gh-pages
```

### 2. Configurar GitHub Pages

1. Vá em Settings → Pages
2. Source: `gh-pages` branch
3. Salvar

### 3. Adicionar Badge no README

```markdown
[![GitHub Pages](https://img.shields.io/badge/demo-online-success)](https://seu-usuario.github.io/prox-ai-studio)
```

---

## 📊 Estatísticas

Adicione badges ao README.md:

```markdown
![GitHub stars](https://img.shields.io/github/stars/seu-usuario/prox-ai-studio)
![GitHub forks](https://img.shields.io/github/forks/seu-usuario/prox-ai-studio)
![GitHub issues](https://img.shields.io/github/issues/seu-usuario/prox-ai-studio)
![GitHub license](https://img.shields.io/github/license/seu-usuario/prox-ai-studio)
```

---

## 🤝 Contribuições

### Configurar Issues

1. Vá em Settings → Features
2. Habilite "Issues"
3. Crie templates de issue

### Configurar Pull Requests

1. Crie arquivo `.github/PULL_REQUEST_TEMPLATE.md`
2. Defina regras de contribuição

---

## 🔒 Segurança

### Verificar Secrets

```bash
# Verificar se não há secrets no código
git log --all --full-history --source -- **/.env
```

### GitHub Secrets

Para CI/CD, adicione secrets em:
Settings → Secrets and variables → Actions

---

## 📞 Suporte

Problemas ao publicar?

- 📧 Email: suporte@exemplo.com
- 💬 [GitHub Discussions](https://github.com/seu-usuario/prox-ai-studio/discussions)

---

## ✅ Checklist Final

- [ ] Git inicializado
- [ ] .gitignore configurado
- [ ] Arquivos sensíveis removidos
- [ ] Commit feito
- [ ] Repositório criado no GitHub
- [ ] Remote adicionado
- [ ] Push realizado
- [ ] README aparece no GitHub
- [ ] Documentação acessível
- [ ] Topics adicionados
- [ ] Descrição configurada
- [ ] License adicionada

---

**Projeto publicado com sucesso!** 🎉

Compartilhe: `https://github.com/SEU_USUARIO/prox-ai-studio`

---

[⬆ Voltar ao topo](#-guia-de-publicação-no-github)
