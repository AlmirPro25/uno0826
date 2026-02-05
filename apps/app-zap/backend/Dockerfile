# 👻 GHOST PROTOCOL v5.0 - Backend Dockerfile
# Multi-stage build for production

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy Prisma
COPY prisma ./prisma/
RUN npx prisma generate

# Copy built files
COPY --from=builder /app/dist ./dist

# Create directories for cache
RUN mkdir -p whatsapp-session audio-cache image-cache

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/system/health || exit 1

# Start server
CMD ["node", "dist/server.js"]
