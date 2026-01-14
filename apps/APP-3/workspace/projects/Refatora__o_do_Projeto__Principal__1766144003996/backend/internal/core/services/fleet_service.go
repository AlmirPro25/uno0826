
package services

import (
	"log"

	"manifest-architect/backend/internal/adapters/influxdb"
	"manifest-architect/backend/internal/adapters/redis"
	"manifest-architect/backend/internal/core/domain"
	"manifest-architect/backend/internal/repositories"
)

// FleetService manages high-level fleet operations and data retrieval.
type FleetService struct {
	agvRepository repositories.AgvMetadataRepository
	redisClient   *redis.Client
	influxDB      *influxdb.Client
}

// NewFleetService creates a new FleetService instance.
func NewFleetService(agvRepository repositories.AgvMetadataRepository, redisClient *redis.Client, influxDB *influxdb.Client) *FleetService {
	return &FleetService{
		agvRepository: agvRepository,
		redisClient:   redisClient,
		influxDB:      influxDB,
	}
}

// GetAllAgvStatuses retrieves the digital twin states of all AGVs from the Redis hot cache.
func (s *FleetService) GetAllAgvStatuses() ([]domain.AgvStatus, error) {
	// Priority 2: Read from high-speed cache for real-time dashboard.
	statuses, err := s.redisClient.GetAllAgvStatuses()
	if err != nil {
		log.Printf("[FleetService] Failed to get all statuses from Redis: %v", err)
		return nil, err
	}
	return statuses, nil
}

// GetAgvHistory retrieves historical telemetry data for a single AGV.
func (s *FleetService) GetAgvHistory(agvId string, duration string) ([]domain.AgvTelemetry, error) {
	// Query historical data from InfluxDB
	// The duration parameter (e.g., "1h", "24h") is passed directly to the InfluxDB client.
	historyData, err := s.influxDB.QueryHistoricalData(agvId, duration)
	if err != nil {
		log.Printf("[FleetService] Failed to query history for AGV %s: %v", agvId, err)
		return nil, err
	}
	return historyData, nil
}
