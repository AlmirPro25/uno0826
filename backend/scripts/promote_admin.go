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
