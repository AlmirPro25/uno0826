/**
 * 🔄 NGINX LOAD BALANCER MANIFEST
 * 
 * O Guardião do Tráfego - Balanceamento, Proxy Reverso e Alta Disponibilidade
 * 
 * @version 1.0.0
 * @author Micro SaaS Factory
 */

export const NGINX_LOADBALANCER_MANIFEST = {
  id: 'nginx-loadbalancer-supreme',
  name: 'NGINX Load Balancer Supreme Master',
  version: '1.0.0',
  category: 'infrastructure',
  
  activation: {
    keywords: [
      'nginx', 'load balancer', 'reverse proxy', 'proxy reverso',
      'upstream', 'balanceamento', 'alta disponibilidade', 'ha',
      'ssl termination', 'rate limiting', 'caching', 'gzip',
      'websocket proxy', 'http2', 'health check', 'failover'
    ],
    contexts: ['infrastructure', 'devops', 'backend', 'deployment']
  },

  philosophy: `
    "NGINX é o guardião silencioso que distribui milhões de requests 
    sem que ninguém perceba. Quando bem configurado, é invisível."
  `,

  // ============================================================
  // ARQUITETURA DE LOAD BALANCING
  // ============================================================
  
  architecture: {
    layers: {
      edge: {
        description: 'CDN/WAF antes do NGINX',
        components: ['Cloudflare', 'AWS CloudFront', 'Fastly'],
        purpose: 'DDoS protection, caching estático, WAF'
      },
      loadBalancer: {
        description: 'NGINX como load balancer principal',
        components: ['NGINX Plus', 'NGINX OSS', 'OpenResty'],
        purpose: 'Distribuição de tráfego, SSL termination, rate limiting'
      },
      application: {
        description: 'Servidores de aplicação',
        components: ['Node.js', 'Go', 'Python', 'Java'],
        purpose: 'Processamento de requests'
      }
    },
    
    diagram: `
┌─────────────────────────────────────────────────────────────────┐
│                    NGINX LOAD BALANCER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CLIENTS                                                        │
│  [Browser] [Mobile] [API Client]                                │
│       │         │         │                                     │
│       └─────────┴─────────┘                                     │
│                 │                                               │
│                 ▼                                               │
│         ┌─────────────┐                                         │
│         │  CDN/WAF    │  ← Cloudflare, CloudFront               │
│         └──────┬──────┘                                         │
│                │                                                │
│                ▼                                                │
│    ┌───────────────────────┐                                    │
│    │   NGINX LOAD BALANCER │                                    │
│    │   ┌─────────────────┐ │                                    │
│    │   │ SSL Termination │ │                                    │
│    │   │ Rate Limiting   │ │                                    │
│    │   │ Caching         │ │                                    │
│    │   │ Compression     │ │                                    │
│    │   └─────────────────┘ │                                    │
│    └───────────┬───────────┘                                    │
│                │                                                │
│    ┌───────────┼───────────┐                                    │
│    │           │           │                                    │
│    ▼           ▼           ▼                                    │
│ ┌─────┐    ┌─────┐    ┌─────┐                                   │
│ │App 1│    │App 2│    │App 3│  ← Upstream Servers               │
│ └─────┘    └─────┘    └─────┘                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
    `
  },

  // ============================================================
  // ALGORITMOS DE BALANCEAMENTO
  // ============================================================
  
  loadBalancingAlgorithms: {
    roundRobin: {
      description: 'Distribui requests sequencialmente',
      useCase: 'Servidores homogêneos',
      config: `
upstream backend {
    server backend1.example.com;
    server backend2.example.com;
    server backend3.example.com;
}
      `
    },
    
    weightedRoundRobin: {
      description: 'Round robin com pesos',
      useCase: 'Servidores com capacidades diferentes',
      config: `
upstream backend {
    server backend1.example.com weight=5;  # 50% do tráfego
    server backend2.example.com weight=3;  # 30% do tráfego
    server backend3.example.com weight=2;  # 20% do tráfego
}
      `
    },
    
    leastConnections: {
      description: 'Envia para servidor com menos conexões ativas',
      useCase: 'Requests com tempo de processamento variável',
      config: `
upstream backend {
    least_conn;
    server backend1.example.com;
    server backend2.example.com;
    server backend3.example.com;
}
      `
    },
    
    ipHash: {
      description: 'Mesmo IP sempre vai para mesmo servidor',
      useCase: 'Sessões sticky sem cookies',
      config: `
upstream backend {
    ip_hash;
    server backend1.example.com;
    server backend2.example.com;
    server backend3.example.com;
}
      `
    },
    
    leastTime: {
      description: 'Menor tempo de resposta (NGINX Plus)',
      useCase: 'Otimização de latência',
      config: `
upstream backend {
    least_time header;  # ou last_byte
    server backend1.example.com;
    server backend2.example.com;
}
      `
    },
    
    random: {
      description: 'Seleção aleatória com two choices',
      useCase: 'Distribuição estatisticamente uniforme',
      config: `
upstream backend {
    random two least_conn;
    server backend1.example.com;
    server backend2.example.com;
    server backend3.example.com;
}
      `
    }
  },

  // ============================================================
  // CONFIGURAÇÕES COMPLETAS
  // ============================================================
  
  configurations: {
    // Configuração principal do NGINX
    mainConfig: `
# /etc/nginx/nginx.conf

user nginx;
worker_processes auto;
worker_rlimit_nofile 65535;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 65535;
    use epoll;
    multi_accept on;
}

http {
    # ============================================================
    # BASIC SETTINGS
    # ============================================================
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';
    
    log_format json escape=json '{'
        '"time":"$time_iso8601",'
        '"remote_addr":"$remote_addr",'
        '"method":"$request_method",'
        '"uri":"$request_uri",'
        '"status":$status,'
        '"body_bytes_sent":$body_bytes_sent,'
        '"request_time":$request_time,'
        '"upstream_response_time":"$upstream_response_time",'
        '"http_referrer":"$http_referer",'
        '"http_user_agent":"$http_user_agent"'
    '}';
    
    access_log /var/log/nginx/access.log json;
    
    # ============================================================
    # PERFORMANCE SETTINGS
    # ============================================================
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    keepalive_requests 1000;
    types_hash_max_size 2048;
    server_tokens off;
    
    # Buffer sizes
    client_body_buffer_size 16k;
    client_header_buffer_size 1k;
    client_max_body_size 100m;
    large_client_header_buffers 4 8k;
    
    # Timeouts
    client_body_timeout 60s;
    client_header_timeout 60s;
    send_timeout 60s;
    
    # ============================================================
    # GZIP COMPRESSION
    # ============================================================
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_min_length 256;
    gzip_types
        application/atom+xml
        application/geo+json
        application/javascript
        application/json
        application/ld+json
        application/manifest+json
        application/rdf+xml
        application/rss+xml
        application/xhtml+xml
        application/xml
        font/eot
        font/otf
        font/ttf
        image/svg+xml
        text/css
        text/javascript
        text/plain
        text/xml;
    
    # ============================================================
    # SSL SETTINGS
    # ============================================================
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:50m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # ============================================================
    # SECURITY HEADERS
    # ============================================================
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # ============================================================
    # RATE LIMITING
    # ============================================================
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
    
    # ============================================================
    # CACHING
    # ============================================================
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=app_cache:100m 
                     max_size=10g inactive=60m use_temp_path=off;
    
    # ============================================================
    # UPSTREAMS
    # ============================================================
    include /etc/nginx/conf.d/upstreams/*.conf;
    
    # ============================================================
    # VIRTUAL HOSTS
    # ============================================================
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
    `,

    // Configuração de upstream
    upstreamConfig: `
# /etc/nginx/conf.d/upstreams/backend.conf

upstream api_backend {
    least_conn;
    keepalive 32;
    
    server api1.internal:3000 weight=5 max_fails=3 fail_timeout=30s;
    server api2.internal:3000 weight=5 max_fails=3 fail_timeout=30s;
    server api3.internal:3000 weight=3 max_fails=3 fail_timeout=30s;
    server api4.internal:3000 backup;  # Servidor de backup
}

upstream websocket_backend {
    ip_hash;  # Sticky sessions para WebSocket
    
    server ws1.internal:8080;
    server ws2.internal:8080;
}

upstream static_backend {
    server static1.internal:80;
    server static2.internal:80;
}
    `,

    // Virtual host completo
    virtualHostConfig: `
# /etc/nginx/conf.d/api.example.com.conf

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name api.example.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.example.com;
    
    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/api.example.com/chain.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Logging
    access_log /var/log/nginx/api.example.com.access.log json;
    error_log /var/log/nginx/api.example.com.error.log warn;
    
    # ============================================================
    # LOCATIONS
    # ============================================================
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
    
    # API endpoints
    location /api/ {
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
        limit_conn conn_limit 10;
        
        # Proxy settings
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-ID $request_id;
        
        # Connection settings
        proxy_set_header Connection "";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        
        # Error handling
        proxy_next_upstream error timeout http_500 http_502 http_503;
        proxy_next_upstream_tries 3;
    }
    
    # Auth endpoints (stricter rate limiting)
    location /api/auth/ {
        limit_req zone=login burst=5 nodelay;
        
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket endpoint
    location /ws/ {
        proxy_pass http://websocket_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # WebSocket specific timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
    
    # Static files with caching
    location /static/ {
        proxy_pass http://static_backend;
        proxy_cache app_cache;
        proxy_cache_valid 200 1d;
        proxy_cache_valid 404 1m;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503;
        proxy_cache_background_update on;
        proxy_cache_lock on;
        
        add_header X-Cache-Status $upstream_cache_status;
        expires 1d;
    }
    
    # Deny access to sensitive files
    location ~ /\\. {
        deny all;
    }
}
    `,

    // Configuração para microservices
    microservicesConfig: `
# /etc/nginx/conf.d/microservices.conf

# Service discovery via DNS
resolver 127.0.0.11 valid=10s;  # Docker DNS

# User Service
upstream user_service {
    zone user_service 64k;
    server user-service:3001 resolve;
}

# Order Service
upstream order_service {
    zone order_service 64k;
    server order-service:3002 resolve;
}

# Payment Service
upstream payment_service {
    zone payment_service 64k;
    server payment-service:3003 resolve;
}

# Notification Service
upstream notification_service {
    zone notification_service 64k;
    server notification-service:3004 resolve;
}

server {
    listen 80;
    server_name gateway.internal;
    
    # User Service routes
    location /users {
        proxy_pass http://user_service;
        include /etc/nginx/conf.d/proxy_params.conf;
    }
    
    # Order Service routes
    location /orders {
        proxy_pass http://order_service;
        include /etc/nginx/conf.d/proxy_params.conf;
    }
    
    # Payment Service routes
    location /payments {
        proxy_pass http://payment_service;
        include /etc/nginx/conf.d/proxy_params.conf;
    }
    
    # Notification Service routes
    location /notifications {
        proxy_pass http://notification_service;
        include /etc/nginx/conf.d/proxy_params.conf;
    }
}
    `
  },

  // ============================================================
  // HEALTH CHECKS
  // ============================================================
  
  healthChecks: {
    passive: {
      description: 'Detecta falhas baseado em respostas',
      config: `
upstream backend {
    server backend1:3000 max_fails=3 fail_timeout=30s;
    server backend2:3000 max_fails=3 fail_timeout=30s;
}
      `
    },
    
    active: {
      description: 'Health checks ativos (NGINX Plus)',
      config: `
upstream backend {
    zone backend 64k;
    server backend1:3000;
    server backend2:3000;
    
    health_check interval=5s fails=3 passes=2;
}

location /health {
    health_check;
    proxy_pass http://backend;
}
      `
    },
    
    customHealthCheck: {
      description: 'Health check com endpoint específico',
      config: `
upstream backend {
    zone backend 64k;
    server backend1:3000;
    server backend2:3000;
}

match health_check {
    status 200;
    header Content-Type = application/json;
    body ~ '"status":"healthy"';
}

server {
    location / {
        proxy_pass http://backend;
        health_check match=health_check uri=/health interval=10s;
    }
}
      `
    }
  },

  // ============================================================
  // CACHING STRATEGIES
  // ============================================================
  
  caching: {
    proxyCache: `
# Cache configuration
proxy_cache_path /var/cache/nginx/api 
    levels=1:2 
    keys_zone=api_cache:100m 
    max_size=10g 
    inactive=60m 
    use_temp_path=off;

server {
    location /api/products {
        proxy_cache api_cache;
        proxy_cache_key "$scheme$request_method$host$request_uri";
        proxy_cache_valid 200 10m;
        proxy_cache_valid 404 1m;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503;
        proxy_cache_background_update on;
        proxy_cache_lock on;
        proxy_cache_lock_timeout 5s;
        
        # Cache bypass
        proxy_cache_bypass $http_cache_control;
        proxy_no_cache $http_pragma $http_authorization;
        
        # Add cache status header
        add_header X-Cache-Status $upstream_cache_status;
        
        proxy_pass http://api_backend;
    }
}
    `,
    
    microcaching: `
# Microcaching for dynamic content (1 second cache)
proxy_cache_path /var/cache/nginx/micro 
    levels=1:2 
    keys_zone=micro_cache:10m 
    max_size=1g 
    inactive=1m;

location /api/feed {
    proxy_cache micro_cache;
    proxy_cache_valid 200 1s;
    proxy_cache_lock on;
    proxy_cache_use_stale updating;
    
    proxy_pass http://api_backend;
}
    `
  },

  // ============================================================
  // DOCKER COMPOSE
  // ============================================================
  
  dockerCompose: `
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: nginx-lb
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/cache:/var/cache/nginx
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - api1
      - api2
      - api3
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3

  api1:
    build: ./api
    container_name: api1
    environment:
      - NODE_ENV=production
      - PORT=3000
    networks:
      - app-network
    restart: unless-stopped

  api2:
    build: ./api
    container_name: api2
    environment:
      - NODE_ENV=production
      - PORT=3000
    networks:
      - app-network
    restart: unless-stopped

  api3:
    build: ./api
    container_name: api3
    environment:
      - NODE_ENV=production
      - PORT=3000
    networks:
      - app-network
    restart: unless-stopped

networks:
  app-network:
    driver: bridge
  `,

  // ============================================================
  // KUBERNETES INGRESS
  // ============================================================
  
  kubernetes: {
    ingressController: `
# NGINX Ingress Controller installation
# helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
# helm install ingress-nginx ingress-nginx/ingress-nginx

apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "100m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
    - hosts:
        - api.example.com
      secretName: api-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 3000
          - path: /ws
            pathType: Prefix
            backend:
              service:
                name: websocket-service
                port:
                  number: 8080
    `,
    
    configMap: `
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-configuration
  namespace: ingress-nginx
data:
  proxy-body-size: "100m"
  proxy-read-timeout: "60"
  proxy-send-timeout: "60"
  use-gzip: "true"
  gzip-level: "6"
  worker-processes: "auto"
  max-worker-connections: "65535"
  use-http2: "true"
  ssl-protocols: "TLSv1.2 TLSv1.3"
  ssl-ciphers: "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256"
    `
  },

  // ============================================================
  // MONITORING
  // ============================================================
  
  monitoring: {
    stubStatus: `
# Enable stub_status for monitoring
server {
    listen 8080;
    server_name localhost;
    
    location /nginx_status {
        stub_status on;
        allow 127.0.0.1;
        allow 10.0.0.0/8;
        deny all;
    }
}
    `,
    
    prometheusExporter: `
# nginx-prometheus-exporter
# docker run -p 9113:9113 nginx/nginx-prometheus-exporter:latest 
#   -nginx.scrape-uri=http://nginx:8080/nginx_status

# Prometheus scrape config
scrape_configs:
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']
    `,
    
    metrics: [
      'nginx_connections_active',
      'nginx_connections_accepted',
      'nginx_connections_handled',
      'nginx_connections_reading',
      'nginx_connections_writing',
      'nginx_connections_waiting',
      'nginx_http_requests_total',
      'nginx_up'
    ]
  },

  // ============================================================
  // BEST PRACTICES
  // ============================================================
  
  bestPractices: [
    'Use least_conn para requests com tempo variável',
    'Configure keepalive para conexões upstream',
    'Implemente health checks ativos quando possível',
    'Use proxy_cache para conteúdo estático e semi-estático',
    'Configure rate limiting por endpoint',
    'Use HTTP/2 para melhor performance',
    'Implemente SSL/TLS com configurações modernas',
    'Configure timeouts apropriados',
    'Use gzip para compressão de respostas',
    'Monitore métricas com Prometheus',
    'Configure logs estruturados (JSON)',
    'Use worker_processes auto'
  ],

  // ============================================================
  // ANTI-PATTERNS
  // ============================================================
  
  antiPatterns: [
    'Não usar health checks',
    'Timeouts muito longos ou muito curtos',
    'Não configurar rate limiting',
    'Usar SSL/TLS desatualizado',
    'Não monitorar métricas',
    'Configurar buffers muito grandes',
    'Não usar keepalive para upstream',
    'Ignorar logs de erro'
  ],

  // ============================================================
  // TROUBLESHOOTING
  // ============================================================
  
  troubleshooting: {
    '502 Bad Gateway': [
      'Verificar se upstream está rodando',
      'Verificar conectividade de rede',
      'Aumentar proxy_connect_timeout',
      'Verificar logs do upstream'
    ],
    '504 Gateway Timeout': [
      'Aumentar proxy_read_timeout',
      'Verificar performance do upstream',
      'Verificar se request está demorando muito'
    ],
    'High Latency': [
      'Verificar algoritmo de balanceamento',
      'Habilitar keepalive para upstream',
      'Verificar se há servidor sobrecarregado',
      'Considerar caching'
    ],
    'Connection Refused': [
      'Verificar se upstream está escutando na porta correta',
      'Verificar firewall/security groups',
      'Verificar DNS resolution'
    ]
  }
};

export default NGINX_LOADBALANCER_MANIFEST;
