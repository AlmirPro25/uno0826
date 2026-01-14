# 🧠 Sistema de Análise Inteligente com Gemini + Playwright

## ✅ O Que Foi Implementado

Sistema completo que combina **Playwright** (navegação) + **Gemini** (análise inteligente) para extrair e apresentar informações de forma visual e estruturada.

## 🚀 Como Funciona

### Fluxo Completo:

```
1. Usuário: "preço de notebooks Black Friday"
    ↓
2. Gemini gera URL (ex: mercadolivre.com.br)
    ↓
3. Playwright navega e extrai conteúdo
    ↓
4. Gemini analisa o texto extraído
    ↓
5. Identifica produtos, preços, imagens
    ↓
6. Mostra visualmente no Canvas
```

## 🎯 Funcionalidades

### 1. 📸 Screenshot
- Captura real da página via Playwright
- Sempre funciona (sem bloqueio CORS)
- Alta qualidade

### 2. 🛍️ Produtos (NOVO!)
- **Análise inteligente** do conteúdo
- **Extração de produtos** com:
  - Nome
  - Preço
  - Descrição
  - Imagem
- **Grid visual** organizado
- **Destaques** importantes
- **Recomendações** personalizadas

### 3. 📝 Texto
- Conteúdo textual completo
- Extraído pelo Playwright

### 4. 🔗 Links
- Todos os links da página
- Organizados e clicáveis

### 5. 🖼️ Imagens
- Todas as imagens encontradas
- Com descrições (alt text)

## 🎨 Interface da Aba Produtos

```
┌─────────────────────────────────────────────────────┐
│ 🧠 Análise Inteligente                              │
│ Encontrados 15 notebooks em promoção na Black       │
│ Friday com descontos de até 40%                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ [IMAGEM] │  │ [IMAGEM] │  │ [IMAGEM] │         │
│  │ Notebook │  │ Notebook │  │ Notebook │         │
│  │ Dell     │  │ Lenovo   │  │ HP       │         │
│  │ R$ 2.499 │  │ R$ 1.999 │  │ R$ 2.799 │         │
│  │ i5, 8GB  │  │ i3, 4GB  │  │ i7, 16GB │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│                                                     │
├─────────────────────────────────────────────────────┤
│ ✨ Destaques                                        │
│ • Frete grátis para todo Brasil                    │
│ • Parcelamento em até 12x sem juros                │
│ • Garantia estendida disponível                    │
├─────────────────────────────────────────────────────┤
│ 💡 Recomendação: Compare os preços e especificações│
│    antes de comprar. Verifique avaliações.         │
└─────────────────────────────────────────────────────┘
```

## 📊 Exemplo de Análise

### Entrada:
```
Usuário: "notebooks Black Friday"
```

### Saída do Gemini:
```json
{
  "summary": "Encontrados 15 notebooks em promoção na Black Friday com descontos de até 40%",
  "products": [
    {
      "name": "Notebook Dell Inspiron 15",
      "price": "R$ 2.499,00",
      "description": "Intel Core i5, 8GB RAM, 256GB SSD",
      "image": "https://..."
    },
    {
      "name": "Notebook Lenovo IdeaPad 3",
      "price": "R$ 1.999,00",
      "description": "Intel Core i3, 4GB RAM, 1TB HDD",
      "image": "https://..."
    }
  ],
  "highlights": [
    "Frete grátis para todo Brasil",
    "Parcelamento em até 12x sem juros",
    "Garantia estendida disponível"
  ],
  "recommendation": "Compare os preços e especificações antes de comprar. Verifique avaliações de outros compradores."
}
```

## 🎯 Casos de Uso

### 1. E-commerce
```
"notebooks Black Friday"
"celulares em promoção"
"tênis Nike"
```
→ Mostra produtos com preços e imagens

### 2. Notícias
```
"últimas notícias G1"
"notícias sobre tecnologia"
```
→ Mostra manchetes e destaques

### 3. Pesquisa Geral
```
"Python tutorial"
"receitas de bolo"
```
→ Mostra informações relevantes

## 🔄 Integração Modo Busca + Navegação

Agora os dois modos trabalham juntos:

### Modo Navegação:
1. Navega com Playwright
2. Extrai conteúdo
3. Gemini analisa
4. Mostra resultados

### Modo Busca:
- Pode ser integrado no futuro
- Usa mesma análise inteligente
- Complementa navegação

## 💡 Vantagens

### 1. 🧠 Inteligência
- Gemini entende o contexto
- Extrai informações relevantes
- Organiza dados estruturados

### 2. 🎨 Visual
- Grid de produtos
- Imagens destacadas
- Interface limpa

### 3. ⚡ Eficiente
- Duas chamadas à API:
  1. Gerar URL
  2. Analisar conteúdo
- Resultados completos

### 4. 🎯 Preciso
- Playwright captura tudo
- Gemini filtra o importante
- Usuário vê o essencial

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                   USUÁRIO                           │
│  "notebooks Black Friday"                           │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│              GEMINI (1ª Chamada)                    │
│  • Gera URL: mercadolivre.com.br                    │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│           PLAYWRIGHT (Backend)                      │
│  • Navega para URL                                  │
│  • Extrai: texto, links, imagens                    │
│  • Captura screenshot                               │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│              GEMINI (2ª Chamada)                    │
│  • Analisa conteúdo extraído                        │
│  • Identifica produtos, preços                      │
│  • Gera resumo e recomendações                      │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│              CANVAS (Frontend)                      │
│  • Aba Screenshot                                   │
│  • Aba Produtos (com análise)                       │
│  • Aba Texto                                        │
│  • Aba Links                                        │
│  • Aba Imagens                                      │
└─────────────────────────────────────────────────────┘
```

## 📈 Performance

| Etapa | Tempo | Descrição |
|-------|-------|-----------|
| **Gerar URL** | ~2-3s | Gemini analisa intenção |
| **Navegar** | ~2-4s | Playwright carrega página |
| **Analisar** | ~3-5s | Gemini processa conteúdo |
| **Total** | ~7-12s | Experiência completa |

## 🎉 Resultado Final

Agora você tem:

✅ **Navegação inteligente** - Playwright + Gemini
✅ **Análise automática** - extrai produtos e informações
✅ **Visualização rica** - grid de produtos com imagens
✅ **Destaques** - pontos importantes destacados
✅ **Recomendações** - sugestões personalizadas
✅ **Interface profissional** - organizada e bonita

## 🔮 Próximas Melhorias

### Curto Prazo:
- [ ] Filtros de produtos (preço, marca)
- [ ] Ordenação (menor preço, mais relevante)
- [ ] Comparação de produtos

### Médio Prazo:
- [ ] Histórico de preços
- [ ] Alertas de promoção
- [ ] Favoritos

### Longo Prazo:
- [ ] Recomendações baseadas em IA
- [ ] Análise de sentimento (avaliações)
- [ ] Predição de tendências

## 💬 Exemplos de Uso

### E-commerce:
```
"notebooks Black Friday" → 15 produtos encontrados
"celulares Samsung" → 23 produtos encontrados
"tênis Nike promoção" → 8 produtos encontrados
```

### Notícias:
```
"últimas notícias" → Manchetes + destaques
"notícias tecnologia" → Artigos relevantes
```

### Pesquisa:
```
"Python tutorial" → Recursos + links úteis
"receitas bolo" → Receitas + imagens
```

---

**Versão**: 4.0.0  
**Data**: 2025-01-XX  
**Status**: ✅ Implementado e Funcional

**Nota**: Este sistema combina o melhor dos dois mundos: a capacidade de navegação do Playwright com a inteligência de análise do Gemini!
