package config

import (
	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
)

type Config struct {
	AuthURL    string `envconfig:"GATEWAY_AUTH_URL"     required:"true"` // e.g. http://auth-service:8080
	OrderURL   string `envconfig:"GATEWAY_ORDER_URL"    required:"true"` // e.g. http://order-service:8081
	ProductURL string `envconfig:"GATEWAY_PRODUCT_URL"  required:"true"` // e.g. http://product-service:8082
	HTTPPort   string `envconfig:"GATEWAY_PORT"         default:"8000"`
	JWTSecret  string `envconfig:"GATEWAY_JWT_SECRET"   required:"true"`
	LogLevel   string `envconfig:"GATEWAY_LOG_LEVEL"    default:"info"`
}

func Load() (*Config, error) {
	_ = godotenv.Load("config/.env") // optional .env
	var cfg Config
	if err := envconfig.Process("GATEWAY", &cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}
