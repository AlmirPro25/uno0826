
package services

import (
	"fmt"
	"log"
	"time"

	"manifest-architect/backend/internal/adapters/mqtt"
	"manifest-architect/backend/internal/adapters/redis"
	"manifest-architect/backend/internal/core/domain"
	"manifest-architect/backend/internal/repositories"

	pahoMqtt "github.com/paho-client/paho.mqtt.golang"
)

// CommandService manages sending commands to AGVs and logging command history.
type CommandService struct {
	agvRepository repositories.AgvMetadataRepository
	redisClient   *redis.Client
	mqttPublisher *MqttCommandPublisher
}

// NewCommandService creates a new CommandService instance.
func NewCommandService(agvRepository repositories.AgvMetadataRepository, redisClient *redis.Client, mqttPublisher *MqttCommandPublisher) *CommandService {
	return &CommandService{
		agvRepository: agvRepository,
		redisClient:   redisClient,
		mqttPublisher: mqttPublisher,
	}
}

// SendCommandToAgv processes a command request, logs it, and publishes it to the AGV via MQTT.
func (s *CommandService) SendCommandToAgv(agvId string, commandRequest domain.AgvCommandRequest, sentBy string) error {
	// 1. Validate AGV status before sending command (business logic rule)
	agvStatus, err := s.redisClient.GetAgvStatus(agvId)
	if err != nil {
		log.Printf("[CommandService] AGV status check failed for AGV %s: %v", agvId, err)
		return fmt.Errorf("AGV not found or unreachable")
	}

	// Example RBAC check: Only allow 'EMERGENCY_STOP' if AGV is 'OPERATIONAL' or 'WARNING'.
	// This ensures commands are contextually valid based on the Digital Twin's state (Priority 3).
	// Further business logic could be implemented here.

	// 2. Log command in persistent metadata store (Prisma/Postgres)
	// commandLog := domain.AgvCommandLog{...} // Use full model here if needed.
	// s.agvRepository.CreateCommandLog(commandLog) // Placeholder for actual repository call.

	// 3. Publish command to MQTT broker (Commands/agv/{agvId})
	commandTopic := fmt.Sprintf("commands/agv/%s", agvId)
	payload := []byte(commandRequest.Command) // In real scenario, convert to JSON/Protobuf for payload

	if err := s.mqttPublisher.PublishCommand(commandTopic, payload); err != nil {
		log.Printf("[CommandService] Failed to publish MQTT command for AGV %s: %v", agvId, err)
		// Update command log status to FAILED here.
		return fmt.Errorf("failed to publish command to AGV")
	}

	log.Printf("[CommandService] Successfully sent command '%s' to AGV %s by user %s.", commandRequest.Command, agvId, sentBy)
	// Update command log status to PENDING/ACKNOWLEDGED here.
	return nil
}

//
