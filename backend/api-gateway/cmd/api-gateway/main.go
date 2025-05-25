// backend/api-gateway/cmd/api-gateway/main.go
package main

import (
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"api-gateway/config"
	"api-gateway/internal"
	"api-gateway/pkg/logger"
)

func main() {
	// load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	// init structured logger
	log := logger.New(cfg.LogLevel)

	e := echo.New()
	e.Use(middleware.Recover(), middleware.Logger())

	h := internal.NewGatewayHandler(cfg.JWTSecret, log)

	// healthcheck
	e.GET("/health", func(c echo.Context) error {
		return c.NoContent(http.StatusOK)
	})

	// public /auth routes
	e.Any("/auth/*", h.ProxyTo(cfg.AuthURL,"/auth"))

	// protected /orders and /products
	api := e.Group("", h.AuthMiddleware)
	api.Any("/orders/*", h.ProxyTo(cfg.OrderURL, "/orders"))
	api.Any("/products/*", h.ProxyTo(cfg.ProductURL, "/products"))

	log.Infof("API Gateway listening on :%s", cfg.HTTPPort)
	if err := e.Start(":" + cfg.HTTPPort); err != nil {
		log.Fatalf("failed to start API Gateway: %v", err)
	}
}
