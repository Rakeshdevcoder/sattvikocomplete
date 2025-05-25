// backend/auth-service/cmd/auth-service/main.go
package main

import (
	"log"
	"net/http"

	"auth-service/config"
	"auth-service/internal"
	"auth-service/pkg/logger"

	"github.com/rs/cors"
)

func main() {
	// 1) Load config from ENV/.env
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	// 2) Init structured logger
	log := logger.New(cfg.LogLevel)

	// 3) Init your AuthService (MongoDB + JWT)
	svc, err := internal.NewAuthService(cfg.MongoURI, cfg.JWTSecret)
	if err != nil {
		log.Fatalf("failed to initialize AuthService: %v", err)
	}

	// 4) Wire up HTTP handlers
	handler := internal.NewHandler(svc, log)
	mux := http.NewServeMux()
	mux.HandleFunc("/signup", handler.Signup)
	mux.HandleFunc("/login", handler.Login)
	mux.HandleFunc("/validate", handler.Validate)

	// 5) Enable CORS (allowing all origins here)
	corsHandler := cors.Default().Handler(mux)

	// 6) Start HTTP server on the same port you were using for gRPC
	addr := ":" + cfg.HTTPPort
	log.Infof("AuthService listening on %s", addr)
	if err := http.ListenAndServe(addr, corsHandler); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
