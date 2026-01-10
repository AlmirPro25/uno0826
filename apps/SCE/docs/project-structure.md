
# 🏗️ Sovereign Cloud Engine - Project Structure

## 🛰️ Root Directory
- `/cmd/engine`: Ponto de entrada do binário Go (Backend).
- `/internal`: Lógica de negócio privada (Hexagonal Architecture).
    - `/domain`: Entidades e regras de negócio puras.
    - `/ports`: Interfaces (Repositórios, Services).
    - `/adapters`: Implementações (Docker API, Postgres, JWT).
- `/web`: Frontend Next.js 15 (Dashboard).
    - `/app`: App Router (Pages & API Routes).
    - `/components`: UI (Shadcn + Framer Motion).
    - `/lib`: Utilitários (Fetchers, SSE hooks).
- `/scripts`: Scripts de bootstrap do host (Instalação de Docker/Proxy).
- `/prisma`: Definição de esquema de banco de dados.
- `docker-compose.yaml`: Para subir a Engine e o Banco de dados localmente.

## 🛠️ Infrastructure Stack
1. **Host OS:** Ubuntu 22.04+ ou Debian 12.
2. **Container Engine:** Docker com API Socket ativa.
3. **Reverse Proxy:** Traefik (integrado via labels dinâmicos pela Go Engine).
4. **SSL:** Let's Encrypt (Automático via Certbot/Traefik).
