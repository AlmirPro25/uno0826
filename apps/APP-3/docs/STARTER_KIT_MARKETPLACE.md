# 🏪 STARTER KIT MARKETPLACE

> **"Cada geração é um ativo econômico reutilizável"**

## 📋 TL;DR

- **Sistema grátis** para usuários gerarem código
- **Cada geração** é automaticamente salva como Starter Kit
- **Modelo pequeno** classifica qualidade (não cria, apenas julga)
- **Marketplace** vende versões genéricas dos kits
- **Dataset** treina modelo interno (lock-in cognitivo)

---

## 🏗️ Arquitetura Completa

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         STARTER KIT MARKETPLACE SYSTEM                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   [Frontend React :5173]                                                        │
│        │                                                                        │
│        ├── StarterKitMarketplace.tsx ──► UI do Marketplace                     │
│        ├── MarketplaceDashboard.tsx ───► Analytics                             │
│        ├── StarterKitIndicator.tsx ────► Feedback visual                       │
│        └── useStarterKit.ts ───────────► React Hook                            │
│                    │                                                            │
│                    ▼                                                            │
│   [Go Brain API :8080]                                                          │
│        │                                                                        │
│        ├── /v1/brain/* ────────────────► Gemini 2.0 Flash                      │
│        │       └── generate-and-save ──► Auto-save Starter Kit                 │
│        │                                                                        │
│        └── /v1/marketplace/* ──────────► SQLite + Classifier                   │
│                │                                                                │
│                ├── POST /kits ─────────► Criar kit                             │
│                ├── POST /classify ─────► Classificar código                    │
│                ├── POST /publish ──────► Publicar no marketplace               │
│                └── GET /training-data ─► Exportar para fine-tuning             │
│                                                                                 │
│   [DAIA :8765]                                                                  │
│        │                                                                        │
│        └── Sincroniza com Starter Kits ► Dataset compartilhado                 │
│                                                                                 │
│   [Backend Node :3001]                                                          │
│        │                                                                        │
│        └── Integração com store ───────► Zustand                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 💰 Modelo de Monetização

### Fluxo de Valor

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE MONETIZAÇÃO                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   [Usuário gera GRÁTIS]                                        │
│          │                                                      │
│          ▼                                                      │
│   [Código é DELE] ◄──── Juridicamente protegido                │
│          │                                                      │
│          ▼                                                      │
│   [Sistema CLASSIFICA] ◄──── Modelo pequeno julga              │
│          │                                                      │
│          ├──► [Dataset interno] ──► Fine-tuning (lock-in)      │
│          │                                                      │
│          └──► [Marketplace] ──► Vende versões genéricas        │
│                    │                                            │
│                    ▼                                            │
│              [Preço: $29 - $999]                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Camadas de Monetização

| Camada | Descrição | Preço |
|--------|-----------|-------|
| **Grátis** | Geração normal, código é do usuário | $0 |
| **Starter Kit** | Versão genérica no marketplace | $29 - $99 |
| **Pro Kit** | Curado, documentado, testado | $99 - $299 |
| **Enterprise** | Projetos completos, suporte | $299 - $999 |

### Cálculo de Preço

```
basePrice = complexidade (low: $29, medium: $99, high: $299, enterprise: $999)
qualityMultiplier = quality_score / 100
hoursMultiplier = 1.0 (ou 1.5 se > 40h, ou 2.0 se > 100h)
integrationBonus = número_de_integrações * $10

finalPrice = (basePrice * qualityMultiplier * hoursMultiplier) + integrationBonus
```

---

## 🧠 Code Classifier

O modelo pequeno que **julga** (não cria):

### Dimensões Avaliadas

| Dimensão | Peso | O que avalia |
|----------|------|--------------|
| **Qualidade** | 30% | DOCTYPE, viewport, charset, semântica HTML |
| **Segurança** | 25% | Secrets expostos, eval(), innerHTML |
| **Acessibilidade** | 15% | alt em imagens, labels, ARIA |
| **Performance** | 10% | async/defer em scripts |
| **Arquitetura** | 10% | Organização, componentes |
| **Manutenibilidade** | 10% | Comentários, nomes descritivos |

### Grades

| Grade | Score | Pode Publicar? |
|-------|-------|----------------|
| A | 90-100 | ✅ Sim |
| B | 80-89 | ✅ Sim |
| C | 70-79 | ✅ Sim |
| D | 60-69 | ⚠️ Com ressalvas |
| F | 0-59 | ❌ Não |

### Regras Heurísticas (15+)

- `has_doctype` - Possui <!DOCTYPE html>
- `has_lang_attribute` - Tag html tem lang
- `has_viewport_meta` - Meta viewport
- `has_charset` - Charset UTF-8
- `uses_semantic_html` - Tags semânticas
- `images_have_alt` - Alt em imagens
- `forms_have_labels` - Labels em forms
- `has_aria_attributes` - Atributos ARIA
- `has_responsive_classes` - Classes responsivas
- `no_inline_scripts_unsafe` - Sem eval/innerHTML
- `no_exposed_secrets` - Sem API keys
- `scripts_async_defer` - Scripts otimizados
- `no_todo_comments` - Sem TODOs
- `no_empty_functions` - Sem funções vazias

---

## 📁 Arquivos do Sistema

### Backend Go

```
go-brain-api/
├── main.go                 # Servidor + integração
├── starter_kit.go          # Tipos do Starter Kit
├── starter_kit_store.go    # SQLite persistence
├── classifier.go           # Modelo que julga
├── marketplace_api.go      # REST endpoints
├── readme_generator.go     # Gerador de README automático
├── go.mod                  # Dependências
├── start-marketplace.bat   # Script Windows
├── start-marketplace.ps1   # Script PowerShell
└── README.md
```

### Frontend TypeScript

```
services/
├── StarterKitService.ts      # Cliente HTTP
├── StarterKitIntegration.ts  # Integração store

hooks/
└── useStarterKit.ts          # React hook

components/
├── StarterKitMarketplace.tsx # UI marketplace
├── MarketplaceDashboard.tsx  # Analytics
├── StarterKitIndicator.tsx   # Feedback visual
├── StarterKitPreview.tsx     # Preview no chat
└── marketplace/
    └── index.ts              # Exports

tests/
├── test-marketplace.js       # Testes básicos
└── test-marketplace-complete.js # Testes completos
```

---

## 🚀 Como Usar

### 1. Iniciar Sistema Completo

```batch
start-all.bat
```

Isso inicia:
- Frontend (:5173)
- Backend (:3001)
- Go Brain API (:8080)
- DAIA (:8765)

### 2. Testar Marketplace

```bash
node tests/test-marketplace.js
```

### 3. Integrar no Código

```typescript
import { useStarterKit } from '@/hooks/useStarterKit';

function MyComponent() {
  const { saveGeneration, lastSavedKit } = useStarterKit();

  const handleGenerate = async (code, prompt) => {
    // Salva automaticamente como Starter Kit
    const kit = await saveGeneration(code, prompt, {
      modelUsed: 'gemini-2.5-flash',
      manifestUsed: 'ECOMMERCE_SUPREME',
    });

    if (kit) {
      console.log(`Kit salvo: ${kit.id} (Grade: ${kit.classification.grade})`);
    }
  };
}
```

### 4. Auto-Save Automático

```typescript
import { useAutoSaveStarterKit } from '@/hooks/useStarterKit';

function CodePreview({ code, prompt }) {
  const { savedKit, isSaving, hasSaved } = useAutoSaveStarterKit(code, prompt);

  return (
    <div>
      {isSaving && <span>Salvando...</span>}
      {hasSaved && <span>✅ Salvo como {savedKit?.id}</span>}
    </div>
  );
}
```

---

## 📊 Endpoints da API

### Brain API

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/health` | GET | Health check |
| `/v1/brain/query` | POST | Query Gemini |
| `/v1/brain/generate-code` | POST | Gerar código |
| `/v1/brain/generate-and-save` | POST | Gerar + auto-save |

### Marketplace API

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/v1/marketplace/kits` | POST | Criar kit |
| `/v1/marketplace/kits` | GET | Listar públicos |
| `/v1/marketplace/kits/:id` | GET | Buscar por ID |
| `/v1/marketplace/my-kits` | GET | Meus kits |
| `/v1/marketplace/classify` | POST | Classificar |
| `/v1/marketplace/kits/:id/publish` | POST | Publicar |
| `/v1/marketplace/kits/:id/generate-readme` | POST | Gerar README |
| `/v1/marketplace/kits/:id/architecture-diagram` | GET | Diagrama ASCII |
| `/v1/marketplace/search` | GET | Buscar kits |
| `/v1/marketplace/stats` | GET | Estatísticas |
| `/v1/marketplace/training-data` | GET | Exportar dados |

---

## 🔮 Roadmap

- [x] Brain API com Gemini
- [x] Starter Kit Store (SQLite)
- [x] Code Classifier (heurístico)
- [x] Marketplace API
- [x] Auto-save de gerações
- [x] Cálculo de preço
- [x] UI do Marketplace
- [x] Dashboard de analytics
- [x] Integração com DAIA
- [x] README Generator automático
- [x] Diagrama de arquitetura ASCII
- [x] Busca de kits por texto
- [x] Preview component para chat
- [ ] Fine-tuning do classificador
- [ ] Sistema de pagamentos (Stripe)
- [ ] Busca semântica (embeddings)
- [ ] Reviews e ratings
- [ ] Sistema de afiliados

---

## 📝 Licença

MIT

---

**Starter Kit Marketplace** - Transformando código em ativos econômicos 🧠💰
