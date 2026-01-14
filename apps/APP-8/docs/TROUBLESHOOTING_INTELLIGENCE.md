# 🔧 Troubleshooting - Sistema de Inteligência

## Problemas Comuns e Soluções

---

## 🎭 Problemas de Personalidade

### A IA não está usando a personalidade configurada

**Sintomas:**
- Respostas genéricas mesmo após configurar
- Tom não corresponde ao selecionado

**Soluções:**
1. Abra Configurações (⚙️) e clique em "Salvar" novamente
2. Verifique se está em modo Adaptativo (pode estar mudando automaticamente)
3. Limpe o cache do navegador e recarregue
4. Verifique o console do navegador (F12) para erros

**Verificação:**
```javascript
// No console do navegador
localStorage.getItem('personality-config')
// Deve retornar um JSON com suas configurações
```

---

### Personalidade Adaptativa não está mudando

**Sintomas:**
- Sempre usa a mesma personalidade
- Não detecta contexto

**Soluções:**
1. Certifique-se de que está em modo "Adaptativa"
2. Dê contexto claro (abra IDE para técnico, pergunte "como?" para tutor)
3. Aguarde alguns segundos para detecção
4. Tente mudar manualmente para testar outras personalidades

**Dica:**
A detecção funciona melhor quando:
- Há texto visível na tela
- Você faz perguntas específicas
- O contexto é claro (IDE, design tool, etc.)

---

## 🧠 Problemas de Memória

### Memórias não estão sendo salvas

**Sintomas:**
- Busca não retorna resultados
- Estatísticas mostram 0 memórias

**Soluções:**
1. Verifique espaço no localStorage:
```javascript
// No console
Object.keys(localStorage).forEach(key => {
  console.log(key, localStorage.getItem(key).length);
});
```

2. Se localStorage está cheio:
   - Exporte memórias importantes
   - Limpe memórias antigas
   - Importe de volta as importantes

3. Verifique permissões do navegador:
   - Configurações → Privacidade → Cookies e dados
   - Certifique-se de que o site pode armazenar dados

**Prevenção:**
- Exporte memórias mensalmente
- Mantenha máximo de 300-400 memórias
- Limpe memórias antigas regularmente

---

### Busca não encontra memórias que existem

**Sintomas:**
- Você sabe que discutiu algo, mas busca não acha
- Resultados irrelevantes

**Soluções:**
1. **Use busca semântica**, não palavras exatas:
   - ❌ "função python"
   - ✅ "programação python" ou "código python"

2. **Tente sinônimos:**
   - "otimização" → "performance", "velocidade"
   - "erro" → "bug", "problema"

3. **Busque por conceitos:**
   - Em vez de "useState", tente "react hooks"

4. **Verifique se memória foi criada:**
```javascript
// No console
JSON.parse(localStorage.getItem('long-term-memories'))
```

---

### Perfil do usuário está vazio

**Sintomas:**
- Habilidades: 0
- Interesses: 0

**Causa:**
Sistema ainda está aprendendo sobre você.

**Soluções:**
1. Use o sistema por alguns dias
2. Tenha conversas sobre seus interesses
3. Mencione suas habilidades explicitamente
4. Trabalhe em projetos visíveis na tela

**Aceleração:**
Diga explicitamente:
- "Sou desenvolvedor Python"
- "Gosto de design minimalista"
- "Trabalho com React"

---

## 🔍 Problemas de Análise Proativa

### Não recebo sugestões proativas

**Sintomas:**
- Nenhum card de sugestão aparece
- Mesmo com erros visíveis

**Soluções:**
1. Verifique se está habilitado:
```javascript
// No console
proactiveService.isProactiveEnabled()
// Deve retornar true
```

2. Se desabilitado, habilite:
```javascript
proactiveService.setEnabled(true)
```

3. Verifique nível de proatividade:
   - Configurações → Proatividade → Média ou Alta

4. Aguarde 30 segundos (intervalo de análise)

5. Certifique-se de que há conteúdo visível na tela

---

### Muitas sugestões proativas

**Sintomas:**
- Cards aparecem constantemente
- Interrompem o trabalho

**Soluções:**
1. Reduza proatividade:
   - Configurações → Proatividade → Baixa

2. Ou desabilite temporariamente:
```javascript
proactiveService.setEnabled(false)
```

3. Descarte sugestões irrelevantes:
   - Sistema aprende o que você ignora

4. Ajuste intervalo (para desenvolvedores):
```typescript
// Em proactiveService.ts
private readonly ANALYSIS_INTERVAL = 60000; // 60 segundos
```

---

### Sugestões não são relevantes

**Sintomas:**
- Sugestões genéricas
- Não relacionadas ao contexto

**Causa:**
Sistema ainda está calibrando.

**Soluções:**
1. Descarte sugestões irrelevantes (sistema aprende)
2. Use por alguns dias para calibração
3. Certifique-se de que tela está visível e legível
4. Trabalhe em contextos claros (IDE, design tool)

---

## 📊 Problemas de Performance

### Sistema está lento

**Sintomas:**
- Respostas demoram muito
- Interface trava

**Soluções:**
1. **Limpe memórias antigas:**
   - Memória Panel → Limpar

2. **Reduza análise proativa:**
   - Configurações → Proatividade → Baixa

3. **Limpe histórico de conversas:**
   - Histórico → Limpar sessões antigas

4. **Verifique uso de memória:**
```javascript
// No console
console.log('DB Size:', databaseService.getDatabaseSize());
console.log('Memories:', memoryService.getMemoryStats());
```

5. **Reinicie o navegador**

---

### localStorage cheio

**Sintomas:**
- Erro "QuotaExceededError"
- Não consegue salvar mais dados

**Soluções:**
1. **Exporte dados importantes:**
   - Memória Panel → Exportar
   - Histórico → Exportar (se disponível)

2. **Limpe seletivamente:**
   - Limpar sessões antigas (manter últimas 10)
   - Limpar memórias menos importantes

3. **Limpe tudo (último recurso):**
   - App → Limpar Tudo
   - Reimporte dados exportados

4. **Aumente quota (Chrome):**
   - Configurações → Privacidade → Limpar dados
   - Desmarque "Cookies e dados"
   - Limpe apenas cache

---

## 🔄 Problemas de Integração

### Personalidade não afeta respostas

**Sintomas:**
- Todas as respostas parecem iguais
- Tom não muda

**Verificação:**
1. Teste diferentes personalidades extremas:
   - Técnica vs Criativa
   - Profissional vs Divertida

2. Se ainda não muda, verifique integração:
```javascript
// No console
personalityService.generateSystemInstruction()
// Deve retornar prompt personalizado
```

**Solução:**
Se retornar prompt genérico, há problema de integração.
Recarregue a página ou limpe cache.

---

### Memória não está sendo usada nas respostas

**Sintomas:**
- IA não lembra de conversas anteriores
- Sem contexto entre sessões

**Verificação:**
```javascript
// No console
await memoryService.getContextForAI('teste')
// Deve retornar contexto com memórias
```

**Soluções:**
1. Certifique-se de que há memórias:
   - Memória Panel → Verificar estatísticas

2. Aguarde algumas conversas para acumular memórias

3. Mencione explicitamente contexto anterior:
   - "Lembra quando falamos sobre X?"

---

## 🐛 Problemas Técnicos

### Erros no console do navegador

**Como verificar:**
1. Pressione F12
2. Vá para aba "Console"
3. Procure por erros em vermelho

**Erros comuns:**

#### "Cannot read property of undefined"
**Causa:** Dados corrompidos no localStorage
**Solução:**
```javascript
// Limpe dados específicos
localStorage.removeItem('personality-config');
localStorage.removeItem('long-term-memories');
// Recarregue a página
```

#### "QuotaExceededError"
**Causa:** localStorage cheio
**Solução:** Veja seção "localStorage cheio" acima

#### "Failed to fetch"
**Causa:** Problema com API do Gemini
**Solução:**
1. Verifique conexão com internet
2. Verifique API key
3. Verifique quota da API

---

### Componentes não aparecem

**Sintomas:**
- Botões de configuração não aparecem
- Painéis não abrem

**Soluções:**
1. Limpe cache do navegador
2. Recarregue com Ctrl+Shift+R
3. Verifique console para erros
4. Tente em modo anônimo

---

## 🔒 Problemas de Privacidade

### Preocupado com dados armazenados

**O que é armazenado:**
- Memórias de conversas
- Configurações de personalidade
- Histórico de sessões
- Estatísticas de uso

**Onde:**
- 100% no localStorage do seu navegador
- Nada em servidores externos (exceto API Gemini)

**Como limpar:**
```javascript
// Limpar tudo
localStorage.clear();
// Ou específico
localStorage.removeItem('long-term-memories');
localStorage.removeItem('personality-config');
localStorage.removeItem('gemini-companion-db');
```

---

### Dados sensíveis foram armazenados

**Solução imediata:**
1. Memória Panel → Buscar dados sensíveis
2. Identificar memórias problemáticas
3. Limpar memórias específicas (ou todas)

**Prevenção:**
- Não discuta informações sensíveis
- Use modo anônimo para sessões sensíveis
- Exporte e limpe regularmente

---

## 📞 Suporte Adicional

### Ainda com problemas?

1. **Verifique documentação:**
   - [INTELLIGENCE_FEATURES.md](INTELLIGENCE_FEATURES.md)
   - [QUICK_START_INTELLIGENCE.md](QUICK_START_INTELLIGENCE.md)

2. **Reset completo:**
```javascript
// No console
personalityService.reset();
memoryService.clearAllMemories();
databaseService.clearAllData();
localStorage.clear();
// Recarregue a página
```

3. **Informações para debug:**
```javascript
// Copie e cole isso no console
console.log({
  personality: personalityService.getConfig(),
  memoryStats: memoryService.getMemoryStats(),
  dbSize: databaseService.getDatabaseSize(),
  proactive: proactiveService.isProactiveEnabled()
});
```

---

## ✅ Checklist de Saúde do Sistema

Execute periodicamente:

```javascript
// No console do navegador
const healthCheck = {
  personality: !!localStorage.getItem('personality-config'),
  memories: JSON.parse(localStorage.getItem('long-term-memories') || '{}'),
  database: !!localStorage.getItem('gemini-companion-db'),
  dbSize: databaseService.getDatabaseSize(),
  memoryCount: memoryService.getMemoryStats().totalMemories
};
console.table(healthCheck);
```

**Valores saudáveis:**
- personality: true
- memories: objeto com dados
- database: true
- dbSize: < 5 MB
- memoryCount: 50-400

---

**Lembre-se: A maioria dos problemas se resolve com um reload ou limpeza de cache!** 🔄
