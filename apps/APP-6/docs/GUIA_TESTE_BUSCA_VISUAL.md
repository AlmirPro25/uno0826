# 🧪 GUIA DE TESTE: Busca Visual Inteligente

**Sistema:** Busca Visual Inteligente  
**Data:** 30/10/2025

---

## 🚀 COMO TESTAR

### 1. Iniciar o Sistema

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd ..
npm run dev
```

Aguarde as mensagens:
```
✅ Backend rodando em http://localhost:3002
✅ Frontend rodando em http://localhost:3000
```

---

## 🧪 TESTES RECOMENDADOS

### Teste 1: Busca de Produtos 🛍️

**Comando:**
```
Busque iPhone 13
```

**O que deve acontecer:**
1. ✅ Mensagem: "🔍👁️ Busca Visual Inteligente"
2. ✅ Navegação em 5 sites (Mercado Livre, Amazon, etc)
3. ✅ Captura de 5 screenshots
4. ✅ Análise visual com Gemini
5. ✅ Resposta natural com:
   - Produtos identificados visualmente
   - Preços corretos
   - Links diretos
   - Comparações
   - Recomendações

**Exemplo de resposta esperada:**
```
Olha, encontrei várias opções de iPhone 13 pra você!

O melhor preço que vi foi R$ 2.899 no Mercado Livre, com frete grátis 
e vendedor confiável. Se você prefere parcelar, a Amazon tem por 
R$ 3.099 em 12x sem juros.

Aqui estão as 3 melhores ofertas que identifiquei:

1. **Mercado Livre** - R$ 2.899 (melhor preço! 🏆)
   - iPhone 13 128GB Azul
   - Frete grátis
   - Vendedor com 99% de avaliações positivas
   - [Ver produto](link)

2. **Amazon** - R$ 3.099 (12x sem juros)
   - iPhone 13 128GB Preto
   - Entrega Prime em 1 dia
   - Garantia estendida disponível
   - [Ver produto](link)

3. **Magazine Luiza** - R$ 3.199 (cashback R$ 150)
   - iPhone 13 128GB Branco
   - Retire na loja em 2 horas
   - Parcelamento em 10x
   - [Ver produto](link)

Todos os produtos são novos e de vendedores confiáveis. Quer que eu 
busque mais informações sobre algum deles?
```

---

### Teste 2: Busca de Notícias 📰

**Comando:**
```
Busque notícias sobre inteligência artificial
```

**O que deve acontecer:**
1. ✅ Detecta intent: "news"
2. ✅ Navega em G1, UOL, Folha, Estadão, BBC
3. ✅ Captura manchetes visíveis
4. ✅ Síntese das principais notícias

**Exemplo de resposta esperada:**
```
Aqui estão as principais notícias sobre inteligência artificial que 
encontrei hoje:

**🔥 Destaque:**
"OpenAI anuncia GPT-5 com capacidades revolucionárias"
- Fonte: G1 Tecnologia
- Publicado há 3 horas
- Novo modelo promete raciocínio avançado e multimodalidade
- [Ler notícia](link)

**💼 Negócios:**
"Empresas brasileiras investem R$ 2 bi em IA"
- Fonte: Folha de S.Paulo
- Crescimento de 150% em relação a 2023
- [Ler mais](link)

**🌍 Internacional:**
"UE aprova regulamentação para IA"
- Fonte: BBC Brasil
- Novas regras entram em vigor em 2025
- [Detalhes](link)

Quer que eu aprofunde em alguma dessas notícias?
```

---

### Teste 3: Busca Geral 🔍

**Comando:**
```
Busque informações sobre Python
```

**O que deve acontecer:**
1. ✅ Detecta intent: "general"
2. ✅ Navega em Bing, Wikipedia, Startpage
3. ✅ Captura páginas de resultados
4. ✅ Síntese informativa

---

## 🔍 VERIFICAÇÕES IMPORTANTES

### No Console do Backend:

Você deve ver:
```
🔍👁️ ========== BUSCA VISUAL INTELIGENTE ==========
📝 Query: "iPhone 13"
🌐 Sites: 5
⏱️  Timeout: 30000ms

🎯 Intenção: products
📋 Sites selecionados: Mercado Livre, Amazon, Magazine Luiza, ...

🌐 Iniciando navegação paralela...
🌐 [Mercado Livre] Navegando...
🌐 [Amazon] Navegando...
...
📸 [Mercado Livre] Capturando screenshot...
📸 [Amazon] Capturando screenshot...
...
📝 [Mercado Livre] Extraindo conteúdo...
📝 [Amazon] Extraindo conteúdo...
...
✅ [Mercado Livre] Captura concluída
✅ [Amazon] Captura concluída
...

📊 Capturas: 5 sucesso, 0 falhas

🧠 Sintetizando com Gemini Vision...
🧠 Enviando 11 partes para o Gemini (texto + 5 screenshots)...
✅ Síntese concluída

✅ ========== BUSCA CONCLUÍDA ==========
⏱️  Duração: 18s
📊 Sites analisados: 5
📸 Screenshots capturados: 5
==========================================
```

### No Console do Frontend:

Você deve ver:
```
🔍👁️ BUSCA VISUAL INTELIGENTE: "iPhone 13"
✅ Busca visual concluída: 5 sites analisados
📸 Screenshots capturados: 5
🧠 Resposta sintetizada com visão multimodal
```

---

## ❌ PROBLEMAS COMUNS

### Problema 1: "Erro ao navegar"

**Sintoma:**
```
❌ [Mercado Livre] Erro: Navigation timeout
```

**Solução:**
- Aumentar timeout no código
- Verificar conexão internet
- Tentar novamente (sites podem estar lentos)

### Problema 2: "Erro ao sintetizar"

**Sintoma:**
```
❌ Erro ao sintetizar: API key not valid
```

**Solução:**
- Verificar `GEMINI_API_KEY` no `.env`
- Verificar quota da API Gemini
- Verificar se a chave tem acesso ao modelo `gemini-2.0-flash-exp`

### Problema 3: "Resposta genérica"

**Sintoma:**
Resposta não menciona preços ou detalhes visuais

**Solução:**
- Verificar se screenshots estão sendo capturados
- Verificar logs do backend
- Testar com menos sites (3 ao invés de 5)

### Problema 4: "Backend não responde"

**Sintoma:**
```
❌ Erro na busca: HTTP 500
```

**Solução:**
```bash
# Reiniciar backend
cd backend
npm start
```

---

## 📊 MÉTRICAS DE SUCESSO

### ✅ Teste Passou Se:

1. **Navegação:**
   - ✅ Pelo menos 3 sites navegados com sucesso
   - ✅ Screenshots capturados
   - ✅ Conteúdo extraído

2. **Síntese:**
   - ✅ Resposta natural e conversacional
   - ✅ Menciona informações visuais (preços, títulos)
   - ✅ Inclui links corretos
   - ✅ Faz recomendações

3. **Performance:**
   - ✅ Tempo total < 30 segundos
   - ✅ Sem erros críticos
   - ✅ Resposta completa

---

## 🎯 CHECKLIST DE TESTE

- [ ] Backend iniciado sem erros
- [ ] Frontend iniciado sem erros
- [ ] Teste 1: Busca de produtos funcionou
- [ ] Teste 2: Busca de notícias funcionou
- [ ] Teste 3: Busca geral funcionou
- [ ] Screenshots sendo capturados (verificar logs)
- [ ] Gemini Vision analisando imagens
- [ ] Respostas naturais e conversacionais
- [ ] Links corretos nas respostas
- [ ] Performance aceitável (< 30s)

---

## 💡 DICAS

1. **Primeira vez:** Teste com produtos (mais visual)
2. **Paciência:** Navegação leva 15-30 segundos
3. **Logs:** Acompanhe o console do backend
4. **Variações:** Teste diferentes queries
5. **Comparação:** Compare com busca antiga

---

## 🚀 PRÓXIMO NÍVEL

Depois que funcionar, teste queries mais complexas:

```
Busque notebook gamer até R$ 5000
Busque notícias sobre eleições no Brasil
Busque receitas de bolo de chocolate
Busque cursos de Python online
```

---

**Boa sorte nos testes! 🎉**

Se tudo funcionar, você terá um sistema de busca que **VÊ** as páginas e **ENTENDE** o contexto visual! 🔍👁️
