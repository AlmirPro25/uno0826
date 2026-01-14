# 🚀 Como Colocar no GitHub - Guia Rápido

## ⚡ Método Rápido (Recomendado)

### Windows:
```cmd
setup-github.bat
```

### Linux/Mac:
```bash
chmod +x setup-github.sh
./setup-github.sh
```

O script faz tudo automaticamente! ✨

---

## 📝 Método Manual (Passo a Passo)

### 1️⃣ Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Nome: `ai-web-weaver`
3. Descrição: `Sistema avançado de geração de código com IA e Excellence Core`
4. Público ou Privado (sua escolha)
5. **NÃO** marque "Add README" (já temos)
6. Clique em **"Create repository"**

### 2️⃣ No Terminal (na pasta do projeto)

```bash
# Inicializar Git
git init

# Adicionar arquivos
git add .

# Primeiro commit
git commit -m "feat: initial commit - AI Web Weaver com Excellence Core"

# Conectar com GitHub (substitua SEU-USUARIO)
git remote add origin https://github.com/SEU-USUARIO/ai-web-weaver.git

# Renomear branch para main
git branch -M main

# Enviar para GitHub
git push -u origin main
```

### 3️⃣ Pronto! 🎉

Acesse: `https://github.com/SEU-USUARIO/ai-web-weaver`

---

## ⚠️ IMPORTANTE: Segurança

### Antes de fazer push, VERIFIQUE:

```bash
# Ver o que será enviado
git status

# Verificar se .env está ignorado
cat .gitignore | grep .env

# Procurar API keys (não deve encontrar nada)
git grep -i "AIza"
```

### ❌ Se encontrar API key:

```bash
# NÃO FAÇA PUSH!

# Remover do Git
git rm --cached arquivo-com-key.js

# Adicionar ao .gitignore
echo "arquivo-com-key.js" >> .gitignore

# Novo commit
git commit -m "fix: remove sensitive files"

# IMPORTANTE: Trocar a API key no Google Cloud Console
```

---

## 🎨 Melhorar o Repositório

### Adicionar Topics

No GitHub, clique em ⚙️ ao lado de "About" e adicione:
- `artificial-intelligence`
- `gemini`
- `code-generation`
- `typescript`
- `react`
- `tailwindcss`

### Adicionar Descrição

```
Sistema avançado de geração de código com IA e Excellence Core - Cria aplicações web completas com qualidade garantida
```

### Criar Release

```bash
# Criar tag
git tag -a v1.0.0 -m "Release v1.0.0"

# Enviar tag
git push origin v1.0.0
```

No GitHub:
1. Vá em **Releases**
2. **"Create a new release"**
3. Tag: `v1.0.0`
4. Título: `v1.0.0 - Excellence Core`
5. Descrição: (veja exemplo no GUIA_GITHUB.md)
6. **"Publish release"**

---

## 🔄 Uso Diário

### Fazer mudanças:

```bash
# Ver status
git status

# Adicionar mudanças
git add .

# Commit
git commit -m "feat: adiciona nova funcionalidade"

# Enviar
git push
```

### Puxar mudanças:

```bash
git pull
```

---

## 🆘 Problemas Comuns

### "Permission denied"
```bash
# Configurar credenciais
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"

# Usar token de acesso pessoal
# GitHub → Settings → Developer settings → Personal access tokens
```

### "Remote already exists"
```bash
# Ver remotes
git remote -v

# Atualizar URL
git remote set-url origin https://github.com/SEU-USUARIO/ai-web-weaver.git
```

### "Failed to push"
```bash
# Puxar mudanças primeiro
git pull origin main --rebase

# Tentar push novamente
git push
```

---

## 📚 Recursos

- [Git Docs](https://git-scm.com/doc)
- [GitHub Docs](https://docs.github.com)
- [GUIA_GITHUB.md](./GUIA_GITHUB.md) - Guia completo
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Como contribuir

---

## ✅ Checklist Rápido

Antes de tornar público:

- [ ] README.md completo
- [ ] .gitignore configurado
- [ ] Sem API keys no código
- [ ] .env.example criado
- [ ] LICENSE adicionada
- [ ] Build funciona (`npm run build`)
- [ ] Código testado

---

## 🎉 Pronto para Compartilhar!

Depois de no GitHub:

1. ⭐ Pedir stars de amigos
2. 📢 Compartilhar no Twitter/LinkedIn
3. 📝 Escrever artigo no Dev.to
4. 💬 Postar em comunidades (Reddit, Discord)

---

**Dúvidas?** Veja o [GUIA_GITHUB.md](./GUIA_GITHUB.md) completo!

**Boa sorte!** 🚀
