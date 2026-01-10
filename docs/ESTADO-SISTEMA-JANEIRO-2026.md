# PROST-QS + VOX-BRIDGE — Estado do Sistema
**Data:** 10 de Janeiro de 2026  
**Autor:** Tech Lead AI  
**Versão:** 1.0

---

## Resumo Executivo

O sistema PROST-QS está **100% operacional em produção**. A Fase 30 (Telemetria Comportamental) foi concluída com sucesso, estabelecendo um pipeline completo de observabilidade end-to-end.

**Status Geral: ✅ PRODUÇÃO ESTÁVEL**

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

### Curto Prazo (1-2 semanas)
- [ ] Timeout automático de sessões zumbi (reduzir para 60s)
- [ ] `session.recover` para reconexão sem inflar métricas
- [ ] Deduplicação de sessão por device_id
- [ ] Alertas básicos (queda brusca de online)
- [ ] Exportar métricas CSV

### Médio Prazo (1-2 meses)
- [ ] Retenção por coorte (D1, D7, D30)
- [ ] Funil por feature
- [ ] Dashboard de erros

### Longo Prazo (3+ meses)
- [ ] Integração BI externo (Metabase/Superset)
- [ ] Machine Learning para anomalias
- [ ] Multi-região

---

## 11. Conclusão

O sistema PROST-QS evoluiu de "projeto experimental" para **base de empresa de verdade**.

**Principais conquistas:**
- Sistema que se observa (e sistemas que se observam evoluem)
- Arquitetura de plataforma, não de produto isolado
- Fundação sólida que não exige refactor para crescer

**Decisões acertadas:**
- Não usar Supabase (controle total)
- Não terceirizar inteligência
- PostgreSQL próprio (Neon)
- Telemetria comportamental desde o início

**Status Final:** Produção estável, pronto para escalar.

---

*Documento gerado em 10/01/2026 — Tech Lead AI*
