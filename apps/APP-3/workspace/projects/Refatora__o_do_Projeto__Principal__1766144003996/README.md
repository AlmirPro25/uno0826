
# MANIFEST-ARCHITECT: Digital Twin & Predictive Mission Control

**"The Digital Twin must be the single source of truth for the physical reality." - Nexus-01 Directive**

MANIFEST-ARCHITECT is a mission-critical system designed to provide real-time monitoring and predictive maintenance for a large fleet of Autonomous Guided Vehicles (AGVs) in a logistics warehouse environment. The core principle of this architecture is the creation of a high-fidelity Digital Twin for each AGV, updated at high frequency via an optimized message queuing protocol (MQTT).

This platform replaces traditional reactive maintenance models with a proactive, data-driven approach, utilizing a Heuristics Engine to analyze time-series data and predict component failures before they occur.

## 1. System Architecture Diagram

```mermaid
graph TD
    subgraph Physical Layer
        A[5,000 AGV Fleet] -- Telemetry (Position, Battery, Vibration) --> B(MQTT Broker);
    end

    subgraph Digital Twin Layer (High Frequency Data Path)
        B -- Publish/Subscribe (QoS 1) --> C(Twin Service - Go);
        C -- Batch Writing (2.5k writes/s) --> D(InfluxDB Time-Series DB);
        D -- Flux Queries / Windowing --> E(Heuristics Engine - Go);
    end

    subgraph Control Layer (Low Frequency Data Path)
        F[Mission Control UI - React] -- WebSocket (Real-Time Updates) --> G(API Gateway - Go);
        F -- REST API (Commands) --> G;
        G -- Publish (Command) --> B;
        G -- REST API (Metadata History) --> D;
    end

    subgraph Metadata & Command Logging Layer
        G -- Read/Write --> H(PostgreSQL Metadata DB);
    end

    style A fill:#D0F0C0,stroke:#3C3C3C
    style B fill:#F5D0A9,stroke:#3C3C3C
    style C fill:#DDEBFB,stroke:#3C3C3C
    style D fill:#FAFAD2,stroke:#3C3C3C
    style E fill:#DDEBFB,stroke:#3C3C3C
    style F fill:#ADD8E6,stroke:#3C3C3C
    style G fill:#DDEBFB,stroke:#3C3C3C
    style H fill:#E6E6FA,stroke:#3C3C3C
```

## 2. Core Components

*   **AGV Telemetry:** Each AGV publishes its state (position, sensor readings, battery) to a central MQTT broker. The payload is optimized for low bandwidth.
*   **MQTT Broker:** The central nervous system for data ingestion. Chosen for its efficiency in IoT scenarios over HTTP/REST.
*   **Twin Service (Go):** The primary data processing pipeline written in Go. It subscribes to all AGV telemetry topics, processes the incoming messages, and maintains the current state of each Digital Twin. It implements **Batch Writing** to **InfluxDB** to handle high write throughput (2,500 messages/second).
*   **Heuristics Engine (Go):** A dedicated service that performs real-time analysis of the time-series data in InfluxDB. It applies predictive models (e.g., sliding window analysis for vibration patterns) to detect potential failures before they occur and updates the AGV's status in the Digital Twin.
*   **PostgreSQL Database:** Used for static AGV metadata (serial numbers, installation dates, maintenance history) and for logging operator-issued commands. Not used for raw telemetry.
*   **Mission Control UI (React/Vite):** The operator dashboard. It uses a real-time WebSocket connection to receive updates from the Digital Twin service, displaying AGV positions on a high-performance Canvas map. Operators can issue commands back to specific AGVs via a REST API gateway.

## 3. Technology Stack

*   **Backend:** Go (for performance and concurrency), InfluxDB (Time-Series Database), PostgreSQL (Metadata Storage), Mosquitto (MQTT Broker).
*   **Frontend:** React, TypeScript, Vite, Recharts (for data visualization), TailwindCSS (for rapid UI development).
*   **DevOps:** Docker, Docker Compose, GitHub Actions, Playwright (E2E testing).

## 4. Local Development Setup

### Prerequisites

*   **Docker Desktop:** Ensure Docker is running on your system.
*   **Go:** Version 1.21 or later.
*   **Node.js:** Version 20 or later.
*   **Prisma CLI:** `npm install -g prisma`

### Steps

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-repo/manifest-architect.git
    cd manifest-architect
    ```

2.  **Configure Environment Variables:**
    Copy the example file and fill in your custom credentials.
    ```bash
    cp .env.example .env
    # Edit .env to set a strong JWT_SECRET and database passwords.
    ```

3.  **Launch Database Services and MQTT Broker:**
    Use Docker Compose to start the dependent services. The development configuration will also build the backend and frontend for local development.
    ```bash
    docker-compose up -d --build
    ```
    *Wait for services to become healthy (PostgreSQL and InfluxDB healthchecks may take a few seconds).*

4.  **Database Migration (Prisma):**
    Apply the Prisma schema to the PostgreSQL database.
    ```bash
    npm install # Install Prisma CLI and dependencies
    npx prisma migrate dev --name init_agv_metadata
    ```

5.  **Run Application Services:**
    The Docker Compose command from step 3 should already be running the services.
    *   Frontend UI: Accessible at `http://localhost:3000`
    *   Backend API: Accessible at `http://localhost:8080` (Internal API, not for direct user access)
    *   InfluxDB UI (optional): Accessible at `http://localhost:8086`

6.  **Simulate AGV Telemetry Data (Optional):**
    For testing purposes, you will need a separate script to simulate the 5,000 AGVs publishing data to the MQTT broker.

## 5. Deployment Guide

Refer to `DEPLOYMENT.md` for production deployment instructions using the `docker-compose.prod.yml` file and GitHub Actions.

## 6. Project Structure

```text
manifest-architect/
├── .github/workflows/         # CI/CD pipelines (GitHub Actions)
├── backend/                   # Go backend code
│   ├── cmd/twin-service/      # Main application entry point
│   ├── internal/core/         # Core business logic (Hexagonal Architecture)
│   ├── pkg/inmemory/          # Digital Twin state management (Redis client)
│   └── pkg/influxdb/          # InfluxDB client and batch writing logic
├── frontend/                  # React/TypeScript frontend code
│   ├── public/                # Static assets
│   ├── src/components/        # UI components
│   ├── src/hooks/             # Data fetching hooks (React Query)
│   ├── src/services/api/      # REST API client logic
│   ├── src/store/             # Zustand store for real-time state
│   └── src/types/             # Shared TypeScript types
├── docker/                    # Dockerfiles for building images
├── mqtt/config/               # Mosquitto broker configuration files
├── prisma/                    # Prisma schema for metadata database
├── .env.example               # Template for environment variables
├── docker-compose.yml         # Development setup
├── docker-compose.prod.yml    # Production setup
└── README.md                  # This document
```
