
package mqtt

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"manifest-architect/backend/internal/adapters/influxdb"
	"manifest-architect/backend/internal/adapters/redis"
	"manifest-architect/backend/internal/core/domain"

	mqtt "github.com/paho-client/paho.mqtt.golang"
)

// processor handles MQTT subscription and data processing logic.
type processor struct {
	clientOptions *mqtt.ClientOptions
	client        mqtt.Client
	redisClient   *redis.Client
	influxDB      *influxdb.Client
}

// NewMQTTProcessor creates a new MQTTProcessor instance.
func NewMQTTProcessor(redisClient *redis.Client, influxDB *influxdb.Client) *processor {
	return &processor{
		redisClient: redisClient,
		influxDB:    influxDB,
	}
}

// StartListening connects to the MQTT broker and subscribes to telemetry topics.
func (p *processor) StartListening(brokerURL string) error {
	opts := mqtt.NewClientOptions()
	opts.AddBroker(brokerURL)
	opts.SetClientID(fmt.Sprintf("twin-service-%d", time.Now().UnixNano()))
	opts.SetKeepAlive(30 * time.Second)
	opts.SetPingTimeout(10 * time.Second)
	opts.SetConnectRetryInterval(1 * time.Second) // Exponential backoff is good here.
	opts.SetConnectTimeout(5 * time.Second)
	opts.SetOnConnectHandler(func(c mqtt.Client) {
		log.Println("[MQTT] Connected successfully to broker.")
	})
	opts.SetConnectionLostHandler(func(c mqtt.Client, err error) {
		log.Printf("[MQTT] Connection lost: %v. Reconnecting...", err)
	})

	p.client = mqtt.NewClient(opts)
	token := p.client.Connect()
	if token.Wait() && token.Error() != nil {
		return fmt.Errorf("MQTT connection error: %v", token.Error())
	}

	// Subscribe to all AGV telemetry topics (telemetry/agv/+)
	if token := p.client.Subscribe("telemetry/agv/+", 1, p.messageHandler); token.Wait() && token.Error() != nil {
		return fmt.Errorf("MQTT subscription error: %v", token.Error())
	}

	log.Println("[MQTT] Subscribed to topic 'telemetry/agv/+' successfully.")
	return nil
}

// StopListening disconnects from the MQTT broker.
func (p *processor) StopListening() {
	if p.client != nil && p.client.IsConnected() {
		p.client.Disconnect(250) // Disconnect timeout in milliseconds
	}
}

// messageHandler processes incoming MQTT messages.
// This function implements the core ingestion logic: Validate -> Update Redis -> Buffer for InfluxDB batch write.
func (p *processor) messageHandler(client mqtt.Client, msg mqtt.Message) {
	var telemetry domain.AgvTelemetry
	if err := json.Unmarshal(msg.Payload(), &telemetry); err != nil {
		log.Printf("[MQTT] Error unmarshalling JSON payload from AGV %s: %v", msg.Topic(), err)
		return
	}

	// 1. Validate incoming data (Anti-pattern 5: strong validation/schema check)
	// (Note: In a real implementation, use a library like go-playground/validator here for robust checks)
	if telemetry.RobotId == "" {
		log.Printf("[MQTT] Invalid telemetry message: Missing robotId in topic %s", msg.Topic())
		return
	}

	// 2. Update Hot State in Redis (SSOT for frontend)
	// We first retrieve the existing AGV state to preserve metadata, then update with new telemetry.
	agvStatus, err := p.redisClient.GetAgvStatus(telemetry.RobotId)
	if err != nil {
		// If AGV not found in hot cache, create a new entry with default status.
		agvStatus = &domain.AgvStatus{
			RobotId: telemetry.RobotId,
			Status:  "OPERATIONAL", // Default initial status
		}
	}
	agvStatus.Telemetry = telemetry
	p.redisClient.SetAgvStatus(agvStatus)

	// 3. Buffer data for batch writing to InfluxDB (Anti-pattern 2)
	p.influxDB.IngestBuffer(telemetry)
}
