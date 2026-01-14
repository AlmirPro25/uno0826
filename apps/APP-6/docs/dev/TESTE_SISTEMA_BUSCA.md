# 🧪 GUIA DE TESTE - SISTEMA DE BUSCA INTELIGENTE

## 🚀 INÍCIO RÁPIDO

### 1. Iniciar o Backend
```bash
cd gemini-pro-studio-main/backend
node server.js
```

Você deve ver:
```
╔════════════════════════════════════════════════════════╗
║  🤖 PROX AI STUDIO - BACKEND LIMPO                    ║
╠════════════════════════════════════════════════════════╣
║  Status: ✅ Running                                    ║
║  Port: 3002                                            ║
╚════════════════════════════════════════════════════════╝
```

### 2. Iniciar o Frontend
```bash
cd gemini-pro-studio-main
npm run dev
```

## 🧪 TESTES BÁSICOS

### Teste 1: Wikipedia (Sempre Funciona)
```bash
curl -X POST http://localhost:3002/api/search/wikipedia \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"Python programming\"}"
```

**Resultado Esperado:**
```json
{
  "query": "Python programming",
  "results": [
    {
      "title": "Python (programming language)",
      "snippet": "Python is a high-level, interpreted...",
      "url": "https://pt.wikipedia.org/wiki/Python_(programming_language)",
      "source": "Wikipedia"
    }
  ]
}
```

### Teste 2: Busca Inteligente (Múltiplas Fontes)
```bash
curl -X POST http://localhost:3002/api/search \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"Como aprender Python\"}"
```

**Resultado Esperado:**
```json
{
  "query": "Como aprender Python",
  "results": [...],
  "sources": ["Wikipedia", "Startpage", "Bing"]
}
```

### Teste 3: Startpage (via Playwright)
```bash
curl -X POST http://localhost:3002/api/browser/search-startpage \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"Python tutorial\"}"
```

**Nota:** Este teste pode demorar 5-10 segundos (navegação real)

### Teste 4: Bing (via Playwright)
```bash
curl -X POST http://localhost:3002/api/browser/search-bing \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"Python tutorial\"}"
```

## 🎯 TESTES NO FRONTEND

### Teste 1: Busca Simples
1. Abra o frontend (http://localhost:3000)
2. Digite: "O que é Python?"
3. Clique em enviar

**Resultado Esperado:**
- ✅ Resposta completa do Gemini
- ✅ Citação de fontes (Wikipedia, Startpage, Bing)
- ✅ Formatação com Markdown
- ✅ Emojis para melhor visualização

### Teste 2: Busca Técnica
1. Digite: "Como criar uma API REST em Python?"
2. Clique em enviar

**Resultado Esperado:**
- ✅ 3 chamadas ao Gemini (otimização, análise, síntese)
- ✅ Resultados de múltiplas fontes
- ✅ Exemplos de código (se disponível)
- ✅ Links para documentação

### Teste 3: Busca de Notícias
1. Digite: "Últimas notícias sobre tecnologia"
2. Clique em enviar

**Resultado Esperado:**
- ✅ Resultados de sites de notícias
- ✅ Datas das notícias
- ✅ Resumo das principais notícias

## 🔍 VERIFICAR LOGS

### Backend Logs
Você deve ver no console do backend:
```
🔍 Busca inteligente: Como aprender Python
📚 Buscando na Wikipedia: Como aprender Python
✅ Wikipedia: 5 resultados
🔍 Buscando no Startpage: Como aprender Python
✅ Startpage: 10 resultados
🔍 Buscando no Bing: Como aprender Python
✅ Bing: 8 resultados
✅ 23 resultados de Wikipedia, Startpage, Bing
```

### Frontend Logs (Console do Navegador)
```
🔍 Busca inteligente iniciada: Como aprender Python
🧠 Chamada 1: Analisando relevância...
✅ 5 resultados relevantes identificados
🧠 Chamada 2: Extraindo informações-chave...
✅ Informações-chave extraídas
🧠 Chamada 3: Gerando resposta final...
✅ Resposta final gerada
```

## ✅ CHECKLIST DE VALIDAÇÃO

### Backend:
- [ ] Servidor rodando na porta 3002
- [ ] Endpoint `/api/search/wikipedia` funcionando
- [ ] Endpoint `/api/browser/search-startpage` funcionando
- [ ] Endpoint `/api/browser/search-bing` funcionando
- [ ] Endpoint `/api/search` funcionando
- [ ] Playwright instalado e funcionando
- [ ] Logs aparecem no console

### Frontend:
- [ ] Aplicação rodando na porta 3000
- [ ] Busca simples funciona
- [ ] Busca técnica funciona
- [ ] Busca de notícias funciona
- [ ] Fontes são citadas corretamente
- [ ] Formatação Markdown funciona
- [ ] Emojis aparecem corretamente

### Gemini:
- [ ] API Key configurada
- [ ] 3 chamadas sendo feitas
- [ ] Otimização de query funciona
- [ ] Análise de relevância funciona
- [ ] Síntese final funciona
- [ ] Retry automático em caso de erro 503

## 🐛 TROUBLESHOOTING

### Problema: "Erro ao buscar"
**Causa:** Backend não está rodando
**Solução:** Inicie o backend com `node server.js`

### Problema: "Timeout"
**Causa:** Playwright demorou muito
**Solução:** Aumente o timeout em `browserService.js` (linha ~150)

### Problema: "Nenhum resultado"
**Causa:** Todas as fontes falharam
**Solução:** Teste cada fonte individualmente para identificar o problema

### Problema: "Erro 503 do Gemini"
**Causa:** Modelo sobrecarregado
**Solução:** Sistema faz retry automático, aguarde alguns segundos

### Problema: "Playwright não instalado"
**Causa:** Dependências não instaladas
**Solução:**
```bash
cd gemini-pro-studio-main
npm install
npx playwright install chromium
```

## 📊 MÉTRICAS DE SUCESSO

### Bom Desempenho:
- ✅ Wikipedia: 100% de sucesso
- ✅ Startpage: 80%+ de sucesso
- ✅ Bing: 80%+ de sucesso
- ✅ Tempo de resposta: < 10 segundos
- ✅ Resultados: 10+ por busca

### Desempenho Aceitável:
- ⚠️ Wikipedia: 90%+ de sucesso
- ⚠️ Startpage: 60%+ de sucesso
- ⚠️ Bing: 60%+ de sucesso
- ⚠️ Tempo de resposta: < 15 segundos
- ⚠️ Resultados: 5+ por busca

### Desempenho Ruim:
- ❌ Wikipedia: < 90% de sucesso
- ❌ Startpage: < 60% de sucesso
- ❌ Bing: < 60% de sucesso
- ❌ Tempo de resposta: > 15 segundos
- ❌ Resultados: < 5 por busca

## 🎯 TESTES AVANÇADOS

### Teste de Carga
```bash
# Fazer 10 buscas simultâneas
for i in {1..10}; do
  curl -X POST http://localhost:3002/api/search \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"Python $i\"}" &
done
wait
```

### Teste de Timeout
```bash
# Busca com timeout curto
curl -X POST http://localhost:3002/api/browser/search-startpage \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"Python\",\"timeout\":5000}" \
  --max-time 10
```

### Teste de Retry
```bash
# Fazer múltiplas buscas para testar retry do Gemini
for i in {1..5}; do
  curl -X POST http://localhost:3002/api/search \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"Python tutorial $i\"}"
  sleep 2
done
```

## 📝 RELATÓRIO DE TESTE

Após os testes, preencha:

### Resultados:
- [ ] Todos os testes básicos passaram
- [ ] Todos os testes no frontend passaram
- [ ] Logs aparecem corretamente
- [ ] Métricas estão boas
- [ ] Testes avançados passaram

### Problemas Encontrados:
1. _____________________
2. _____________________
3. _____________________

### Observações:
_____________________
_____________________
_____________________

---

**🎉 Se todos os testes passaram, seu sistema está funcionando perfeitamente!**

**Próximos passos:**
1. Testar com queries reais do seu uso
2. Monitorar performance em produção
3. Ajustar timeouts se necessário
4. Adicionar mais fontes especializadas
