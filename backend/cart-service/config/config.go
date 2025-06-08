// cart-service/config/config.go
package config

import (
	"time"

	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
)

// Config holds all configuration for the cart service
type Config struct {
	// MongoDB
	MongoURI string `envconfig:"CART_DB_URL" required:"true"`
	
	// HTTP Server
	HTTPPort string `envconfig:"CART_PORT" default:"8083"`
	
	// Auth
	JWTSecret string `envconfig:"CART_JWT_SECRET" required:"true"`
	
	// External Services
	ProductServiceURL string `envconfig:"PRODUCT_SERVICE_URL" default:"http://product-service:8082"`
	
	// Cart Settings
	CartTTL      time.Duration `envconfig:"CART_TTL" default:"72h"` // 72 hours default TTL
	TaxRate      float64       `envconfig:"CART_TAX_RATE" default:"0.18"` // 18% tax rate
	ShippingCost float64       `envconfig:"CART_SHIPPING_COST" default:"0.0"` // Free shipping by default
	
	// Logging
	LogLevel string `envconfig:"CART_LOG_LEVEL" default:"info"`
}

// Load loads the configuration from environment variables
func Load() (*Config, error) {
	// Try to load .env file if it exists
	_ = godotenv.Load("config/.env")
	
	var cfg Config
	if err := envconfig.Process("CART", &cfg); err != nil {
		return nil, err
	}
	
	return &cfg, nil
}