package localstore

import (
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// ========================================
// INITIALIZATION - Setup do LocalStore
// "SQLite local + Postgres remoto = resiliência"
// ========================================

// InitFromEnv inicializa o LocalStore a partir de variáveis de ambiente
// Retorna nil se LOCAL_STORE_ENABLED != "true"
func InitFromEnv(remoteDB *gorm.DB) error {
	// Verificar se está habilitado
	if os.Getenv("LOCAL_STORE_ENABLED") != "true" {
		log.Println("⚠️  LocalStore desabilitado (LOCAL_STORE_ENABLED != true)")
		return nil
	}

	// Caminho do SQLite local
	localDBPath := os.Getenv("LOCAL_STORE_PATH")
	if localDBPath == "" {
		localDBPath = "/data/localstore.db"
	}

	// Garantir que o diretório existe
	dir := filepath.Dir(localDBPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		log.Printf("⚠️  Erro ao criar diretório para LocalStore: %v", err)
		return err
	}

	// Inicializar SQLite local com WAL mode
	localDB, err := gorm.Open(sqlite.Open(localDBPath+"?_journal_mode=WAL&_busy_timeout=5000"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Printf("⚠️  Erro ao inicializar SQLite local: %v", err)
		return err
	}

	// Configuração do sync
	cfg := Config{
		SyncInterval: getSyncInterval(),
		BatchSize:    getBatchSize(),
		MaxRetries:   getMaxRetries(),
	}

	// Inicializar store global
	if err := InitGlobalStore(localDB, remoteDB, cfg); err != nil {
		log.Printf("⚠️  Erro ao inicializar LocalStore global: %v", err)
		return err
	}

	log.Printf("✅ LocalStore inicializado (path: %s, interval: %v, batch: %d)",
		localDBPath, cfg.SyncInterval, cfg.BatchSize)

	return nil
}

// getSyncInterval retorna intervalo de sync das env vars
func getSyncInterval() time.Duration {
	intervalStr := os.Getenv("LOCAL_STORE_SYNC_INTERVAL")
	if intervalStr == "" {
		return 5 * time.Second
	}
	d, err := time.ParseDuration(intervalStr)
	if err != nil {
		return 5 * time.Second
	}
	return d
}

// getBatchSize retorna tamanho do batch das env vars
func getBatchSize() int {
	sizeStr := os.Getenv("LOCAL_STORE_BATCH_SIZE")
	if sizeStr == "" {
		return 100
	}
	var size int
	if _, err := parseEnvInt(sizeStr, &size); err != nil || size <= 0 {
		return 100
	}
	return size
}

// getMaxRetries retorna máximo de retries das env vars
func getMaxRetries() int {
	retriesStr := os.Getenv("LOCAL_STORE_MAX_RETRIES")
	if retriesStr == "" {
		return 5
	}
	var retries int
	if _, err := parseEnvInt(retriesStr, &retries); err != nil || retries <= 0 {
		return 5
	}
	return retries
}

// parseEnvInt helper para parsear int de string
func parseEnvInt(s string, v *int) (int, error) {
	var n int
	for _, c := range s {
		if c < '0' || c > '9' {
			return 0, nil
		}
		n = n*10 + int(c-'0')
	}
	*v = n
	return n, nil
}
