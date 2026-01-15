-- ========================================
-- MIGRATION: Performance Indexes
-- Data: 15 de Janeiro de 2026
-- Problema: SLOW SQL >= 200ms em telemetry_sessions e rule_executions
-- ========================================

-- Índices para telemetry_sessions (queries de métricas)
CREATE INDEX IF NOT EXISTS idx_telemetry_sessions_app_id 
ON telemetry_sessions(app_id);

CREATE INDEX IF NOT EXISTS idx_telemetry_sessions_app_ended 
ON telemetry_sessions(app_id, ended_at);

CREATE INDEX IF NOT EXISTS idx_telemetry_sessions_app_duration 
ON telemetry_sessions(app_id, duration_ms) 
WHERE ended_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_telemetry_sessions_app_interactions 
ON telemetry_sessions(app_id, interaction_count) 
WHERE interaction_count > 0;

-- Índice composto para queries de bounce rate
CREATE INDEX IF NOT EXISTS idx_telemetry_sessions_bounce_rate 
ON telemetry_sessions(app_id, ended_at, duration_ms);

-- Índices para rule_executions (inserts frequentes)
CREATE INDEX IF NOT EXISTS idx_rule_executions_rule_id 
ON rule_executions(rule_id);

CREATE INDEX IF NOT EXISTS idx_rule_executions_app_id 
ON rule_executions(app_id);

CREATE INDEX IF NOT EXISTS idx_rule_executions_executed_at 
ON rule_executions(executed_at DESC);

-- Índice composto para queries de histórico
CREATE INDEX IF NOT EXISTS idx_rule_executions_app_rule_time 
ON rule_executions(app_id, rule_id, executed_at DESC);

-- Índices para jobs (lock queries)
CREATE INDEX IF NOT EXISTS idx_jobs_status_next_run 
ON jobs(status, next_run_at) 
WHERE status IN ('pending', 'retrying');

CREATE INDEX IF NOT EXISTS idx_jobs_locked_at 
ON jobs(locked_at);

-- ========================================
-- ANALYZE para atualizar estatísticas
-- ========================================
ANALYZE telemetry_sessions;
ANALYZE rule_executions;
ANALYZE jobs;
