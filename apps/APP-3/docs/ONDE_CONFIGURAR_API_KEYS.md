# 🔑 Onde Configurar API Keys

## 📍 Localização do Botão

O botão para gerenciar API Keys está localizado no **menu "Ferramentas IA"** da barra de comandos.

---

## 🎯 Como Acessar

### Passo a Passo Visual

```
┌─────────────────────────────────────────────────────────┐
│  [Arquivo ▼] [🔧 Ferramentas IA ▼] [Modelo ▼]          │
│                                                         │
│  Clique aqui ↑                                          │
└─────────────────────────────────────────────────────────┘
```

### Menu Ferramentas IA

```
┌─────────────────────────────────────┐
│ 🔧 Ferramentas IA                   │
├─────────────────────────────────────┤
│ 💡 Brainstorming IA                 │
│ 🎨 Customizador de Tema             │
│ 🔍 Crítica de Site IA               │
│ ✨ Code Insight IA                  │
│ 🧪 Sugerir Testes                   │
│ 👨‍⚕️ Depurador IA                     │
│ ─────────────────────────────────   │
│ 🔑 Gerenciar API Keys  ← AQUI!     │
└─────────────────────────────────────┘
```

---

## 🖱️ Instruções Detalhadas

### 1. Abrir o Menu
1. Localize a barra de comandos no topo da tela
2. Clique no botão **"🔧 Ferramentas IA"**
3. O menu dropdown será aberto

### 2. Acessar Gerenciador
1. No menu aberto, role até o final
2. Clique em **"🔑 Gerenciar API Keys"**
3. O modal de gerenciamento será aberto

### 3. Adicionar Chave
1. No modal, clique em **"➕ Adicionar Nova Chave de API"**
2. Escolha o provider (Google Gemini, OpenAI, etc)
3. Cole sua chave de API
4. Clique em **"✓ Validar e Salvar"**
5. Aguarde a validação
6. Pronto! Chave configurada ✅

---

## 📱 Interface do Modal

### Tela Principal

```
┌─────────────────────────────────────────────────────────┐
│ 🔑 Gerenciador de API Keys                       [X]    │
│ Configure suas chaves de API para usar em apps gerados  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📋 Chaves Configuradas                                  │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔷 Google Gemini                        [Ativa]     │ │
│ │ Para apps de chatbot                                │ │
│ │ AIza••••••••••••••••••••••••••••••••SyXX            │ │
│ │ Usos: 15 | Último: 10/11/2025                       │ │
│ │                          [Desativar] [Remover]      │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [➕ Adicionar Nova Chave de API]                        │
│                                                         │
│ ℹ️ Como funciona?                                       │
│ • Configure suas chaves aqui                           │
│ • Apps gerados usarão automaticamente                  │
│ • Chaves armazenadas localmente                        │
│                                                         │
│                                          [Fechar]      │
└─────────────────────────────────────────────────────────┘
```

### Formulário de Adicionar

```
┌─────────────────────────────────────────────────────────┐
│ ➕ Nova Chave de API                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Provider:                                               │
│ [🔷 Google Gemini ▼]                                    │
│                                                         │
│ Nome (opcional):                                        │
│ [Minha Chave Gemini                              ]     │
│                                                         │
│ Chave de API *:                                         │
│ [••••••••••••••••••••••••••••••••••••••••••••••••]     │
│                                                         │
│ Descrição (opcional):                                   │
│ [Para apps de chatbot                            ]     │
│                                                         │
│ [✓ Validar e Salvar]  [Cancelar]                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🎬 Fluxo Completo

### 1. Primeira Vez (Sem Chaves)

```
Você abre o app
    ↓
Clica em "Ferramentas IA"
    ↓
Clica em "🔑 Gerenciar API Keys"
    ↓
Modal abre vazio
    ↓
Clica em "➕ Adicionar Nova Chave"
    ↓
Preenche formulário
    ↓
Clica em "Validar e Salvar"
    ↓
✅ Chave configurada!
```

### 2. Com Chaves Configuradas

```
Você abre o app
    ↓
Clica em "Ferramentas IA"
    ↓
Clica em "🔑 Gerenciar API Keys"
    ↓
Modal mostra suas chaves
    ↓
Pode:
  • Ver chaves configuradas
  • Adicionar novas chaves
  • Ativar/Desativar chaves
  • Remover chaves antigas
  • Ver histórico de uso
```

---

## 🔍 Onde Está no Código

### Arquivo: `components/CommandBar.tsx`

**Linha do botão:**
```tsx
// Linha ~703
<DropdownItem 
  onClick={() => setIsApiKeysModalOpen(true)} 
  iconClass="fa-solid fa-key" 
  text="🔑 Gerenciar API Keys" 
/>
```

**Linha do modal:**
```tsx
// Linha ~806
<ApiKeysManagerModal
  isOpen={isApiKeysModalOpen}
  onClose={() => setIsApiKeysModalOpen(false)}
/>
```

---

## 🎯 Atalhos Rápidos

### Teclado (Futuro)
- `Ctrl + K` → Abrir menu de comandos
- `A` → Abrir API Keys
- `Enter` → Adicionar nova chave

### Mouse
1. Clique em "Ferramentas IA"
2. Clique em "Gerenciar API Keys"
3. Pronto!

---

## 📸 Screenshots (Referência Visual)

### Localização do Botão
```
Barra de Comandos (Topo)
    ↓
[Arquivo] [Ferramentas IA] [Modelo]
              ↑
         Clique aqui
```

### Menu Aberto
```
Ferramentas IA
├── Brainstorming IA
├── Customizador de Tema
├── Crítica de Site IA
├── Code Insight IA
├── Sugerir Testes
├── Depurador IA
├── ─────────────────
└── 🔑 Gerenciar API Keys ← AQUI
```

---

## ✅ Checklist de Configuração

- [ ] Abrir menu "Ferramentas IA"
- [ ] Clicar em "Gerenciar API Keys"
- [ ] Clicar em "Adicionar Nova Chave"
- [ ] Escolher provider (Google, OpenAI, etc)
- [ ] Colar chave de API
- [ ] Clicar em "Validar e Salvar"
- [ ] Aguardar validação
- [ ] Ver mensagem de sucesso ✅
- [ ] Fechar modal
- [ ] Pronto para usar!

---

## 🎉 Pronto!

Agora você sabe exatamente onde configurar suas API Keys!

**Localização:** Menu "Ferramentas IA" → "🔑 Gerenciar API Keys"

**Atalho:** Barra de comandos (topo) → Ferramentas IA → Gerenciar API Keys

---

*Última atualização: 10/11/2025*
