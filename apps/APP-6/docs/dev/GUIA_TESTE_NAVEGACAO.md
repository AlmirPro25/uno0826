# 🧪 Guia de Teste - Modo Navegação

## ✅ Pré-requisitos

- ✅ Backend rodando (porta 3002)
- ✅ Frontend rodando (porta 3000)
- ✅ Playwright instalado

---

## 🎯 Como Testar

### 1. Abrir o Frontend

Acesse: http://localhost:3000

---

### 2. Ativar Modo Navegação

**Localize o botão** ao lado da lupa (🔍):
- Ícone: 🌐 (globo verde)
- Cor: Emerald (verde)
- Posição: Ao lado do botão de pesquisa

**Clique no botão** 🌐

**O que deve acontecer**:
- ✅ Botão fica verde brilhante
- ✅ Aparece ponto verde piscando
- ✅ Placeholder muda para "🌐 Modo Navegação Ativo"
- ✅ Mensagem embaixo: "🌐 Modo Navegação Ativo - Canvas aberto"

---

### 3. Testar Navegação

#### Teste 1: Site Simples

Digite no chat:
```
example.com
```

**Esperado**:
1. ✅ Mensagem de loading com etapas
2. ✅ Canvas abre do lado direito (50/50)
3. ✅ Screenshot do site aparece
4. ✅ Tabs: Preview, Texto, Links, Imagens
5. ✅ Mensagem de sucesso no chat

---

#### Teste 2: Site Complexo

Digite:
```
playwright.dev
```

**Esperado**:
1. ✅ Navega no site
2. ✅ Canvas mostra screenshot
3. ✅ Extrai ~3000 caracteres
4. ✅ Mostra ~29 links
5. ✅ Mostra ~11 imagens

---

#### Teste 3: GitHub

Digite:
```
github.com/microsoft/playwright
```

**Esperado**:
1. ✅ Navega no repositório
2. ✅ Screenshot do GitHub
3. ✅ Extrai ~8000 caracteres
4. ✅ ~50 links
5. ✅ Múltiplas imagens

---

### 4. Interagir com o Canvas

**Tabs disponíveis**:

1. **📸 Preview**
   - Screenshot em tela cheia
   - Scroll para ver página completa

2. **📝 Texto**
   - Conteúdo extraído
   - Botão "Mostrar mais" se > 1000 chars

3. **🔗 Links**
   - Lista de todos os links
   - Clicáveis (abrem em nova aba)

4. **🖼️ Imagens**
   - Grid de imagens
   - Alt text quando disponível

---

### 5. Fechar Canvas

**Botão X** no canto superior direito do Canvas

**O que acontece**:
- ✅ Canvas fecha
- ✅ Modo navegação desativa
- ✅ Chat volta ao normal
- ✅ Botão 🌐 volta ao cinza

---

## 🎨 Visual Esperado

```
┌──────────────────────┬──────────────────────────┐
│ Chat (50%)           │ Canvas (50%)             │
├──────────────────────┼──────────────────────────┤
│                      │ ┌──────────────────────┐ │
│ 👤 Você:             │ │ 🌐 Canvas - Navegação│ │
│ playwright.dev       │ │                  [✕] │ │
│                      │ ├──────────────────────┤ │
│ 🤖 Assistente:       │ │                      │ │
│ ✅ Navegação         │ │ [📸] [📝] [🔗] [🖼️]  │ │
│ concluída!           │ │                      │ │
│                      │ │ ┌──────────────────┐ │ │
│ 📄 Página: ...       │ │ │                  │ │ │
│ 🔗 URL: ...          │ │ │  [Screenshot]    │ │ │
│ 📝 Conteúdo: 3101    │ │ │                  │ │ │
│ 🔗 Links: 29         │ │ └──────────────────┘ │ │
│ 🖼️ Imagens: 11       │ │                      │ │
│                      │ └──────────────────────┘ │
└──────────────────────┴──────────────────────────┘
```

---

## ⚠️ Possíveis Erros

### Erro 1: "URL não encontrada"

**Causa**: Não digitou uma URL válida

**Solução**: Digite uma URL como:
- `example.com`
- `https://github.com`
- `playwright.dev`

---

### Erro 2: Backend não responde

**Causa**: Backend não está rodando

**Solução**:
```bash
cd backend
node server.js
```

---

### Erro 3: Canvas não abre

**Causa**: Modo navegação não está ativo

**Solução**: Clique no botão 🌐 antes de digitar a URL

---

## 📊 Checklist de Teste

- [ ] Botão 🌐 aparece ao lado da lupa
- [ ] Clicar no botão ativa o modo (fica verde)
- [ ] Placeholder muda para "Modo Navegação Ativo"
- [ ] Digitar URL navega no site
- [ ] Canvas abre do lado direito (50/50)
- [ ] Screenshot aparece no Canvas
- [ ] Tabs funcionam (Preview, Texto, Links, Imagens)
- [ ] Links são clicáveis
- [ ] Botão X fecha o Canvas
- [ ] Modo navegação desativa ao fechar

---

## 🎯 URLs para Testar

### Simples
- `example.com`
- `google.com`

### Médias
- `playwright.dev`
- `react.dev`
- `nodejs.org`

### Complexas
- `github.com/microsoft/playwright`
- `stackoverflow.com`
- `reddit.com`

---

## 🎉 Sucesso!

Se todos os testes passarem, você tem:

✅ Modo navegação funcionando  
✅ Canvas split-screen perfeito  
✅ Playwright integrado  
✅ Detecção automática de URL  
✅ Extração de conteúdo  
✅ Screenshots funcionando  
✅ Interface linda e responsiva  

**Sistema completo e funcionando!** 🚀

---

## 📝 Próximos Passos

Depois de testar, você pode:

1. **Adicionar mais funcionalidades**
   - Busca no Google
   - Múltiplas abas
   - Histórico de navegação

2. **Melhorar a UI**
   - Animações mais suaves
   - Temas personalizados
   - Atalhos de teclado

3. **Automações**
   - Preencher formulários
   - Clicar em elementos
   - Executar scripts

**Bora testar!** 🎯
