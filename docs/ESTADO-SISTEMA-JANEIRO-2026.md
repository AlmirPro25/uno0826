# PROST-QS + VOX-BRIDGE — Estado do Sistema
**Data:** 10 de Janeiro de 2026  
**Autor:** Tech Lead AI  
**Versão:** 2.0 — SISTEMA FECHADO FUNCIONALMENTE

---

## Resumo Executivo

O sistema PROST-QS está **fechado funcionalmente**. Não "acabado" — fechado no sentido de **confiável e pronto para escalar**.

**Status: ✅ PRODUÇÃO ESTÁVEL — NÃO MEXER NO KERNEL**

---

## O que o sistema tem hoje

| Capability | Status | Descrição |
|------------|--------|-----------|
| Sessões reais | ✅ | Não fake login, ciclo completo start→ping→end |
| Session recovery | ✅ | Reconexão sem inflar métricas (localStorage + query string) |
| Cleanup automático | ✅ | Sessões zumbi morrem em 60s |
| Métricas real-time | ✅ | Polling 3s, dados confiáveis |
| Alertas | ✅ | Queda de online, taxa de erros |
| Timeline debug | ✅ | Sessões ativas com contexto |
| Health log | ✅ | Log a cada 5min para monitoramento |
| Funil de conversão | ✅ | Sessão → Fila → Match → Chat |
| Engajamento | ✅ | Duração, bounce rate, match rate |
| Retenção D1/D7/D30 | ✅ | Coortes diários com médias |
| Comparação períodos | ✅ | Últimos N dias vs anteriores |
| Heatmap atividade | ✅ | Grid hora x dia da semana |
| Jornada usuário | ✅ | Fluxo típico com drop-off |
| Distribuição geo | ✅ | Top países por sessões |
| Live events | ✅ | Stream em tempo real |
| Top users | ✅ | Ranking por engajamento |
| **Rules Engine** | ✅ | **Camada de decisão automática** |

**Sistema de analytics + decisão completo. Plataforma adaptativa.**

---

## 1. Arquitetura Atual

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ECOSSISTEMA PROST-QS                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    WebSocket     ┌──────────────────────────┐    │
│  │  VOX-BRIDGE  │◄────────────────►│    Usuários Finais       │    │
│  │  (APP-1)     │                  │    (Video Chat)          │    │
│  └──────┬───────┘                  └──────────────────────────┘    │
│         │                                                           │
│         │ HTTP (Telemetria)                                         │
│         ▼                                                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      PROST-QS KERNEL                          │  │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌─────────────────┐   │  │
│  │  │Identity │ │ Billing │ │ Agents   │ │   Telemetry     │   │  │
│  │  │ Module  │ │ Module  │ │ Module   │ │   Module ✨     │   │  │
│  │  └─────────┘ └─────────┘ └──────────┘ └─────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│         │                                                           │
│         │ PostgreSQL                                                │
│         ▼                                                           │
│  ┌──────────────┐                  ┌──────────────────────────┐    │
│  │  Neon DB     │                  │    Admin Dashboard       │    │
│  │  (sa-east-1) │                  │    (Real-time)           │    │
│  └──────────────┘                  └──────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. URLs de Produção

| Serviço | URL | Status |
|---------|-----|--------|
| PROST-QS Backend | https://uno0826.onrender.com | ✅ Online |
| VOX-BRIDGE API | https://vox-bridge-api.onrender.com | ✅ Online |
| VOX-BRIDGE Frontend | https://vox-bridge-ivory.vercel.app | ✅ Online |
| Admin Dashboard | https://admin-six-mauve.vercel.app | ✅ Online |
| Neon PostgreSQL | ep-morning-rain-ackv38c5-pooler.sa-east-1.aws.neon.tech | ✅ Online |

---

## 3. Módulos Implementados

### 3.1 Identity Module ✅
- Autenticação JWT
- Registro/Login de usuários
- Gestão de sessões
- OAuth2 preparado

### 3.2 Application Module ✅
- CRUD de aplicações
- Geração de API Keys (public/secret)
- Scopes: identity, billing, agents, audit
- Multi-tenant por design

### 3.3 Billing Module ✅
- Integração Stripe preparada
- Modelo de subscriptions
- Capabilities por plano
- Webhooks configurados

### 3.4 Telemetry Module ✅ (Fase 30 - COMPLETA)
- **Sessões Reais** (AppSession ≠ login)
- **Eventos Semânticos** (TelemetryEvent)
- **Métricas Pré-agregadas** (AppMetricsSnapshot)
- **Heartbeat** para presença real
- **Polling 3s** no dashboard

---

## 4. Fluxo de Telemetria (End-to-End)

```
Usuário abre VOX-BRIDGE
        │
        ▼
┌───────────────────┐
│ session.start     │ ──► PROST-QS cria AppSession
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ session.ping      │ ──► Heartbeat a cada 30s (mantém online_now)
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Eventos de Ação   │
│ - queue.joined    │
│ - match.created   │ ──► TelemetryEvent gravado + métricas atualizadas
│ - message.sent    │
│ - skip            │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ session.end       │ ──► Sessão encerrada, métricas finalizadas
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Admin Dashboard   │ ──► Polling 3s busca AppMetricsSnapshot
└───────────────────┘
```

---

## 5. Métricas Disponíveis no Dashboard

### Row 1 - Métricas Principais
| Métrica | Campo | Descrição |
|---------|-------|-----------|
| Usuários | total_users | Total de usuários únicos |
| Ativos (24h) | active_users_24h | Usuários ativos nas últimas 24h |
| Online Agora | online_now | Usuários com sessão ativa (heartbeat) |
| Sessões Total | total_sessions | Total de sessões criadas |
| Sessões Ativas | active_sessions | Sessões abertas agora |
| Eventos | total_events | Total de eventos processados |

### Row 2 - Métricas Detalhadas
| Métrica | Campo | Descrição |
|---------|-------|-----------|
| Eventos/min | events_per_minute | Taxa de eventos por minuto |
| Ativos (1h) | active_users_1h | Usuários ativos na última hora |
| Eventos (24h) | events_24h | Eventos nas últimas 24h |
| Interações | total_interactions | Total de matches/interações |
| Interações (24h) | interactions_24h | Interações nas últimas 24h |

### Usuários por Feature
- Mostra distribuição de usuários por feature (lobby, video_chat, queue, etc.)
- Atualizado em tempo real via `users_by_feature` JSON

---

## 5.1 Analytics Avançado ✨ (NOVO)

### Funil de Conversão
- Sessão Iniciada → Fila → Match → Mensagem → Match Completo
- Drop-off por etapa
- Endpoint: `GET /admin/telemetry/apps/:id/funnel?since=24h`

### Engajamento
| Métrica | Descrição |
|---------|-----------|
| Duração média | Tempo médio de sessão |
| Eventos/sessão | Engajamento por sessão |
| Matches/usuário | Taxa de sucesso |
| Msgs/match | Qualidade do match |
| Bounce rate | Sessões < 30s |
| Match rate | % sessões com match |

### Retenção D1/D7/D30
- Coortes diários
- D1: voltou no dia seguinte
- D7: voltou após 7 dias
- D30: voltou após 30 dias
- Endpoint: `GET /admin/telemetry/apps/:id/retention?days=14`

### Comparação de Períodos
- Últimos N dias vs N dias anteriores
- Variação % em sessões, usuários, eventos, matches
- Endpoint: `GET /admin/telemetry/apps/:id/compare?days=7`

### Heatmap de Atividade
- Grid 7x24 (dia da semana x hora)
- Intensidade por volume de eventos
- Identifica horários de pico
- Endpoint: `GET /admin/telemetry/apps/:id/heatmap?days=30`

### Jornada do Usuário
- Fluxo típico: session.start → queue → match → message → end
- Drop-off por etapa
- Taxa de completude
- Endpoint: `GET /admin/telemetry/apps/:id/journey?since=24h`

### Distribuição Geográfica
- Top países por sessões
- Percentual por região
- Endpoint: `GET /admin/telemetry/apps/:id/geo?since=168h`

### Eventos em Tempo Real
- Stream dos últimos eventos
- Atualização a cada 5s
- Endpoint: `GET /admin/telemetry/apps/:id/live?limit=15`

### Top Usuários
- Ranking por engajamento
- Sessões, duração, matches
- Endpoint: `GET /admin/telemetry/apps/:id/top-users?limit=10`

---

## 5.2 Rules Engine ✨ (NOVO - Camada de Decisão)

O Rules Engine transforma o PROST-QS de **plataforma observável** para **plataforma adaptativa**.

### Conceito
```
Observação → Condição → Ação
```

### Tipos de Trigger
| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `metric` | Baseado em métrica | `bounce_rate > 60` |
| `threshold` | Baseado em threshold | `online_now > 100` |
| `event` | Baseado em evento | `session.end` |
| `schedule` | Baseado em horário | Cron expression |

### Tipos de Ação
| Tipo | Descrição |
|------|-----------|
| `alert` | Criar alerta no sistema |
| `webhook` | Chamar URL externa |
| `flag` | Marcar usuário/sessão |
| `notify` | Enviar notificação |

### Templates Pré-definidos
- **Retenção Baixa**: Alerta quando D1 < 10%
- **Bounce Alto**: Alerta quando bounce > 60%
- **Pico Online**: Alerta quando online > threshold
- **Risco de Churn**: Flag usuários inativos
- **Queda de Atividade**: Alerta quando eventos/min cai

### Endpoints
```
GET  /admin/rules/app/:appId        → Lista regras do app
POST /admin/rules                   → Criar regra
PUT  /admin/rules/:id               → Atualizar regra
DELETE /admin/rules/:id             → Deletar regra
POST /admin/rules/:id/toggle        → Ativar/desativar
GET  /admin/rules/templates         → Templates pré-definidos
POST /admin/rules/from-template     → Criar de template
GET  /admin/rules/:id/executions    → Histórico de execuções
```

### Exemplo de Regra
```json
{
  "name": "Bounce Rate Alto",
  "trigger_type": "metric",
  "condition": "bounce_rate > 60 AND online_now > 10",
  "action_type": "alert",
  "cooldown_minutes": 360
}
```

---

## 6. Eventos Emitidos pelo VOX-BRIDGE

| Evento | Quando | Dados |
|--------|--------|-------|
| `session.start` | Conexão WebSocket | user_id, device_info |
| `session.ping` | A cada 30s | session_id |
| `session.end` | Desconexão | session_id, duration |
| `interaction.queue.joined` | Entra na fila | user_id |
| `interaction.queue.left` | Sai da fila | user_id, reason |
| `interaction.match.created` | Match iniciado | user_ids, room_id |
| `interaction.match.ended` | Match encerrado | room_id, duration |
| `interaction.skip` | Skip de parceiro | user_id, skipped_id |
| `interaction.message.sent` | Mensagem enviada | user_id, type |
| `nav.feature.enter` | Entra em feature | feature_name |
| `nav.feature.leave` | Sai de feature | feature_name |
| `error.ice_failure` | Erro WebRTC | user_id, error |

---

## 7. Stack Tecnológica

### Backend PROST-QS
- **Linguagem:** Go 1.21+
- **Framework:** Chi Router
- **Database:** PostgreSQL (Neon)
- **Deploy:** Render.com
- **Auth:** JWT + API Keys

### VOX-BRIDGE (APP-1)
- **Backend:** Node.js + Socket.io
- **Frontend:** React + Vite
- **WebRTC:** Peer-to-peer video
- **Deploy:** Render (API) + Vercel (Frontend)

### Admin Dashboard
- **Stack:** HTML/CSS/JS puro
- **Styling:** Tailwind CSS (CDN)
- **Deploy:** Vercel
- **Updates:** Polling 3s

---

## 8. Credenciais VOX-BRIDGE

> ⚠️ **APENAS PARA AMBIENTE INTERNO — ROTACIONÁVEL**  
> Estas credenciais são de desenvolvimento/staging. Em produção real, rotacionar periodicamente.

```env
PROSTQS_URL=https://uno0826.onrender.com
PROSTQS_APP_ID=c573e4f0-a738-400c-a6bc-d890360a0057
PROSTQS_APP_KEY=pq_pk_***
PROSTQS_APP_SECRET=pq_sk_***
```

*Credenciais completas disponíveis no Render Dashboard (vox-bridge-api → Environment)*

---

## 9. Análise Técnica (Tech Lead)

### O que está sólido ✅

1. **Arquitetura de Plataforma**
   - Multi-tenant por design
   - Apps herdam observabilidade automaticamente
   - Separação clara: eventos → estado → visão

2. **Telemetria Comportamental**
   - Não é logging, é inteligência
   - Sessões reais com heartbeat
   - Métricas pré-agregadas (barato de consultar)

3. **Dashboard Observável**
   - Não calcula, apenas observa snapshots
   - Escalável e previsível
   - Real-time sem WebSocket (polling é suficiente)

4. **Integração VOX-BRIDGE**
   - Eventos semânticos ricos
   - Presença real funcionando
   - Erros categorizados

### Pontos de Atenção ⚠️

1. **Heartbeat Timeout**
   - Timeout atual: 5 minutos (configurável em `telemetry/service.go`)
   - Se frontend travar, sessão pode virar zumbi até expirar
   - Futuro: reduzir para 30-60s + cleanup automático

2. **Volume de Eventos**
   - Muitos eventos é bom para histórico
   - Nem tudo vira métrica (e está certo assim)
   - Regra: evento é barato, insight é caro

3. **Dashboard ≠ Analytics**
   - Responde: quanto, onde, agora
   - Não responde: por que, funil, retenção
   - Isso é próxima fase (não é falha)

### Débito Técnico Aceitável

- Tailwind via CDN (ok para admin interno)
- Polling vs WebSocket (ok para este estágio)
- Sem testes automatizados no frontend admin

---

## 10. Roadmap Sugerido

### ⛔ NÃO MEXER AGORA
- Arquitetura do kernel
- Modelo de eventos
- Banco de dados
- Telemetria base
- Analytics (já completo)

Tudo isso está correto o suficiente para crescer. Mexer agora é ansiedade técnica.

### ✅ COMPLETADO (Janeiro 2026)
- [x] Session cleanup automático
- [x] Session recovery
- [x] Sistema de alertas
- [x] Funil de conversão
- [x] Métricas de engajamento
- [x] Retenção D1/D7/D30
- [x] Comparação de períodos
- [x] Heatmap de atividade
- [x] Jornada do usuário
- [x] Distribuição geográfica
- [x] Live events stream
- [x] Top users ranking
- [x] **Rules Engine (Camada de Decisão)**

### Próximo Passo: OBSERVAR
Durante alguns dias:
1. Usar VOX-BRIDGE como usuário normal
2. Deixar admin aberto do lado
3. Observar padrões sem mudar nada
4. Usar os novos analytics para entender comportamento

### Depois: Escolher UM eixo

**Opção A — Produto**
- Melhorar VOX-BRIDGE com base nos dados
- Reduzir abandono, melhorar match, UX
- Usar funil e retenção para guiar decisões

**Opção B — Plataforma**
- Adicionar APP-2 simples
- Provar que PROST-QS escala para múltiplos apps
- Cada app herda analytics automaticamente

**Opção C — Monetização**
- Definir métrica de cobrança (sessão, minuto, interação)
- Implementar limites por plano
- Billing já está preparado

📌 Escolher apenas um.

---

## 11. Conclusão

**O sistema está fechado funcionalmente com analytics + decisão completos.**

Você construiu algo que:
- Observa sistemas enquanto eles funcionam
- Permite corrigir a rota antes de quebrar
- Não mente sobre métricas
- Se recupera de falhas
- Se alerta sobre anomalias
- Mede retenção, funil, engajamento
- Mostra padrões de uso (heatmap, jornada)
- Identifica usuários mais valiosos
- **Toma decisões automáticas baseadas em regras**

Isso é uma **plataforma adaptativa**, não apenas observável.

**Próximo passo: usar as regras para automatizar decisões de negócio.**

---

*Documento atualizado em 10/01/2026 — Tech Lead AI*
*Checkpoint: Sistema fechado funcionalmente + Analytics + Rules Engine*
