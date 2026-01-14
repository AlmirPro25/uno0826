# 🎯 Guia de Uso - Sistema Integrado

## 🚀 Como Usar o Sistema Completo

### 1️⃣ Gerar Código com IA

**No Chat:**
```
Você: "Crie um dashboard de vendas com gráficos"

IA: [Gera código HTML, CSS e JavaScript]
```

**O que acontece:**
- ✅ Código aparece no editor
- ✅ Arquivos são criados automaticamente
- ✅ Após 2 segundos, projeto é salvo no HD

---

### 2️⃣ Salvar Projeto Manualmente

**Clique no botão:**
```
[💾 Salvar Projeto]
```

**Resultado:**
```
✅ Projeto salvo em: C:\Users\seu-usuario\aiweaver\projects\abc123\
```

**Arquivos salvos:**
```
C:\Users\seu-usuario\aiweaver\projects\abc123\
├── index.html
├── styles.css
└── script.js
```

---

### 3️⃣ Instalar como App

**Clique no botão:**
```
[📦 Instalar como App]
```

**O que acontece:**
1. Se projeto não foi salvo, salva automaticamente
2. Copia arquivos para pasta de apps
3. Registra no banco de dados
4. Retorna ID do app

**Resultado:**
```
✅ App instalado! ID: xyz789
```

---

### 4️⃣ Iniciar o App

**No Terminal Integrado:**
```bash
$ aiweaver start xyz789
```

**Resultado:**
```
🚀 Servidor iniciado em http://localhost:3000
🌐 Abrindo navegador...
```

---

### 5️⃣ Abrir Pasta do Projeto

**Clique no botão:**
```
[📁 Abrir Pasta]
```

**Resultado:**
- Windows Explorer abre na pasta do projeto
- Você pode editar arquivos diretamente
- Mudanças sincronizam automaticamente

---

## 🎨 Interface do Chat

### Desktop

```
┌─────────────┬──────────────────────┬─────────────┐
│  Conversas  │   Editor de Código   │    Chat     │
│     +       │  ┌─────────────────┐  │  Messages   │
│  Arquivos   │  │                 │  │             │
│  Projeto    │  │   Monaco Editor │  │  [IA gera   │
│             │  │                 │  │   código]   │
│             │  ├─────────────────┤  │             │
│             │  │   Terminal CLI  │  │  ┌────────┐ │
│             │  │   $ aiweaver    │  │  │💾 Save │ │
│             │  │                 │  │  │📦 App  │ │
│             │  └─────────────────┘  │  │📁 Open │ │
│             │                       │  └────────┘ │
│             │                       │  [Input]    │
└─────────────┴──────────────────────┴─────────────┘
```

### Mobile

```
┌───────────────────────────────┐
│  Conversas | Arquivos         │
├───────────────────────────────┤
│                               │
│     Editor de Código          │
│                               │
├───────────────────────────────┤
│                               │
│     Chat Messages             │
│                               │
├───────────────────────────────┤
│ [💾] [📦] [📁]                │
│ [Digite mensagem...] [Enviar] │
└───────────────────────────────┘
```

---

## 🔄 Fluxos de Trabalho

### Fluxo 1: Criar Projeto do Zero

```
1. Abra o Chat
2. Digite: "Crie um site de portfólio"
3. IA gera o código
4. Aguarde 2 segundos (auto-save)
5. Clique em [📦 Instalar]
6. No terminal: aiweaver start [ID]
7. Navegador abre automaticamente
```

**Tempo total:** ~30 segundos

---

### Fluxo 2: Editar Projeto Existente

```
1. Abra o Chat
2. Digite: "Adicione um formulário de contato"
3. IA modifica o código
4. Mudanças são salvas automaticamente
5. Clique em [📦 Instalar] para atualizar
6. Recarregue o navegador
```

**Tempo total:** ~15 segundos

---

### Fluxo 3: Editar no VS Code

```
1. Clique em [📁 Abrir Pasta]
2. Windows Explorer abre
3. Clique com botão direito → "Abrir com Code"
4. Edite no VS Code
5. Salve (Ctrl+S)
6. Mudanças sincronizam automaticamente
```

---

### Fluxo 4: Deploy para Produção

```
1. Clique em [📁 Abrir Pasta]
2. No terminal da pasta:
   $ git init
   $ git add .
   $ git commit -m "Initial commit"
   $ vercel deploy
3. Vercel retorna URL
4. Compartilhe o link!
```

---

## 💡 Dicas e Truques

### Auto-Save
- **Ativa automaticamente** após 2 segundos
- **Só salva uma vez** (não salva repetidamente)
- **Desabilitado** se você já salvou manualmente

### Botões Inteligentes
- **Salvar:** Muda para "Atualizar" após primeira vez
- **Instalar:** Salva automaticamente se necessário
- **Abrir Pasta:** Só ativa após salvar

### Terminal Integrado
- **Comandos disponíveis:**
  - `aiweaver list` - Lista apps instalados
  - `aiweaver start [ID]` - Inicia app
  - `aiweaver stop [ID]` - Para app
  - `aiweaver remove [ID]` - Remove app

### Atalhos de Teclado
- **Enviar mensagem:** Enter
- **Nova linha:** Shift+Enter
- **Salvar código:** Ctrl+S (no editor)

---

## 🐛 Solução de Problemas

### Projeto não salva
**Problema:** Botão "Salvar" não funciona

**Solução:**
1. Verifique se backend está rodando
2. Execute: `.\cli\backend-simple.ps1`
3. Tente salvar novamente

---

### App não instala
**Problema:** Erro ao instalar como app

**Solução:**
1. Verifique se projeto foi salvo
2. Verifique se backend está rodando
3. Veja logs no terminal

---

### Explorador não abre
**Problema:** Botão "Abrir Pasta" não funciona

**Solução:**
1. Salve o projeto primeiro
2. Verifique permissões do Windows
3. Tente abrir manualmente a pasta

---

## 📚 Comandos Úteis

### Backend
```powershell
# Iniciar backend
cd cli
.\backend-simple.ps1

# Verificar status
curl http://localhost:5000/api/health
```

### CLI
```bash
# Listar apps
aiweaver list

# Iniciar app
aiweaver start [ID]

# Parar app
aiweaver stop [ID]

# Remover app
aiweaver remove [ID]

# Ver ajuda
aiweaver --help
```

### Git
```bash
# Inicializar repositório
git init

# Adicionar arquivos
git add .

# Commit
git commit -m "Mensagem"

# Push para GitHub
git remote add origin [URL]
git push -u origin main
```

---

## 🎯 Casos de Uso

### 1. Prototipagem Rápida
```
Tempo: 2 minutos
Passos: 3

1. "Crie um landing page para produto X"
2. [Aguardar código]
3. [Instalar e visualizar]
```

### 2. Desenvolvimento Iterativo
```
Tempo: 5-10 minutos
Passos: Múltiplos

1. "Crie um dashboard"
2. "Adicione gráfico de vendas"
3. "Mude cores para azul"
4. "Adicione filtro por data"
```

### 3. Aprendizado
```
Tempo: Variável
Passos: Exploratórios

1. "Como fazer um carousel?"
2. [Ver código gerado]
3. [Abrir no VS Code]
4. [Estudar implementação]
```

---

## 🚀 Próximas Features

### Em Desenvolvimento
- [ ] Sincronização bidirecional
- [ ] Git integration automático
- [ ] Deploy com um clique
- [ ] Colaboração em tempo real

### Planejado
- [ ] Templates prontos
- [ ] Marketplace de componentes
- [ ] Testes automatizados
- [ ] CI/CD integrado

---

## 📞 Suporte

### Documentação
- `docs/INTEGRACAO_COMPLETA.md` - Arquitetura
- `cli/COMMANDS.md` - Referência de comandos
- `cli/TEST_GUIDE.md` - Guia de testes

### Comunidade
- GitHub Issues
- Discord (em breve)
- Email: suporte@aiweaver.com

---

**Feito com ❤️ para AI Web Weaver**
**Versão:** 1.0.0
**Data:** 13 de Novembro de 2025
