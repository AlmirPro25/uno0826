# 🎬 Exemplo de Uso - Navegação no Chat

## Fluxo Completo

### 1️⃣ Usuário Digita no Chat

```
┌─────────────────────────────────────┐
│ Chat                                │
├─────────────────────────────────────┤
│                                     │
│ 👤 Você:                            │
│ Navegue em playwright.dev           │
│                                     │
│ [Enviar]                            │
└─────────────────────────────────────┘
```

---

### 2️⃣ Sistema Detecta e Processa

```
Console:
🌐 Comando de navegação detectado
🔗 URL extraída: playwright.dev
🌐 Navegando para: https://playwright.dev
✅ Página carregada: Fast and reliable...
📝 Extraindo conteúdo...
✅ Conteúdo extraído: 3101 caracteres
📸 Tirando screenshot...
✅ Screenshot capturado (130KB)
```

---

### 3️⃣ Canvas Abre Automaticamente

```
┌──────────────────────┬──────────────────────────┐
│ Chat (50%)           │ Canvas (50%)             │
├──────────────────────┼──────────────────────────┤
│                      │ ┌──────────────────────┐ │
│ 👤 Você:             │ │ Canvas          [✕]  │ │
│ Navegue em           │ ├──────────────────────┤ │
│ playwright.dev       │ │                      │ │
│                      │ │ 📸 Preview           │ │
│ 🤖 Assistente:       │ │ ┌──────────────────┐ │ │
│ ✅ Navegação         │ │ │                  │ │ │
│ concluída! Site      │ │ │  [Screenshot do  │ │ │
│ carregado no Canvas. │ │ │   Playwright.dev]│ │ │
│                      │ │ │                  │ │ │
│                      │ │ └──────────────────┘ │ │
│                      │ │                      │ │
│                      │ │ 📝 Texto | 🔗 Links  │ │
│                      │ │ 🖼️ Imagens           │ │
│                      │ └──────────────────────┘ │
└──────────────────────┴──────────────────────────┘
```

---

### 4️⃣ Usuário Interage com o Canvas

```
┌──────────────────────┬──────────────────────────┐
│ Chat                 │ Canvas                   │
├──────────────────────┼──────────────────────────┤
│                      │ [📸 Preview] [📝 Texto]  │
│ 👤 Você:             │ [🔗 Links] [🖼️ Imagens]  │
│ Navegue em           │                          │
│ playwright.dev       │ ┌──────────────────────┐ │
│                      │ │ 🔗 Links (29)        │ │
│ 🤖 ✅ Navegação      │ ├──────────────────────┤ │
│ concluída!           │ │                      │ │
│                      │ │ → Getting Started    │ │
│                      │ │   /docs/intro        │ │
│                      │ │                      │ │
│                      │ │ → API Reference      │ │
│                      │ │   /docs/api          │ │
│                      │ │                      │ │
│                      │ │ → Examples           │ │
│                      │ │   /docs/examples     │ │
│                      │ └──────────────────────┘ │
└──────────────────────┴──────────────────────────┘
```

---

## 🎯 Exemplo 2: Busca no Google

### Usuário Digita

```
👤 Você: "Pesquise sobre React hooks"
```

### Sistema Processa

```
Console:
🔍 Comando de busca detectado
📝 Query extraída: React hooks
🔍 Buscando no Google...
✅ 10 resultados encontrados
```

### Canvas Mostra Resultados

```
┌──────────────────────┬──────────────────────────┐
│ Chat                 │ Canvas                   │
├──────────────────────┼──────────────────────────┤
│ 👤 Você:             │ 🔍 Resultados: "React    │
│ Pesquise sobre       │    hooks"                │
│ React hooks          │                          │
│                      │ ┌──────────────────────┐ │
│ 🤖 ✅ Encontrei      │ │ #1                   │ │
│ 10 resultados        │ │ React Hooks - React  │ │
│                      │ │ https://react.dev... │ │
│                      │ │ Hooks are functions  │ │
│                      │ │ that let you...      │ │
│                      │ ├──────────────────────┤ │
│                      │ │ #2                   │ │
│                      │ │ Introducing Hooks    │ │
│                      │ │ https://legacy...    │ │
│                      │ │ Hooks are a new...   │ │
│                      │ └──────────────────────┘ │
└──────────────────────┴──────────────────────────┘
```

---

## 🎯 Exemplo 3: Múltiplas Navegações

```
┌──────────────────────┬──────────────────────────┐
│ Chat                 │ Canvas                   │
├──────────────────────┼──────────────────────────┤
│ 👤 Navegue em        │ [Mostrando:              │
│    playwright.dev    │  playwright.dev]         │
│                      │                          │
│ 🤖 ✅ Carregado      │ [Screenshot]             │
│                      │                          │
│ 👤 Agora abra        │                          │
│    github.com        │                          │
│                      │                          │
│ 🤖 ✅ Carregado      │ [Mostrando:              │
│                      │  github.com]             │
│                      │                          │
│ 👤 Pesquise sobre    │ [Screenshot]             │
│    Node.js           │                          │
│                      │                          │
│ 🤖 ✅ 10 resultados  │ [Mostrando:              │
│                      │  Resultados de busca]    │
└──────────────────────┴──────────────────────────┘
```

---

## 💬 Comandos que Funcionam

### ✅ Navegação

```
"Navegue em playwright.dev"
"Abra o site github.com"
"Acesse https://example.com"
"Visite microsoft.com"
"Entre em react.dev"
"Vá para nodejs.org"
"Mostre o site python.org"
"Carregue o site typescript.org"
```

### ✅ Busca

```
"Pesquise sobre Playwright"
"Busque no Google: React tutorial"
"Procure informações sobre Node.js"
"Encontre documentação do TypeScript"
"Pesquise React hooks"
"Busque Python tutorial"
```

---

## 🎨 Interações no Canvas

### Tabs Disponíveis

1. **📸 Preview** - Screenshot do site
2. **📝 Texto** - Conteúdo extraído
3. **🔗 Links** - Todos os links da página
4. **🖼️ Imagens** - Todas as imagens

### Ações

- ✅ Clicar em links (abre em nova aba)
- ✅ Ver imagens em tamanho maior
- ✅ Copiar texto
- ✅ Fechar Canvas
- ✅ Navegar para outro site

---

## 🔄 Fluxo de Trabalho

```
1. Usuário digita comando
   ↓
2. Sistema detecta tipo (navegação/busca)
   ↓
3. Extrai URL ou query
   ↓
4. Executa ação (navegar/buscar)
   ↓
5. Abre Canvas automaticamente
   ↓
6. Mostra resultado visual
   ↓
7. Usuário interage
   ↓
8. Pode fazer nova navegação
```

---

## 🎯 Casos de Uso

### 1. Pesquisa Rápida

```
👤 "Pesquise sobre Playwright"
🤖 Busca no Google
📊 Mostra 10 resultados
👤 Clica no primeiro resultado
🌐 Abre o site no Canvas
```

### 2. Comparar Sites

```
👤 "Navegue em react.dev"
🤖 Mostra React no Canvas
👤 "Agora mostre vue.js"
🤖 Mostra Vue no Canvas
👤 Compara os dois
```

### 3. Documentação

```
👤 "Abra a documentação do Node.js"
🤖 Navega em nodejs.org/docs
📚 Mostra documentação no Canvas
👤 Pode ler e navegar pelos links
```

---

## 🎉 Resultado

**Experiência fluida e natural!**

✅ Fala naturalmente no chat  
✅ Sistema entende automaticamente  
✅ Canvas abre sozinho  
✅ Vê o site completo  
✅ Pode interagir  
✅ Pode fazer novas navegações  

**Igual ter um navegador dentro do chat!** 🚀
