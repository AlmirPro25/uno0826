# 🛡️ PROST-QS: ESTADO DO KERNEL (MEMÓRIA E AUTODEFESA)
**Data:** 19 de Janeiro de 2026  
**Versão da Arquitetura:** 3.0 (Cognitive Engineering Phase)  
**Status:** Consolidado e Pronto para Produção  

---

## 1. 🎯 VISÃO GERAL
Esta fase marcou a transição do PROST-QS de um monitor passivo para um **Sistema Autodefensivo Soberano**. Implementamos o ciclo cognitivo completo: **Sentir** (RED Metrics), **Lembrar** (Selective Persistence), **Agir** (Defense Engine) e **Explicar** (Narrative Intelligence).

---

## 2. 🧠 CAMADA DE MEMÓRIA (SELECTIVE PERSISTENCE)
Implementada para filtrar o ruído de telemetria e reter apenas eventos com valor de governança e post-mortem.

### A. Tabelas de Banco de Dados (PostgreSQL)
*   **`incidents`**: Registra falhas críticas sustentadas.
    *   *Campos:* `id (UUID)`, `severity`, `trigger (ERROR_RATE/LATENCY)`, `affected_routes (JSONB)`, `status (OPEN/RESOLVED)`.
    *   *Lógica:* Mecanismo de **debounce de 5 min** para evitar spam de registros durante crises contínuas.
*   **`anomalies`**: Rastreador de desvios métricos.
    *   *Campos:* `baseline_value`, `observed_value`, `confidence (0-1)`.
*   **`kernel_events`**: O diário de consciência do sistema.
    *   *Campos:* `event_type`, `source`, `metadata (JSONB)`. Registra toda decisão de autodefesa e mudança de estado.

### B. Migrations
Localizada em: `backend/scripts/migrations/20260119_create_warobs_memory_tables.sql`

---

## 3. 🛡️ MOTOR DE AUTODEFESA (DEFENSE POLICY ENGINE)
O Kernel agora protege sua própria integridade sem intervenção humana imediata.

### A. Política 001: Route Circuit Breaker
*   **Trigger**: Se uma rota específica acumular **3 incidentes críticos** na última hora.
*   **Ação**: Ativação automática de um **Kill-Switch seletivo** (`route:/path`).
*   **Duração**: 10 minutos (auto-recuperação).
*   **Middleware**: `GuardMiddleware` intercepta requests e responde `429 CIRCUIT_BREAKER` ou `503 SYSTEM_PAUSED` antes de qualquer processamento pesado.

---

## 🔮 4. INTELIGÊNCIA NARRATIVA (GEMINI IA)
Integração do Gemini como a "Voz do Kernel".

*   **Serviço**: `NarrativeIntelligenceService` (em `warobs/narrative.go`).
*   **Contrato Cognitivo**: IA atua como **Narradora**, nunca como **Decisora**.
*   **Input**: Snapshots sanitizados de incidentes e eventos (sem métricas brutas).
*   **Outputs**: Explicações estruturadas (JSON) contendo `causa`, `confiança` e `ação recomendada`.

---

## 🖥️ 5. INTERFACE (UX DE GUERRA)
O Admin Dashboard foi atualizado para refletir o estado do Kernel:
*   **Card de Consciência**: Interface direta com o Gemini para narrativas de saúde.
*   **Timeline de Incidentes**: Histórico visual de falhas das últimas 24h.
*   **Thought Feed**: Stream de eventos técnicos (KernelEvents).
*   **Estado Defensivo**: Indicadores visuais pulsantes quando o Circuit Breaker está ativo.

---

## 7. 📡 PIPELINE DE DECISÃO COGNITIVA (O CICLO DE VIDA DO DADO)
Para manutenção futura, este é o fluxo exato de uma requisição sob estresse:

1.  **Ingress**: O `GuardMiddleware` intercepta a request e consulta o `KillSwitchService` (cache em memória). Se houver bloqueio (Global ou de Rota), a requisição morre aqui com `429` ou `503`.
2.  **Telemetry**: O `WarObsMiddleware` registra métricas RED (Rate, Error, Duration) via sliding window de 1 minuto em memória.
3.  **Judgment**: O `PressureIndicator` avalia se as métricas cruzaram os thresholds críticos (configurados via ENV).
4.  **Memory**: Se a pressão for sustentada (3 checklists consecutivos), o `PersistenceService` grava um `Incident` (OPEN) e gera um `KernelEvent` de diagnóstico.
5.  **Reflex**: O `DefensePolicyEngine` (rodando a cada 1 min) lê os últimos incidentes. Se a rota X atingir o threshold, ele ativa um Kill-Switch automático.
6.  **Explanation**: O `NarrativeIntelligenceService` é acionado pelo Admin (ou via trigger de evento) para ler o snapshot de memória e gerar a explicação via Gemini.

---

## 8. ⚙️ CONFIGURAÇÃO DE THRESHOLDS (VARIÁVEIS DE AMBIENTE)
O comportamento do Kernel é ajustado sem recompilação via `.env`:

*   `WAROBS_ERROR_RATE_CRITICAL`: Limite de taxa de erro para abrir incidente (default: 5.0%).
*   `WAROBS_LATENCY_CRITICAL`: Limite de latência P99 (default: 2000ms).
*   `WAROBS_REQS_MIN_THRESHOLD`: Mínimo de requisições/min para validar um incidente (evita falso positivo em baixo tráfego).
*   `GEMINI_API_KEY`: Chave soberana para o Narrative Intelligence.

---

## ⚖️ 9. CONTRATO DE GOVERNANÇA HUMANA
Regras invioláveis implementadas no código:
1.  **Soberania do Override**: Nenhuma ação automática da IA ou do Kernel pode impedir o Admin Humano de desativar um Kill-Switch via `DELETE /admin/kill-switch`.
2.  **Isolamento Cognitivo**: O Gemini não tem acesso a chaves privadas, senhas ou dados sensíveis de usuários. Ele recebe apenas IDs, nomes de rotas e valores métricos sanitizados.
3.  **Auditabilidade**: Toda ação de autodefesa gera obrigatoriamente um `KernelEvent` vinculado ao ID da política que a disparou.

---

## 📡 10. ENDPOINTS TÉCNICOS (API V1)
| Rota | Método | Função |
| :--- | :--- | :--- |
| `/api/v1/warobs/dashboard` | GET | Snapshot de métricas em tempo real |
| `/api/v1/warobs/incidents` | GET | Lista de incidentes da memória |
| `/api/v1/warobs/events` | GET | Feed de eventos do Kernel (Thoughts) |
| `/api/v1/warobs/narrative/explain` | GET | Explicabilidade geral via Gemini |
| `/api/v1/warobs/narrative/incident/:id` | GET | Explicação de incidente específico |
| `/api/v1/admin/kill-switch` | GET/POST/DEL | Controle soberano das travas |

---

## 11. PRÓXIMOS PASSOS ESTABELECIDOS
1.  **Observação Operacional**: Validar thresholds de bloqueio em tráfego real na Oracle VM.
2.  **Ajuste Fino de Narrativa**: Refinar prompts de incerteza da IA baseados em eventos reais.
3.  **UNO Companion**: Evolução da interface para suporte a voz e resumos de baixa fricção.

---
**Este documento serve como fonte da verdade absoluta para o estado do sistema em 19/01/2026.**
