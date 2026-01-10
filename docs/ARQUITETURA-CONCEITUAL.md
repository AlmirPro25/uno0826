# PROST-QS — Arquitetura Conceitual

**O que o sistema faz em uma frase:**
> PROST-QS observa apps em tempo real, entende comportamento e age automaticamente.

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

1. **Usar as regras** — Criar regras reais para o VOX-BRIDGE
2. **Observar padrões** — Deixar o sistema rodar e coletar dados
3. **Refinar condições** — Ajustar thresholds baseado em dados reais
4. **Adicionar ações** — Webhooks para sistemas externos

---

*Documento criado em 10/01/2026*
*Propósito: Clareza conceitual, não técnica*
