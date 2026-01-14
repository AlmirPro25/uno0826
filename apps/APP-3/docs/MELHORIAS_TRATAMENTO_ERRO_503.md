# Melhorias no Tratamento de Erro 503 (Servidor Sobrecarregado)

## 🎯 Problema Identificado

O sistema estava falhando ao gerar planos quando o servidor Gemini retornava erro 503 (sobrecarregado), mesmo após 3 tentativas de retry.

**Erro original:**
```
{"error":{"code":503,"message":"The model is overloaded. Please try again later.","status":"UNAVAILABLE"}}
```

## ✅ Melhorias Implementadas

### 1. **Aumento do Número de Tentativas**
- **Antes:** 3 tentativas
- **Depois:** 5 tentativas
- **Motivo:** Dar mais chances para o servidor se recuperar

### 2. **Backoff Exponencial Aumentado**
- **Antes:** Delay máximo de 10 segundos
- **Depois:** Delay máximo de 30 segundos
- **Progressão:** 2s → 4s → 8s → 16s → 30s
- **Motivo:** Dar mais tempo para o servidor se recuperar entre tentativas

### 3. **Sistema de Fallback de Modelos**
Adicionada função `getFallbackModels()` que tenta modelos alternativos quando um está sobrecarregado:

```typescript
function getFallbackModels(originalModel: string): string[] {
    const modelFallbacks: Record<string, string[]> = {
        'gemini-2.5-pro': ['gemini-2.5-flash', 'gemini-2.5-flash-lite'],
        'gemini-2.5-flash': ['gemini-2.5-flash-lite', 'gemini-2.5-pro'],
        'gemini-2.5-flash-lite': ['gemini-2.5-flash', 'gemini-2.5-pro']
    };
    
    return modelFallbacks[originalModel] || ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
}
```

**Comportamento:**
- Tentativas 1-2: Usa o modelo original
- Tentativa 3+: Tenta modelos alternativos automaticamente
- Exemplo: Se `gemini-2.5-flash` falhar, tenta `gemini-2.5-flash-lite` ou `gemini-1.5-flash`

### 4. **Mensagens de Erro Mais Claras**

#### No Console:
```
⏳ Servidor sobrecarregado. Aguardando 4000ms antes da tentativa 3/5...
🔄 Tentando modelo alternativo: gemini-2.5-flash-lite
```

#### Na Interface do Usuário:
- **Antes:** "Erro ao criar plano. Tente novamente."
- **Depois:** 
  - "🔴 Servidor Gemini sobrecarregado. Aguarde 1-2 minutos e tente novamente."
  - "🔑 Erro na chave da API. Verifique suas configurações."
  - "⚠️ Limite de uso atingido. Aguarde alguns minutos."

### 5. **Tratamento Específico por Tipo de Erro**

```typescript
if (error.message.includes('sobrecarregado') || error.message.includes('overloaded')) {
    errorMessage = '🔴 Servidor Gemini sobrecarregado. Aguarde 1-2 minutos e tente novamente.';
} else if (error.message.includes('API key') || error.message.includes('API_KEY')) {
    errorMessage = '🔑 Erro na chave da API. Verifique suas configurações.';
} else if (error.message.includes('quota') || error.message.includes('rate limit')) {
    errorMessage = '⚠️ Limite de uso atingido. Aguarde alguns minutos.';
}
```

## 📍 Arquivos Modificados

### 1. **services/GeminiService.ts**
- Adicionada função `getFallbackModels()`
- Aumentado `maxRetries` de 3 para 5
- Aumentado delay máximo de 10s para 30s
- Adicionada lógica de fallback de modelos na tentativa 3
- Melhoradas mensagens de log
- Aplicado em ambas as funções (normal e streaming)

### 2. **store/useAppStore.ts**
- Melhorado tratamento de erro em `continueWithSelectedPalette()`
- Adicionadas mensagens específicas por tipo de erro
- Mensagens mais amigáveis e acionáveis

## 🚀 Como Funciona Agora

### Fluxo de Retry com Fallback:

```
Tentativa 1: gemini-2.5-flash (delay: 0s)
   ↓ Falha (503)
Tentativa 2: gemini-2.5-flash (delay: 2s)
   ↓ Falha (503)
Tentativa 3: gemini-2.5-flash-lite (delay: 4s) ← MODELO ALTERNATIVO (mais leve)
   ↓ Falha (503)
Tentativa 4: gemini-2.5-pro (delay: 8s) ← MODELO ALTERNATIVO (mais poderoso)
   ↓ Falha (503)
Tentativa 5: gemini-2.5-flash (delay: 16s) ← TENTA NOVAMENTE O ORIGINAL
   ↓ Falha (503)
Erro Final: "🔴 Servidor Gemini sobrecarregado. Aguarde 1-2 minutos..."
```

**Nota:** Apenas modelos Gemini 2.5 são usados (versões mais recentes e estáveis).

## 📊 Benefícios

1. **Maior Taxa de Sucesso:** 5 tentativas + modelos alternativos = mais chances de sucesso
2. **Melhor UX:** Usuário entende exatamente o que está acontecendo
3. **Resiliência:** Sistema tenta automaticamente modelos alternativos
4. **Transparência:** Logs claros mostram cada tentativa e modelo usado
5. **Recuperação Automática:** Não precisa intervenção manual na maioria dos casos

## 🎓 Modelos Gemini 2.5 Disponíveis

### Ordem de Preferência (por velocidade/disponibilidade):
1. `gemini-2.5-flash` - Rápido e equilibrado (padrão)
2. `gemini-2.5-flash-lite` - Mais leve e mais disponível
3. `gemini-2.5-pro` - Mais poderoso para tarefas complexas

**Nota:** Apenas modelos da família Gemini 2.5 são usados, garantindo as funcionalidades mais recentes e estáveis.

## 🔧 Configuração

Não é necessária nenhuma configuração adicional. O sistema funciona automaticamente.

Para ajustar o comportamento, modifique em `GeminiService.ts`:
```typescript
const maxRetries = 5; // Número de tentativas
const delay = Math.min(2000 * Math.pow(2, attempt - 1), 30000); // Delay máximo
```

## 📝 Notas Importantes

- O erro 503 é **temporário** e geralmente se resolve em 1-2 minutos
- O sistema agora é **muito mais resiliente** a picos de carga
- Modelos alternativos podem ter **qualidade ligeiramente diferente**
- O fallback é **automático e transparente** para o usuário

---

**Status:** ✅ Implementado e Testado
**Data:** 2025-11-10
**Versão:** 2.0
**Impacto:** Alto - Melhora significativa na resiliência do sistema
