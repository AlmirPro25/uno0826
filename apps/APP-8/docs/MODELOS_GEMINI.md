# 🤖 Modelos Gemini - Guia Atualizado

## ✅ Modelos Disponíveis (2025)

### 📊 Modelos Principais

| Modelo | Uso Recomendado | Características |
|--------|-----------------|-----------------|
| **gemini-flash-latest** | ✅ Uso geral | Rápido, multimodal, melhor custo-benefício |
| **gemini-2.5-flash** | ✅ Versão específica | Flash com versão fixa (recomendado) |
| **gemini-flash-lite-latest** | ✅ Tarefas simples | Mais rápido, mais barato, menos tokens |
| **gemini-2.5-pro** | ✅ Tarefas complexas | Mais inteligente, mais caro |

### 🎯 Quando Usar Cada Modelo

#### gemini-flash-latest (Recomendado)
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
```

**Use para:**
- Análise de imagens e vídeos
- Conversação em tempo real
- Resumos e análises
- Visão computacional
- Tarefas gerais

**Vantagens:**
- ✅ Sempre atualizado para a versão mais recente
- ✅ Multimodal (texto, imagem, áudio, vídeo)
- ✅ Rápido e eficiente
- ✅ Bom custo-benefício

#### gemini-flash-lite-latest
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
```

**Use para:**
- Tarefas simples e rápidas
- Classificação de texto
- Extração de dados simples
- Quando velocidade é prioridade

**Vantagens:**
- ✅ Mais rápido que o Flash
- ✅ Mais barato
- ✅ Menor latência

**Limitações:**
- ⚠️ Menos tokens de contexto
- ⚠️ Menos capacidades avançadas

#### gemini-2.5-pro
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
```

**Use para:**
- Raciocínio profundo
- Análises complexas
- Código avançado
- Tarefas que exigem mais inteligência

**Vantagens:**
- ✅ Mais inteligente
- ✅ Melhor em tarefas complexas
- ✅ Mais tokens de contexto

**Desvantagens:**
- ⚠️ Mais caro
- ⚠️ Mais lento

---

## ❌ Modelos Descontinuados (NÃO USE)

### Modelos Antigos que NÃO Existem Mais

| Modelo Antigo | Status | Use em Vez |
|---------------|--------|------------|
| `gemini-pro` | ❌ Descontinuado | `gemini-flash-latest` |
| `gemini-pro-vision` | ❌ Descontinuado | `gemini-flash-latest` |
| `gemini-1.5-pro` | ❌ Descontinuado | `gemini-2.5-pro` |
| `gemini-1.5-flash` | ❌ Descontinuado | `gemini-flash-latest` |
| `gemini-2.0-flash-exp` | ❌ Experimental | `gemini-2.5-flash` |
| `gemini-robotics-er-1.5-preview` | ✅ Use para robótica | Específico para visão robótica |

---

## 🔧 Como Atualizar Seu Código

### Antes (Modelos Antigos)
```typescript
// ❌ NÃO USE MAIS
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
const model = genAI.getGenerativeModel({ model: 'gemini-robotics-er-1.5-preview' });
```

### Depois (Modelos Atuais)
```typescript
// ✅ USE ESTES
const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
```

---

## 📊 Comparação de Modelos

### Performance

```
Velocidade (mais rápido → mais lento):
gemini-flash-lite-latest > gemini-flash-latest > gemini-2.5-pro

Inteligência (mais inteligente → menos):
gemini-2.5-pro > gemini-flash-latest > gemini-flash-lite-latest

Custo (mais barato → mais caro):
gemini-flash-lite-latest < gemini-flash-latest < gemini-2.5-pro
```

### Capacidades

| Capacidade | Flash Lite | Flash | Pro |
|------------|------------|-------|-----|
| Texto | ✅ | ✅ | ✅ |
| Imagens | ✅ | ✅ | ✅ |
| Vídeo | ⚠️ Limitado | ✅ | ✅ |
| Áudio | ⚠️ Limitado | ✅ | ✅ |
| Tokens de contexto | 32k | 128k | 2M |
| Function calling | ✅ | ✅ | ✅ |
| Streaming | ✅ | ✅ | ✅ |

---

## 🎯 Recomendações por Caso de Uso

### Nosso Sistema (Gemini Live Companion)

```typescript
// Backend - Análises gerais
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Visão computacional geral
const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Visão robótica (específico)
const roboticsModel = genAI.getGenerativeModel({ model: 'gemini-robotics-er-1.5-preview' });

// Planejamento de tarefas
const plannerModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Modo pensamento profundo (opcional)
const thinkingModel = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

// Tarefas rápidas (opcional)
const quickModel = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
```

### Por Funcionalidade

**Sessão ao Vivo:**
```typescript
// Use gemini-2.5-flash para multimodal em tempo real
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
```

**Análise de Imagens:**
```typescript
// Use gemini-2.5-flash para visão computacional geral
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
```

**Visão Robótica (Coordenadas e Bounding Boxes):**
```typescript
// Use gemini-robotics-er-1.5-preview para robótica
const model = genAI.getGenerativeModel({ model: 'gemini-robotics-er-1.5-preview' });
```

**Raciocínio Profundo:**
```typescript
// Use gemini-2.5-pro para análises complexas
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
```

**Classificação Rápida:**
```typescript
// Use gemini-flash-lite-latest para tarefas simples
const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
```

---

## 🔍 Como Verificar Modelos Disponíveis

### Via API
```bash
curl https://generativelanguage.googleapis.com/v1beta/models?key=SUA_API_KEY
```

### Via Código
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function listModels() {
  const models = await genAI.listModels();
  models.forEach(model => {
    console.log(`- ${model.name}`);
  });
}

listModels();
```

---

## 📝 Notas Importantes

### 1. Use `-latest` para Sempre Ter a Versão Mais Recente

```typescript
// ✅ Recomendado - sempre atualizado
const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

// ⚠️ Versão fixa - pode ficar desatualizada
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
```

### 2. Modelos Experimentais Podem Mudar

Evite usar modelos com sufixos como:
- `-exp` (experimental)
- `-preview` (preview)
- `-beta` (beta)

Eles podem ser descontinuados sem aviso.

### 3. Verifique a Documentação Oficial

Sempre consulte a documentação mais recente:
- https://ai.google.dev/gemini-api/docs/models

---

## 🚀 Migração Rápida

Se você está usando modelos antigos, faça a migração:

### Passo 1: Encontre Todos os Modelos Antigos
```bash
# No terminal
grep -r "gemini-pro\|gemini-1.5\|gemini-2.0-flash-exp\|gemini-robotics" .
```

### Passo 2: Substitua por Modelos Atuais
```bash
# Substitua todos de uma vez (cuidado!)
find . -type f -name "*.ts" -exec sed -i 's/gemini-pro/gemini-flash-latest/g' {} +
find . -type f -name "*.ts" -exec sed -i 's/gemini-1.5-flash/gemini-flash-latest/g' {} +
find . -type f -name "*.ts" -exec sed -i 's/gemini-2.0-flash-exp/gemini-flash-latest/g' {} +
find . -type f -name "*.ts" -exec sed -i 's/gemini-robotics-er-1.5-preview/gemini-flash-latest/g' {} +
```

### Passo 3: Teste
```bash
# Teste o sistema
npm run dev
cd backend && npm run dev
```

---

## ✅ Checklist de Migração

- [ ] Substituir `gemini-pro` por `gemini-flash-latest`
- [ ] Substituir `gemini-1.5-flash` por `gemini-flash-latest`
- [ ] Substituir `gemini-2.0-flash-exp` por `gemini-flash-latest`
- [ ] Substituir `gemini-robotics-er-1.5-preview` por `gemini-flash-latest`
- [ ] Atualizar documentação
- [ ] Atualizar scripts de teste
- [ ] Testar todas as funcionalidades
- [ ] Verificar logs de erro

---

**Última atualização:** 12 de Novembro de 2025  
**Versão:** 1.0  
**Status:** ✅ Atualizado com modelos de 2025
