-- Migration: Create Lighthouse (Farol) tables
-- Date: 2026-01-13
-- Description: Ledger de presença para rede P2P distribuída

-- Tabela principal: Ledger de Presença
-- Armazena APENAS metadados operacionais, NUNCA conteúdo
CREATE TABLE IF NOT EXISTS presence_ledger (
    peer_id         TEXT PRIMARY KEY,           -- 12D3KooW... (libp2p peer ID)
    network_hash    TEXT NOT NULL,              -- Hash da região (privacidade)
    lighthouse_id   TEXT NOT NULL,              -- Qual farol registrou
    capabilities    JSONB DEFAULT '{}',         -- bandwidth, storage, uptime
    reputation      INTEGER DEFAULT 100,        -- Score de confiabilidade (0-100)
    last_seen       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_presence_network_hash ON presence_ledger(network_hash);
CREATE INDEX IF NOT EXISTS idx_presence_lighthouse ON presence_ledger(lighthouse_id);
CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON presence_ledger(last_seen);
CREATE INDEX IF NOT EXISTS idx_presence_reputation ON presence_ledger(reputation DESC);

-- Tabela: Registro de Faróis (Lighthouses)
CREATE TABLE IF NOT EXISTS lighthouse_registry (
    id              TEXT PRIMARY KEY,           -- lighthouse-sa-01
    region          TEXT NOT NULL,              -- sa-east, us-east, eu-west, asia
    url             TEXT NOT NULL,              -- https://nexus-sa.fly.dev
    status          TEXT DEFAULT 'active',      -- active, maintenance, offline
    capacity        INTEGER DEFAULT 10000,      -- Max peers suportados
    current_load    INTEGER DEFAULT 0,          -- Peers atualmente conectados
    last_heartbeat  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca de faróis ativos
CREATE INDEX IF NOT EXISTS idx_lighthouse_status ON lighthouse_registry(status);
CREATE INDEX IF NOT EXISTS idx_lighthouse_region ON lighthouse_registry(region);

-- Tabela: Histórico de Conexões (para análise, não tracking)
-- Dados agregados, sem identificação individual
CREATE TABLE IF NOT EXISTS connection_stats (
    id              SERIAL PRIMARY KEY,
    lighthouse_id   TEXT NOT NULL,
    hour            TIMESTAMP WITH TIME ZONE NOT NULL,
    connections     INTEGER DEFAULT 0,
    unique_peers    INTEGER DEFAULT 0,
    avg_latency_ms  INTEGER DEFAULT 0,
    relay_usage     INTEGER DEFAULT 0,
    UNIQUE(lighthouse_id, hour)
);

CREATE INDEX IF NOT EXISTS idx_stats_lighthouse ON connection_stats(lighthouse_id);
CREATE INDEX IF NOT EXISTS idx_stats_hour ON connection_stats(hour);

-- Inserir faróis iniciais
INSERT INTO lighthouse_registry (id, region, url, status) VALUES
    ('lighthouse-sa-01', 'sa-east', 'https://nexus-sa.railway.app', 'active'),
    ('lighthouse-us-01', 'us-east', 'https://nexus-us.vercel.app', 'active'),
    ('lighthouse-eu-01', 'eu-west', 'https://nexus-eu.render.com', 'active'),
    ('lighthouse-asia-01', 'asia', 'https://nexus-asia.fly.dev', 'active')
ON CONFLICT (id) DO NOTHING;

-- Função para limpar peers inativos (executar via cron)
CREATE OR REPLACE FUNCTION cleanup_stale_peers()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM presence_ledger
    WHERE last_seen < NOW() - INTERVAL '10 minutes';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar estatísticas horárias
CREATE OR REPLACE FUNCTION update_hourly_stats(p_lighthouse_id TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO connection_stats (lighthouse_id, hour, connections, unique_peers)
    SELECT 
        p_lighthouse_id,
        date_trunc('hour', NOW()),
        COUNT(*),
        COUNT(DISTINCT peer_id)
    FROM presence_ledger
    WHERE lighthouse_id = p_lighthouse_id
      AND last_seen > NOW() - INTERVAL '1 hour'
    ON CONFLICT (lighthouse_id, hour) DO UPDATE SET
        connections = EXCLUDED.connections,
        unique_peers = EXCLUDED.unique_peers;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE presence_ledger IS 'Ledger de presença P2P - NUNCA armazena conteúdo, apenas metadados operacionais';
COMMENT ON COLUMN presence_ledger.network_hash IS 'Hash da região para privacidade - não armazena IP diretamente';
COMMENT ON COLUMN presence_ledger.capabilities IS 'Capacidades do peer: bandwidth, storage, relay, webrtc';
COMMENT ON TABLE lighthouse_registry IS 'Registro de faróis (servidores de descoberta) distribuídos globalmente';
COMMENT ON TABLE connection_stats IS 'Estatísticas agregadas para análise de saúde da rede - sem tracking individual';
