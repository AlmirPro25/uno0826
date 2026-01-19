-- 20260119_create_warobs_memory_tables.sql
-- Movimento 3A: Engenharia da Memória do Kernel
-- Objetivo: Dotar o sistema de persistência seletiva para incidentes, anomalias e decisões do kernel.

-- 1. Tabela de Incidentes (Dor Real)
-- Registra eventos que quebram a normalidade e exigem atenção/resolução.
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY,
  severity TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'HIGH', 'CRITICAL')),
  trigger TEXT NOT NULL, -- ERROR_RATE, LATENCY, MEMORY, GOROUTINES, MANUAL
  description TEXT,

  metric_name TEXT,
  metric_value NUMERIC,
  threshold NUMERIC,

  affected_service TEXT DEFAULT 'prost-qs-kernel',
  affected_routes JSONB, -- Armazena a lista de rotas impactadas

  started_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,

  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED')),

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance em auditoria e dashboard
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_started_at ON incidents(started_at);

-- 2. Tabela de Anomalias (Sensação Estranha)
-- Registra desvios estatísticos que não são necessariamente falhas, mas são notáveis.
CREATE TABLE IF NOT EXISTS anomalies (
  id UUID PRIMARY KEY,

  metric_name TEXT NOT NULL,
  baseline_value NUMERIC,
  observed_value NUMERIC,
  deviation_percent NUMERIC,

  detection_method TEXT, -- threshold | stddev | heuristic
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),

  window_start TIMESTAMPTZ,
  window_end TIMESTAMPTZ,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anomalies_metric_name ON anomalies(metric_name);
CREATE INDEX IF NOT EXISTS idx_anomalies_created_at ON anomalies(created_at);

-- 3. Tabela de Kernel Events (O Diário de Bordo do Cérebro)
-- Registra mudanças de estado, decisões da IA e ações de governança.
CREATE TABLE IF NOT EXISTS kernel_events (
  id UUID PRIMARY KEY,

  event_type TEXT NOT NULL, -- STATE_CHANGE, KILL_SWITCH, DEGRADED, NARRATIVE, etc.
  source TEXT NOT NULL,      -- warobs | policy_engine | ai | admin

  description TEXT,

  related_incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,

  metadata JSONB, -- Dados contextuais da decisão

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kernel_events_type ON kernel_events(event_type);
CREATE INDEX IF NOT EXISTS idx_kernel_events_created_at ON kernel_events(created_at);
