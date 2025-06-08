
FROM golang:1.24-alpine AS builder

WORKDIR /app

# cache deps
COPY go.mod go.sum ./
RUN go mod download

# copy the rest and build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o auth-service ./cmd/auth-service

# -------------------------
# 2) Minimal runtime image
# -------------------------
FROM alpine:3.18
RUN apk add --no-cache ca-certificates

WORKDIR /root/
# copy the binary
COPY --from=builder /app/auth-service .

# expose the HTTP port (matches config default AUTH_PORT=8080)
EXPOSE 8080

ENTRYPOINT ["./auth-service"]
