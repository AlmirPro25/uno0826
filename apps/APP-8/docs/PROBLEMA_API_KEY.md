# ⚠️ Problema com a API Key do Gemini

## 🔍 Diagnóstico

Testamos sua API Key e ela está retornando erro `404 Not Found` para **modelos antigos**.

**Modelos corretos a usar:**
- ✅ `gemini-2.5-flash` - Modelo principal (recomendado)
- ✅ `gemini-flash-latest` - Sempre atualizado
- ✅ `gemini-flash-lite-latest` - Modelo leve e rápido
- ✅ `gemini-2.5-pro` - Versão Pro
- ✅ `gemini-robotics-er-1.5-preview` - Específico para visão robótica

**Modelos que NÃO existem mais:**
- ❌ `gemini-pro` - Descontinuado (use gemini-2.5-flash)
- ❌ `gemini-pro-vision` - Descontinuado (use gemini-2.5-flash)
- ❌ `gemini-1.5-pro` - Descontinuado (use gemini-2.5-pro)
- ❌ `gemini-1.5-flash` - Descontinuado (use gemini-2.5-flash)
- ❌ `gemini-2.0-flash-exp` - Experimental (use gemini-2.5-flash)

## 🎯 Causa Provável

Sua API Key pode estar:

1. **Desatualizada** - Gerada antes dos novos modelos
2. **Sem acesso** - Não tem permissão para os modelos
3. **Região incorreta** - Alguns modelos não estão disponíveis em todas as regiões
4. **Projeto sem billing** - Alguns modelos requerem billing habilitado

## ✅ Solução

### Opção 1: Gerar Nova API Key (Recomendado)

1. Acesse: https://aistudio.google.com/app/apikey
2. **Delete a chave antiga** (se possível)
3. **Crie uma nova chave**
4. Certifique-se de:
   - Estar logado com a conta correta
   - Selecionar um projeto ativo
   - Aceitar os termos de uso

### Opção 2: Verificar Acesso aos Modelos

1. Acesse: https://aistudio.google.com/
2. Vá em "Get API Key"
3. Verifique se você tem acesso aos modelos Gemini
4. Se não tiver, pode precisar:
   - Habilitar billing no Google Cloud
   - Aceitar termos adicionais
   - Aguardar aprovação (alguns modelos estão em preview)

### Opção 3: Usar Modelo Correto

Use sempre `gemini-flash-latest` ou `gemini-flash-lite-latest` que são os modelos atuais e disponíveis.

## 🧪 Como Testar Sua Nova Chave

Depois de gerar uma nova chave, teste assim:

```bash
# No terminal do backend
node -e "const { GoogleGenerativeAI } = require('@google/generative-ai'); const genAI = new GoogleGenerativeAI('SUA_NOVA_CHAVE'); const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' }); model.generateContent('teste').then(r => console.log('✅ OK')).catch(e => console.log('❌ ERRO:', e.message));"
```

Se retornar `✅ OK`, a chave funciona!

## 📝 Atualizar no Sistema

Depois de ter uma chave funcionando:

1. Edite `backend/.env`:
```env
GEMINI_API_KEY=SUA_NOVA_CHAVE_AQUI
```

2. O backend vai recarregar automaticamente

## 🔗 Links Úteis

- **Obter API Key:** https://aistudio.google.com/app/apikey
- **Google AI Studio:** https://aistudio.google.com/
- **Documentação:** https://ai.google.dev/
- **Modelos Disponíveis:** https://ai.google.dev/models/gemini

## 💡 Dica

**Modelos recomendados:**
- `gemini-2.5-flash` - Melhor para uso geral
- `gemini-flash-latest` - Sempre atualizado
- `gemini-flash-lite-latest` - Mais rápido e econômico
- `gemini-2.5-pro` - Para tarefas complexas
- `gemini-robotics-er-1.5-preview` - Para visão robótica com coordenadas
- Região específica (US)

---

**Resumo:** Sua chave atual não tem acesso a nenhum modelo. Gere uma nova em https://aistudio.google.com/app/apikey
