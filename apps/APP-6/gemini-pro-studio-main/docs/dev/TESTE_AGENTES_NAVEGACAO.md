# 🧪 Guia de Teste - Agentes de Navegação Inteligente

## 🚀 Como Testar

### 1. Iniciar o Sistema

```bash
# Terminal 1 - Backend
cd gemini-pro-studio-main/backend
npm start

# Terminal 2 - Frontend
cd gemini-pro-studio-main
npm run dev
```

### 2. Verificar Inicialização

No console do backend, você deve ver:

```
🤖 Navigator Agent inicializado
🤖 Navigator Agents inicializados
```

Se ver `⚠️ GEMINI_API_KEY não encontrada`, configure a chave no `.env`:

```env
GEMINI_API_KEY=sua_chave_aqui
VITE_GEMINI_API_KEY=sua_chave_aqui
```

## 📝 Casos de Teste

### Teste 1: Navegação com URL Direta ✅

**Ação**: Ativar Modo Navegação e digitar:
```
playwright.dev
```

**Resultado Esperado**:
- Navegação direta (sem agente)
- Screenshot da página
- Conteúdo extraído
- Canvas atualizado

---

### Teste 2: Navegação Inteligente Simples 🤖

**Ação**: Ativar Modo Navegação e digitar:
```
Busque por Python no Google
```

**Resultado Esperado**:
```
🤖 Agente de Navegação Ativado

🧠 Analisando sua solicitação...
✅ Plano criado por Gemini 2.5 Flash (5 passos)
✅ Sessão iniciada
📍 Passo 1/5: Navegar para Google
📍 Passo 2/5: Aguardar campo de busca
📍 Passo 3/5: Preencher "Python"
📍 Passo 4/5: Clicar em buscar
📍 Passo 5/5: Capturar screenshot
✅ Navegação concluída!

🎯 Objetivo: Buscar por Python no Google
📋 Passos executados: 5
🤖 Agente: Gemini 2.5 Flash
⏱️ Duração: 12s

👉 Veja o resultado no Canvas ao lado!
```

---

### Teste 3: Navegação com Contexto 🎯

**Ação**: Ativar Modo Navegação e digitar:
```
Entre no site da Amazon e procure por notebooks
```

**Resultado Esperado**:
- Plano com 6-7 passos
- Navegação para amazon.com
- Busca por "notebooks"
- Screenshot dos resultados
- Conteúdo extraído (produtos)

---

### Teste 4: Extração de Dados 📊

**Ação**: Ativar Modo Navegação e digitar:
```
Acesse o GitHub e extraia informações sobre o projeto Playwright
```

**Resultado Esperado**:
- Navegação para github.com
- Busca por "playwright"
- Extração de dados estruturados
- Screenshot

---

### Teste 5: Múltiplas Requisições (Teste de Quota) 🔄

**Ação**: Fazer 5 navegações seguidas rapidamente:

```
1. "Busque por Python no Google"
2. "Busque por JavaScript no Google"
3. "Busque por TypeScript no Google"
4. "Busque por React no Google"
5. "Busque por Node.js no Google"
```

**Resultado Esperado**:
- Primeira usa Gemini 2.5 Flash
- Segunda usa Gemini 2.5 Flash Lite
- Terceira usa Gemini 2.0 Flash
- Quarta volta para Flash (se quota por minuto resetou)
- Todas executam com sucesso

---

### Teste 6: Verificar Estatísticas 📈

**Ação**: Fazer requisição para:
```
GET http://localhost:3002/api/navigator/stats
```

**Resultado Esperado**:
```json
{
  "agents": [
    {
      "key": "flash",
      "name": "Gemini 2.5 Flash",
      "model": "gemini-2.5-flash",
      "callsToday": 2,
      "quotaPerDay": 1500,
      "callsThisMinute": 0,
      "quotaPerMinute": 15,
      "available": true
    },
    {
      "key": "lite",
      "name": "Gemini 2.5 Flash Lite",
      "model": "gemini-2.5-flash-lite",
      "callsToday": 1,
      "quotaPerDay": 1500,
      "callsThisMinute": 0,
      "quotaPerMinute": 15,
      "available": true
    },
    {
      "key": "pro",
      "name": "Gemini 2.0 Flash",
      "model": "gemini-2.0-flash",
      "callsToday": 1,
      "quotaPerDay": 1000,
      "callsThisMinute": 0,
      "quotaPerMinute": 10,
      "available": true
    }
  ],
  "metrics": {
    "totalCalls": 4,
    "successfulCalls": 4,
    "failedCalls": 0,
    "avgResponseTime": 2500,
    "plansGenerated": 4,
    "plansExecuted": 4
  }
}
```

---

### Teste 7: Erro Intencional ❌

**Ação**: Ativar Modo Navegação e digitar:
```
Faça algo impossível que não existe
```

**Resultado Esperado**:
```
❌ Erro na Navegação Inteligente

[Mensagem de erro do agente]

💡 Dica: Tente ser mais específico ou forneça uma URL direta.
```

---

## 🔍 Verificações

### Backend Console

Deve mostrar:

```
🤖 Agente selecionado: Gemini 2.5 Flash (0/1500 hoje)
🧠 Gerando plano para: Busque por Python no Google
✅ Plano gerado por Gemini 2.5 Flash em 1234ms
📋 Plano: { objective: '...', steps: [...] }
🚀 Executando plano: Buscar por Python no Google
📍 Passo 1/5: Navegar para Google
✅ Passo 1 concluído
📍 Passo 2/5: Aguardar campo de busca
✅ Passo 2 concluído
...
🎉 Plano executado com sucesso!
```

### Frontend Console

Deve mostrar:

```
🤖 Processando intenção: Busque por Python no Google
✅ Navegação concluída!
```

### Canvas

Deve exibir:
- Screenshot da página final
- Título e URL
- Conteúdo extraído
- Plano executado (opcional)

---

## 🐛 Problemas Comuns

### 1. "Agentes não disponíveis"

**Causa**: GEMINI_API_KEY não configurada

**Solução**:
```bash
# Adicionar no .env
GEMINI_API_KEY=sua_chave_aqui
VITE_GEMINI_API_KEY=sua_chave_aqui

# Reiniciar backend
```

---

### 2. "Todos os agentes atingiram o limite"

**Causa**: Muitas requisições em pouco tempo

**Solução**:
- Aguardar 1 minuto
- Ou aguardar reset diário
- Verificar quotas com GET /api/navigator/stats

---

### 3. "Erro ao executar plano"

**Causa**: Playwright não instalado ou erro no plano

**Solução**:
```bash
# Instalar Playwright
cd backend
npm install playwright
npx playwright install chromium
```

---

### 4. Plano não faz sentido

**Causa**: Prompt ambíguo ou modelo não entendeu

**Solução**:
- Ser mais específico
- Fornecer mais contexto
- Tentar reformular

---

## 📊 Métricas de Sucesso

### ✅ Teste Passou Se:

1. Agentes inicializam corretamente
2. Plano é gerado em < 5 segundos
3. Plano tem passos lógicos e sequenciais
4. Execução completa sem erros
5. Screenshot é capturado
6. Conteúdo é extraído
7. Canvas é atualizado
8. Balanceamento funciona (múltiplas requisições)
9. Estatísticas são atualizadas
10. Feedback visual é claro

---

## 🎯 Próximos Testes

Após validar os testes básicos, testar:

1. **Formulários Complexos**
   - Login em sites
   - Preenchimento multi-campo
   - Seleção de dropdowns

2. **Navegação Multi-Página**
   - Clicar em links
   - Navegar entre páginas
   - Voltar/Avançar

3. **Extração Estruturada**
   - Listas de produtos
   - Tabelas de dados
   - Cards de informação

4. **Performance**
   - 10 navegações seguidas
   - Tempo médio de resposta
   - Taxa de sucesso

5. **Resiliência**
   - Sites lentos
   - Timeouts
   - Elementos não encontrados

---

## 📝 Checklist de Teste

- [ ] Backend inicia sem erros
- [ ] Frontend inicia sem erros
- [ ] Agentes são inicializados
- [ ] Teste 1: URL direta funciona
- [ ] Teste 2: Navegação inteligente funciona
- [ ] Teste 3: Navegação com contexto funciona
- [ ] Teste 4: Extração de dados funciona
- [ ] Teste 5: Balanceamento funciona
- [ ] Teste 6: Estatísticas corretas
- [ ] Teste 7: Erro tratado corretamente
- [ ] Canvas atualiza corretamente
- [ ] Feedback visual claro
- [ ] Performance aceitável (< 15s por navegação)

---

**Boa sorte com os testes! 🚀**
