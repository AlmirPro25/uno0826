# 🗺️ MAPEAMENTO DOS FLUXOS DE GERAÇÃO

## 📋 COMPONENTES DE UI NO INÍCIO DA GERAÇÃO

### 1. AiResearchPanel (Painel de Inteligência)
- **Arquivo:** `components/AiResearchPanel.tsx`
- **Estado:** `isResearchPanelOpen`, `researchFindings`
- **Função:** Mostra cards de pesquisa com categorias (Design, Technology, etc.)
- **Localização:** Aparece embaixo do editor de código

### 2. ColorPaletteSelector (Seletor de Paletas)
- **Arquivo:** `components/ColorPaletteSelector.tsx`
- **Estado:** `isColorPaletteSelectorOpen`, `designResearch`, `selectedColorPalette`
- **Função:** Modal fullscreen para escolher paleta de cores
- **Acionado por:** `performAdvancedResearchAndShowPalettes()`

### 3. WebResearchIndicator
- **Arquivo:** `components/WebResearchIndicator.tsx`
- **Função:** Indicador de pesquisa na web

### 4. MiniPipelineIndicator
- **Arquivo:** `components/MiniPipelineIndicator.tsx`
- **Função:** Mostra progresso do pipeline de 3 fases

---

## 🔄 FLUXO ATUAL (BAGUNÇADO)

```
PROMPT DO USUÁRIO
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  handleCommandBarSend() - src/App.tsx                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Detecta projeto complexo (detectComplexProject)              │
│  2. Verifica se é persona (selectedGenerationType === 'persona') │
│  3. Detecta app mobile (mobileAppDetector)                       │
│  4. Verifica se deve mostrar paletas                             │
│     └── performAdvancedResearchAndShowPalettes()                 │
│  5. Se já tem código, refina                                     │
│  6. Detecta tipo (backend/frontend)                              │
│  7. Chama handleAiCommand()                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  handleAiCommand() - store/useAppStore.ts                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Ativa manifestos (ManifestOrchestrator)                      │
│  2. Pesquisa web (WebResearchEngine)                             │
│  3. Consulta Knowledge Base                                      │
│  4. Avalia código (UniversalScoringSystem)                       │
│  5. Chama generateAiResponseStream()                             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  generateAiResponseStream() - services/GeminiService.ts          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Verifica shouldUseEnterpriseMode()                           │
│     ├── Score >= 30 → Enterprise Pipeline (5 chamadas)           │
│     └── Score < 30 → Single Call (1 chamada)                     │
│                                                                  │
│  2. Se Enterprise:                                               │
│     └── executeEnterprisePipelineStream()                        │
│         ├── Soul Architect (forja especialista)                  │
│         ├── Fase 1: Arquiteto                                    │
│         ├── Fase 2: Backend                                      │
│         ├── Fase 3: Frontend                                     │
│         ├── Fase 4: Integração                                   │
│         └── Fase 5: DevOps                                       │
│                                                                  │
│  3. Se Single Call:                                              │
│     └── Gera tudo de uma vez                                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎯 FLUXO IDEAL (LINEAR)

```
PROMPT DO USUÁRIO
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  FASE 0: ANÁLISE INICIAL                                         │
├──────────────────────────────────────────────────────────────────┤
│  • Detectar tipo de projeto (web, mobile, backend, fullstack)    │
│  • Detectar complexidade (simples, médio, enterprise)            │
│  • Identificar manifestos relevantes                             │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  FASE 1: PESQUISA DE REFERÊNCIAS                                 │
│  📊 UI: AiResearchPanel (cards embaixo do editor)                │
├──────────────────────────────────────────────────────────────────┤
│  • Pesquisa simulada na internet                                 │
│  • Tendências de design                                          │
│  • Padrões de UI/UX                                              │
│  • Referências visuais                                           │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  FASE 2: SELEÇÃO DE PALETA DE CORES                              │
│  🎨 UI: ColorPaletteSelector (modal fullscreen)                  │
├──────────────────────────────────────────────────────────────────┤
│  • 5 paletas geradas pela IA                                     │
│  • Cores + Fontes + Efeitos integrados                           │
│  • Usuário escolhe sua favorita                                  │
│  • Sentimento/mood do site                                       │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  FASE 3: PLANEJAMENTO                                            │
│  📋 UI: Plano exibido no chat                                    │
├──────────────────────────────────────────────────────────────────┤
│  • Aurora Builder cria plano estruturado                         │
│  • Arquitetura do projeto                                        │
│  • Componentes necessários                                       │
│  • Tecnologias a usar                                            │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  FASE 4: GERAÇÃO DE CÓDIGO                                       │
│  💻 UI: Código streaming no editor                               │
├──────────────────────────────────────────────────────────────────┤
│  • Single Call (1x) ou Enterprise (5x)                           │
│  • Código aparece em tempo real                                  │
│  • Preview atualiza automaticamente                              │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  FASE 5: FINALIZAÇÃO                                             │
│  ✅ UI: Código completo + Preview funcional                      │
├──────────────────────────────────────────────────────────────────┤
│  • Processamento de mídia                                        │
│  • Geração de imagens (se necessário)                            │
│  • Avaliação de qualidade                                        │
│  • Score final                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📁 ARQUIVOS PRINCIPAIS

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/App.tsx` | Orquestra o fluxo principal, renderiza componentes |
| `store/useAppStore.ts` | Estado global, actions de geração |
| `services/GeminiService.ts` | Chamadas à API, Enterprise Pipeline |
| `services/AdvancedResearch.ts` | Pesquisa de paletas e design |
| `components/ColorPaletteSelector.tsx` | UI de seleção de paletas |
| `components/AiResearchPanel.tsx` | UI de cards de pesquisa |

---

## 🔧 ESTADOS IMPORTANTES

```typescript
// Estados de UI
isResearchPanelOpen: boolean        // Painel de pesquisa visível
isColorPaletteSelectorOpen: boolean // Modal de paletas visível
designResearch: DesignResearch      // Dados da pesquisa de design
selectedColorPalette: ColorPalette  // Paleta escolhida

// Estados de geração
currentAppPhase: string             // Fase atual do app
isLoadingAi: boolean                // IA processando
generationMode: 'auto' | 'single' | 'enterprise'

// Dados
projectPlan: string                 // Plano do projeto
htmlCode: string                    // Código gerado
researchFindings: ResearchFinding[] // Resultados da pesquisa
```

---

## 🐛 PROBLEMAS IDENTIFICADOS

1. **Pesquisa de paletas não ativa** - Condição `htmlCode === initialHtmlBase` falha quando há código anterior
2. **Fluxo não linear** - Várias verificações em paralelo sem ordem clara
3. **Estados desconectados** - Componentes de UI não seguem sequência lógica
4. **Enterprise sempre ativa** - Sistema vai direto para 5 chamadas sem mostrar paletas

---

## ✅ PRÓXIMOS PASSOS

1. Criar um orquestrador de fluxo linear
2. Garantir que cada fase complete antes da próxima
3. Conectar os componentes de UI na sequência correta
4. Adicionar controle manual para pular fases
