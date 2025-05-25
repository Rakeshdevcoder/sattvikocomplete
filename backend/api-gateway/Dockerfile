# backend/api-gateway/Dockerfile

# -------------------------
# 1) Build the Go binary
# -------------------------
FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o api-gateway ./cmd/api-gateway

# -------------------------
# 2) Minimal runtime image
# -------------------------
FROM alpine:3.18
RUN apk add --no-cache ca-certificates

WORKDIR /root/
COPY --from=builder /app/api-gateway .

# gateway port (config default API_PORT=8000)
EXPOSE 8000

ENTRYPOINT ["./api-gateway"]
