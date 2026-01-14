# 🧪 Como Testar o Sistema

## Pré-requisitos

1. ✅ Backend rodando: `npm start` na pasta `backend/`
2. ✅ Frontend rodando: `npm run dev` na raiz
3. ✅ API Key do Gemini configurada

## Teste 1: Navegação Simples

### Passos:
1. Abra o chat
2. Clique no botão **🌐 Navegação** (fica verde)
3. Digite: `https://mercadolivre.com.br`
4. Pressione Enter

### Resultado Esperado:
- ✅ Canvas abre à direita (70%)
- ✅ Screenshot da página aparece
- ✅ Chat mostra resumo à esquerda (30%)
- ✅ Resumo inteligente da IA
- ✅ Produtos com imagens (se houver)

### Tempo: ~5-8 segundos

## Teste 2: Busca de Produtos

### Passos:
1. Modo navegação ativo
2. Digite: `Busque notebooks gamer no mercado livre`
3. Enter

### Resultado Esperado:
- ✅ Canvas: Screenshot da busca
- ✅ Chat: 
  - Resumo: "Encontrados X notebooks..."
  - Grid de produtos com fotos
  - Preços em verde
  - Botões "Ver Produto"

### Tempo: ~8-12 segundos

## Teste 3: Pesquisa de Informações

### Passos:
1. Modo navegação ativo
2. Digite: `Pesquise sobre inteligência artificial`
3. Enter

### Resultado Esperado:
- ✅ Canvas: Screenshot do artigo
- ✅ Chat:
  - Resumo inteligente
  - Pontos principais
  - Imagens relevantes
  - Links importantes

### Tempo: ~6-10 segundos

## Teste 4: Interação com Mídia

### Passos:
1. Após qualquer navegação com produtos
2. Clique em um card de produto

### Resultado Esperado:
- ✅ Card expande ou abre link
- ✅ Mostra detalhes completos
- ✅ Botão "Ver Produto" funciona

### Passos (Imagens):
1. Após navegação com imagens
2. Clique em uma imagem

### Resultado Esperado:
- ✅ Modal abre em tela cheia
- ✅ Imagem ampliada
- ✅ Botão X fecha modal

## Teste 5: Tabs do Canvas

### Passos:
1. Após qualquer navegação
2. Clique nas tabs: Screenshot, Texto, Links, Imagens

### Resultado Esperado:
- ✅ **Screenshot**: Mostra captura da página
- ✅ **Texto**: Mostra conteúdo extraído
- ✅ **Links**: Lista todos os links
- ✅ **Imagens**: Grid de imagens
- ✅ **Produtos**: Cards de produtos (se houver)

## Teste 6: Fechar Canvas

### Passos:
1. Canvas aberto
2. Clique no **X** no canto superior direito

### Resultado Esperado:
- ✅ Canvas fecha
- ✅ Chat volta para 100% da largura
- ✅ Modo navegação desativa
- ✅ Indicador verde some

## Teste 7: Análise IA

### Passos:
1. Navegue para qualquer site
2. Aguarde análise

### Resultado Esperado:
- ✅ Box roxo com "🧠 Resumo Inteligente"
- ✅ Texto resumido e claro
- ✅ Pontos principais listados
- ✅ Recomendação da IA

## Teste 8: Múltiplas Navegações

### Passos:
1. Navegue para site A
2. Aguarde conclusão
3. Navegue para site B
4. Aguarde conclusão

### Resultado Esperado:
- ✅ Canvas atualiza com novo conteúdo
- ✅ Chat adiciona nova mensagem
- ✅ Histórico preservado
- ✅ Sem travamentos

## Verificações de Console

### Backend (Terminal):
```
✅ 🌐 Inicializando navegador...
✅ 📄 Sessão criada: smart_xxxxx
✅ 🔗 Navegando para: https://...
✅ 📸 Screenshot capturado
✅ 📝 Conteúdo extraído
✅ 🧠 Content Analyzer inicializado
✅ ✅ Análise concluída
```

### Frontend (DevTools):
```
✅ 🧠 Navegação inteligente: https://...
✅ ✅ Resultado recebido
✅ Canvas atualizado
✅ Mensagem adicionada
```

## Problemas Comuns

### Canvas não abre?
- Verifique se clicou no botão 🌐
- Recarregue a página

### Screenshot demora muito?
- Normal: 3-8 segundos
- Se > 15s, verifique conexão

### Análise IA não funciona?
- Verifique API Key do Gemini
- Console deve mostrar erro específico

### Produtos não aparecem?
- Normal se página não tem produtos
- IA detecta automaticamente

### Imagens não carregam?
- Algumas imagens podem ter CORS
- Fallback mostra "Sem imagem"

## Métricas de Sucesso

✅ **Navegação**: < 5 segundos
✅ **Análise IA**: < 3 segundos
✅ **Screenshot**: < 1 segundo
✅ **Total**: < 8 segundos

✅ **Canvas**: Abre e fecha suavemente
✅ **Chat**: Mídia renderiza corretamente
✅ **IA**: Resumo coerente e útil
✅ **Produtos**: Imagens e preços corretos

## Teste Completo (5 minutos)

1. ✅ Navegação simples (1 min)
2. ✅ Busca de produtos (1 min)
3. ✅ Pesquisa de informações (1 min)
4. ✅ Interação com mídia (1 min)
5. ✅ Fechar e reabrir Canvas (1 min)

**Se todos passarem: Sistema 100% funcional!** 🎉

## Próximos Passos

Após testes bem-sucedidos:
1. Ajustar timeouts se necessário
2. Melhorar prompts da IA
3. Adicionar cache de análises
4. Implementar comparação de produtos
5. Adicionar exportação de resultados

---

**Boa sorte nos testes!** 🚀
