
package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"manifest-architect/backend/internal/adapters/influxdb"
	"manifest-architect/backend/internal/adapters/mqtt"
	"manifest-architect/backend/internal/adapters/redis"
	"manifest-architect/backend/internal/core/heuristics"
)

// main function for the Digital Twin Service (twin-service)
func main() {
	log.Println("Initializing MANIFEST-ARCHITECT Digital Twin Service...")

	// 1. Initialize Adapters
	// Redis Client (Hot State Cache)
	redisClient, err := redis.NewRedisClient("redis:6379", "")
	if err != nil {
		log.Fatalf("Failed to initialize Redis client: %v", err)
	}

	// InfluxDB Client (Historical Data Storage)
	influxDBClient, err := influxdb.NewInfluxDBClient(
		os.Getenv("INFLUXDB_URL"),
		os.Getenv("INFLUXDB_TOKEN"),
		os.Getenv("INFLUXDB_ORG"),
		os.Getenv("INFLUXDB_BUCKET"),
	)
	if err != nil {
		log.Fatalf("Failed to initialize InfluxDB client: %v", err)
	}

	// Heuristics Engine (Predictive Maintenance Logic)
	heuristicsEngine := heuristics.NewEngine(influxDBClient, redisClient)
	go heuristicsEngine.StartHeuristicsWorker()

	// 2. Start MQTT Ingestion Processor
	mqttProcessor := mqtt.NewMQTTProcessor(redisClient, influxDBClient)
	if err := mqttProcessor.StartListening("mqtt-broker:1883"); err != nil {
		log.Fatalf("Failed to start MQTT processor: %v", err)
	}

	// 3. Graceful shutdown handler
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down twin-service gracefully...")

	// Cleanup resources
	mqttProcessor.StopListening()
	influxDBClient.Close()
	heuristicsEngine.StopHeuristicsWorker()
	log.Println("Services stopped.")
}
