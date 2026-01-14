
package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"ai-web-weaver/backend/internal/auth"
	"ai-web-weaver/backend/internal/beta"
	"ai-web-weaver/backend/internal/cache"
	"ai-web-weaver/backend/internal/config"
	"ai-web-weaver/backend/internal/database"
	"ai-web-weaver/backend/internal/middleware"
	"ai-web-weaver/backend/internal/project"
	"ai-web-weaver/backend/internal/user"
	"ai-web-weaver/backend/internal/validator"
	"ai-web-weaver/backend/pkg/logger"
	"ai-web-weaver/backend/pkg/errors" // Ensure this path is correct if pkg/errors is outside internal

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	// 1. Initialize Logger
	log := logger.NewLogger()
	defer func() {
		_ = log.Sync() // Flushes any buffered logs
	}()

	log.Info("Starting AI Web Weaver Backend Service...")

	// 2. Load Configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatal("Failed to load configuration", zap.Error(err))
	}
	log.Info("Configuration loaded successfully", zap.String("server_port", cfg.ServerPort))

	// 3. Connect to PostgreSQL
	dbPool, err := database.NewPostgresDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to connect to PostgreSQL", zap.Error(err))
	}
	defer dbPool.Close()
	log.Info("Connected to PostgreSQL successfully")

	// 4. Connect to Redis
	redisClient := cache.NewRedisClient(cfg.RedisAddr, cfg.RedisPassword, cfg.RedisDB)
	defer func() {
		if err := redisClient.Close(); err != nil {
			log.Error("Failed to close Redis client", zap.Error(err))
		}
	}()
	// Ping Redis to ensure connection is live
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err = redisClient.Ping(ctx).Result()
	if err != nil {
		log.Fatal("Failed to connect to Redis", zap.Error(err))
	}
	log.Info("Connected to Redis successfully")

	// 5. Initialize Validator
	v := validator.NewValidator()

	// 6. Initialize Repositories
	authRepo := auth.NewPostgresUserRepository(dbPool)
	sessionRepo := auth.NewPostgresSessionRepository(dbPool, cfg.AESSecretKey) // Pass AES key
	betaRepo := beta.NewPostgresBetaSubscriptionRepository(dbPool)
	projectRepo := project.NewPostgresProjectRepository(dbPool)
	userRepo := user.NewPostgresUserRepository(dbPool) // Reuse authRepo user for now, or define a distinct user repo

	// 7. Initialize Services
	authService := auth.NewAuthService(authRepo, sessionRepo, cfg.JWTSecret, time.Duration(cfg.AccessTokenExpirationMinutes)*time.Minute, time.Duration(cfg.RefreshTokenExpirationHours)*time.Hour, log)
	betaService := beta.NewBetaService(betaRepo, log)
	userService := user.NewUserService(userRepo, log)
	projectService := project.NewProjectService(projectRepo, log)

	// 8. Initialize Handlers
	authHandler := auth.NewAuthHandler(authService, v, log)
	betaHandler := beta.NewBetaHandler(betaService, v, log)
	userHandler := user.NewUserHandler(userService, v, log)
	projectHandler := project.NewProjectHandler(projectService, v, log)

	// 9. Setup Chi Router
	r := chi.NewRouter()

	// Global Middleware
	r.Use(middleware.RequestID)
	r.Use(logger.LoggerMiddleware(log)) // Structured logging for requests
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	// CORS Middleware
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "https://aiwebweaver.com"}, // Frontend origins
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	}))

	// Security Headers Middleware
	r.Use(middleware.SetSecurityHeaders)

	// API Routes
	r.Route("/api/v1", func(r chi.Router) {
		// Public Routes (Auth & Beta Subscription)
		r.Group(func(r chi.Router) {
			r.Post("/auth/register", authHandler.Register)
			r.Post("/auth/login", authHandler.Login)
			r.Post("/auth/refresh", authHandler.Refresh) // Uses refresh token from body
			r.Post("/beta/subscribe", betaHandler.Subscribe)
		})

		// Authenticated Routes
		r.Group(func(r chi.Router) {
			r.Use(middleware.AuthMiddleware(cfg.JWTSecret, authService, log)) // Auth middleware
			// User Profile
			r.Get("/auth/me", userHandler.GetProfile)
			r.Patch("/auth/me", userHandler.UpdateProfile)

			// Projects
			r.Get("/users/{userID}/projects", projectHandler.ListProjects)
			r.Post("/users/{userID}/projects", projectHandler.CreateProject)
			// Placeholder for individual project operations (/users/{userID}/projects/{projectID})
		})
	})

	// 10. Start Server
	server := &http.Server{
		Addr:         ":" + cfg.ServerPort,
		Handler:      r,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// 11. Graceful Shutdown
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Info(fmt.Sprintf("Server listening on port %s", cfg.ServerPort))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Could not listen on port", zap.String("port", cfg.ServerPort), zap.Error(err))
		}
	}()

	<-stop // Block until a signal is received

	log.Info("Shutting down server...")

	ctx, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancelShutdown()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatal("Server shutdown failed", zap.Error(err))
	}

	log.Info("Server stopped gracefully.")
}
