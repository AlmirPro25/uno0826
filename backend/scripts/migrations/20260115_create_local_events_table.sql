-- ========================================
-- MIGRATION: Local Events Table (Neon side)
-- Data: 15 de Janeiro de 2026
-- Propósito: Receber eventos sincronizados do SQLite local
-- Padrão: Write-Ahead Log local + async upstream sync
-- ========================================

-- Tabela para receber eventos do SQLite local
CREATE TABLE IF NOT EXISTS local_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    app_id TEXT,
    payload TEXT, -- JSON
    created_at TIMESTAMP NOT NULL,
    sync_status TEXT DEFAULT 'confirmed',
    synced_at TIMESTAMP DEFAULT NOW()
);

-- Índices para queries comuns
CREATE INDEX IF NOT EXISTS idx_local_events_type ON local_events(event_type);
CREATE INDEX IF NOT EXISTS idx_local_events_app ON local_events(app_id);
CREATE INDEX IF NOT EXISTS idx_local_events_created ON local_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_local_events_app_type ON local_events(app_id, event_type);

-- Índice para cleanup de eventos antigos
CREATE INDEX IF NOT EXISTS idx_local_events_synced ON local_events(synced_at);

-- Comentário explicativo
COMMENT ON TABLE local_events IS 'Eventos sincronizados do SQLite local. Fonte de verdade para logs, telemetria e auditoria.';

-- ========================================
-- ANALYZE para estatísticas
-- ========================================
ANALYZE local_events;
