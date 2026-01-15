-- ========================================
-- MIGRATION: Performance Indexes v2
-- Data: 15 de Janeiro de 2026
-- Problema: SLOW SQL >= 200ms em múltiplas tabelas
-- Atualizado: Índices mais agressivos baseados em logs de produção
-- ========================================

-- ========================================
-- 1. JOBS - CRÍTICO (query roda a cada 5s, ~460ms atual)
-- ========================================

-- Índice principal para polling de jobs (o mais importante!)
-- Query: UPDATE jobs WHERE status IN ('pending','retrying') AND next_run_at <= ? AND (locked_at IS NULL OR locked_at < ?)
CREATE INDEX IF NOT EXISTS idx_jobs_worker_polling 
ON jobs(status, next_run_at, locked_at) 
WHERE status IN ('pending', 'retrying');

-- Índice para buscar job lockado pelo worker
CREATE INDEX IF NOT EXISTS idx_jobs_locked_by_status 
ON jobs(locked_by, status);

-- ========================================
-- 2. TELEMETRY_SESSIONS - Queries frequentes
-- ========================================

-- Query: SELECT * FROM telemetry_sessions WHERE ended_at IS NULL AND last_seen_at < ?
CREATE INDEX IF NOT EXISTS idx_telemetry_sessions_active_timeout 
ON telemetry_sessions(last_seen_at) 
WHERE ended_at IS NULL;

-- Query: SELECT count(*) FROM telemetry_sessions WHERE ended_at IS NULL AND last_seen_at > ?
CREATE INDEX IF NOT EXISTS idx_telemetry_sessions_active_recent 
ON telemetry_sessions(ended_at, last_seen_at);

-- Query: SELECT count(*) FROM telemetry_sessions WHERE app_id = ? AND ended_at IS NOT NULL AND duration_ms < 30000
CREATE INDEX IF NOT EXISTS idx_telemetry_sessions_bounce 
ON telemetry_sessions(app_id, ended_at, duration_ms) 
WHERE ended_at IS NOT NULL;

-- Query: SELECT count(*) FROM telemetry_sessions WHERE app_id = ? AND interaction_count > 0
CREATE INDEX IF NOT EXISTS idx_telemetry_sessions_engaged 
ON telemetry_sessions(app_id, interaction_count) 
WHERE interaction_count > 0;

-- ========================================
-- 3. TELEMETRY_METRICS_SNAPSHOTS - Lookups por app_id
-- ========================================

-- Query: SELECT ... FROM telemetry_metrics_snapshots WHERE app_id = ?
CREATE INDEX IF NOT EXISTS idx_telemetry_metrics_app_id 
ON telemetry_metrics_snapshots(app_id);

-- ========================================
-- 4. RULES - Queries de avaliação periódica
-- ========================================

-- Query: SELECT * FROM rules WHERE status = 'active' AND trigger_type IN ('metric','threshold')
CREATE INDEX IF NOT EXISTS idx_rules_active_trigger 
ON rules(status, trigger_type) 
WHERE status = 'active';

-- Query: SELECT count(*) FROM rules WHERE app_id = ?
CREATE INDEX IF NOT EXISTS idx_rules_app_id 
ON rules(app_id);

-- ========================================
-- 5. RULE_EXECUTIONS - Inserts frequentes
-- ========================================

CREATE INDEX IF NOT EXISTS idx_rule_executions_rule_id 
ON rule_executions(rule_id);

CREATE INDEX IF NOT EXISTS idx_rule_executions_app_id 
ON rule_executions(app_id);

CREATE INDEX IF NOT EXISTS idx_rule_executions_executed_at 
ON rule_executions(executed_at DESC);

-- ========================================
-- 6. TEMPORARY_RULES - Cleanup periódico
-- ========================================

-- Query: SELECT * FROM temporary_rules WHERE expires_at < ? AND auto_disabled = false
CREATE INDEX IF NOT EXISTS idx_temporary_rules_expiry 
ON temporary_rules(expires_at, auto_disabled) 
WHERE auto_disabled = false;

-- ========================================
-- 7. APP_CONFIGS - Cleanup periódico
-- ========================================

-- Query: SELECT * FROM app_configs WHERE expires_at IS NOT NULL AND expires_at < ?
CREATE INDEX IF NOT EXISTS idx_app_configs_expiry 
ON app_configs(expires_at) 
WHERE expires_at IS NOT NULL;

-- ========================================
-- 8. KILL_SWITCHES - Lookup de ativos
-- ========================================

-- Query: SELECT * FROM kill_switches WHERE active = true
CREATE INDEX IF NOT EXISTS idx_kill_switches_active 
ON kill_switches(active) 
WHERE active = true;

-- ========================================
-- 9. ALERT_RECORDS - Persistência de alertas
-- ========================================

CREATE INDEX IF NOT EXISTS idx_alert_records_type_severity 
ON alert_records(type, severity);

CREATE INDEX IF NOT EXISTS idx_alert_records_created_at 
ON alert_records(created_at DESC);

-- ========================================
-- 10. ALERT_HISTORY - Contagem por período
-- ========================================

-- Query: SELECT count(*) FROM alert_history WHERE created_at > ?
CREATE INDEX IF NOT EXISTS idx_alert_history_created_at 
ON alert_history(created_at DESC);

-- ========================================
-- 11. TELEMETRY_EVENTS - Contagem por período
-- ========================================

-- Query: SELECT count(*) FROM telemetry_events WHERE timestamp > ?
CREATE INDEX IF NOT EXISTS idx_telemetry_events_timestamp 
ON telemetry_events(timestamp DESC);

-- ========================================
-- 12. APPLICATIONS - Contagem total
-- ========================================

-- Tabela pequena, mas garantir PK está otimizado
-- (geralmente já existe por padrão)

-- ========================================
-- ANALYZE para atualizar estatísticas do planner
-- ========================================
ANALYZE jobs;
ANALYZE telemetry_sessions;
ANALYZE telemetry_metrics_snapshots;
ANALYZE telemetry_events;
ANALYZE rules;
ANALYZE rule_executions;
ANALYZE temporary_rules;
ANALYZE app_configs;
ANALYZE kill_switches;
ANALYZE alert_records;
ANALYZE alert_history;
ANALYZE applications;
