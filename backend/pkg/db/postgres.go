package db

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// InitPostgres inicializa conexão com PostgreSQL
func InitPostgres() (*gorm.DB, error) {
	host := getEnvOrDefault("POSTGRES_HOST", "localhost")
	port := getEnvOrDefault("POSTGRES_PORT", "5432")
	user := getEnvOrDefault("POSTGRES_USER", "prostqs")
	password := getEnvOrDefault("POSTGRES_PASSWORD", "prostqs")
	dbname := getEnvOrDefault("POSTGRES_DB", "prostqs")
	sslmode := getEnvOrDefault("POSTGRES_SSLMODE", "disable")

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbname, sslmode,
	)

	logLevel := logger.Info
	if os.Getenv("GIN_MODE") == "release" {
		logLevel = logger.Warn
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("falha ao conectar PostgreSQL: %w", err)
	}

	log.Printf("✅ Conectado ao PostgreSQL: %s:%s/%s", host, port, dbname)
	return db, nil
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
