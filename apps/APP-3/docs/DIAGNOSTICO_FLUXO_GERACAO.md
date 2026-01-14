# 🔍 DIAGNÓSTICO COMPLETO DO FLUXO DE GERAÇÃO

## 📋 RESUMO DOS PROBLEMAS IDENTIFICADOS

### 1️⃣ PROBLEMA: Enterprise Pipeline Automático (Sem Controle Manual)

**Localização:** `services/EnterprisePipelineIntegration.ts` → `analyzeComplexity()`

**O que acontece:**
- O sistema analisa o prompt automaticamente
- Se score >= 30 → usa Enterprise (3-5 chamadas)
- Se score < 30 → usa Single Call (1 chamada)
- **NÃO HÁ BOTÃO/SELETOR** para o usuário escolher

**Código responsável:**
```typescript
// services/GeminiService.ts linha ~7483
if (phase === 'generate_code_no_plan' || phase === 'generate_code_from_plan') {
    const enterpriseCheck = shouldUseEnterpriseMode(userPromptInput);
    
    if (enterpriseCheck.useEnterprise) {
        // VAI DIRETO PARA ENTERPRISE - SEM PERGUNTAR!
    }
}
```

**Solução proposta:**
- Adicionar `generationMode: 'auto' | 'single' | 'enterprise'` no store
- Criar seletor na UI (comando de barra ou botão)
- Respeitar escolha do usuário antes de `analyzeComplexity()`

---

### 2️⃣ PROBLEMA: Tela de Seleção de Cores Não Aparece

**Localização:** `components/ThemeCustomizerModal.tsx` + `store/useAppStore.ts`

**O que acontece:**
- O modal `ThemeCustomizerModal` existe
- A função `openThemeModal` existe no store
- **MAS** não está sendo chamada no fluxo de geração

**Código que deveria chamar:**
```typescript
// Deveria ter algo assim após gerar código:
if (shouldShowColorPicker) {
    openThemeModal();
}
```

**Solução proposta:**
- Adicionar flag `showColorPickerAfterGeneration: boolean` no store
- Chamar `openThemeModal()` após geração se flag ativa

---

### 3️⃣ PROBLEMA: Extração de Código Duplicando Conteúdo

**Localização:** `store/useAppStore.ts` → função de ZIP (linha ~3145)

**O que acontece:**
- Ao exportar ZIP, o código está sendo duplicado
- index.html aparece 2x ou com conteúdo errado
- Problema na extração de `<script type="text/plain" data-path="...">`

**Código responsável:**
```typescript
// store/useAppStore.ts linha ~3145
const zip = new JSZip();
const mainHtmlFile = files.find(f => f.path === 'index.html');
// ... lógica de extração pode estar duplicando
```

**Solução proposta:**
- Revisar lógica de extração de arquivos
- Garantir que cada arquivo seja adicionado apenas 1x
- Validar formato antes de adicionar ao ZIP

---

### 4️⃣ PROBLEMA: Interfazer Quebrando Extração

**Sintoma:** 
- CTRL+C, CTRL+V duplica código
- 2 linhas viram 4000
- index.html não extrai corretamente

**Causa provável:**
- O formato `===FILE: path===` do Enterprise não está sendo convertido corretamente
- A função `convertEnterpriseFormatToScriptTags()` pode ter bug

**Localização:** `services/GeminiService.ts` linha ~7530

---

## 🗺️ MAPA DOS FLUXOS DE GERAÇÃO

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUXOS DE GERAÇÃO ATUAIS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PROMPT DO USUÁRIO                                                          │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  analyzeComplexity() - AUTOMÁTICO (SEM CONTROLE DO USUÁRIO)         │   │
│  │  Score >= 30 → Enterprise | Score < 30 → Single                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ├──────────────────────────────────────────────────────────────┐   │
│         │                                                              │   │
│         ▼                                                              ▼   │
│  ┌─────────────────────┐                              ┌─────────────────┐  │
│  │  ENTERPRISE MODE    │                              │  SINGLE CALL    │  │
│  │  (3-5 chamadas)     │                              │  (1 chamada)    │  │
│  │                     │                              │                 │  │
│  │  1. Architect       │                              │  Gera tudo      │  │
│  │  2. Backend         │                              │  de uma vez     │  │
│  │  3. Frontend        │                              │                 │  │
│  │  4. Integration     │                              │  ✅ Mais rápido │  │
│  │  5. Polish          │                              │  ✅ Funciona    │  │
│  │                     │                              │                 │  │
│  │  ⚠️ Mais lento      │                              │                 │  │
│  │  ⚠️ Pode quebrar    │                              │                 │  │
│  └─────────────────────┘                              └─────────────────┘  │
│         │                                                      │           │
│         └──────────────────────┬───────────────────────────────┘           │
│                                │                                            │
│                                ▼                                            │
│                    ┌───────────────────────┐                               │
│                    │  CÓDIGO GERADO        │                               │
│                    │  (Monaco Editor)      │                               │
│                    └───────────────────────┘                               │
│                                │                                            │
│                                ▼                                            │
│                    ┌───────────────────────┐                               │
│                    │  ❌ TELA DE CORES     │  ← NÃO ESTÁ APARECENDO!       │
│                    │  (ThemeCustomizer)    │                               │
│                    └───────────────────────┘                               │
│                                │                                            │
│                                ▼                                            │
│                    ┌───────────────────────┐                               │
│                    │  EXPORT ZIP           │  ← DUPLICANDO CÓDIGO!         │
│                    │  (JSZip)              │                               │
│                    └───────────────────────┘                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ ARQUIVOS PARA MODIFICAR

| Arquivo | Modificação |
|---------|-------------|
| `store/useAppStore.ts` | Adicionar `generationMode` state |
| `services/GeminiService.ts` | Respeitar `generationMode` antes de `analyzeComplexity()` |
| `components/ChatView.tsx` | Adicionar seletor de modo (1 ou 5 chamadas) |
| `services/EnterprisePipelineIntegration.ts` | Permitir override manual |
| `store/useAppStore.ts` (ZIP) | Corrigir duplicação na extração |

---

## 📝 PLANO DE AÇÃO

### Fase 1: Adicionar Controle Manual de Modo
1. Adicionar state `generationMode` no store
2. Criar componente seletor (toggle ou dropdown)
3. Modificar `shouldUseEnterpriseMode()` para respeitar escolha

### Fase 2: Restaurar Tela de Cores
1. Identificar onde era chamada antes
2. Adicionar flag para mostrar após geração
3. Integrar no fluxo

### Fase 3: Corrigir Extração de Código
1. Debug da função de ZIP
2. Corrigir duplicação
3. Validar formato de saída

---

## 🔧 CÓDIGO PARA IMPLEMENTAR

### 1. Adicionar State no Store

```typescript
// store/useAppStore.ts - Adicionar no state
generationMode: 'auto' | 'single' | 'enterprise';
setGenerationMode: (mode: 'auto' | 'single' | 'enterprise') => void;
showColorPickerAfterGeneration: boolean;
setShowColorPickerAfterGeneration: (show: boolean) => void;
```

### 2. Modificar shouldUseEnterpriseMode

```typescript
// services/GeminiService.ts
export function shouldUseEnterpriseMode(
  userPrompt: string,
  manualMode?: 'auto' | 'single' | 'enterprise'
): { useEnterprise: boolean; mode: PipelineMode; ... } {
  
  // Se modo manual definido, respeitar
  if (manualMode === 'single') {
    return { useEnterprise: false, mode: 1, reason: 'Modo manual: Single Call' };
  }
  if (manualMode === 'enterprise') {
    return { useEnterprise: true, mode: 5, reason: 'Modo manual: Enterprise' };
  }
  
  // Modo auto: usar análise de complexidade
  const analysis = analyzeComplexity(userPrompt);
  return { ... };
}
```

### 3. Componente Seletor de Modo

```tsx
// components/GenerationModeSelector.tsx
export function GenerationModeSelector() {
  const { generationMode, setGenerationMode } = useAppStore();
  
  return (
    <div className="flex items-center gap-2">
      <span>Modo:</span>
      <select 
        value={generationMode}
        onChange={(e) => setGenerationMode(e.target.value)}
      >
        <option value="auto">Auto (detectar)</option>
        <option value="single">1 Chamada (rápido)</option>
        <option value="enterprise">5 Chamadas (detalhado)</option>
      </select>
    </div>
  );
}
```

---

## ✅ CHECKLIST DE CORREÇÕES

- [x] Adicionar `generationMode` no store ✅ FEITO
- [x] Criar seletor de modo na UI ✅ FEITO (`components/GenerationModeSelector.tsx`)
- [x] Modificar `shouldUseEnterpriseMode()` para aceitar modo manual ✅ FEITO
- [x] Integrar seletor no ChatView/CommandBar ✅ FEITO
- [x] **PASSAR `generationMode` para `generateAiResponseStream()`** ✅ FEITO (4 chamadas corrigidas)
- [x] **Restaurar chamada do `ThemeCustomizerModal` após geração** ✅ FEITO
  - Adicionado `openThemeModal()` após geração se `showColorPickerAfterGeneration` estiver ativo
  - Adicionado botão 🎨 no seletor inline para ativar/desativar
- [ ] Corrigir duplicação no export ZIP (investigação em andamento)
- [ ] Testar fluxo Single Call
- [ ] Testar fluxo Enterprise
- [ ] Testar export ZIP
- [ ] Testar seleção de cores

---

## 📁 ARQUIVOS CRIADOS/MODIFICADOS

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `store/useAppStore.ts` | ✅ Modificado | Adicionado `generationMode` state e actions |
| `services/GeminiService.ts` | ✅ Modificado | `shouldUseEnterpriseMode()` aceita modo manual |
| `components/GenerationModeSelector.tsx` | ✅ Criado | Componente seletor de modo |
| `docs/DIAGNOSTICO_FLUXO_GERACAO.md` | ✅ Criado | Este documento |

---

## 🔧 COMO USAR O SELETOR

```tsx
// Importar o componente
import { GenerationModeSelector, GenerationModeInline } from './components/GenerationModeSelector';

// Versão completa (com labels)
<GenerationModeSelector />

// Versão compacta (só ícones)
<GenerationModeSelector compact />

// Versão inline (para barra de comandos)
<GenerationModeInline />
```

### ✅ Integrado no ChatView!

O seletor foi adicionado ao lado do botão de enviar mensagem no ChatView.

---

## 🎯 RESUMO DA IMPLEMENTAÇÃO

### O que foi feito:

1. **State no Store** (`store/useAppStore.ts`):
   - `generationMode: 'auto' | 'single' | 'enterprise'`
   - `showColorPickerAfterGeneration: boolean`
   - Actions: `setGenerationMode()`, `setShowColorPickerAfterGeneration()`, `getGenerationMode()`

2. **Lógica de Decisão** (`services/GeminiService.ts`):
   - `shouldUseEnterpriseMode()` agora aceita parâmetro `manualMode`
   - Se `manualMode === 'single'` → força 1 chamada
   - Se `manualMode === 'enterprise'` → força 5 chamadas
   - Se `manualMode === 'auto'` → usa análise de complexidade

3. **Componente UI** (`components/GenerationModeSelector.tsx`):
   - `GenerationModeSelector` - versão completa com labels
   - `GenerationModeInline` - versão compacta para barra de comandos

4. **Integração** (`components/ChatView.tsx`):
   - Seletor adicionado ao lado do botão de enviar

### Como funciona:

```
┌─────────────────────────────────────────────────────────────────┐
│  USUÁRIO CLICA NO SELETOR                                       │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🔄 Auto  │  ⚡ 1x  │  🏢 5x                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                                                       │
│         ▼                                                       │
│  setGenerationMode() → store.generationMode                    │
│         │                                                       │
│         ▼                                                       │
│  shouldUseEnterpriseMode(prompt, generationMode)               │
│         │                                                       │
│         ├── 'single' → 1 chamada (rápido)                      │
│         ├── 'enterprise' → 5 chamadas (detalhado)              │
│         └── 'auto' → analyzeComplexity() decide                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Próximos passos pendentes:

- [ ] Passar `generationMode` do store para `generateAiResponseStream()`
- [ ] Restaurar tela de seleção de cores após geração
- [ ] Corrigir duplicação no export ZIP
