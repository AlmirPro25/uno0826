#!/bin/bash
docker run -d \
  --name sce-backend \
  --network sce-network \
  --env-file ~/sce/.env \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v ~/sce/data:/app/data \
  --health-cmd="wget --no-verbose --tries=1 --spider http://127.0.0.1:3001/api/v1/health || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-start-period=10s \
  --health-retries=3 \
  -l "traefik.enable=true" \
  -l 'traefik.http.routers.sce-api.rule=Host(`api.sce.prostqs.com.br`)' \
  -l "traefik.http.routers.sce-api.entrypoints=websecure" \
  -l "traefik.http.routers.sce-api.tls.certresolver=letsencrypt" \
  -l "traefik.http.services.sce-api.loadbalancer.server.port=3001" \
  sce_sce-backend
