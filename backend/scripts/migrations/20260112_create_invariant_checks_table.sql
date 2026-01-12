-- Migration: Create invariant_checks table
-- Date: 2026-01-12
-- Description: Tabela para persistir resultados de verificações de invariantes

-- ========================================
-- CREATE TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS invariant_checks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    passed BOOLEAN NOT NULL,
    violations INTEGER NOT NULL DEFAULT 0,
    details TEXT,
    error VARCHAR(500),
    duration BIGINT NOT NULL DEFAULT 0, -- milliseconds
    checked_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========================================
-- INDEXES
-- ========================================

-- Index para busca por nome
CREATE INDEX IF NOT EXISTS idx_invariant_checks_name ON invariant_checks(name);

-- Index para busca por categoria
CREATE INDEX IF NOT EXISTS idx_invariant_checks_category ON invariant_checks(category);

-- Index para busca por status
CREATE INDEX IF NOT EXISTS idx_invariant_checks_passed ON invariant_checks(passed);

-- Index para busca por timestamp
CREATE INDEX IF NOT EXISTS idx_invariant_checks_checked_at ON invariant_checks(checked_at DESC);

-- Index composto para queries comuns
CREATE INDEX IF NOT EXISTS idx_invariant_checks_name_checked ON invariant_checks(name, checked_at DESC);

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE invariant_checks IS 'Histórico de verificações de invariantes do sistema';
COMMENT ON COLUMN invariant_checks.name IS 'Nome da invariante: user_isolation, ledger_balance, etc';
COMMENT ON COLUMN invariant_checks.category IS 'Categoria: identity, billing, rules, etc';
COMMENT ON COLUMN invariant_checks.passed IS 'Se a invariante passou (true) ou falhou (false)';
COMMENT ON COLUMN invariant_checks.violations IS 'Número de violações encontradas';
COMMENT ON COLUMN invariant_checks.details IS 'JSON com detalhes das violações';
COMMENT ON COLUMN invariant_checks.duration IS 'Duração da verificação em milliseconds';

-- ========================================
-- CLEANUP JOB (optional)
-- ========================================

-- Função para limpar registros antigos (manter últimos 30 dias)
CREATE OR REPLACE FUNCTION cleanup_old_invariant_checks()
RETURNS void AS $$
BEGIN
    DELETE FROM invariant_checks
    WHERE checked_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Comentário sobre uso
COMMENT ON FUNCTION cleanup_old_invariant_checks IS 
    'Executar periodicamente para limpar registros antigos. Ex: SELECT cleanup_old_invariant_checks();';
