package config

import (
	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
)

type Config struct {
	MongoURI  string `envconfig:"AUTH_DB_URL" required:"true"`
	HTTPPort  string `envconfig:"AUTH_PORT" default:"8080"`
	JWTSecret string `envconfig:"AUTH_JWT_SECRET" required:"true"`
	LogLevel  string `envconfig:"AUTH_LOG_LEVEL" default:"info"`
}

func Load() (*Config, error) {
	_ = godotenv.Load("config/.env") // loads .env if present
	var cfg Config
	if err := envconfig.Process("AUTH", &cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}
