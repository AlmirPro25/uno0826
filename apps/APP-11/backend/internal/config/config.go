
package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL                 string
	JWTSecret                   string
	AccessTokenExpirationMinutes int
	RefreshTokenExpirationHours  int
	AESSecretKey                []byte // 32 bytes for AES-256
	RedisAddr                   string
	RedisPassword               string
	RedisDB                     int
	ServerPort                  string
}

func LoadConfig() (*Config, error) {
	// Load .env file in development
	if _, err := os.Stat(".env"); err == nil {
		if err := godotenv.Load(); err != nil {
			return nil, fmt.Errorf("error loading .env file: %w", err)
		}
	}

	cfg := &Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
		RedisAddr:   os.Getenv("REDIS_ADDR"),
		RedisPassword: os.Getenv("REDIS_PASSWORD"),
		ServerPort:  os.Getenv("SERVER_PORT"),
	}

	// Environment variable parsing with defaults and error checking
	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL not set")
	}
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET not set")
	}
	if cfg.RedisAddr == "" {
		cfg.RedisAddr = "localhost:6379" // Default Redis address
	}
	if cfg.ServerPort == "" {
		cfg.ServerPort = "8080" // Default server port
	}

	// Parse Access Token Expiration
	accessTokenExpStr := os.Getenv("ACCESS_TOKEN_EXPIRATION_MINUTES")
	if accessTokenExpStr == "" {
		accessTokenExpStr = "15" // Default 15 minutes
	}
	accessTokenExp, err := strconv.Atoi(accessTokenExpStr)
	if err != nil {
		return nil, fmt.Errorf("invalid ACCESS_TOKEN_EXPIRATION_MINUTES: %w", err)
	}
	cfg.AccessTokenExpirationMinutes = accessTokenExp

	// Parse Refresh Token Expiration
	refreshTokenExpStr := os.Getenv("REFRESH_TOKEN_EXPIRATION_HOURS")
	if refreshTokenExpStr == "" {
		refreshTokenExpStr = "720" // Default 30 days (720 hours)
	}
	refreshTokenExp, err := strconv.Atoi(refreshTokenExpStr)
	if err != nil {
		return nil, fmt.Errorf("invalid REFRESH_TOKEN_EXPIRATION_HOURS: %w", err)
	}
	cfg.RefreshTokenExpirationHours = refreshTokenExp

	// Parse Redis DB
	redisDBStr := os.Getenv("REDIS_DB")
	if redisDBStr == "" {
		redisDBStr = "0" // Default Redis DB 0
	}
	redisDB, err := strconv.Atoi(redisDBStr)
	if err != nil {
		return nil, fmt.Errorf("invalid REDIS_DB: %w", err)
	}
	cfg.RedisDB = redisDB

	// AES Secret Key
	aesKeyStr := os.Getenv("AES_SECRET_KEY")
	if aesKeyStr == "" {
		return nil, fmt.Errorf("AES_SECRET_KEY not set")
	}
	if len(aesKeyStr) != 32 { // AES-256 requires 32-byte key
		return nil, fmt.Errorf("AES_SECRET_KEY must be 32 bytes long")
	}
	cfg.AESSecretKey = []byte(aesKeyStr)

	return cfg, nil
}
