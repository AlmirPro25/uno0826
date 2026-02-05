
# SENTINEL NEXUS 🛡️

![Status](https://img.shields.io/badge/STATUS-OPERATIONAL-39FF14?style=for-the-badge)
![Security](https://img.shields.io/badge/SECURITY-MAXIMUM-FF5F1F?style=for-the-badge)
![License](https://img.shields.io/badge/LICENSE-CLASSIFIED-0F0F12?style=for-the-badge)

> **Tactical Border Control & Asset Tracking System**
> Designed by Sentinel Prime.

## 📜 MISSION BRIEF
Sentinel Nexus is a high-precision Command & Control (C2) interface designed for monitoring high-value assets across international borders. It combines real-time geospatial tracking, encrypted manifest management, and simulated sensor telemetry into a single "War Room" dashboard.

## 🏗️ SYSTEM ARCHITECTURE

### The Core (Backend)
*   **Runtime:** Node.js + Express
*   **Database:** SQLite (Embedded Industrial Storage)
*   **ORM:** Prisma (Type-Safe Data Access)
*   **Comms:** WebSockets (Real-time Telemetry)

### The Visor (Frontend)
*   **Framework:** React + Vite
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (Custom "Tactical Onyx" Config)
*   **Maps:** Leaflet JS (Geospatial Rendering)

## 🚀 QUICK START (TACTICAL DEPLOYMENT)

### Prerequisites
*   Node.js v18+
*   Docker & Docker Compose

### Initialization Sequence

1.  **Clone the Vector:**
    ```bash
    git clone https://github.com/your-org/sentinel-nexus.git
    cd sentinel-nexus
    ```

2.  **Install Dependencies (Local):**
    ```bash
    npm install
    ```

3.  **Engage Systems:**
    ```bash
    # Runs both Frontend and Backend in concurrent development mode
    npm run dev
    ```

4.  **Docker Protocol:**
    ```bash
    docker-compose up --build
    ```

## 🖥️ INTERFACE PREVIEW

*   **Authentication:** Zero-Trust login screen.
*   **Dashboard:** Dark mode, high-contrast map, scrolling logs.
*   **Asset Detail:** Live sensor data (Battery, Temp, Lock Status).

## 🔒 SECURITY PROTOCOLS
*   **Panic Mode:** Immediately locks down selected assets.
*   **Audit Logs:** Immutable record of all actions.
*   **Manifest Encryption:** (Simulated) AES-256 for documents.
