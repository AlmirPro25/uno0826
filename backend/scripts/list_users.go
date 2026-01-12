// +build ignore

package main

import (
	"fmt"
	"log"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

type User struct {
	ID    string `gorm:"primaryKey"`
	Email string
}

func main() {
	db, err := gorm.Open(sqlite.Open("data/prostqs.db"), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	var users []User
	db.Table("users").Select("id, email").Limit(20).Find(&users)

	fmt.Println("Usuários no Kernel:")
	fmt.Println("================================================================================")
	for _, u := range users {
		fmt.Printf("ID: %s | Email: %s\n", u.ID, u.Email)
	}
}
