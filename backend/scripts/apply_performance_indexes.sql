-- ========================================
-- SCRIPT PARA APLICAR ÍNDICES DE PERFORMANCE
-- Execute este script diretamente no Neon Console
-- ou via psql: psql $DATABASE_URL -f apply_performance_indexes.sql
-- ========================================

-- Verificar índices existentes antes
SELECT indexname, tablename FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ========================================
-- 1. JOBS - CRÍTICO
-- ========================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_worker_polling 
ON jobs(status, next_run_at, locked_at) 
WHERE status IN ('pending', 'retrying');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_locked_by_status 
ON jobs(locked_by, status);

-- ========================================
-- 2. TELEMETRY_SESSIONS
-- ========================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_telemetry_sessions_active_timeout 
ON telemetry_sessions(last_seen_at) 
WHERE ended_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_telemetry_sessions_active_recent 
ON telemetry_sessions(ended_at, last_seen_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_telemetry_sessions_bounce 
ON telemetry_sessions(app_id, ended_at, duration_ms) 
WHERE ended_at IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_telemetry_sessions_engaged 
ON telemetry_sessions(app_id, interaction_count) 
WHERE interaction_count > 0;

-- ========================================
-- 3. TELEMETRY_METRICS_SNAPSHOTS
-- ========================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_telemetry_metrics_app_id 
ON telemetry_metrics_snapshots(app_id);

-- ========================================
-- 4. RULES
-- ========================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rules_active_trigger 
ON rules(status, trigger_type) 
WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rules_app_id 
ON rules(app_id);

-- ========================================
-- 5. RULE_EXECUTIONS
-- ========================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rule_executions_rule_id 
ON rule_executions(rule_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rule_executions_app_id 
ON rule_executions(app_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rule_executions_executed_at 
ON rule_executions(executed_at DESC);

-- ========================================
-- 6. TEMPORARY_RULES
-- ========================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_temporary_rules_expiry 
ON temporary_rules(expires_at, auto_disabled) 
WHERE auto_disabled = false;

-- ========================================
-- 7. APP_CONFIGS
-- ========================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_app_configs_expiry 
ON app_configs(expires_at) 
WHERE expires_at IS NOT NULL;

-- ========================================
-- 8. KILL_SWITCHES
-- ========================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kill_switches_active 
ON kill_switches(active) 
WHERE active = true;

-- ========================================
-- 9. ALERT_RECORDS
-- ========================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alert_records_type_severity 
ON alert_records(type, severity);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alert_records_created_at 
ON alert_records(created_at DESC);

-- ========================================
-- 10. ALERT_HISTORY
-- ========================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alert_history_created_at 
ON alert_history(created_at DESC);

-- ========================================
-- 11. TELEMETRY_EVENTS
-- ========================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_telemetry_events_timestamp 
ON telemetry_events(timestamp DESC);

-- ========================================
-- ANALYZE para atualizar estatísticas
-- ========================================
ANALYZE jobs;
ANALYZE telemetry_sessions;
ANALYZE telemetry_metrics_snapshots;
ANALYZE telemetry_events;
ANALYZE rules;
ANALYZE rule_executions;
ANALYZE alert_records;
ANALYZE alert_history;

-- Verificar índices criados
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
