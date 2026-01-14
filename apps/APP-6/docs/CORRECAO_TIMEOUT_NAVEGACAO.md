# 🔧 Correção: Timeout na Navegação

## Problema

Erro 500 ao tentar navegar para URLs:
```
Failed to load resource: the server responded with a status of 500
Error: HTTP error! status: 500
```

Logs do backend mostravam:
```
❌ Erro ao navegar: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "https://www.mercadolivre.com.br/", waiting until "networkidle"
```

## Causa

O método `navigate` do `browserService` estava usando:
- Timeout de apenas 30 segundos
- Estratégia única de carregamento (`networkidle`)
- Sem fallback para sites lentos

Sites como Mercado Livre podem demorar mais de 30 segundos para atingir o estado `networkidle` (quando todas as requisições de rede terminam).

## Solução Aplicada

### 1. Timeout Aumentado

```javascript
// ANTES
timeout: options.timeout || 30000  // 30 segundos

// DEPOIS
timeout: options.timeout || 60000  // 60 segundos
```

### 2. Estratégia de Fallback

Implementado sistema de fallback com 3 tentativas:

```javascript
// 1ª tentativa: networkidle (60s)
await page.goto(url, {
    waitUntil: 'networkidle',
    timeout: 60000
});

// 2ª tentativa: domcontentloaded (30s)
await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 30000
});

// 3ª tentativa: load (20s)
await page.goto(url, {
    waitUntil: 'load',
    timeout: 20000
});
```

### 3. Logs Informativos

```javascript
console.log(`⚠️ Timeout com networkidle, tentando domcontentloaded...`);
console.log(`⚠️ Timeout com domcontentloaded, tentando load...`);
```

## Estratégias de Carregamento

### networkidle (Ideal)
- Aguarda até que não haja mais requisições de rede por 500ms
- Melhor para sites com muito JavaScript
- Pode demorar muito em sites pesados

### domcontentloaded (Rápido)
- Aguarda até que o DOM esteja completamente carregado
- Não espera por imagens, CSS ou scripts externos
- Bom para sites simples

### load (Básico)
- Aguarda até que a página e todos os recursos estejam carregados
- Mais rápido que networkidle
- Suficiente para a maioria dos casos

## Resultado

Agora o sistema:
- ✅ Tenta primeiro com `networkidle` (60s)
- ✅ Se falhar, tenta com `domcontentloaded` (30s)
- ✅ Se falhar, tenta com `load` (20s)
- ✅ Só retorna erro se todas as 3 tentativas falharem
- ✅ Logs informativos sobre qual estratégia funcionou

## Benefícios

1. **Maior Taxa de Sucesso**: Sites lentos agora carregam
2. **Melhor UX**: Usuário não vê erro 500 com tanta frequência
3. **Flexibilidade**: Adapta-se a diferentes tipos de sites
4. **Logs Claros**: Fácil debugar qual estratégia foi usada

## Testes

Para testar:

```bash
cd backend
node test-navegador-remoto.js
```

Ou no frontend:
1. Abra http://localhost:3000
2. Tente navegar para sites pesados:
   - https://www.mercadolivre.com.br/
   - https://www.amazon.com.br/
   - https://www.olx.com.br/

## Arquivo Modificado

- `backend/services/browserService.js` (linhas 85-145)

## Próximas Melhorias

1. **Cache de Estratégias**: Lembrar qual estratégia funcionou para cada domínio
2. **Timeout Adaptativo**: Ajustar timeout baseado no histórico
3. **Retry com Exponential Backoff**: Tentar novamente com delays crescentes
4. **Detecção de Bot**: Detectar e contornar proteções anti-bot

## Logs Esperados

### Sucesso na 1ª tentativa
```
🔗 Navegando para: https://www.google.com
✅ Página carregada: Google
```

### Sucesso na 2ª tentativa
```
🔗 Navegando para: https://www.mercadolivre.com.br/
⚠️ Timeout com networkidle, tentando domcontentloaded...
✅ Página carregada: Mercado Livre
```

### Sucesso na 3ª tentativa
```
🔗 Navegando para: https://www.site-lento.com/
⚠️ Timeout com networkidle, tentando domcontentloaded...
⚠️ Timeout com domcontentloaded, tentando load...
✅ Página carregada: Site Lento
```

### Falha total
```
🔗 Navegando para: https://www.site-offline.com/
⚠️ Timeout com networkidle, tentando domcontentloaded...
⚠️ Timeout com domcontentloaded, tentando load...
❌ Erro ao navegar: Timeout exceeded
```

## Configuração Recomendada

Para sites específicos, você pode passar opções customizadas:

```javascript
// Site rápido
await browserService.navigate(sessionId, url, {
    waitUntil: 'domcontentloaded',
    timeout: 15000
});

// Site lento
await browserService.navigate(sessionId, url, {
    waitUntil: 'load',
    timeout: 90000
});

// Site com muito JavaScript
await browserService.navigate(sessionId, url, {
    waitUntil: 'networkidle',
    timeout: 120000
});
```

## Status

- ✅ Correção aplicada
- ✅ Backend reiniciado
- ✅ Sistema testado
- ✅ Funcionando corretamente
