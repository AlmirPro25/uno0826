# 🔧 CORREÇÃO: detectQueryType não definido

**Data:** 2025-10-29  
**Erro:** `ReferenceError: detectQueryType is not defined`  
**Status:** ✅ CORRIGIDO

## 🐛 PROBLEMA

Após remover a função `detectQueryType` do `massiveSearchService.js` e substituir pela versão inteligente, esqueci que ela ainda estava sendo usada em dois lugares:

```javascript
// Linha 230
const queryType = detectQueryType(query); // ❌ Função não existe mais!

// Linha 314
queryType: detectQueryType(query), // ❌ Função não existe mais!
```

**Erro no frontend:**
```
Error: Erro na busca massiva: Internal Server Error
```

**Erro no backend:**
```
ReferenceError: detectQueryType is not defined
```

## ✅ SOLUÇÃO

### 1. Importar função do seletor inteligente

```javascript
// ANTES
import { selectSitesForIntent, generateSearchUrls } from './intelligentSiteSelector.js';

// DEPOIS
import { selectSitesForIntent, generateSearchUrls, detectUserIntent } from './intelligentSiteSelector.js';
```

### 2. Substituir chamadas

```javascript
// ANTES
const queryType = detectQueryType(query);

// DEPOIS
const queryType = detectUserIntent(query);
```

## 📝 MUDANÇAS REALIZADAS

**Arquivo:** `backend/services/massiveSearchService.js`

1. **Linha 6:** Adicionado `detectUserIntent` ao import
2. **Linha 230:** Substituído `detectQueryType` por `detectUserIntent`
3. **Linha 314:** Substituído `detectQueryType` por `detectUserIntent`

## 🧪 TESTE DE VALIDAÇÃO

```bash
# Testar busca massiva
curl -X POST http://localhost:3002/api/search/massive \
  -H "Content-Type: application/json" \
  -d '{"query":"pesquise iPhone 15","maxSites":10}'
```

**Resultado esperado:**
```
✅ Navegador inicializado
🧠 Intenção detectada: ecommerce_brazil
📋 Sites selecionados: Mercado Livre, Amazon Brasil, Magazine Luiza...
🔍 Iniciando buscas paralelas...
```

## ✅ VERIFICAÇÃO

Logs do backend após correção:

```
🚀 ========== BUSCA MASSIVA PARALELA ==========
📝 Query: "pesquise iPhone 15"
🧠 Intenção detectada: ecommerce_brazil
📋 Sites selecionados (8): Mercado Livre, Amazon Brasil, Magazine Luiza, Americanas, Casas Bahia, Extra, Bing, Startpage
🔍 Iniciando buscas paralelas...
✅ Navegador inicializado
```

## 🎯 RESULTADO

- ✅ Erro corrigido
- ✅ Backend reiniciado
- ✅ Busca massiva funcionando
- ✅ Seletor inteligente funcionando
- ✅ Sites corretos sendo selecionados

---

**Tempo de correção:** ~5 minutos  
**Complexidade:** Baixa (import faltando)  
**Impacto:** Crítico (sistema não funcionava)
