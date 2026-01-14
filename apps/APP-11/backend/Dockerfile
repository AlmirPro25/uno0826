
# Stage 1: Build the Go application
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy go.mod and go.sum files and download dependencies
COPY go.mod .
COPY go.sum .
RUN go mod download

# Copy the rest of the application source code
COPY . .

# Build the Go application for Linux
RUN CGO_ENABLED=0 GOOS=linux go build -o /ai-web-weaver-backend ./cmd/api/main.go

# Stage 2: Create a minimal image
FROM alpine:latest

# Set the working directory to /root/
WORKDIR /root/

# Copy the compiled application from the builder stage
COPY --from=builder /ai-web-weaver-backend .

# Expose the port the application listens on
EXPOSE 8080

# Run the application
CMD ["./ai-web-weaver-backend"]
