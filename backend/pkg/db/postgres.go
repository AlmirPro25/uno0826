package db

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// PoolConfig holds connection pool configuration
// "Pool bem configurado = menos latência, mais throughput"
type PoolConfig struct {
	MaxIdleConns    int           // Conexões ociosas mantidas abertas
	MaxOpenConns    int           // Máximo de conexões simultâneas
	ConnMaxLifetime time.Duration // Tempo máximo de vida de uma conexão
	ConnMaxIdleTime time.Duration // Tempo máximo ocioso antes de fechar
}

// DefaultPoolConfig returns optimized pool settings for 1GB RAM VM
// "Otimizado para Oracle Free Tier: 1 OCPU, 1GB RAM"
func DefaultPoolConfig() PoolConfig {
	return PoolConfig{
		MaxIdleConns:    3,               // Manter 3 conexões prontas (baixo uso de RAM)
		MaxOpenConns:    10,              // Máximo 10 conexões (Neon free tier limit)
		ConnMaxLifetime: 30 * time.Minute, // Reconectar a cada 30min (evita conexões stale)
		ConnMaxIdleTime: 10 * time.Minute, // Fechar conexões ociosas após 10min
	}
}

// HighPerformancePoolConfig returns settings for higher traffic
// "Para quando você tiver mais usuários"
func HighPerformancePoolConfig() PoolConfig {
	return PoolConfig{
		MaxIdleConns:    10,
		MaxOpenConns:    25,
		ConnMaxLifetime: 1 * time.Hour,
		ConnMaxIdleTime: 15 * time.Minute,
	}
}

// GetPoolConfigFromEnv reads pool config from environment variables
func GetPoolConfigFromEnv() PoolConfig {
	config := DefaultPoolConfig()
	
	if v := os.Getenv("DB_MAX_IDLE_CONNS"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			config.MaxIdleConns = n
		}
	}
	if v := os.Getenv("DB_MAX_OPEN_CONNS"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			config.MaxOpenConns = n
		}
	}
	if v := os.Getenv("DB_CONN_MAX_LIFETIME_MINUTES"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			config.ConnMaxLifetime = time.Duration(n) * time.Minute
		}
	}
	if v := os.Getenv("DB_CONN_MAX_IDLE_MINUTES"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			config.ConnMaxIdleTime = time.Duration(n) * time.Minute
		}
	}
	
	return config
}

// InitPostgres inicializa a conexão com o banco de dados PostgreSQL.
// Otimizado para baixo consumo de memória e alta eficiência.
func InitPostgres(databaseURL string) (*gorm.DB, error) {
	// Determinar log level baseado no ambiente
	logLevel := logger.Warn // Produção: só warnings e erros
	if os.Getenv("GIN_MODE") != "release" {
		logLevel = logger.Info // Dev: mais verbose
	}
	
	gormDB, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
		// Otimizações de performance
		PrepareStmt:                              false, // Desabilitado para evitar "cached plan" errors com Neon
		SkipDefaultTransaction:                   true,  // Não criar transação para cada query
		DisableForeignKeyConstraintWhenMigrating: false, // Manter integridade
	})
	if err != nil {
		return nil, fmt.Errorf("falha ao conectar ao PostgreSQL: %w", err)
	}

	// Configurar pool de conexões otimizado
	sqlDB, err := gormDB.DB()
	if err != nil {
		return nil, fmt.Errorf("falha ao obter DB: %w", err)
	}

	config := GetPoolConfigFromEnv()
	
	sqlDB.SetMaxIdleConns(config.MaxIdleConns)
	sqlDB.SetMaxOpenConns(config.MaxOpenConns)
	sqlDB.SetConnMaxLifetime(config.ConnMaxLifetime)
	sqlDB.SetConnMaxIdleTime(config.ConnMaxIdleTime)

	// Verificar conexão
	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("falha ao verificar conexão: %w", err)
	}

	log.Printf("✅ Conectado ao PostgreSQL (pool: idle=%d, max=%d, lifetime=%v)", 
		config.MaxIdleConns, config.MaxOpenConns, config.ConnMaxLifetime)
	
	return gormDB, nil
}

// GetPoolStats returns current connection pool statistics
// "Saber o estado do pool é essencial para debugging"
func GetPoolStats(db *gorm.DB) (map[string]interface{}, error) {
	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}
	
	stats := sqlDB.Stats()
	return map[string]interface{}{
		"max_open_connections": stats.MaxOpenConnections,
		"open_connections":     stats.OpenConnections,
		"in_use":               stats.InUse,
		"idle":                 stats.Idle,
		"wait_count":           stats.WaitCount,
		"wait_duration_ms":     stats.WaitDuration.Milliseconds(),
		"max_idle_closed":      stats.MaxIdleClosed,
		"max_idle_time_closed": stats.MaxIdleTimeClosed,
		"max_lifetime_closed":  stats.MaxLifetimeClosed,
	}, nil
}
