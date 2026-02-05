package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"prost-qs/backend/pkg/tenancy"
)

func main() {
	// Load environment variables
	godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}

	// Connect to database
	db, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Initialize Tenant Manager
	manager := tenancy.NewTenantManager(db, false) // Set to true if you already have schema isolation logic in place

	// Auto-migrate tenancy tables
	fmt.Println("Migrating tenancy tables...")
	if err := manager.AutoMigrate(); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	// Create First Tenant
	fmt.Println("Creating first tenant (Platform Admin)...")
	tenant, err := manager.CreateTenant(context.Background(), tenancy.CreateTenantRequest{
		Name:         "Platform Admin",
		Domain:       "admin",
		DisplayName:  "Admin Console",
		ContactEmail: "admin@prostqs.com",
		PlanTier:     "enterprise",
	})

	if err != nil {
		log.Fatalf("Failed to create tenant: %v", err)
	}

	// Display Credentials
	fmt.Println("\n====================================================")
	fmt.Println("🚀 FIRST TENANT CREATED SUCCESSFULLY")
	fmt.Println("====================================================")
	fmt.Printf("TENANT ID:    %s\n", tenant.ID)
	fmt.Printf("DOMAIN:       %s\n", tenant.Domain)
	fmt.Printf("TIER:         %s\n", tenant.PlanTier)
	fmt.Printf("API KEY:      %s\n", tenant.APIKey)
	fmt.Printf("SECRET KEY:   %s\n", tenant.SecretKey)
	fmt.Println("====================================================")
	fmt.Println("⚠️  STASH THESE CREDENTIALS SECURELY!")
	fmt.Println("You will need the API KEY to access the platform.")
	fmt.Println("====================================================\n")
}
