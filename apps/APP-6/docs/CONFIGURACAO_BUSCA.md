# ⚙️ CONFIGURAÇÃO DO SISTEMA DE BUSCA

## 📁 Arquivo de Configuração

**Local:** `backend/config/search-config.js`

Este arquivo centraliza todas as configurações do sistema de busca massiva.

## 🎛️ CONFIGURAÇÕES DISPONÍVEIS

### ⏱️ Timeouts

#### `DEFAULT_TIMEOUT` (padrão: 60000ms = 60s)
Timeout padrão para todos os sites.

**Quando ajustar:**
- ✅ **Aumentar (90s):** Se muitos sites estão dando timeout
- ✅ **Diminuir (45s):** Se quer respostas mais rápidas (mas pode perder sites lentos)

```javascript
DEFAULT_TIMEOUT: 60000, // 60 segundos
```

#### `NEWS_TIMEOUT` (padrão: 45000ms = 45s)
Timeout específico para sites de notícias (geralmente mais rápidos).

#### `INTERNATIONAL_TIMEOUT` (padrão: 90000ms = 90s)
Timeout para sites internacionais (geralmente mais lentos).

#### `SEARCH_ENGINE_TIMEOUT` (padrão: 60000ms = 60s)
Timeout para buscadores.

### 🔢 Limites

#### `MAX_SITES` (padrão: 10)
Número máximo de sites a buscar simultaneamente.

**Quando ajustar:**
- ✅ **Aumentar (15-20):** Para mais resultados (mas mais lento)
- ✅ **Diminuir (5-8):** Para respostas mais rápidas (mas menos resultados)

```javascript
MAX_SITES: 10,
```

#### `MAX_RESULTS_PER_SITE` (padrão: 10)
Número máximo de resultados extraídos de cada site.

#### `MAX_LINKS_PER_PAGE` (padrão: 20)
Número máximo de links a extrair por página.

### 🎯 Comportamento

#### `WAIT_UNTIL` (padrão: 'networkidle')
Estado de carregamento a aguardar.

**Opções:**
- `'load'` - Mais rápido, mas pode perder conteúdo
- `'domcontentloaded'` - Balanceado
- `'networkidle'` - Mais lento, mas mais confiável ✅

```javascript
WAIT_UNTIL: 'networkidle',
```

#### `MAX_RETRIES` (padrão: 2)
Número de tentativas em caso de falha.

#### `RETRY_DELAY` (padrão: 2000ms)
Delay entre tentativas.

### 💾 Cache

#### `CACHE_TTL` (padrão: 300000ms = 5min)
Tempo de vida do cache.

#### `ENABLE_CACHE` (padrão: false)
Habilitar/desabilitar cache.

**Nota:** Cache ainda não implementado, mas configuração já está pronta.

### 🐛 Debug

#### `DEBUG` (padrão: true)
Habilitar logs detalhados.

#### `INCLUDE_FAILURES` (padrão: true)
Incluir sites que falharam na resposta.

## 🎯 CONFIGURAÇÕES OTIMIZADAS POR TIPO

O sistema ajusta automaticamente as configurações baseado no tipo de query:

### 📰 Notícias
```javascript
{
  MAX_SITES: 8,
  DEFAULT_TIMEOUT: 45000, // 45s
}
```

### 🌤️ Clima
```javascript
{
  MAX_SITES: 5,
  DEFAULT_TIMEOUT: 30000, // 30s
}
```

### 🛒 Produtos
```javascript
{
  MAX_SITES: 6,
  DEFAULT_TIMEOUT: 60000, // 60s
}
```

### 🔍 Geral
```javascript
{
  MAX_SITES: 10,
  DEFAULT_TIMEOUT: 60000, // 60s
}
```

## 🚀 CENÁRIOS COMUNS

### Cenário 1: Muitos Timeouts
**Problema:** Muitos sites dando timeout

**Solução:** Aumentar timeouts
```javascript
DEFAULT_TIMEOUT: 90000, // 90 segundos
NEWS_TIMEOUT: 60000,    // 60 segundos
```

### Cenário 2: Respostas Lentas
**Problema:** Sistema muito lento

**Solução:** Diminuir sites e timeouts
```javascript
MAX_SITES: 5,           // Menos sites
DEFAULT_TIMEOUT: 30000, // 30 segundos
WAIT_UNTIL: 'load',     // Não aguardar networkidle
```

### Cenário 3: Poucos Resultados
**Problema:** Retornando poucos resultados

**Solução:** Aumentar sites e resultados
```javascript
MAX_SITES: 15,                // Mais sites
MAX_RESULTS_PER_SITE: 15,     // Mais resultados por site
MAX_LINKS_PER_PAGE: 30,       // Mais links
```

### Cenário 4: Conexão Lenta
**Problema:** Internet lenta

**Solução:** Configuração conservadora
```javascript
MAX_SITES: 5,           // Poucos sites
DEFAULT_TIMEOUT: 90000, // Timeout alto
MAX_RETRIES: 3,         // Mais tentativas
```

### Cenário 5: Máxima Performance
**Problema:** Quer resultados o mais rápido possível

**Solução:** Configuração agressiva
```javascript
MAX_SITES: 20,          // Muitos sites
DEFAULT_TIMEOUT: 20000, // 20 segundos
WAIT_UNTIL: 'load',     // Não aguardar
MAX_RETRIES: 0,         // Sem retry
```

## 📊 RECOMENDAÇÕES

### Para Produção
```javascript
{
  DEFAULT_TIMEOUT: 60000,
  MAX_SITES: 10,
  WAIT_UNTIL: 'networkidle',
  MAX_RETRIES: 2,
  ENABLE_CACHE: true,
  DEBUG: false,
}
```

### Para Desenvolvimento
```javascript
{
  DEFAULT_TIMEOUT: 90000,
  MAX_SITES: 5,
  WAIT_UNTIL: 'networkidle',
  MAX_RETRIES: 2,
  ENABLE_CACHE: false,
  DEBUG: true,
}
```

### Para Testes
```javascript
{
  DEFAULT_TIMEOUT: 30000,
  MAX_SITES: 3,
  WAIT_UNTIL: 'load',
  MAX_RETRIES: 0,
  ENABLE_CACHE: false,
  DEBUG: true,
}
```

## 🔧 COMO APLICAR MUDANÇAS

1. **Editar o arquivo:**
```bash
code backend/config/search-config.js
```

2. **Modificar valores:**
```javascript
export const SEARCH_CONFIG = {
    DEFAULT_TIMEOUT: 90000, // Aumentar para 90s
    MAX_SITES: 15,          // Aumentar para 15 sites
    // ...
};
```

3. **Reiniciar o backend:**
```bash
cd backend
npm start
```

4. **Testar:**
```bash
node test-busca-massiva.js
```

## 📈 MONITORAMENTO

Para ver o impacto das mudanças, observe:

1. **Duração total** - Deve diminuir com timeouts menores
2. **Sites bem-sucedidos** - Deve aumentar com timeouts maiores
3. **Total de resultados** - Deve aumentar com mais sites
4. **Taxa de falha** - Deve diminuir com timeouts maiores

## ⚠️ AVISOS

- **Não diminuir muito os timeouts:** Sites podem não carregar
- **Não aumentar muito MAX_SITES:** Pode sobrecarregar o sistema
- **Testar sempre após mudanças:** Verificar se não quebrou nada
- **Backup antes de mudar:** Copiar configuração original

## 🎉 CONFIGURAÇÃO ATUAL

**Configuração otimizada aplicada:**
- ✅ Timeout aumentado para 60s (antes: 30s)
- ✅ Timeouts específicos por tipo de site
- ✅ Configurações otimizadas por tipo de query
- ✅ Sistema de retry implementado
- ✅ Debug habilitado

**Resultado esperado:**
- Menos timeouts
- Mais sites bem-sucedidos
- Melhor taxa de sucesso geral

---

**Próximo passo:** Testar com `node backend/test-busca-massiva.js`
