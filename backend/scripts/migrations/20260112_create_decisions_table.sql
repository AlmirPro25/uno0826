-- Migration: Create system_decisions table
-- Date: 2026-01-12
-- Description: Tabela para registrar decisões do sistema (separado de eventos)

-- ========================================
-- CREATE TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS system_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL,
    
    -- Tipo e resultado
    type VARCHAR(100) NOT NULL,
    outcome VARCHAR(50) NOT NULL,
    
    -- Razão (para auditoria e explainability)
    reason VARCHAR(500) NOT NULL,
    reason_code VARCHAR(50),
    
    -- Contexto
    user_id UUID,
    session_id UUID,
    resource_id VARCHAR(100),
    resource_type VARCHAR(50),
    
    -- Trigger
    trigger_type VARCHAR(50),
    trigger_id VARCHAR(100),
    
    -- Dados extras
    context TEXT,
    metadata TEXT,
    
    -- Impacto
    severity VARCHAR(20) NOT NULL DEFAULT 'low',
    reversible BOOLEAN NOT NULL DEFAULT true,
    
    -- Timestamps
    decided_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_decisions_app FOREIGN KEY (app_id) REFERENCES applications(id),
    CONSTRAINT fk_decisions_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ========================================
-- INDEXES
-- ========================================

-- Index para busca por app
CREATE INDEX IF NOT EXISTS idx_decision_app ON system_decisions(app_id);

-- Index para busca por usuário
CREATE INDEX IF NOT EXISTS idx_decision_user ON system_decisions(user_id);

-- Index para busca por tipo
CREATE INDEX IF NOT EXISTS idx_decision_type ON system_decisions(type);

-- Index para busca por timestamp
CREATE INDEX IF NOT EXISTS idx_decision_timestamp ON system_decisions(decided_at DESC);

-- Index para busca por severidade
CREATE INDEX IF NOT EXISTS idx_decision_severity ON system_decisions(severity);

-- Index composto para queries comuns
CREATE INDEX IF NOT EXISTS idx_decision_app_type ON system_decisions(app_id, type);
CREATE INDEX IF NOT EXISTS idx_decision_app_severity ON system_decisions(app_id, severity);

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE system_decisions IS 'Registra decisões tomadas pelo sistema (diferente de eventos que são fatos)';
COMMENT ON COLUMN system_decisions.type IS 'Tipo da decisão: access.allowed, payment.blocked, rule.triggered, etc';
COMMENT ON COLUMN system_decisions.outcome IS 'Resultado: allowed, blocked, deferred, escalated, retry';
COMMENT ON COLUMN system_decisions.reason IS 'Explicação legível da decisão';
COMMENT ON COLUMN system_decisions.reason_code IS 'Código máquina da razão';
COMMENT ON COLUMN system_decisions.trigger_type IS 'O que causou: rule, invariant, killswitch, manual, automatic';
COMMENT ON COLUMN system_decisions.severity IS 'Severidade: low, medium, high, critical';

-- ========================================
-- SAMPLE DATA (for testing)
-- ========================================

-- Uncomment to insert sample data
/*
INSERT INTO system_decisions (app_id, type, outcome, reason, severity) VALUES
    ('00000000-0000-0000-0000-000000000001', 'access.allowed', 'allowed', 'User authenticated successfully', 'low'),
    ('00000000-0000-0000-0000-000000000001', 'payment.blocked', 'blocked', 'Insufficient funds', 'medium'),
    ('00000000-0000-0000-0000-000000000001', 'killswitch.block', 'blocked', 'Billing killswitch active', 'high');
*/
