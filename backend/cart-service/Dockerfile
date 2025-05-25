# cart-service/Dockerfile
# 1) Build stage
FROM golang:1.24-bullseye AS builder
WORKDIR /app

# Cache modules
COPY go.mod go.sum ./
RUN go mod download

# Build binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o cart-service ./cmd/cart-service

# 2) Runtime stage
FROM debian:bullseye-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
# Copy binary
COPY --from=builder /app/cart-service .
# Copy env file
COPY --from=builder /app/config/.env ./config/.env

EXPOSE 8083
ENTRYPOINT ["./cart-service"]