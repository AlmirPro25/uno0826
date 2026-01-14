# 🧪 Teste Rápido - Navegação Inteligente V2

## 🚀 Como Testar

### 1. Iniciar Sistema

```bash
# Backend (se não estiver rodando)
cd backend
npm start

# Frontend
npm run dev
```

### 2. Abrir Navegador

```
http://localhost:3000
```

### 3. Ativar Modo Navegação

Clicar no botão **"Modo Navegação"** no chat

### 4. Testar Comandos

## 📝 Casos de Teste

### Teste 1: Busca no Google ✅

**Comando**:
```
Busque por Python no Google
```

**Resultado Esperado**:
```
✅ URLs Geradas pelo Gemini:
• Google: Buscar por Python
• YouTube: Vídeos sobre Python
• Wikipedia: Artigo sobre Python

🌐 Navegando em: https://www.google.com/search?q=Python
📄 Página: Google Search

👉 Veja o site funcionando no Canvas ao lado!
```

**Canvas**:
- Aba "🌐 Live" ativa
- Site do Google funcionando
- Você pode interagir com a busca

---

### Teste 2: GitHub ✅

**Comando**:
```
Procure por projetos de React no GitHub
```

**Resultado Esperado**:
- URLs geradas (GitHub, npm, Stack Overflow)
- Navegação para GitHub
- Site funcional no Canvas

---

### Teste 3: E-commerce ✅

**Comando**:
```
Busque por notebooks na Amazon
```

**Resultado Esperado**:
- URLs geradas (Amazon, Mercado Livre, Kabum)
- Navegação para Amazon
- Site funcional no Canvas

---

### Teste 4: YouTube ✅

**Comando**:
```
Encontre vídeos de JavaScript no YouTube
```

**Resultado Esperado**:
- URLs geradas (YouTube, Udemy, Coursera)
- Navegação para YouTube
- Site funcional no Canvas

---

### Teste 5: Wikipedia ✅

**Comando**:
```
Busque sobre inteligência artificial na Wikipedia
```

**Resultado Esperado**:
- URLs geradas (Wikipedia, Google, YouTube)
- Navegação para Wikipedia
- Artigo funcional no Canvas

---

## ✅ Checklist de Verificação

### Chat
- [ ] Mensagem do usuário aparece
- [ ] "🧠 Gemini gerando URLs..." aparece
- [ ] URLs geradas são exibidas
- [ ] URL de navegação é mostrada
- [ ] Mensagem de sucesso aparece

### Canvas
- [ ] Canvas abre automaticamente
- [ ] Aba "🌐 Live" está ativa
- [ ] Site carrega no iframe
- [ ] Site é funcional (pode clicar, rolar)
- [ ] Barra de ferramentas mostra URL
- [ ] Botão "Abrir em nova aba" funciona

### Outras Abas
- [ ] Aba "📝 Texto" mostra conteúdo
- [ ] Aba "🔗 Links" mostra links
- [ ] Aba "🖼️ Imagens" mostra imagens

---

## 🐛 Problemas Comuns

### 1. Site não carrega no iframe

**Causa**: CORS policy (site bloqueia iframe)

**Exemplos**: Facebook, Instagram, alguns bancos

**Solução**: Normal, alguns sites bloqueiam por segurança

---

### 2. "Não foi possível gerar URLs"

**Causa**: Gemini não entendeu a intenção

**Solução**: Reformular o comando de forma mais clara

---

### 3. Canvas não abre

**Causa**: Modo Navegação não está ativo

**Solução**: Clicar no botão "Modo Navegação"

---

### 4. Site demora para carregar

**Causa**: Site pesado ou conexão lenta

**Solução**: Aguardar ou tentar outro site

---

## 📊 Métricas de Sucesso

### ✅ Teste Passou Se:

1. Gemini gera URLs em < 5 segundos
2. URLs são relevantes para a intenção
3. Navegação funciona
4. Canvas abre automaticamente
5. Site carrega no iframe
6. Site é interativo
7. Outras abas funcionam
8. Feedback visual é claro

---

## 🎯 Testes Avançados

### Teste A: Múltiplas Buscas Seguidas

```
1. "Busque por Python no Google"
2. "Procure por JavaScript no GitHub"
3. "Encontre notebooks na Amazon"
```

**Esperado**: Todas funcionam, Canvas atualiza

---

### Teste B: Sites Diferentes

```
1. Google (busca)
2. YouTube (vídeos)
3. Wikipedia (artigos)
4. GitHub (código)
5. Amazon (produtos)
```

**Esperado**: Todos carregam corretamente

---

### Teste C: Comandos Variados

```
1. "Busque..."
2. "Procure..."
3. "Encontre..."
4. "Pesquise..."
5. "Vá para..."
```

**Esperado**: Gemini entende todas as variações

---

## 💡 Dicas de Teste

### 1. Seja Específico

❌ "Busque Python"
✅ "Busque por Python no Google"

### 2. Use Nomes de Sites

✅ "no Google"
✅ "no YouTube"
✅ "no GitHub"

### 3. Teste Sites Populares Primeiro

✅ Google, YouTube, Wikipedia
⚠️ Sites menos conhecidos podem não funcionar

### 4. Verifique o Console

F12 → Console → Ver erros (se houver)

---

## 📝 Relatório de Teste

Após testar, preencha:

```
Data: ___/___/___
Navegador: ___________
Sistema: ___________

Testes Realizados:
[ ] Teste 1: Google
[ ] Teste 2: GitHub
[ ] Teste 3: Amazon
[ ] Teste 4: YouTube
[ ] Teste 5: Wikipedia

Problemas Encontrados:
_______________________
_______________________

Sugestões:
_______________________
_______________________
```

---

## 🎉 Resultado Esperado

Após todos os testes, você deve ter:

✅ Sistema gerando URLs inteligentes
✅ Navegação funcionando
✅ Canvas com sites reais
✅ Interatividade completa
✅ Experiência fluida

---

**Boa sorte com os testes! 🚀**
