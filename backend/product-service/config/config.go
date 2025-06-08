package config

import (
	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
)

type Config struct {
	MongoURI  string `envconfig:"PRODUCT_DB_URL"      required:"true"`
	HTTPPort  string `envconfig:"PRODUCT_PORT"        default:"8082"`
	JWTSecret string `envconfig:"PRODUCT_JWT_SECRET"  required:"true"`
	LogLevel  string `envconfig:"PRODUCT_LOG_LEVEL"   default:"info"`
}

func Load() (*Config, error) {
	_ = godotenv.Load("config/.env")
	var cfg Config
	if err := envconfig.Process("PRODUCT", &cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}
