# 🔍👁️ SISTEMA DE BUSCA VISUAL INTELIGENTE

**Data:** 30/10/2025  
**Status:** ✅ Implementado

---

## 🎯 VISÃO GERAL

Sistema **UNIFICADO** que combina:
- ✅ Busca massiva paralela
- ✅ Navegação inteligente em páginas
- ✅ Captura de screenshots
- ✅ Análise visual com Gemini Vision
- ✅ Síntese natural e conversacional

**Resultado:** Um sistema que **VÊ** as páginas e **ENTENDE** o contexto visual!

---

## 🚀 COMO FUNCIONA

### Fluxo Completo:

```
Usuário: "Busque iPhone 13"
    ↓
1. 🧠 DETECTA INTENÇÃO
   - Produtos? Notícias? Geral?
   ↓
2. 🎯 SELECIONA SITES
   - Produtos: Mercado Livre, Amazon, Magazine Luiza...
   - Notícias: G1, UOL, Folha...
   - Geral: Bing, Wikipedia, Startpage...
   ↓
3. 🌐 NAVEGA EM PARALELO (5 sites)
   - Abre cada site simultaneamente
   - Aguarda carregamento completo
   ↓
4. 📸 CAPTURA SCREENSHOTS
   - Screenshot de cada página
   - Extrai texto visível
   - Extrai links e imagens
   ↓
5. 🧠 GEMINI VISION ANALISA
   - Recebe: texto + 5 screenshots
   - Analisa visualmente os produtos/notícias
   - Identifica preços, títulos, informações
   ↓
6. 💬 SÍNTESE NATURAL
   - Resposta conversacional
   - Com links corretos
   - Baseada no que VIU nas páginas
```

---

## 📁 ARQUITETURA

### Backend

**Arquivo:** `backend/services/visualIntelligentSearch.js`

**Funções principais:**

1. **`detectIntent(query)`**
   - Detecta se é busca de produtos, notícias ou geral
   - Usa regex para identificar palavras-chave

2. **`selectSitesForIntent(query, intent, maxSites)`**
   - Seleciona os melhores sites baseado na intenção
   - Retorna URLs prontas para navegação

3. **`navigateAndCapture(site, timeout)`**
   - Navega no site usando Playwright
   - Captura screenshot (PNG base64)
   - Extrai texto, links e imagens
   - Retorna dados estruturados

4. **`synthesizeWithVision(query, intent, capturedData, apiKey)`**
   - Envia texto + screenshots para Gemini Vision
   - Prompt especializado por tipo de busca
   - Retorna resposta natural e conversacional

5. **`visualIntelligentSearch(query, options)`**
   - Função principal que orquestra tudo
   - Executa navegação em paralelo
   - Chama síntese com visão
   - Retorna resultado completo

### Frontend

**Arquivo:** `src/App.tsx`

**Função:** `executeIntelligentSearch(query)`

- Chama API `/api/search/visual-intelligent`
- Exibe loading com mensagem visual
- Mostra resposta sintetizada
- Inclui metadados (sites analisados, screenshots, etc)

### API

**Rota:** `POST /api/search/visual-intelligent`

**Request:**
```json
{
  "query": "iPhone 13",
  "maxSites": 5,
  "timeout": 30000
}
```

**Response:**
```json
{
  "success": true,
  "query": "iPhone 13",
  "intent": "products",
  "response": "Olha, encontrei algumas opções...",
  "sites": [
    {
      "name": "Mercado Livre",
      "url": "https://...",
      "screenshot": "base64..."
    }
  ],
  "stats": {
    "totalSites": 5,
    "successfulSites": 5,
    "failedSites": 0,
    "duration": 15000
  },
  "metadata": {
    "capturedData": [...]
  }
}
```

---

## 🎨 DIFERENCIAL: VISÃO MULTIMODAL

### O que o sistema VÊ:

**Antes (só texto):**
```
Título: iPhone 13 128GB
Preço: R$ 2.899
Loja: Mercado Livre
```

**Agora (texto + imagem):**
```
[Screenshot da página]
- Vê o produto visualmente
- Identifica o preço na tela
- Vê se tem frete grátis
- Identifica selo de vendedor confiável
- Vê avaliações e estrelas
- Identifica botão de compra
```

### Prompt para Gemini Vision:

```
Você é um assistente de busca inteligente. Analise as capturas de tela 
e conteúdos extraídos dos sites abaixo...

**PERGUNTA DO USUÁRIO:**
"iPhone 13"

**TIPO DE BUSCA:** Produtos/Compras

**SITES ANALISADOS:**

### Site 1: Mercado Livre
URL: https://lista.mercadolivre.com.br/iphone-13

Texto extraído:
iPhone 13 128GB Azul
R$ 2.899,00
Frete grátis
Vendedor confiável
...

Links encontrados:
- iPhone 13 128GB: https://...
- iPhone 13 256GB: https://...

(Veja a captura de tela abaixo)

[SCREENSHOT 1 - PNG]

### Site 2: Amazon
...

[SCREENSHOT 2 - PNG]

**INSTRUÇÕES PARA PRODUTOS:**
- Identifique os produtos nas imagens
- Compare preços se visíveis
- Destaque as melhores ofertas
- Mencione lojas e condições
- Forneça links diretos
- Seja específico sobre o que você vê nas capturas

**SUA RESPOSTA COMPLETA:**
```

---

## 💡 VANTAGENS

### 1. **Contexto Visual Completo**
- Não depende só de texto extraído
- VÊ a página como um humano veria
- Identifica elementos visuais (preços, botões, selos)

### 2. **Navegação Real**
- Entra nas páginas de verdade
- Aguarda carregamento completo
- Captura estado final da página

### 3. **Síntese Inteligente**
- Gemini analisa TUDO (texto + imagens)
- Resposta baseada no que VIU
- Links corretos das páginas visitadas

### 4. **Automático**
- Usuário só faz a pergunta
- Sistema decide onde navegar
- Captura e analisa automaticamente

### 5. **Paralelo e Rápido**
- 5 sites navegados simultaneamente
- ~15-30 segundos total
- Eficiente e escalável

---

## 🧪 EXEMPLOS DE USO

### Exemplo 1: Busca de Produtos

**Usuário:** "Busque notebook gamer"

**Sistema:**
1. Detecta: `intent = 'products'`
2. Seleciona: Mercado Livre, Amazon, Magazine Luiza, Kabum, Pichau
3. Navega em paralelo nos 5 sites
4. Captura screenshots de cada página
5. Gemini analisa visualmente os notebooks
6. Resposta:

```
Olha, encontrei várias opções de notebooks gamer! Vou te mostrar as 
melhores ofertas que vi:

**🏆 Melhor Custo-Benefício:**
Notebook Acer Nitro 5 - R$ 4.299 no Mercado Livre
- RTX 3050, i5 12ª geração, 16GB RAM
- Frete grátis
- [Ver produto](link)

**💪 Melhor Performance:**
Notebook Lenovo Legion 5 - R$ 6.899 na Kabum
- RTX 4060, Ryzen 7, 32GB RAM
- Parcelamento em 12x sem juros
- [Ver produto](link)

**💰 Melhor Preço:**
Notebook Dell G15 - R$ 3.799 na Amazon
- GTX 1650, i5 11ª geração, 8GB RAM
- Prime: entrega em 1 dia
- [Ver produto](link)

Todos os preços que vi estão atualizados e os links levam direto 
para as páginas dos produtos. Quer que eu busque mais informações 
sobre algum deles?
```

### Exemplo 2: Busca de Notícias

**Usuário:** "Busque notícias sobre IA"

**Sistema:**
1. Detecta: `intent = 'news'`
2. Seleciona: G1, UOL, Folha, Estadão, BBC Brasil
3. Navega e captura screenshots
4. Gemini analisa as manchetes visíveis
5. Resposta:

```
Aqui estão as principais notícias sobre IA que encontrei hoje:

**🔥 Destaque do Dia:**
"OpenAI lança GPT-5 com capacidades revolucionárias"
- Fonte: G1 Tecnologia
- Publicado há 2 horas
- [Ler notícia completa](link)

**💼 Negócios:**
"Empresas brasileiras investem R$ 2 bilhões em IA em 2024"
- Fonte: Folha de S.Paulo
- Análise mostra crescimento de 150% em relação a 2023
- [Ler mais](link)

**🌍 Internacional:**
"União Europeia aprova nova regulamentação para IA"
- Fonte: BBC Brasil
- Novas regras entram em vigor em 2025
- [Detalhes](link)

Todas as notícias são de hoje e os links levam direto para as 
matérias completas. Quer que eu aprofunde em alguma delas?
```

### Exemplo 3: Busca Geral

**Usuário:** "Busque informações sobre Python"

**Sistema:**
1. Detecta: `intent = 'general'`
2. Seleciona: Bing, Wikipedia, Startpage, DuckDuckGo
3. Navega e captura
4. Gemini sintetiza
5. Resposta natural com informações gerais

---

## ⚙️ CONFIGURAÇÃO

### Variáveis de Ambiente

```env
GEMINI_API_KEY=sua_chave_aqui
PORT=3002
```

### Parâmetros Ajustáveis

**No código (`visualIntelligentSearch.js`):**

```javascript
// Número de sites a navegar
maxSites: 5 // Padrão: 5 (recomendado 3-7)

// Timeout por site
timeout: 30000 // 30 segundos (recomendado 20-60s)

// Modelo Gemini
model: 'gemini-2.0-flash-exp' // Suporta visão multimodal
```

---

## 📊 PERFORMANCE

### Métricas Esperadas:

- **Tempo total:** 15-30 segundos
- **Sites navegados:** 5 simultâneos
- **Screenshots:** 5 capturas (PNG)
- **Tamanho médio:** ~500KB por screenshot
- **Tokens Gemini:** ~10.000-20.000 tokens
- **Custo estimado:** ~$0.01-0.02 por busca

### Otimizações:

1. **Screenshots otimizados:**
   - Apenas viewport visível (não fullPage)
   - Formato PNG comprimido
   - Resolução adequada para análise

2. **Texto limitado:**
   - Máximo 5000 caracteres por site
   - Apenas conteúdo relevante

3. **Navegação paralela:**
   - Todos os sites ao mesmo tempo
   - Timeout individual por site

---

## 🔧 TROUBLESHOOTING

### Problema: "Nenhum site foi capturado"

**Causa:** Todos os sites falharam na navegação

**Solução:**
- Aumentar timeout
- Verificar conexão internet
- Verificar se Playwright está instalado

### Problema: "Erro ao sintetizar"

**Causa:** Gemini API falhou

**Solução:**
- Verificar GEMINI_API_KEY
- Verificar quota da API
- Reduzir número de screenshots

### Problema: "Resposta muito genérica"

**Causa:** Screenshots não foram analisados

**Solução:**
- Verificar se screenshots estão sendo capturados
- Verificar formato base64
- Testar com menos sites primeiro

---

## 🚀 PRÓXIMOS PASSOS

### Melhorias Futuras:

1. **Cache de Screenshots**
   - Cachear capturas por 5-10 minutos
   - Evitar navegação repetida

2. **Navegação Profunda**
   - Clicar em produtos/notícias
   - Capturar páginas internas
   - Mais contexto visual

3. **OCR Avançado**
   - Extrair texto de imagens
   - Identificar preços em banners
   - Ler tabelas e gráficos

4. **Análise de Vídeos**
   - Capturar frames de vídeos
   - Analisar conteúdo visual dinâmico

5. **Comparação Visual**
   - Comparar produtos lado a lado
   - Identificar diferenças visuais
   - Gerar tabelas comparativas

---

## 💡 CONCLUSÃO

O **Sistema de Busca Visual Inteligente** é a evolução natural do sistema de busca:

**Antes:**
- Busca massiva ✅
- Extração de texto ✅
- Síntese com Gemini ✅

**Agora:**
- Busca massiva ✅
- **Navegação real** ✅
- **Captura visual** ✅
- **Análise multimodal** ✅
- Síntese com Gemini ✅

**Resultado:** Sistema que **VÊ** e **ENTENDE** as páginas como um humano! 🎯

---

**Implementado por:** Kiro AI  
**Testado:** Pendente  
**Documentação:** Completa ✅
