
# MANIFEST-ARCHITECT Project Structure

This structure outlines the Go backend services and the TypeScript frontend application necessary to implement the Digital Twin system.

## 1. Backend Services (Go)

The backend consists of several microservices, all written in Go to ensure high performance and low latency. The services are designed around the Hexagonal Architecture pattern.

```text
manifest-architect/
├── cmd/
│   ├── twin-service/     // Digital Twin core logic and data ingestion
│   │   └── main.go
│   └── streaming-service/ // WebSocket API gateway for frontend communication
│       └── main.go
├── internal/
│   ├── core/             // Domain logic and business rules (e.g., Heuristics engine logic)
│   │   ├── domain/       // Core entities (DigitalTwin, AgvTelemetry)
│   │   ├── heuristics/   // Predictive maintenance logic and anomaly detection
│   │   └── validation/   // Schema validation (Zod equivalent) for incoming data
│   ├── ports/            // Interfaces defining interaction boundaries (e.g., IngestionPort, StoragePort)
│   ├── adapters/         // Implementations of ports (e.g., MqttAdapter, InfluxDBAdapter, RedisAdapter)
│   │   ├── mqtt/
│   │   ├── redis/
│   │   └── influxdb/
│   ├── api/              // REST API endpoints for commands and metadata queries
│   └── streaming/        // WebSocket message handling logic
├── pkg/                  // Common libraries (logging, error handling, configuration)
├── deploy/               // Dockerfiles, Helm charts, CI/CD pipelines
├── go.mod                // Go module dependencies
└── go.sum                // Go module checksums
```

## 2. Frontend Application (TypeScript/React)

The frontend uses Vite for bundling, React/TypeScript for components, and Canvas/WebGL for high-performance visualization.

```text
manifest-architect/
└── frontend/
    ├── src/
    │   ├── api/          // REST API client generated from OpenAPI spec
    │   ├── components/   // Reusable React components (buttons, cards, data displays)
    │   ├── hooks/        // Custom hooks for state management and data fetching
    │   ├── context/      // Global state management (AuthContext, WebSocketContext)
    │   ├── pages/        // Main application pages (Dashboard, AGVDetails)
    │   ├── store/        // Redux/Zustand store for global state management
    │   ├── utils/        // Utility functions (data formatting, color conversions)
    │   ├── visualizations/ // Core visualization components (Canvas/WebGL rendering logic)
    │   │   ├── AgvMapRenderer.tsx // Canvas/WebGL component for rendering 5000 AGVs
    │   │   └── Map.tsx // Container for the visualization component
    │   └── App.tsx       // Main application entry point
    ├── public/           // Static assets (fonts, images)
    ├── tailwind.config.js// Tailwind CSS configuration (dark mode, high contrast)
    ├── package.json      // Node.js dependencies
    └── tsconfig.json     // TypeScript configuration
```

## 3. Configuration and Documentation

```text
manifest-architect/
├── docs/                 // Project documentation
│   ├── architecture.json // High-level architecture design document (Phase 1)
│   ├── openapi.yaml      // API contract specification (Phase 1)
│   ├── project-structure.md // Current document (Phase 1)
│   ├── phase-instructions.md // Detailed implementation guide (Phase 1)
│   ├── README.md         // Installation and usage instructions (Phase 2)
│   └── SECURITY.md       // Security best practices (TLS, RBAC)
├── config/               // Environment variables and configuration files
└── prisma/               // Database schema definition and migration files
    └── schema.prisma
```
