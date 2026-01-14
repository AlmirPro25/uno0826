
package influxdb

import (
	"context"
	"fmt"
	"log"
	"time"

	"manifest-architect/backend/internal/core/domain"

	influxdb2 "github.com/influxdata/influxdb-client-go/v2"
	"github.com/influxdata/influxdb-client-go/v2/api"
)

// Client for interacting with InfluxDB (Time Series Storage)
type Client struct {
	client influxdb2.Client
	writer api.WriteAPIBlocking
	query  api.QueryAPI
	bucket string
	buffer chan domain.AgvTelemetry // Ingestion buffer channel (Anti-pattern 2)
}

const (
	batchSize   = 1000            // Write batch size (Anti-pattern 2)
	flushInterval = 1 * time.Second // Flush interval (Anti-pattern 2)
)

// NewInfluxDBClient creates and initializes an InfluxDB client and starts the batch writing goroutine.
func NewInfluxDBClient(url, token, org, bucket string) (*Client, error) {
	client := influxdb2.NewClient(url, token)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := client.Health(ctx)
	if err != nil {
		return nil, fmt.Errorf("influxdb health check failed: %w", err)
	}

	c := &Client{
		client: client,
		writer: client.WriteAPIBlocking(org, bucket),
		query:  client.QueryAPI(org),
		bucket: bucket,
		buffer: make(chan domain.AgvTelemetry, batchSize*2), // Buffer capacity
	}

	log.Println("[InfluxDB] Connection established successfully. Starting batch writer...")
	go c.startBatchWriter()

	return c, nil
}

// startBatchWriter implements the batch writing mechanism.
// It continuously reads from the buffer channel and flushes data to InfluxDB in batches.
func (c *Client) startBatchWriter() {
	buffer := make([]domain.AgvTelemetry, 0, batchSize)
	ticker := time.NewTicker(flushInterval)
	defer ticker.Stop()

	for {
		select {
		case telemetry := <-c.buffer:
			buffer = append(buffer, telemetry)
			if len(buffer) >= batchSize {
				c.flushBuffer(buffer)
				buffer = buffer[:0] // Clear buffer after flush
			}
		case <-ticker.C:
			if len(buffer) > 0 {
				c.flushBuffer(buffer)
				buffer = buffer[:0] // Clear buffer after flush
			}
		}
	}
}

// flushBuffer writes the accumulated telemetry points to InfluxDB.
func (c *Client) flushBuffer(telemetryBatch []domain.AgvTelemetry) {
	log.Printf("[InfluxDB] Flushing batch of %d data points.", len(telemetryBatch))
	points := make([]*influxdb2.Point, 0, len(telemetryBatch))

	for _, t := range telemetryBatch {
		p := influxdb2.NewPointWithMeasurement("agv_telemetry").
			AddTag("agvId", t.RobotId).
			AddField("positionX", t.PositionX).
			AddField("positionY", t.PositionY).
			AddField("batteryLevel", t.BatteryLevel).
			AddField("batteryTemperature", t.BatteryTemperature).
			AddField("motorVibrationMS2", t.MotorVibrationMS2).
			AddField("loadKG", t.LoadKG).
			SetTime(t.Timestamp) // Use timestamp from telemetry data

		points = append(points, p)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := c.writer.WritePoint(ctx, points...); err != nil {
		log.Printf("[InfluxDB] Batch write failed: %v", err)
	}
}

// IngestBuffer adds a new telemetry point to the write buffer.
func (c *Client) IngestBuffer(telemetry domain.AgvTelemetry) {
	select {
	case c.buffer <- telemetry:
		// Message added to buffer successfully
	default:
		// Buffer is full, drop message. This prevents blocking the MQTT consumer.
		log.Printf("[InfluxDB] Write buffer full for AGV %s, dropping message.", telemetry.RobotId)
	}
}

// QueryHistoricalData retrieves time series data for an AGV from InfluxDB.
// Implements the logic required by GET /api/v1/agv/{agvId}/history.
func (c *Client) QueryHistoricalData(agvId string, duration string) ([]domain.AgvTelemetry, error) {
	fluxQuery := fmt.Sprintf(`
		from(bucket: "%s")
		  |> range(start: -%s)
		  |> filter(fn: (r) => r._measurement == "agv_telemetry" and r.agvId == "%s")
		  |> sort(columns: ["_time"])
	`, c.bucket, duration, agvId)

	results, err := c.query.Query(context.Background(), fluxQuery)
	if err != nil {
		return nil, fmt.Errorf("influxdb query failed: %w", err)
	}

	var telemetryData []domain.AgvTelemetry
	for results.Next() {
		record := results.Record()
		telemetry := domain.AgvTelemetry{
			RobotId:            record.ValueByKey("agvId").(string),
			PositionX:          record.ValueByKey("positionX").(float64),
			PositionY:          record.ValueByKey("positionY").(float64),
			BatteryLevel:       int(record.ValueByKey("batteryLevel").(int64)),
			BatteryTemperature: record.ValueByKey("batteryTemperature").(float64),
			MotorVibrationMS2:  record.ValueByKey("motorVibrationMS2").(float64),
			LoadKG:             record.ValueByKey("loadKG").(float64),
			Timestamp:          record.Time(),
		}
		telemetryData = append(telemetryData, telemetry)
	}

	if results.Err() != nil {
		return nil, fmt.Errorf("influxdb query error: %w", results.Err())
	}

	return telemetryData, nil
}

// Close closes the underlying InfluxDB connection.
func (c *Client) Close() {
	c.client.Close()
}
