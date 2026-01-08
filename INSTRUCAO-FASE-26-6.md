# FASE 26.6 — INTERPRETAÇÃO ASSISTIDA

## Definição

**Integrar Gemini como narrador cognitivo READ-ONLY para ajudar o humano a interpretar o sistema.**

O sistema não muda. O humano aprende a ler o sistema melhor.

---

## O QUE ESTA FASE NÃO É

❌ Não é calibração de inteligência
❌ Não é alteração de agentes
❌ Não é interferência no core
❌ Não é Fase 27
❌ Não é Gemini decidindo
❌ Não é Gemini sugerindo mudanças

---

## O QUE CONTINUA PROIBIDO

- Gemini decidir qualquer coisa
- Gemini sugerir mudança de regra
- Gemini alterar thresholds
- Gemini influenciar o sistema
- Gemini no loop operacional
- Qualquer mutação de dados

---

## O QUE PASSA A SER PERMITIDO

✅ Gemini explicar gráficos
✅ Gemini resumir tendências
✅ Gemini gerar texto estruturado
✅ Gemini responder perguntas sobre dados
✅ Gemini gerar relatórios narrativos
✅ Gemini traduzir dados em linguagem humana

---

## PAPEL DO GEMINI

```
┌─────────────────────────────────────────────────────────┐
│                    GEMINI = NARRADOR                     │
├─────────────────────────────────────────────────────────┤
│  ENTRADA: Dados do Dashboard Cognitivo (JSON)           │
│  SAÍDA: Texto estruturado / Narrativa                   │
│  AÇÃO: NENHUMA                                          │
│  DECISÃO: NENHUMA                                       │
│  MUTAÇÃO: NENHUMA                                       │
└─────────────────────────────────────────────────────────┘
```

---

## CONTRATO DO GEMINI NARRADOR

### Entrada Permitida
- Dados de `/admin/cognitive/dashboard`
- Dados de `/admin/cognitive/agents`
- Dados de `/admin/cognitive/decisions`
- Dados de `/admin/cognitive/noise`
- Dados de `/admin/cognitive/trust`

### Saída Permitida
- Texto em português
- Resumo estruturado
- Análise narrativa
- Resposta a perguntas específicas
- Formato para Notebook LLM / Podcast

### Saída Proibida
- Comandos
- Sugestões de ação
- Recomendações de mudança
- Qualquer coisa que implique "faça X"

---

## PROMPT BASE DO GEMINI (GOVERNADO)

```
Você é um NARRADOR COGNITIVO do sistema PROST-QS.

SEU PAPEL:
- Explicar dados
- Resumir tendências
- Traduzir métricas em linguagem humana
- Responder perguntas sobre o estado do sistema

VOCÊ NÃO PODE:
- Sugerir ações
- Recomendar mudanças
- Decidir qualquer coisa
- Dizer "você deveria fazer X"
- Influenciar o comportamento do sistema

FORMATO DE RESPOSTA:
- Linguagem clara e acessível
- Fatos, não opiniões
- Dados, não julgamentos
- Observações, não prescrições

EXEMPLO DE RESPOSTA CORRETA:
"Nas últimas 24 horas, o sistema gerou 15 sugestões. 
Dessas, 8 foram aceitas (53%), 5 ignoradas (33%) e 2 adiadas (13%).
O agente 'error_rate_agent' teve a maior taxa de aceitação (70%).
O finding mais ignorado foi 'high_memory_usage' com 4 ocorrências."

EXEMPLO DE RESPOSTA PROIBIDA:
"Você deveria ajustar o threshold do error_rate_agent."
"Recomendo silenciar o finding high_memory_usage."
"O sistema precisa de calibração."
```

---

## ENDPOINTS NOVOS (READ-ONLY)

```
POST /api/v1/admin/cognitive/narrate
  Body: { "type": "summary" | "weekly" | "question", "question"?: string }
  Response: { "narrative": string, "generated_at": timestamp }

GET /api/v1/admin/cognitive/report/daily
  Response: { "report": string, "data": object, "generated_at": timestamp }

GET /api/v1/admin/cognitive/report/weekly
  Response: { "report": string, "data": object, "generated_at": timestamp }
```

---

## FLUXO DE DADOS

```
Dashboard Cognitivo (JSON)
         │
         ▼
┌─────────────────┐
│  Gemini API     │
│  (narrador)     │
└────────┬────────┘
         │
         ▼
   Texto Narrativo
         │
         ▼
┌─────────────────┐
│  Frontend       │
│  (exibição)     │
└─────────────────┘
         │
         ▼
   Notebook LLM / Podcast (opcional)
```

---

## TIPOS DE NARRATIVA

### 1. Resumo Instantâneo
"Como está o sistema agora?"
- KPIs principais
- Status geral
- Alertas ativos

### 2. Relatório Diário
"O que aconteceu hoje?"
- Sugestões geradas
- Decisões tomadas
- Padrões identificados

### 3. Relatório Semanal
"Como foi a semana?"
- Tendências
- Evolução da confiança
- Padrões de ruído

### 4. Resposta a Pergunta
"Por que o agente X está sendo ignorado?"
- Análise específica
- Dados contextuais
- Sem recomendação

---

## CHECKLIST DE CONCLUSÃO

```
[x] Documento INSTRUCAO-FASE-26-6.md criado
[x] Serviço de narração implementado (backend)
[x] Prompt base do Gemini definido e governado
[x] Endpoint /admin/cognitive/narrate implementado
[x] Endpoint /admin/cognitive/report/daily implementado
[x] Endpoint /admin/cognitive/report/weekly implementado
[x] Frontend com botão "Gerar Narrativa"
[x] Integração com Gemini API
[x] Zero decisão pelo Gemini
[x] Zero mutação de dados
```

---

## CRITÉRIO DE SUCESSO

A Fase 26.6 está completa quando:

1. **Humano pode pedir explicação ao Gemini**
2. **Gemini responde apenas com narrativa**
3. **Nenhuma sugestão de ação é gerada**
4. **Dados podem ser exportados para Notebook LLM**

---

## VARIÁVEIS DE AMBIENTE

```env
GEMINI_API_KEY=sua_chave_aqui
GEMINI_NARRATOR_ENABLED=true
GEMINI_MODEL=gemini-1.5-flash
```

---

## SEGURANÇA

- API Key do Gemini armazenada em variável de ambiente
- Nenhum dado sensível enviado ao Gemini
- Apenas métricas agregadas (nunca PII)
- Rate limiting para evitar abuso
- Logs de todas as chamadas ao Gemini

---

*Documento criado em 29/12/2025*
*PROST-QS - Fase 26.6 (Interpretação Assistida)*
