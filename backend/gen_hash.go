package main
import (
	"fmt"
	"golang.org/x/crypto/bcrypt"
)
func main() {
	hash, _ := bcrypt.GenerateFromPassword([]byte("415263456a"), bcrypt.DefaultCost)
	fmt.Println(string(hash))
}
