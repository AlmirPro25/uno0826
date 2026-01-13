-- ============================================================================
-- Migration: Fix telemetry_metrics_snapshots table
-- Date: 2026-01-13
-- Issue: Column "active_users_24h" does not exist
-- ============================================================================

-- Create table if not exists (GORM may not have created it)
CREATE TABLE IF NOT EXISTS telemetry_metrics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL,
    online_now INTEGER DEFAULT 0,
    active_sessions INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_events INTEGER DEFAULT 0,
    events_per_minute FLOAT DEFAULT 0,
    total_interactions INTEGER DEFAULT 0,
    active_users_24h INTEGER DEFAULT 0,
    active_users_1h INTEGER DEFAULT 0,
    total_users INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns if table already exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'telemetry_metrics_snapshots' 
                   AND column_name = 'active_users_24h') THEN
        ALTER TABLE telemetry_metrics_snapshots ADD COLUMN active_users_24h INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'telemetry_metrics_snapshots' 
                   AND column_name = 'total_users') THEN
        ALTER TABLE telemetry_metrics_snapshots ADD COLUMN total_users INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'telemetry_metrics_snapshots' 
                   AND column_name = 'active_users_1h') THEN
        ALTER TABLE telemetry_metrics_snapshots ADD COLUMN active_users_1h INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create indexes for better performance on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_telemetry_metrics_app_id 
ON telemetry_metrics_snapshots(app_id);

CREATE INDEX IF NOT EXISTS idx_alert_records_type_severity 
ON alert_records(type, severity);

CREATE INDEX IF NOT EXISTS idx_alert_records_created_at 
ON alert_records(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jobs_status_next_run 
ON jobs(status, next_run_at) 
WHERE status IN ('pending', 'retrying');

CREATE INDEX IF NOT EXISTS idx_jobs_locked_at 
ON jobs(locked_at) 
WHERE locked_at IS NOT NULL;

-- Analyze tables for query planner
ANALYZE telemetry_metrics_snapshots;
ANALYZE alert_records;
ANALYZE jobs;
ANALYZE rules;

-- ============================================================================
-- Verificação
-- ============================================================================
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'telemetry_metrics_snapshots';
