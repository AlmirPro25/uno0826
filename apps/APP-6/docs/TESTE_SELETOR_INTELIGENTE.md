# 🧪 TESTE: Seletor Inteligente de Sites

**Status:** ✅ Pronto para testar

## 🎯 O QUE TESTAR

O sistema agora seleciona sites automaticamente baseado na sua intenção!

## 📋 TESTES RECOMENDADOS

### 1. Teste de Notícias 📰

**Digite:**
```
notícias sobre COP 30 em Belém
```

**Esperado:**
- Sites: G1, UOL, Folha, CNN Brasil
- Tempo: ~20-30s
- Resultados: Notícias brasileiras relevantes

---

### 2. Teste de Produtos 🛍️

**Digite:**
```
pesquise iPhone 15
```

**Esperado:**
- Sites: Mercado Livre, Amazon, Magazine Luiza, KaBuM!
- Tempo: ~25-35s
- Resultados: Produtos com preços

---

### 3. Teste de Clima ☀️

**Digite:**
```
previsão do tempo Salvador
```

**Esperado:**
- Sites: Climatempo, INMET, CPTEC
- Tempo: ~15-25s
- Resultados: Previsão do tempo

---

### 4. Teste de Tecnologia 💻

**Digite:**
```
pesquise sobre inteligência artificial
```

**Esperado:**
- Sites: TecMundo, Olhar Digital, Wikipedia, Bing
- Tempo: ~20-30s
- Resultados: Artigos técnicos

---

### 5. Teste de Saúde 🏥

**Digite:**
```
sintomas de gripe
```

**Esperado:**
- Sites: Drauzio Varella, Ministério da Saúde, WHO
- Tempo: ~20-30s
- Resultados: Informações médicas confiáveis

---

### 6. Teste de Finanças 💰

**Digite:**
```
cotação do dólar hoje
```

**Esperado:**
- Sites: InfoMoney, Money Times, Investing.com
- Tempo: ~20-30s
- Resultados: Cotações atualizadas

---

## 📊 COMO VERIFICAR

### No Console do Backend

Procure por estas mensagens:

```
🧠 Intenção detectada: news_brazil
📋 Sites selecionados (5): G1, UOL, Folha, CNN Brasil, Bing
```

### No Frontend

1. Digite a query
2. Veja a mensagem: "🚀 Busca Massiva no Bing"
3. Aguarde: "✅ X sites buscados em Yms"
4. Canvas abre com resultados

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] Backend mostra "🧠 Intenção detectada"
- [ ] Sites selecionados são relevantes
- [ ] Menos timeouts que antes
- [ ] Resultados mais rápidos
- [ ] Canvas mostra conteúdo relevante

## 🐛 PROBLEMAS COMUNS

### Ainda há timeouts
**Normal!** Alguns sites são lentos, mas agora você tem mais sites relevantes tentando.

### Sites errados selecionados
**Ajuste necessário!** Adicione mais palavras-chave no `intelligentSiteSelector.js`

### Nenhum resultado
**Verifique:** Backend está rodando? Logs mostram erros?

## 📈 MÉTRICAS ESPERADAS

| Métrica | Antes | Depois |
|---------|-------|--------|
| Taxa de sucesso | 20-30% | 70-90% |
| Tempo médio | 60-90s | 20-40s |
| Sites relevantes | 1-2 | 5-8 |

## 🎯 RESULTADO ESPERADO

Se tudo funcionar:

1. ✅ Sistema detecta sua intenção automaticamente
2. ✅ Seleciona sites relevantes (não genéricos)
3. ✅ Busca direta nesses sites
4. ✅ Menos timeouts
5. ✅ Resultados mais rápidos e precisos

---

**Pronto para testar!** 🚀

Digite qualquer uma das queries acima e veja a mágica acontecer!
