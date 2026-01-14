package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all application configuration variables.
type Config struct {
	Port          string
	DatabaseURL   string
	JWTSecret     string
	EncryptionKey string
	UseSQLite     bool   // Flag to enable SQLite
	SQLiteFile    string // Path to SQLite DB file
}

// LoadConfig loads configuration from environment variables (or .env file).
func LoadConfig() *Config {
	// Load environment variables from .env file (if exists)
	err := godotenv.Load()
	if err != nil {
		log.Println("Note: .env file not found. Reading from process environment.")
	}

	// Determine if we should use SQLite
	// Default to true if DATABASE_URL is not explicitly set to a postgres URL
	dbUrl := getEnv("DATABASE_URL", "")
	useSQLite := false
	if dbUrl == "" || os.Getenv("USE_SQLITE") == "true" {
		useSQLite = true
	}

	cfg := &Config{
		Port:          getEnv("PORT", "8080"),
		DatabaseURL:   dbUrl,
		JWTSecret:     getEnv("JWT_SECRET", "MediSync2024ProductionJWTSecretKeyVerySecure64CharsLongString"),
		EncryptionKey: getEnv("ENCRYPTION_KEY", "MediSync2024SecureKey32Chars!!"),
		UseSQLite:     useSQLite,
		SQLiteFile:    getEnv("SQLITE_FILE", "medisync.db"),
	}

	return cfg
}

// getEnv retrieves environment variables or returns a default value.
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
