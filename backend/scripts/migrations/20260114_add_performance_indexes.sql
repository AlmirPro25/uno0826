-- Migration: Add performance indexes for slow queries
-- Date: 2026-01-14
-- Issue: SLOW SQL >= 200ms on jobs, telemetry_sessions, rules, kill_switches, alert_records

-- =============================================
-- JOBS TABLE - Queries taking 450-1150ms
-- =============================================

-- Index for job polling query (most critical - runs every 2 seconds)
CREATE INDEX IF NOT EXISTS idx_jobs_polling 
ON jobs (status, next_run_at, locked_at) 
WHERE status IN ('pending', 'retrying');

-- Index for locked_at cleanup
CREATE INDEX IF NOT EXISTS idx_jobs_locked_at 
ON jobs (locked_at) 
WHERE locked_at IS NOT NULL;

-- =============================================
-- TELEMETRY_SESSIONS TABLE - Queries taking 340ms
-- =============================================

-- Index for session timeout cleanup
CREATE INDEX IF NOT EXISTS idx_telemetry_sessions_timeout 
ON telemetry_sessions (ended_at, last_seen_at) 
WHERE ended_at IS NULL;

-- Index for app_id + ended_at (bounce rate calculation)
CREATE INDEX IF NOT EXISTS idx_telemetry_sessions_app_ended 
ON telemetry_sessions (app_id, ended_at, duration_ms);

-- Index for interaction_count (match rate calculation)
CREATE INDEX IF NOT EXISTS idx_telemetry_sessions_app_interactions 
ON telemetry_sessions (app_id, interaction_count) 
WHERE interaction_count > 0;

-- =============================================
-- RULES TABLE - Queries taking 337ms
-- =============================================

-- Index for active rules by trigger type
CREATE INDEX IF NOT EXISTS idx_rules_active_trigger 
ON rules (status, trigger_type) 
WHERE status = 'active';

-- =============================================
-- KILL_SWITCHES TABLE - Queries taking 339ms
-- =============================================

-- Index for active kill switches
CREATE INDEX IF NOT EXISTS idx_kill_switches_active 
ON kill_switches (active) 
WHERE active = true;

-- =============================================
-- ALERT_RECORDS TABLE - Queries taking 340-450ms
-- =============================================

-- Index for upsert operations
CREATE INDEX IF NOT EXISTS idx_alert_records_type_title 
ON alert_records (type, title, source);

-- Index for unresolved alerts
CREATE INDEX IF NOT EXISTS idx_alert_records_unresolved 
ON alert_records (resolved_at) 
WHERE resolved_at IS NULL;

-- =============================================
-- RULE_EXECUTIONS TABLE - Queries taking 450ms on INSERT
-- =============================================

-- Index for recent executions by rule
CREATE INDEX IF NOT EXISTS idx_rule_executions_rule_time 
ON rule_executions (rule_id, executed_at DESC);

-- Index for app executions
CREATE INDEX IF NOT EXISTS idx_rule_executions_app_time 
ON rule_executions (app_id, executed_at DESC);

-- =============================================
-- ANALYZE TABLES (update statistics)
-- =============================================

ANALYZE jobs;
ANALYZE telemetry_sessions;
ANALYZE rules;
ANALYZE kill_switches;
ANALYZE alert_records;
ANALYZE rule_executions;
