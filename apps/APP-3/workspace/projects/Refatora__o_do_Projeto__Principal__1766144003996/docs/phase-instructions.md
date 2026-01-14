
# MANIFEST-ARCHITECT: Detailed Instructions for Backend Implementation (Go)

**Phase Objective:** Implement the high-performance data ingestion pipeline and the digital twin core logic as defined in the architectural blueprint.

**Prerequisites:**
*   A running MQTT Broker (e.g., Mosquitto, HiveMQ).
*   A running InfluxDB instance (v2.x) with a pre-configured bucket for telemetry.
*   A running Redis instance for hot state caching.

**Service 1: `twin-service` (Digital Twin Core and Ingestion Engine)**

**1. MQTT Ingestion and Schema Validation:**
*   **Implementation Target:** `internal/adapters/mqtt/mqtt_client.go`
*   **Requirement:** Connect to the MQTT Broker (using `paho.mqtt.golang`) with persistence and exponential backoff on connection failure (Anti-pattern 4). Subscribe to the topic `telemetry/agv/+` to receive messages from all AGVs.
*   **Schema Validation:** Immediately upon message reception, validate the incoming payload against the defined schema (`AgvTelemetrySnapshot`). Use a strong validation library (e.g., `go-playground/validator` or generate Go structs from JSON schema). Reject and log invalid messages.

**2. Batch Writing to InfluxDB:**
*   **Implementation Target:** `internal/adapters/influxdb/influxdb_client.go`
*   **Requirement (Anti-pattern 2):** **Do not write data point by point.** Implement a **buffer system**. Create a buffered channel (`go chan *dataPoint`) and a Go routine that continuously reads from this channel. The routine should flush the buffer to InfluxDB when either:
    *   The buffer size reaches a pre-defined limit (e.g., 1000 data points).
    *   A timeout interval elapses (e.g., every 1 second).
*   **InfluxDB Data Mapping:** Map the validated MQTT message to InfluxDB Line Protocol format.
    *   **Measurement:** `agv_telemetry`
    *   **Tags:** `agvId` (indexed for querying specific AGVs efficiently)
    *   **Fields:** `positionX`, `positionY`, `batteryLevel`, `batteryTemperature`, `motorVibrationMS2`, `loadKG` (all numeric values).

**3. Hot State Management in Redis:**
*   **Implementation Target:** `internal/adapters/redis/redis_client.go`
*   **Requirement (SSOT Principle):** After validating an incoming message, immediately update the "hot" state of the digital twin in Redis. Use a key pattern `agv:state:{agvId}`. The value should be the full JSON snapshot of the AGV's current state. This allows the Streaming Service (Service 2) to rapidly retrieve the current state without querying InfluxDB.

**Service 2: `heuristics-engine` (Predictive Maintenance Logic)**

*   **Implementation Target:** `internal/core/heuristics/engine.go`
*   **Requirement:** Implement a worker that applies the predictive maintenance rule to identify AGVs at risk of failure.
*   **Rule Logic:** "If `motorVibrationMS2` exceeds 3.5 **for more than 60 seconds** AND `batteryTemperature` exceeds 75°C, change AGV status to `PREDICTIVE_MAINTENANCE`."
*   **Query Implementation (InfluxDB Flux):** Use a windowing function to evaluate the condition over the specified time range. Example Flux query structure:
    ```flux
    from(bucket: "agv_telemetry_bucket")
      |> range(start: -1m)
      |> filter(fn: (r) => r._measurement == "agv_telemetry")
      |> filter(fn: (r) => r.agvId == agvIdToAnalyze)
      |> window(every: 1m) // Calculate over 1-minute windows
      |> group(columns: ["agvId"])
      |> mean() // Calculate mean vibration and temp over the window
      |> filter(fn: (r) => r.motorVibrationMS2 > 3.5 and r.batteryTemperature > 75.0)
    ```
*   **Alert Action:** When an anomaly is detected, update the AGV status in Redis (e.g., `SET agv:state:{agvId} '{"status": "PREDICTIVE_MAINTENANCE", ...}'`).

**Service 3: `streaming-service` (Real-time WebSockets Gateway)**

*   **Implementation Target:** `cmd/streaming-service/main.go`
*   **Requirement:** Provide a high-performance, real-time data feed to the frontend dashboard via WebSockets.
*   **Data Source:** Subscribe to Redis `KEYSPACE` notifications or listen for updates from the `twin-service`. When an AGV's hot state changes in Redis, push the update to the connected clients via WebSocket.
*   **Frontend Data Format:** Implement a binary serialization protocol (Protobuf/MessagePack) for optimal bandwidth usage (Anti-pattern 6).

**Checklist for Review:**
*   [ ] Go routines for concurrency in ingestion process.
*   [ ] Batch writing logic for InfluxDB fully implemented.
*   [ ] Redis cache update logic (SSOT) operational.
*   [ ] Heuristics engine logic implemented using time-windowing logic.
*   [ ] WebSocket streaming service implemented for real-time frontend updates.
*   [ ] TLS/SSL configuration for all external communication points.
