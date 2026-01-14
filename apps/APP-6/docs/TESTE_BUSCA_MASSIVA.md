# 🧪 TESTE: Busca Massiva Integrada

**Data:** 2025-10-29  
**Status:** ✅ PRONTO PARA TESTAR

## 🎯 O QUE TESTAR

A integração da busca massiva com o Canvas existente.

## 📋 PRÉ-REQUISITOS

1. ✅ Backend rodando na porta 3002
2. ✅ Frontend rodando na porta 3000
3. ✅ Imports corrigidos no backend

## 🚀 COMO TESTAR

### 1. Verificar Backend

```bash
# Verificar se backend está rodando
curl http://localhost:3002/api/search/massive -X POST -H "Content-Type: application/json" -d "{\"query\":\"teste\",\"maxSites\":3}"
```

**Resultado esperado:** JSON com `results`, `totalResults`, `duration`

### 2. Testar no Frontend

**Abra o navegador:** http://localhost:3000

**Digite no chat:**
```
pesquise iPhone 15
```

**Fluxo esperado:**

```
1. Mensagem aparece: "🚀 Busca Massiva no Bing"
   ↓
2. Progresso: "🌐 Buscando em 10 sites simultaneamente..."
   ↓
3. Resultado: "✅ X sites buscados em Yms"
   ↓
4. Navegação: "🎯 Navegando nos top 5 resultados..."
   ↓
5. Canvas abre com:
   - Screenshot do primeiro site
   - Análise do Gemini
   - Produtos encontrados
   - Recomendações
```

### 3. Outros Testes

**Teste 1: Busca de produtos**
```
pesquise notebooks gamer
```

**Teste 2: Busca de notícias**
```
pesquise notícias sobre tecnologia
```

**Teste 3: Busca geral**
```
pesquise Python tutorial
```

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] Backend responde na porta 3002
- [ ] Rota `/api/search/massive` funciona
- [ ] Frontend mostra "Busca Massiva no Bing"
- [ ] Busca retorna resultados em ~30-60s
- [ ] Top 5 URLs são navegadas
- [ ] Canvas abre com resultados
- [ ] Gemini analisa o conteúdo
- [ ] Produtos são exibidos (se houver)

## 🐛 PROBLEMAS COMUNS

### Erro: "Não encontrado"
**Causa:** Backend não está rodando ou imports incorretos  
**Solução:** Reiniciar backend com `npm start` na pasta `backend/`

### Erro: "Timeout"
**Causa:** Sites demorando muito para responder  
**Solução:** Normal, alguns sites são lentos. A busca continua com os que funcionam.

### Canvas não abre
**Causa:** Nenhum resultado foi navegado com sucesso  
**Solução:** Verificar logs do backend para ver quais sites falharam

## 📊 MÉTRICAS ESPERADAS

- **Busca massiva:** 10 sites em paralelo
- **Tempo:** ~30-60 segundos
- **Resultados:** 5-10 sites com sucesso
- **Top 5:** Navegados e analisados
- **Canvas:** Mostra primeiro resultado + análise

## 🎯 RESULTADO FINAL

Se tudo funcionar:

1. ✅ Busca massiva mais rápida que Gemini
2. ✅ Mais resultados (10 sites vs 2-3)
3. ✅ Bing como padrão (prioridade 1)
4. ✅ Canvas mostra análise completa
5. ✅ Produtos e preços extraídos

---

**Pronto para testar!** 🚀
