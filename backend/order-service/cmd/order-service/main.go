package main

import (
	"context"
	"log"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"order-service/config"
	"order-service/internal"
	"order-service/pkg/logger"
)

func main() {
	// 1) Load config
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	// 2) Init logger
	log := logger.New(cfg.LogLevel)

	// 3) Connect service
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	svc, err := internal.NewOrderService(ctx, cfg.MongoURI)
	if err != nil {
		log.Fatalf("service init error: %v", err)
	}

	// 4) HTTP server
	e := echo.New()
	e.Use(middleware.Recover())
	e.Use(middleware.Logger())

	handler := internal.NewOrderHandler(svc, cfg.JWTSecret, log)

	// 5) Routes
	g := e.Group("/orders")
	g.Use(handler.AuthMiddleware)

	g.POST("", handler.CreateOrder)
	g.GET("", handler.ListOrders)
	g.GET("/:id", handler.GetOrder)
	g.PUT("/:id", handler.UpdateOrder)    // ← new
	g.DELETE("/:id", handler.DeleteOrder) // ← new

	log.Infof("OrderService listening on :%s", cfg.HTTPPort)
	if err := e.Start(":" + cfg.HTTPPort); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
