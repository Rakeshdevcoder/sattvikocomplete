# 1) Build stage
FROM golang:1.24-bullseye AS builder
WORKDIR /app

# cache modules
COPY go.mod go.sum ./
RUN go mod download

# build our binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o product-service ./cmd/product-service

# 2) Runtime stage
FROM debian:bullseye-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /root
# copy binary
COPY --from=builder /app/product-service .
# copy your .env
COPY --from=builder /app/config/.env .env

EXPOSE 8082
ENTRYPOINT ["./product-service"]
