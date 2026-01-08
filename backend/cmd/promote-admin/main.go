package main

import (
	"log"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	db, err := gorm.Open(sqlite.Open("./data/prostqs.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		log.Fatalf("Erro ao conectar: %v", err)
	}

	// Promover admin para super_admin
	result := db.Exec("UPDATE users SET role = 'super_admin', status = 'active' WHERE username = 'admin'")
	if result.Error != nil {
		log.Fatalf("Erro ao atualizar: %v", result.Error)
	}

	log.Printf("✅ Usuário 'admin' promovido a super_admin! Linhas afetadas: %d", result.RowsAffected)
}
