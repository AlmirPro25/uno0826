
// --- backend/internal/database/db.go ---
package database

import (
	"log"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// DB representa a instância do banco de dados GORM
var DB *gorm.DB

// ConnectDB inicializa a conexão com o banco de dados PostgreSQL
func ConnectDB(dsn string) (*gorm.DB, error) {
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	log.Println("✅ Conexão com o banco de dados PostgreSQL estabelecida com sucesso.")
	return DB, nil
}
