
# Use a Node.js base image for building the Next.js application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the Next.js application
RUN npm run build

# Use a lean-production base image for smaller final image size
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Copy necessary files from builder stage
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Expose port where the Next.js app will run
EXPOSE 3000

# Set environment variables for production build
ENV NODE_ENV production
ENV DATABASE_URL=file:./db.sqlite

# Run the Next.js application in production mode
CMD ["npm", "start"]
