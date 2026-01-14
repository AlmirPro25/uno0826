# 🔍 DEBUG: Geração de Imagens

## 🚨 PROBLEMA ATUAL:
As imagens ainda aparecem como placeholders SVG mesmo após as correções.

## 🔍 POSSÍVEIS CAUSAS:

### 1. **API Key não configurada**
- O Gemini precisa de uma API key válida
- Verificar se `ApiKeyManager.getKeyToUse()` retorna uma chave

### 2. **Erro na geração do Gemini**
- O modelo pode não estar gerando imagens
- Pode estar retornando apenas texto

### 3. **Erro na substituição**
- O HTML pode não estar sendo substituído corretamente
- Os placeholders podem não estar sendo encontrados

## 🧪 TESTE MANUAL:

### **Passo 1: Verificar API Key**
```javascript
// No console do navegador:
console.log('API Key disponível:', localStorage.getItem('user_api_key'));
```

### **Passo 2: Verificar Logs**
```javascript
// Procurar por estes logs no console:
// 🎨 Detectados placeholders de imagem, iniciando geração...
// 📸 Encontrados X placeholders de imagem
// 🔥 PROMPT ASSERTIVO ENVIADO: Hi, can you create...
// 📥 RESPOSTA RECEBIDA: X parts
// 🎉 IMAGEM ENCONTRADA! Tipo: image/png
```

### **Passo 3: Verificar HTML Final**
```javascript
// No console, após gerar um site:
console.log(document.querySelector('img').src);
// Deve mostrar: ai-img://... ou data:image/...
// NÃO deve mostrar: data:image/svg+xml...
```

## 🔧 SOLUÇÕES POSSÍVEIS:

### **Solução 1: Forçar Fallback Pixabay**
Se o Gemini não funcionar, usar apenas Pixabay:

```typescript
// Em generateImageWithGemini, adicionar fallback imediato:
try {
  // Tentativa Gemini...
} catch (error) {
  console.log('🔄 Gemini falhou, usando Pixabay...');
  return await searchPixabayImage(description);
}
```

### **Solução 2: Verificar Configuração**
```typescript
// Verificar se a API key está sendo usada:
const ai = getGeminiInstance();
console.log('Instância Gemini criada:', !!ai);
```

### **Solução 3: Simplificar Prompt**
```typescript
// Usar prompt mais simples:
const prompt = `Create an image of ${description}`;
```

## 🎯 PRÓXIMOS PASSOS:

1. **Gerar um site simples** com imagens
2. **Abrir console (F12)** e verificar logs
3. **Procurar por erros** na geração
4. **Verificar se API key está configurada**
5. **Testar com prompt mais simples**

## 📊 LOGS ESPERADOS:

### **Se funcionando:**
```
🎨 Detectados placeholders de imagem, iniciando geração...
📸 Encontrados 3 placeholders de imagem
🔥 PROMPT ASSERTIVO ENVIADO: Hi, can you create a high-quality...
📥 RESPOSTA RECEBIDA: 2 parts
🎉 IMAGEM ENCONTRADA! Tipo: image/png, Tamanho: 12345 chars
✅ IMAGEM SALVA! ID: img_1234567890_abc12
✅ Imagem 1/3 gerada
🎉 Processamento concluído! 3/3 imagens geradas
```

### **Se com problemas:**
```
🎨 Detectados placeholders de imagem, iniciando geração...
📸 Encontrados 3 placeholders de imagem
🔥 PROMPT ASSERTIVO ENVIADO: Hi, can you create...
📥 RESPOSTA RECEBIDA: 1 parts
❌ Nenhuma imagem encontrada na resposta
🔄 PRIMEIRA TENTATIVA FALHOU. TENTANDO PROMPT MAIS ESPECÍFICO...
❌ Erro ao gerar imagem 1: Error message
🎉 Processamento concluído! 0/3 imagens geradas
```

## 🚀 TESTE RÁPIDO:

**Execute este comando no console após gerar um site:**

```javascript
// Verificar se há placeholders não processados
const imgs = document.querySelectorAll('img');
imgs.forEach((img, i) => {
  console.log(`Imagem ${i+1}:`, img.src.substring(0, 50) + '...');
});
```

**Resultado esperado:**
- ✅ `ai-img://img_123...` (imagem gerada)
- ✅ `data:image/png;base64,...` (imagem real)
- ❌ `data:image/svg+xml,...` (placeholder não processado)