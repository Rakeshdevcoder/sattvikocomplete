// product-service/cmd/product-service/main.go
package main

import (
	"context"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"product-service/config"
	"product-service/internal"
	"product-service/pkg/logger"
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
	// 1) Load config
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	// 2) Init logger
	log := logger.New(cfg.LogLevel)

	// 3) Connect to Mongo
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	svc, err := internal.NewProductService(ctx, cfg.MongoURI)
	if err != nil {
		log.Fatalf("service init error: %v", err)
	}

	// 4) Setup Echo
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

	e.Validator = &CustomValidator{validate: validator.New()}

	// 5) Handlers & routes
	h := internal.NewProductHandler(svc, cfg.JWTSecret, log)

	// Public endpoints for product browsing
	e.GET("/products", h.List)
	e.GET("/products/:id", h.Get)

	// New product browsing endpoints
	e.GET("/products/top-sellers", func(c echo.Context) error {
		products, err := svc.GetTopSellers(c.Request().Context())
		if err != nil {
			log.Error(err)
			return echo.NewHTTPError(http.StatusInternalServerError, "could not fetch top sellers")
		}
		return c.JSON(http.StatusOK, products)
	})

	e.GET("/products/highest-rated", func(c echo.Context) error {
		limit := 10 // Default limit
		if limitParam := c.QueryParam("limit"); limitParam != "" {
			if val, err := strconv.Atoi(limitParam); err == nil && val > 0 {
				limit = val
			}
		}

		products, err := svc.GetHighestRated(c.Request().Context(), limit)
		if err != nil {
			log.Error(err)
			return echo.NewHTTPError(http.StatusInternalServerError, "could not fetch highest rated products")
		}
		return c.JSON(http.StatusOK, products)
	})

	// Review endpoint - making it public to allow customers to leave reviews
	// (in a real app, you'd still want some auth to prevent spam)
	e.POST("/products/:id/reviews", h.AddReview)

	// Protected endpoints for admin management
	grp := e.Group("/products", h.AuthMiddleware)
	grp.POST("", h.Create)
	grp.PUT("/:id", h.Update)
	grp.DELETE("/:id", h.Delete)

	log.Infof("ProductService listening on :%s", cfg.HTTPPort)
	if err := e.Start(":" + cfg.HTTPPort); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
