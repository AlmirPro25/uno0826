package db

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// InitPostgres inicializa a conexão com o banco de dados PostgreSQL.
func InitPostgres(databaseURL string) (*gorm.DB, error) {
	gormDB, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("falha ao conectar ao PostgreSQL: %w", err)
	}

	// Configurar pool de conexões
	sqlDB, err := gormDB.DB()
	if err != nil {
		return nil, fmt.Errorf("falha ao obter DB: %w", err)
	}

	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetMaxOpenConns(20)

	log.Println("✅ Conectado ao PostgreSQL (Neon)")
	return gormDB, nil
}
