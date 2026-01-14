# 🧠 Go Brain API + Starter Kit Marketplace

> **"Cada geração é um ativo econômico reutilizável"**

[![Go](https://img.shields.io/badge/Go-1.21+-00ADD8.svg)](https://golang.org/)
[![Gin](https://img.shields.io/badge/Gin-1.9+-00ADD8.svg)](https://gin-gonic.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57.svg)](https://sqlite.org/)
[![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-orange.svg)](https://ai.google.dev/)

## 🎯 O Que É

Sistema backend em Go que combina:

1. **Brain API** - Geração de código com Gemini 2.0 Flash
2. **Starter Kit Marketplace** - Armazenamento e venda de código gerado
3. **Code Classifier** - Modelo pequeno que julga qualidade do código

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GO BRAIN API ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   [Frontend React]                                                          │
│        │                                                                    │
│        ▼                                                                    │
│   [Go Brain API :8080]                                                      │
│        │                                                                    │
│        ├── /v1/brain/* ──────────► [Gemini 2.0 Flash]                      │
│        │       │                                                            │
│        │       └── generate-and-save ──► Auto-save como Starter Kit        │
│        │                                                                    │
│        └── /v1/marketplace/* ────► [SQLite + Classifier]                   │
│                │                                                            │
│                ├── POST /kits ────► Criar Starter Kit                      │
│                ├── GET /kits ─────► Listar kits públicos                   │
│                ├── POST /classify ► Classificar código                     │
│                ├── POST /publish ─► Publicar no marketplace                │
│                └── GET /stats ────► Estatísticas                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Requisitos

- Go 1.21+
- GEMINI_API_KEY (obtenha em https://aistudio.google.com/app/apikey)

### Instalação

```powershell
# 1. Entre na pasta
cd go-brain-api

# 2. Configure a API Key
$env:GEMINI_API_KEY = "sua_chave_aqui"

# 3. Execute
.\start-marketplace.ps1
```

Ou manualmente:

```bash
# Baixar dependências
go mod tidy

# Compilar
go build -o brain-api.exe .

# Executar
./brain-api.exe
```

## 📡 Endpoints

### Brain API

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/health` | GET | Health check |
| `/v1/brain/query` | POST | Query genérica ao Gemini |
| `/v1/brain/generate-code` | POST | Gerar código |
| `/v1/brain/analyze-code` | POST | Analisar código |
| `/v1/brain/generate-and-save` | POST | **Gerar + Auto-save como Starter Kit** |

### Marketplace API

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/v1/marketplace/kits` | POST | Criar Starter Kit |
| `/v1/marketplace/kits` | GET | Listar kits públicos |
| `/v1/marketplace/kits/:id` | GET | Buscar kit por ID |
| `/v1/marketplace/my-kits` | GET | Listar meus kits |
| `/v1/marketplace/classify` | POST | Classificar código |
| `/v1/marketplace/kits/:id/publish` | POST | Publicar kit |
| `/v1/marketplace/kits/:id/unpublish` | POST | Despublicar kit |
| `/v1/marketplace/stats` | GET | Estatísticas |
| `/v1/marketplace/training-data` | GET | Exportar dados para fine-tuning |

## 🔧 Exemplos de Uso

### Gerar Código e Auto-Save

```bash
curl -X POST http://localhost:8080/v1/brain/generate-and-save \
  -H "Content-Type: application/json" \
  -H "X-Owner-ID: user_123" \
  -d '{
    "input": "Crie um dashboard de vendas moderno com gráficos",
    "mode": "code"
  }'
```

Resposta:
```json
{
  "output": "<!DOCTYPE html>...",
  "metadata": {
    "model": "gemini-2.0-flash-exp",
    "mode": "code"
  },
  "starter_kit": {
    "id": "sk_a1b2c3d4e5f6g7h8",
    "grade": "A",
    "quality_score": 85,
    "category": "dashboard",
    "complexity": "medium",
    "estimated_hours": 12
  }
}
```

### Classificar Código

```bash
curl -X POST http://localhost:8080/v1/marketplace/classify \
  -H "Content-Type: application/json" \
  -d '{
    "code": "<!DOCTYPE html>...",
    "prompt": "Dashboard de vendas"
  }'
```

Resposta:
```json
{
  "classification": {
    "quality_score": 85,
    "security_score": 90,
    "accessibility_score": 75,
    "performance_score": 80,
    "grade": "B",
    "patterns_detected": ["has_doctype", "has_viewport_meta", "uses_semantic_html"],
    "anti_patterns": ["no_aria_attributes"],
    "improvements": ["Adicionar atributos ARIA para melhor acessibilidade"]
  },
  "category": "dashboard",
  "complexity": "medium",
  "estimated_hours": 12,
  "can_be_listed": true
}
```

### Publicar no Marketplace

```bash
curl -X POST http://localhost:8080/v1/marketplace/kits/sk_a1b2c3d4e5f6g7h8/publish \
  -H "X-Owner-ID: user_123"
```

Resposta:
```json
{
  "success": true,
  "message": "Kit publicado no marketplace!",
  "suggested_price": 99.99
}
```

## 📊 Code Classifier

O classificador avalia código em 6 dimensões:

| Dimensão | Peso | O que avalia |
|----------|------|--------------|
| **Qualidade** | 30% | DOCTYPE, viewport, charset, semântica HTML |
| **Segurança** | 25% | Secrets expostos, eval(), innerHTML |
| **Acessibilidade** | 15% | alt em imagens, labels, ARIA |
| **Performance** | 10% | async/defer em scripts |
| **Arquitetura** | 10% | Organização, componentes |
| **Manutenibilidade** | 10% | Comentários, nomes descritivos |

### Grades

| Grade | Score | Significado |
|-------|-------|-------------|
| A | 90-100 | Excelente, pronto para produção |
| B | 80-89 | Bom, pequenos ajustes |
| C | 70-79 | Aceitável, melhorias recomendadas |
| D | 60-69 | Abaixo do esperado |
| F | 0-59 | Não recomendado |

## 💰 Modelo de Monetização

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
│              Baseado em:                                        │
│              • Complexidade                                     │
│              • Qualidade                                        │
│              • Horas economizadas                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Cálculo de Preço

```go
basePrice = complexidade (low: $29, medium: $99, high: $299, enterprise: $999)
qualityMultiplier = quality_score / 100
hoursMultiplier = 1.0 (ou 1.5 se > 40h, ou 2.0 se > 100h)
integrationBonus = número_de_integrações * $10

finalPrice = (basePrice * qualityMultiplier * hoursMultiplier) + integrationBonus
```

## 📁 Estrutura de Arquivos

```
go-brain-api/
├── main.go                 # Servidor principal + integração
├── starter_kit.go          # Tipos e estruturas do Starter Kit
├── starter_kit_store.go    # Persistência SQLite
├── classifier.go           # Modelo pequeno que julga código
├── marketplace_api.go      # Endpoints REST do marketplace
├── go.mod                  # Dependências
├── go.sum                  # Lock de dependências
├── start-marketplace.bat   # Script de inicialização (Windows CMD)
├── start-marketplace.ps1   # Script de inicialização (PowerShell)
├── data/                   # Diretório de dados
│   └── marketplace.db      # Banco SQLite
└── README.md               # Este arquivo
```

## 🔗 Integração com Frontend

O frontend TypeScript se conecta via:

- `services/StarterKitService.ts` - Cliente HTTP
- `services/StarterKitIntegration.ts` - Integração com store
- `hooks/useStarterKit.ts` - React hook
- `components/StarterKitMarketplace.tsx` - UI do marketplace
- `components/StarterKitIndicator.tsx` - Indicador visual

## 📈 Roadmap

- [x] Brain API com Gemini
- [x] Starter Kit Store (SQLite)
- [x] Code Classifier (heurístico)
- [x] Marketplace API
- [x] Auto-save de gerações
- [x] Cálculo de preço
- [ ] Fine-tuning do classificador
- [ ] Sistema de pagamentos (Stripe)
- [ ] Dashboard de analytics
- [ ] API de busca semântica

## 📝 Licença

MIT

---

**Go Brain API** - Transformando código em ativos econômicos 🧠💰
