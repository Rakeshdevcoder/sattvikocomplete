// cart-service/cmd/cart-service/main.go
package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"cart-service/config"
	"cart-service/internal"
	"cart-service/pkg/logger"
)

// CustomValidator wraps a *validator.Validate for Echo
type CustomValidator struct {
	validate *validator.Validate
}

// Validate makes CustomValidator satisfy echo.Validator
func (cv *CustomValidator) Validate(i interface{}) error {
	return cv.validate.Struct(i)
}

func main() {
	// 1) Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 2) Setup logger
	log := logger.New(cfg.LogLevel)
	log.Info("Starting cart service")

	// 3) Create product service client
	productClient := internal.NewHTTPProductServiceClient(
		cfg.ProductServiceURL,
		10*time.Second, // 10 second timeout for product service calls
	)

	// 4) Connect to MongoDB and initialize cart service
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cartSvc, err := internal.NewCartService(
		ctx,
		cfg.MongoURI,
		productClient,
		cfg.CartTTL,
		cfg.TaxRate,
		cfg.ShippingCost,
	)
	if err != nil {
		log.WithError(err).Fatal("Failed to initialize cart service")
	}

	// 5) Initialize Echo framework
	e := echo.New()
	e.Use(middleware.Recover())
	e.Use(middleware.Logger())

	// Configure CORS with specific settings
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"*"}, // Allow all origins for development
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete},
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
		ExposeHeaders:    []string{echo.HeaderContentLength},
		AllowCredentials: true,  // Allow credentials
		MaxAge:           86400, // Cache preflight requests for 24 hours
	}))

	// Setup request validator
	e.Validator = &CustomValidator{validate: validator.New()}

	// 6) Setup handler and routes
	h := internal.NewCartHandler(cartSvc, cfg.JWTSecret, log)

	// Public routes (no auth required)
	e.POST("/carts", h.CreateCart)
	
	// Routes that work with optional auth
	// (authenticated users get their user ID attached to the cart)
	optionalAuthGroup := e.Group("", h.OptionalAuthMiddleware)
	optionalAuthGroup.GET("/carts/:id", h.GetCart)
	
	// Routes that require authentication
	authGroup := e.Group("", h.AuthMiddleware)
	authGroup.GET("/user/cart", h.GetUserCart)
	
	// Authenticated cart operations
	cartGroup := e.Group("/carts/:id", h.OptionalAuthMiddleware)
	cartGroup.POST("/items", h.AddCartItem)
	cartGroup.PUT("/items/:itemId", h.UpdateCartItem)
	cartGroup.DELETE("/items/:itemId", h.RemoveCartItem)
	cartGroup.DELETE("/items", h.ClearCart)
	cartGroup.POST("/coupon", h.ApplyCoupon)
	cartGroup.DELETE("/coupon", h.RemoveCoupon)
	cartGroup.POST("/checkout", h.CheckoutCart)
	
	// Cart merging (requires auth)
	authGroup.POST("/carts/:id/merge", h.MergeGuestCart)
	
	// Admin routes
	adminGroup := e.Group("/admin", h.AuthMiddleware)
	adminGroup.GET("/carts/statistics", h.GetCartStatistics)
	
	// 7) Setup a background task to cleanup abandoned carts
	go func() {
		for {
			time.Sleep(1 * time.Hour) // Run every hour
			
			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			count, err := cartSvc.CleanupAbandonedCarts(ctx, 24*time.Hour) // Mark carts as abandoned after 24h of inactivity
			cancel()
			
			if err != nil {
				log.WithError(err).Error("Failed to cleanup abandoned carts")
			} else {
				log.WithField("count", count).Info("Cleaned up abandoned carts")
			}
		}
	}()
	
	// 8) Start the HTTP server
	log.WithField("port", cfg.HTTPPort).Info("Cart service listening")
	if err := e.Start(":" + cfg.HTTPPort); err != nil && err != http.ErrServerClosed {
		log.WithError(err).Fatal("Failed to start server")
	}
}