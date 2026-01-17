#!/bin/bash
docker run -d \
  --name sce-frontend \
  --network sce-network \
  --restart unless-stopped \
  --no-healthcheck \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e HOSTNAME=0.0.0.0 \
  -l "traefik.enable=true" \
  -l "traefik.http.routers.sce-frontend.rule=Host(\`sce.prostqs.com.br\`)" \
  -l "traefik.http.routers.sce-frontend.entrypoints=websecure" \
  -l "traefik.http.routers.sce-frontend.tls.certresolver=letsencrypt" \
  -l "traefik.http.services.sce-frontend.loadbalancer.server.port=3000" \
  sce-frontend:latest
