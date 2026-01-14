
# MANIFEST-ARCHITECT Production Deployment Guide

This document outlines the procedure for deploying the MANIFEST-ARCHITECT system to a production environment using Docker Compose. The deployment assumes a single host server running Docker and accessible via SSH.

## Prerequisites

1.  **Production Server:** A Linux server (e.g., Ubuntu, Debian, CentOS) with sufficient resources for running the database services (PostgreSQL, InfluxDB) and application containers.
2.  **Docker & Docker Compose:** Installed and configured on the production server.
3.  **Domain Name:** A registered domain (e.g., `mission-control.yourcompany.com`) pointing to the server's IP address.
4.  **SSL/TLS Certificate:** A valid certificate for your domain (e.g., generated via Let's Encrypt or a commercial CA) for secure communication (HTTPS/WSS).
5.  **GitHub Secrets:** Your GitHub repository must have the following secrets configured for the CD pipeline:
    *   `DOCKER_USERNAME` / `DOCKER_PASSWORD`: Credentials for your Docker registry (e.g., Docker Hub, GitHub Packages).
    *   `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`: Credentials for connecting to the production server.

## 1. Environment Configuration

Before deployment, set up a production environment file (`.env.production`) on your server. This file will contain all sensitive credentials and configuration parameters.

```bash
# On your production server:
# Create the .env file
touch .env.production

# Edit the file with strong passwords and unique tokens
nano .env.production
```

**Example `.env.production` content:**

```dotenv
#
