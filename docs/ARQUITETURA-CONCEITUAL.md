# PROST-QS — Arquitetura Conceitual

**O que o sistema faz em uma frase:**
> PROST-QS observa apps em tempo real, entende comportamento, age automaticamente e aprende com os resultados.

**Categoria atual:** Sistema Operacional de Comportamento

---

## O Ciclo Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   OBSERVAÇÃO ──► DECISÃO ──► AÇÃO ──► REGISTRO ──► APRENDIZADO     │
│        │            │          │          │              │          │
│     eventos      análise    webhook    histórico      feedback      │
│     sessões      padrões    alerta     auditável      ajuste        │
│     métricas     insights   flag       memória        evolução      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

Esse ciclo diferencia o PROST-QS de ferramentas fragmentadas:
- Firebase/Supabase → infraestrutura, não decisão
- Mixpanel/Amplitude → análise, não ação
- Zapier → ação sem contexto
- Intercom → regras limitadas

**PROST-QS:** observa, entende, decide e age no mesmo modelo mental.

---

## As 3 Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   CAMADA 3: AÇÃO                                           │
│   "O sistema reage"                                         │
│   Rules Engine → Alertas, Webhooks, Flags                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   CAMADA 2: DECISÃO                                        │
│   "O sistema entende"                                       │
│   Analytics → Funil, Retenção, Padrões                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   CAMADA 1: OBSERVAÇÃO                                     │
│   "O sistema vê"                                            │
│   Telemetria → Eventos, Sessões, Métricas                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Camada 1: Observação

**Pergunta que responde:** "O que está acontecendo agora?"

**Componentes:**
- `TelemetryEvent` — Fato histórico (imutável)
- `AppSession` — Estado vivo de uma sessão
- `AppMetricsSnapshot` — Visão agregada pronta para consumo

**Fluxo:**
```
App emite evento → Kernel processa → Sessão atualizada → Snapshot recalculado
```

**Métricas disponíveis:**
- online_now
- active_sessions
- events_per_minute
- total_interactions

**Princípio:** Apps não calculam. Apps emitem. O kernel observa.

---

## Camada 2: Decisão

**Pergunta que responde:** "O que isso significa?"

**Componentes:**
- Funil de conversão
- Retenção D1/D7/D30
- Engajamento (bounce rate, match rate)
- Heatmap de atividade
- Jornada do usuário
- Distribuição geográfica

**Fluxo:**
```
Dados brutos → Agregação → Insight → Visualização
```

**Insights disponíveis:**
- "Usuários abandonam na etapa X"
- "Retenção caiu 20% essa semana"
- "Pico de uso às 21h"
- "70% dos usuários são do Brasil"

**Princípio:** Dados viram conhecimento. Conhecimento guia decisão.

---

## Camada 3: Ação

**Pergunta que responde:** "O que fazer sobre isso?"

**Componentes:**
- `Rule` — Regra declarativa (condição → ação)
- `RuleExecution` — Histórico de execuções
- Triggers (metric, event, threshold, schedule)
- Actions (alert, webhook, flag, notify)

**Fluxo:**
```
Condição satisfeita → Ação executada → Resultado registrado
```

**Exemplos de regras:**
- "Se bounce_rate > 60%, criar alerta"
- "Se usuário inativo há 3 dias, marcar como risco de churn"
- "Se online_now > 100, chamar webhook de scaling"

**Princípio:** O sistema age sozinho. Humano supervisiona.

---

## O que cada camada NÃO faz

| Camada | NÃO faz |
|--------|---------|
| Observação | Não interpreta, não decide, não age |
| Decisão | Não coleta dados, não executa ações |
| Ação | Não calcula métricas, não analisa padrões |

Separação clara = sistema previsível.

---

## Como as camadas se conectam

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  OBSERVAÇÃO  │────▶│   DECISÃO    │────▶│    AÇÃO      │
│              │     │              │     │              │
│  Eventos     │     │  Analytics   │     │  Rules       │
│  Sessões     │     │  Insights    │     │  Automação   │
│  Métricas    │     │  Padrões     │     │  Reação      │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │                    │                    │
       ▼                    ▼                    ▼
   "O que?"            "Por quê?"           "E agora?"
```

---

## Decisões de arquitetura (e por quê)

### 1. Eventos são imutáveis
**Por quê:** Histórico confiável. Nunca se perde contexto.

### 2. Sessões são estado vivo
**Por quê:** Presença real. Não fake login.

### 3. Snapshots são pré-agregados
**Por quê:** Dashboard rápido. Não calcula em tempo de request.

### 4. Regras são declarativas
**Por quê:** Fácil de entender, auditar, modificar.

### 5. Cooldown em regras
**Por quê:** Evita spam. Sistema não enlouquece.

### 6. Polling no dashboard (não WebSocket)
**Por quê:** Simples, previsível, suficiente para este estágio.

---

## O que o PROST-QS substitui

| Ferramenta externa | PROST-QS equivalente |
|--------------------|---------------------|
| Firebase Auth | Identity Module |
| Mixpanel/Amplitude | Telemetry + Analytics |
| Segment | Event Pipeline |
| Intercom triggers | Rules Engine |
| Zapier automations | Rules Engine |

**Diferença:** Tudo no mesmo contexto, com o mesmo modelo mental.

---

## Vocabulário do sistema

| Termo | Definição |
|-------|-----------|
| **Evento** | Fato que aconteceu (imutável) |
| **Sessão** | Período de atividade de um usuário |
| **Snapshot** | Foto das métricas em um momento |
| **Regra** | Condição + Ação |
| **Trigger** | O que dispara uma regra |
| **Action** | O que a regra faz quando dispara |
| **Cooldown** | Tempo mínimo entre disparos |

---

## Perguntas que o sistema responde

### Observação
- Quantos usuários estão online agora?
- Qual a taxa de eventos por minuto?
- Quais sessões estão ativas?

### Decisão
- Qual a retenção D1/D7/D30?
- Onde os usuários abandonam o funil?
- Qual o horário de pico?
- Quais são os usuários mais engajados?

### Ação
- Quando devo ser alertado?
- O que fazer quando X acontece?
- Como automatizar resposta a padrões?

---

## Próximos passos naturais

### AGORA: Fase de Observação (72h)
1. **Não mexer em nada** — estabelecer baseline
2. **Observar padrões de disparo** — quais regras falam, quais calam
3. **Classificar alertas** — ruído vs sinal vs insight
4. **Deixar o sistema ensinar** — ele vai mostrar onde está mal calibrado

### DEPOIS: Refinamento baseado em evidência
1. **Ajustar thresholds** — baseado em dados reais, não intuição
2. **Calibrar cooldowns** — regras que disparam demais precisam respirar
3. **Desativar ruído** — regras que não agregam viram log-only

### FUTURO: Ações Consequentes (próximo salto real)
Não é mais feature. É governança automática:
- Ações que mudam estado do sistema
- Ações que alteram comportamento do app
- Ações que criam novas regras a partir de regras

Exemplos conceituais:
- "Se churn sobe → reduzir frequência de anúncios"
- "Se engajamento cai → mudar algoritmo de feed"
- "Se pico acontece → criar regra temporária de proteção"
- "Se alerta crítico não é acknowledged → escalar severidade"

**Só avançar quando confiar no que o sistema está dizendo.**

---

*Documento criado em 10/01/2026*
*Propósito: Clareza conceitual, não técnica*
*Status: CICLO COMPLETO — FASE DE OBSERVAÇÃO*
