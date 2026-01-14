
package heuristics

import (
	"context"
	"fmt"
	"log"
	"time"

	"manifest-architect/backend/internal/adapters/influxdb"
	"manifest-architect/backend/internal/adapters/redis"

	influxdb2 "github.com/influxdata/influxdb-client-go/v2"
	"github.com/influxdata/influxdb-client-go/v2/api"
)

// Heuristics Engine Constants
const (
	checkInterval      = 30 * time.Second // How often to run the predictive maintenance checks
	analysisWindow     = "1m"             // Check data over the last 1 minute
	vibrationThreshold = 3.5              // m/s^2
	tempThreshold      = 75.0             // degrees Celsius
	minDataPoints      = 30               // Requirement: condition met for > 60 seconds (at 2s interval) = 30 points
	statusWarning      = "WARNING"
	statusPredictive   = "PREDICTIVE_MAINTENANCE"
	statusOperational  = "OPERATIONAL"
)

// Engine implements the predictive maintenance logic.
type Engine struct {
	influxDB    *influxdb.Client
	redisClient *redis.Client
	ticker      *time.Ticker
	quit        chan struct{}
}

// NewEngine creates a new Heuristics Engine.
func NewEngine(influxDB *influxdb.Client, redisClient *redis.Client) *Engine {
	return &Engine{
		influxDB:    influxDB,
		redisClient: redisClient,
		quit:        make(chan struct{}),
	}
}

// StartHeuristicsWorker starts the background worker that runs predictive checks.
func (e *Engine) StartHeuristicsWorker() {
	e.ticker = time.NewTicker(checkInterval)
	go func() {
		for {
			select {
			case <-e.ticker.C:
				e.runPredictiveChecks()
			case <-e.quit:
				e.ticker.Stop()
				return
			}
		}
	}()
	log.Println("[Heuristics Engine] Predictive checks started.")
}

// StopHeuristicsWorker stops the background worker.
func (e *Engine) StopHeuristicsWorker() {
	close(e.quit)
}

// runPredictiveChecks executes the core logic on all AGVs.
// This function implements the heuristic rule using Flux queries.
func (e *Engine) runPredictiveChecks() {
	log.Println("[Heuristics Engine] Running predictive maintenance checks...")

	// 1. Define Flux query to detect anomalies based on the rule:
	// "If motorVibrationMS2 > 3.5 for more than 60 seconds AND batteryTemperature > 75C, change status to PREDICTIVE_MAINTENANCE."
	// We check for a window of 1 minute (analysisWindow = "1m").
	// The query filters for points where both conditions are true and counts them per AGV.
	fluxQuery := fmt.Sprintf(`
		from(bucket: "%s")
		  |> range(start: -%s)
		  |> filter(fn: (r) => r._measurement == "agv_telemetry")
		  |> filter(fn: (r) => r.motorVibrationMS2 > %f and r.batteryTemperature > %f)
		  |> group(columns: ["agvId"])
		  |> count(column: "_value") // Count how many data points meet the criteria within the window
		  |> filter(fn: (r) => r._value >= %d) // Rule: condition must be true for >= %d points (based on 2s interval)
	`, e.influxDB.Bucket(), analysisWindow, vibrationThreshold, tempThreshold, minDataPoints, minDataPoints)

	// 2. Execute query against InfluxDB
	results, err := e.influxDB.QueryAPI().Query(context.Background(), fluxQuery)
	if err != nil {
		log.Printf("[Heuristics Engine] Error querying InfluxDB: %v", err)
		return
	}

	// 3. Process results and apply state changes to Redis (Digital Twin)
	for results.Next() {
		agvId := results.Record().ValueByKey("agvId").(string)
		log.Printf("[Heuristics Engine] Anomaly detected for AGV %s: PREDICTIVE_MAINTENANCE required.", agvId)
		e.updateAgvStatus(agvId, statusPredictive)
	}

	if results.Err() != nil {
		log.Printf("[Heuristics Engine] InfluxDB query error processing results: %v", results.Err())
	}
}

// updateAgvStatus updates the AGV's hot state in Redis.
func (e *Engine) updateAgvStatus(agvId string, newStatus string) {
	agvStatus, err := e.redisClient.GetAgvStatus(agvId)
	if err != nil {
		log.Printf("[Heuristics Engine] Failed to retrieve AGV %s status from Redis: %v", agvId, err)
		return
	}

	// Only update if the status has actually changed to avoid unnecessary updates/events.
	if agvStatus.Status != newStatus {
		agvStatus.Status = newStatus
		if err := e.redisClient.SetAgvStatus(agvStatus); err != nil {
			log.Printf("[Heuristics Engine] Failed to update AGV %s status in Redis: %v", agvId, err)
		} else {
			log.Printf("[Heuristics Engine] AGV %s status updated to '%s'.", agvId, newStatus)
		}
	}
}

// Helper method to simulate a command that could be triggered by the engine.
func (e *Engine) TriggerCommand(agvId string, command string) {
	// In a full implementation, this would publish to a command topic on the MQTT broker.
	log.Printf("[Heuristics Engine] Auto-triggering command '%s' for AGV %s.", command, agvId)
}
