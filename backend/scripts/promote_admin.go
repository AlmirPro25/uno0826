package main

import (
	"fmt"
	"log"
	"os"

	"github.com/glebarez/sqlite"
	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

func main() {
	godotenv.Load("../.env")

	// PROTEÇÃO: Requer confirmação explícita
	if os.Getenv("CONFIRM_ADMIN_PROMOTION") != "yes" {
		fmt.Println("⚠️  ATENÇÃO: Este script promove um usuário a super_admin")
		fmt.Println("")
		fmt.Println("Para executar, defina a variável de ambiente:")
		fmt.Println("  CONFIRM_ADMIN_PROMOTION=yes go run scripts/promote_admin.go")
		fmt.Println("")
		log.Fatal("❌ Execução cancelada por segurança")
	}
	
	dbPath := os.Getenv("SQLITE_DB_PATH")
	if dbPath == "" {
		dbPath = "./data/prostqs.db"
	}

	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatal("Erro ao conectar:", err)
	}

	// Atualizar role do usuário almir para super_admin
	result := db.Exec("UPDATE users SET role = 'super_admin' WHERE username = 'almir'")
	if result.Error != nil {
		log.Fatal("Erro ao atualizar:", result.Error)
	}

	fmt.Printf("✅ Usuário 'almir' promovido a super_admin! Linhas afetadas: %d\n", result.RowsAffected)
}
